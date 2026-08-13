const pool = require('../db/pool');

async function addToBurnPool(source, amount, telegramId) {
  if (!amount || amount <= 0) return;
  try {
    await pool.query(
      'INSERT INTO burn_pool (source, amount, telegram_id) VALUES ($1, $2, $3)',
      [source, amount, telegramId || null]
    );
  } catch(e) {
    console.error('[BURN] addToBurnPool error:', e.message);
  }
}

async function logTx(userId, type, amount, direction, description = {}) {
  try {
    await pool.query(
      `INSERT INTO transactions (user_id, type, amount, direction, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, amount, direction, JSON.stringify(description)]
    );
  } catch (e) {
    console.error('[logTx] error:', e);
  }
}

async function withRetry(fn, retries = 3, delayMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[withRetry] Попытка ${attempt}/${retries} не удалась: ${err.message}`);
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

module.exports = { addToBurnPool, logTx, withRetry };
