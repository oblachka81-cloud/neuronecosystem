const cron = require('node-cron');
const pool = require('../db/pool');
const { postDailyQuestion, postWeeklyTop, sendStreakWarnings, postWeeklyAchievements, postStreakBattle, postDailyFact, postRankLeaderboard, postDailyPoll } = require('../services/channel');
const { checkTonUsdtPayments } = require('../services/tonPayments');
const { splitSuperGameRevenue } = require('../services/revenueSplit');

function setupCron(bot, botUsername) {
  cron.schedule('*/30 * * * * *', () => checkTonUsdtPayments(bot));

  cron.schedule('0 */6 * * *', () => splitSuperGameRevenue(bot));
  
  // ==================== АВТООЧИСТКА ДУЭЛЕЙ ====================
  // Каждые 15 минут удаляем "waiting" дуэли старше 30 минут
  cron.schedule('*/15 * * * *', async () => {
    try {
      // Удаляем ответы для старых дуэлей
      await pool.query(`
        DELETE FROM duel_answers WHERE duel_id IN (
          SELECT id FROM duels WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '30 minutes'
        )
      `);
      
      // Удаляем старые дуэли и возвращаем ставки создателям
      const staleDuels = await pool.query(`
        SELECT id, player1_id, stake FROM duels 
        WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '30 minutes'
      `);
      
      if (staleDuels.rows.length > 0) {
        for (const duel of staleDuels.rows) {
          // Возвращаем ставку создателю
          await pool.query(
            'UPDATE users SET balance = balance + $1 WHERE telegram_id = $2',
            [duel.stake, duel.player1_id]
          );
          
          // Логируем возврат
          await pool.query(
            'INSERT INTO transactions (user_id, type, amount, direction, description) VALUES ($1, $2, $3, $4, $5)',
            [duel.player1_id, 'duel_refund', duel.stake, 'in', JSON.stringify({ duel_id: duel.id, reason: 'timeout' })]
          );
        }
        
        // Удаляем дуэли
        await pool.query(`
          DELETE FROM duels 
          WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '30 minutes'
        `);
        
        console.log(`[DUELS] Auto-cleanup: ${staleDuels.rows.length} stale duels removed, stakes refunded`);
      }
    } catch (e) {
      console.error('[DUELS] Cleanup error:', e.message);
    }
  });
  
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
