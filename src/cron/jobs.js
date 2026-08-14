const cron = require('node-cron');
const pool = require('../db/pool');
const { postDailyQuestion, postWeeklyTop, sendStreakWarnings, postWeeklyAchievements, postStreakBattle, postDailyFact, postRankLeaderboard, postDailyPoll } = require('../services/channel');

// TON платежи — каждые 30 секунд
// (checkTonUsdtPayments пока в index.js, потом вынесем)

// Авто-клейм стейков — каждый день в полночь
cron.schedule('0 0 * * *', async () => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM stakes WHERE claimed = false AND end_date <= CURRENT_DATE"
    );
    for (const s of rows) {
      const total = s.amount + Math.floor(s.amount * s.percent / 100);
      await pool.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [total, s.user_id]);
      await pool.query('UPDATE stakes SET claimed = true WHERE id = $1', [s.id]);
    }
    if (rows.length) console.log(`[CRON] Auto-claimed ${rows.length} stakes`);
  } catch (e) {
    console.error('[CRON] stake claim error:', e.message);
  }
});

// Вопрос дня — каждый день в 10:00 МСК (07:00 UTC)
cron.schedule('0 7 * * *', () => postDailyQuestion(bot, botUsername));

// Топ недели — каждое воскресенье в 18:00 UTC (21:00 МСК)
cron.schedule('0 18 * * 0', () => postWeeklyTop(bot, botUsername));

// Предупреждения о стриках — каждый день в 11:00 UTC (14:00 МСК)
cron.schedule('0 11 * * *', () => sendStreakWarnings(bot));

// Достижения недели — пятница 16:00 UTC (19:00 МСК)
cron.schedule('0 16 * * 5', () => postWeeklyAchievements(bot, botUsername));

// Сброс daily_deeplink — каждый день в полночь
cron.schedule('0 0 * * *', async () => {
  await pool.query(`UPDATE users SET daily_deeplink_used = false`);
  console.log('[CRON] daily_deeplink_used reset');
});

// Битва стриков — среда 15:00 UTC (18:00 МСК)
cron.schedule('0 15 * * 3', () => postStreakBattle(bot, botUsername));

// Факт дня — каждый день 12:00 UTC (15:00 МСК)
cron.schedule('0 12 * * *', () => postDailyFact(bot));

// Рейтинг рангов — вторник 15:00 UTC (18:00 МСК)
cron.schedule('0 15 * * 2', () => postRankLeaderboard(bot, botUsername));

// Опрос — четверг 15:00 UTC (18:00 МСК)
cron.schedule('0 15 * * 4', () => postDailyPoll(bot));

module.exports = { setupCron };
