const crypto = require('crypto');
const pool = require('../db/pool');
const { generateCrashPoint, crashMultiplierAt } = require('./casino');

// === СОСТОЯНИЕ ТЕКУЩЕГО РАУНДА ===
let currentRound = {
  id: null,
  phase: 'waiting',
  crashPoint: null,
  serverSeed: null,
  seedHash: null,
  startedAt: null,
  bettingEndsAt: null,
};

// === КОНФИГ ФАЗ ===
const PHASES = {
  WAITING_DURATION: 2000,
  BETTING_DURATION: 3000,
  CRASHED_DURATION: 3000,
};

// === ЗАПУСК НОВОГО РАУНДА ===
async function startNewRound() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Очистка старых ставок
    await client.query(`
      DELETE FROM crash_bets_multi 
      WHERE round_id NOT IN (
        SELECT id FROM crash_rounds ORDER BY id DESC LIMIT 100
      )
    `);
    
    // 2. Очистка старых раундов
    await client.query(`
      DELETE FROM crash_rounds 
      WHERE id NOT IN (
        SELECT id FROM crash_rounds ORDER BY id DESC LIMIT 100
      )
    `);
    
    const crashPoint = generateCrashPoint();
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const seedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    
    // 3. Завершаем предыдущие активные раунды
    await client.query(
      `UPDATE crash_rounds SET phase = 'finished' WHERE phase IN ('waiting','betting','flying')`
    );
    
    // 4. Создаём новый раунд
    const res = await client.query(
      `INSERT INTO crash_rounds (crash_point, server_seed, seed_hash, phase, started_at)
       VALUES ($1, $2, $3, 'waiting', NOW())
       RETURNING id`,
      [crashPoint, serverSeed, seedHash]
    );
    
    await client.query('COMMIT');
    
    currentRound = {
      id: res.rows[0].id,
      phase: 'waiting',
      crashPoint,
      serverSeed,
      seedHash,
      startedAt: Date.now(),
      bettingEndsAt: Date.now() + PHASES.WAITING_DURATION + PHASES.BETTING_DURATION,
    };
    
    console.log(`[CRASH] Round ${currentRound.id} started, crash at ${crashPoint}x`);
    
    schedulePhases();
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] startNewRound error:', e);
    setTimeout(() => {
      if (!currentRound.id || currentRound.phase === 'crashed' || currentRound.phase === 'idle') {
        startNewRound();
      }
    }, 30000);
  } finally {
    client.release();
  }
}

function schedulePhases() {
  setTimeout(() => {
    if (currentRound.phase !== 'waiting') return;
    currentRound.phase = 'betting';
    console.log(`[CRASH] Round ${currentRound.id} → betting`);
  }, PHASES.WAITING_DURATION);
  
  setTimeout(() => {
    if (currentRound.phase !== 'betting') return;
    currentRound.phase = 'flying';
    currentRound.startedAt = Date.now();
    console.log(`[CRASH] Round ${currentRound.id} → flying`);
    runFlying();
  }, PHASES.WAITING_DURATION + PHASES.BETTING_DURATION);
}

async function runFlying() {
  const roundId = currentRound.id;
  const crashPoint = currentRound.crashPoint;
  
  const interval = setInterval(async () => {
    if (currentRound.id !== roundId || currentRound.phase !== 'flying') {
      clearInterval(interval);
      return;
    }
    
    const elapsed = Date.now() - currentRound.startedAt;
    const mult = crashMultiplierAt(elapsed);
    
    if (mult >= crashPoint) {
      clearInterval(interval);
      await triggerCrash(crashPoint);
      return;
    }
  }, 50);
}

async function triggerCrash(crashPoint) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Все активные ставки проиграли
    await client.query(
      `UPDATE crash_bets_multi SET status = 'lost' WHERE round_id = $1 AND status = 'active'`,
      [currentRound.id]
    );
    
    await client.query(
      `UPDATE crash_rounds SET phase = 'crashed', crashed_at = NOW() WHERE id = $1`,
      [currentRound.id]
    );
    
    await client.query('COMMIT');
    
    currentRound.phase = 'crashed';
    console.log(`[CRASH] Round ${currentRound.id} → crashed at ${crashPoint}x`);
    
    // Логируем проигрыши + burn 5%
    const losers = await pool.query(
      `SELECT telegram_id, bet_amount FROM crash_bets_multi WHERE round_id = $1 AND status = 'lost'`,
      [currentRound.id]
    );
    
    for (const row of losers.rows) {
      const burnAmount = Math.max(1, Math.floor(row.bet_amount * 0.05));
      await pool.query(
        `INSERT INTO burn_pool (source, amount, telegram_id) VALUES ('impulse_crash', $1, $2)`,
        [burnAmount, row.telegram_id]
      );
      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, direction, description)
         VALUES ($1, 'impulse_bet', $2, 'out', $3)`,
        [row.telegram_id, row.bet_amount, JSON.stringify({ game: 'KRASH', round: currentRound.id })]
      );
    }
    
    setTimeout(startNewRound, PHASES.CRASHED_DURATION);
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] triggerCrash error:', e);
  } finally {
    client.release();
  }
}

function getState() {
  const now = Date.now();
  
  if (currentRound.phase === 'waiting') {
    return {
      phase: 'waiting',
      round_id: currentRound.id,
      seed_hash: currentRound.seedHash,
      next_round_in: Math.max(0, Math.ceil((currentRound.bettingEndsAt - now) / 1000)),
    };
  }
  
  if (currentRound.phase === 'betting') {
    return {
      phase: 'betting',
      round_id: currentRound.id,
      seed_hash: currentRound.seedHash,
      betting_ends_in: Math.max(0, Math.ceil((currentRound.bettingEndsAt - now) / 1000)),
    };
  }
  
  if (currentRound.phase === 'flying') {
    const elapsed = now - currentRound.startedAt;
    const mult = crashMultiplierAt(elapsed);
    return {
      phase: 'flying',
      round_id: currentRound.id,
      seed_hash: currentRound.seedHash,
      multiplier: mult,
      elapsed_ms: elapsed,
    };
  }
  
  if (currentRound.phase === 'crashed') {
    return {
      phase: 'crashed',
      round_id: currentRound.id,
      seed_hash: currentRound.seedHash,
      server_seed: currentRound.serverSeed,
      crash_point: currentRound.crashPoint,
    };
  }
  
  return { phase: 'idle' };
}

module.exports = {
  startNewRound,
  getState,
  getCurrentRoundId: () => currentRound.id,
  isPhase: (phase) => currentRound.phase === phase,
  getPhase: () => currentRound.phase,
};
