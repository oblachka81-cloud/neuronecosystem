const pool = require('../db/pool');
const { ACHIEVEMENTS, ACHIEVEMENT_TITLES, ACHIEVEMENT_UNLOCK_PREFIX } = require('../constants/achievements');
const { logTx, withRetry } = require('./burn');

async function checkAndUnlockAchievements(userId, bot) {
  try {
    const user = await pool.query(
      `SELECT u.streak_count, u.balance, u.referred_count, u.super_games_total,
              u.games_played_total, u.language_code,
              (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.balance > u.balance) AS leaderboard_rank
       FROM users u WHERE u.telegram_id = $1`,
      [userId]
    );
    if (!user.rows[0]) return;

    const existing = await pool.query(
      'SELECT achievement_key FROM achievements WHERE user_id = $1',
      [userId]
    );
    const unlocked = new Set(existing.rows.map(r => r.achievement_key));

    for (const ach of ACHIEVEMENTS) {
      if (unlocked.has(ach.key)) continue;
      if (ach.condition(user.rows[0])) {
        const lang = user.rows[0]?.language_code || 'ru';
        const result = await pool.query(
          `INSERT INTO achievements (user_id, achievement_key) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`,
          [userId, ach.key]
        );
        if (result.rowCount > 0 && ach.bonus > 0) {
          await pool.query(
            `UPDATE users SET balance = balance + $1 WHERE telegram_id = $2`,
            [ach.bonus, userId]
          );
          await logTx(userId, 'achievement', ach.bonus, 'in', { title: ACHIEVEMENT_TITLES[ach.key]?.[lang] || ach.key });
        }
        const prefix = ACHIEVEMENT_UNLOCK_PREFIX[lang] || ACHIEVEMENT_UNLOCK_PREFIX['ru'];
        try {
          const title = ACHIEVEMENT_TITLES[ach.key]?.[lang] || ach.key;
          const imageBuffer = await generateAchievementCard({ emoji: ach.emoji, title, prefix, lang });
          await withRetry(() => bot.telegram.sendPhoto(userId, { source: imageBuffer }));
        } catch (e) {
          try {
            await withRetry(() => bot.telegram.sendMessage(userId, `${prefix}: ${ACHIEVEMENT_TITLES[ach.key]?.[lang] || ach.key}`));
          } catch (e2) {}
        }
      }
    }
  } catch (e) {
    console.error('[ACHIEVEMENTS] checkAndUnlock error:', e.message);
  }
}

module.exports = { checkAndUnlockAchievements };
