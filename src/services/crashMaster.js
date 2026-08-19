const crypto = require('crypto');
const pool = require('../db/pool');
const { generateCrashPoint, crashMultiplierAt } = require('./casino');

// === СОСТОЯНИЕ ТЕКУЩЕГО РАУНДА (только в памяти) ===
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
  WAITING_DURATION: 3000,   // пауза между раундами (ставки ещё закрыты)
  BETTING_DURATION: 5000,   // окно ставок
  CRASHED_DURATION: 5000,   // пауза после краша (показать результат)
};

// === ЗАПУСК НОВОГО РАУНДА (БЕЗ записи в БД) ===
async function startNewRound() {
  try {
    const crashPoint = generateCrashPoint();
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const seedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    
    currentRound = {
      id: Math.floor(Date.now() / 1000),
      phase: 'waiting',
      crashPoint,
      serverSeed,
      seedHash,
      startedAt: Date.now(),
      bettingEndsAt: Date.now() + PHASES.WAITING_DURATION + PHASES.BETTING_DURATION,
    };
    
    schedulePhases();
    
  } catch (e) {
    console.error('[CRASH] startNewRound error:', e);
  }
}

function schedulePhases() {
  setTimeout(() => {
    if (currentRound.phase !== 'waiting') return;
    currentRound.phase = 'betting';
  }, PHASES.WAITING_DURATION);
  
  setTimeout(() => {
    if (currentRound.phase !== 'betting') return;
    currentRound.phase = 'flying';
    currentRound.startedAt = Date.now();
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
    const losers = await client.query(
      `SELECT telegram_id, bet_amount FROM crash_bets_multi 
       WHERE round_id = $1 AND status = 'active' FOR UPDATE`,
      [currentRound.id]
    );
    
    for (const row of losers.rows) {
      // Логируем проигрыш
      const burnAmount = Math.max(1, Math.floor(row.bet_amount * 0.05));
      await client.query(
        `INSERT INTO burn_pool (source, amount, telegram_id) VALUES ('impulse_crash', $1, $2)`,
        [burnAmount, row.telegram_id]
      );
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, direction, description)
         VALUES ($1, 'impulse_bet', $2, 'out', $3)`,
        [row.telegram_id, row.bet_amount, JSON.stringify({ game: 'KRASH', round: currentRound.id })]
      );
    }
    
    // Обновляем статусы проигравших
    await client.query(
      `UPDATE crash_bets_multi SET status = 'lost' 
       WHERE round_id = $1 AND status = 'active'`,
      [currentRound.id]
    );
    
    // Очистка старых ставок (оставляем только последние 500)
    await client.query(`
      DELETE FROM crash_bets_multi 
      WHERE id NOT IN (
        SELECT id FROM crash_bets_multi ORDER BY id DESC LIMIT 500
      )
    `);
    
    // Очистка старых транзакций (оставляем 5000)
    await client.query(`
      DELETE FROM transactions 
      WHERE id NOT IN (
        SELECT id FROM transactions ORDER BY id DESC LIMIT 5000
      )
    `);
    
    // Очистка старого burn_pool (оставляем 1000)
    await client.query(`
      DELETE FROM burn_pool 
      WHERE id NOT IN (
        SELECT id FROM burn_pool ORDER BY id DESC LIMIT 1000
      )
    `);
    
    await client.query('COMMIT');
    
    currentRound.phase = 'crashed';
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] triggerCrash error:', e);
  } finally {
    client.release();
  }
  
  setTimeout(startNewRound, PHASES.CRASHED_DURATION);
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
