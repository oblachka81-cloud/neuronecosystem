const pool = require('../db/pool');
const { ALLOWED_USER_FIELDS } = require('../constants/allowedUserFields');
const { MAX_FREE_GAMES_PER_DAY } = require('../config');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateStr(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function calcGamesLeft(user) {
  const base = MAX_FREE_GAMES_PER_DAY;
  const bonus = user.subscription_type === 'premium' ? 10 : user.subscription_type === 'vip' ? 10 : 0;
  const extra = user.extra_games || 0;
  const played = user.games_today || 0;
  return Math.max(0, base + bonus + extra - played);
}

async function checkAndResetDailyLimit(client, user) {
  const today = todayStr();
  const lastDate = normalizeDateStr(user.last_game_date);

  if (lastDate !== today) {
    await client.query(
      'UPDATE users SET games_today = 0, last_game_date = $1, daily_question_answered = false, daily_hints_used = 0 WHERE telegram_id = $2',
      [today, user.telegram_id]
    );
    user.games_today = 0;
    user.last_game_date = today;
    user.daily_question_answered = false;
    user.daily_hints_used = 0;
  }
}

async function getOrCreateUser(tgUser, client = null) {
  const db = client || pool;
  const { id: telegram_id, username, first_name } = tgUser;
  let res = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
  if (res.rows.length === 0) {
    await db.query(
      `INSERT INTO users (telegram_id, username, first_name, last_game_date, language_code)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (telegram_id) DO NOTHING`,
      [telegram_id, username || null, first_name || null, todayStr(), tgUser.language_code || 'en']
    );
    res = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
  }
  const user = res.rows[0];
  if (!user) throw new Error(`User ${telegram_id} not found after insert`);
  await checkAndResetDailyLimit(db, user);
  return user;
}

async function saveUser(telegram_id, updates) {
  const fields = Object.keys(updates).filter(f => ALLOWED_USER_FIELDS.has(f));
  if (fields.length === 0) return;
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map(f => updates[f]);
  const result = await pool.query(
    `UPDATE users SET ${setClause} WHERE telegram_id = $1 RETURNING *`,
    [telegram_id, ...values]
  );
  if (result.rowCount === 0) {
    console.error(`[SAVE] Failed to update user ${telegram_id}`);
  }
}

module.exports = {
  getOrCreateUser,
  saveUser,
  calcGamesLeft,
  checkAndResetDailyLimit,
  todayStr,
  normalizeDateStr,
};
