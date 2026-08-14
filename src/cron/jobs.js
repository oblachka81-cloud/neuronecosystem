const cron = require('node-cron');
const pool = require('../db/pool');
const { postDailyQuestion, postWeeklyTop, sendStreakWarnings, postWeeklyAchievements, postStreakBattle, postDailyFact, postRankLeaderboard, postDailyPoll } = require('../services/channel');
const { checkTonUsdtPayments } = require('../services/tonPayments');

function setupCron(bot, botUsername) {
cron.schedule('*/30 * * * * *', () => checkTonUsdtPayments(bot));
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

  cron.schedule('0 7 * * *', () => postDailyQuestion(bot, botUsername));
  cron.schedule('0 18 * * 0', () => postWeeklyTop(bot, botUsername));
  cron.schedule('0 11 * * *', () => sendStreakWarnings(bot));
  cron.schedule('0 16 * * 5', () => postWeeklyAchievements(bot, botUsername));

  cron.schedule('0 0 * * *', async () => {
    await pool.query(`UPDATE users SET daily_deeplink_used = false`);
    console.log('[CRON] daily_deeplink_used reset');
  });

  cron.schedule('0 15 * * 3', () => postStreakBattle(bot, botUsername));
  cron.schedule('0 12 * * *', () => postDailyFact(bot));
  cron.schedule('0 15 * * 2', () => postRankLeaderboard(bot, botUsername));
  cron.schedule('0 15 * * 4', () => postDailyPoll(bot));
}


module.exports = { setupCron };
