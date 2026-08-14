const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { adminRateLimit, questionsAdminRateLimit } = require('../middleware/rateLimit');
const { loadQuestionsFromDB, yandexTranslate, questionsCache } = require('../services/questions');
const { sendCogniqJetton } = require('../services/ton');
const { postBurnCard } = require('../../channel');

// ==================== СТАТИСТИКА ====================
router.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [
      playersResult,
      gamesTodayResult,
      circulationResult,
      questionsResult,
      superGamesResult,
      starsResult,
      usdtResult,
      withdrawStatsResult,
      exchangeResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COALESCE(SUM(games_today), 0) AS total FROM users WHERE last_game_date = CURRENT_DATE"),
      pool.query('SELECT COALESCE(SUM(balance), 0) AS total FROM users'),
      pool.query('SELECT COUNT(*) FROM questions'),
      pool.query('SELECT COALESCE(SUM(super_games_total), 0) AS total FROM users'),
      pool.query('SELECT COALESCE(SUM(stars_spent), 0) AS total FROM users'),
      pool.query("SELECT COALESCE(SUM(amount_usdt), 0) AS total FROM exchange_orders WHERE status = 'completed'"),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
          COUNT(*) FILTER (WHERE status = 'approved') AS approved,
          COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
          COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS total_approved
        FROM withdrawals
      `),
      pool.query(`
        SELECT
          COUNT(*) AS exchange_count,
          COALESCE(SUM(amount_cogniq), 0) AS total_cogniq,
          COALESCE(SUM(amount_usdt), 0)   AS total_usdt
        FROM exchange_orders
        WHERE status = 'completed'
      `)
    ]);

    const ws = withdrawStatsResult.rows[0];
    const ex = exchangeResult.rows[0];

    res.json({
      totalPlayers:         parseInt(playersResult.rows[0].count),
      gamesToday:           parseInt(gamesTodayResult.rows[0].total),
      cogniqInCirculation:  parseInt(circulationResult.rows[0].total),
      totalQuestions:       parseInt(questionsResult.rows[0].count),
      superGamesTotal:      parseInt(superGamesResult.rows[0].total),
      starsCollected:       parseInt(starsResult.rows[0].total),
      usdtTotal:            parseFloat(usdtResult.rows[0].total),
      withdrawStats: {
        pending:      parseInt(ws.pending),
        approved:     parseInt(ws.approved),
        rejected:     parseInt(ws.rejected),
        totalApproved: parseInt(ws.total_approved)
      },
      totalPurchasedCogniq: parseInt(ex.total_cogniq),
      totalUsdtReceived:    parseFloat(ex.total_usdt),
      exchangeCount:        parseInt(ex.exchange_count)
    });

  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Stats unavailable' });
  }
});

router.get('/api/admin/shop-stats', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const { rows: packRows } = await pool.query(`
      SELECT price_currency, COUNT(*) AS cnt, COALESCE(SUM(price_amount), 0) AS total
      FROM shop_purchases WHERE item_key = 'pack_20'
      GROUP BY price_currency
    `);

    const { rows: subRows } = await pool.query(`
      SELECT subscription_type, COUNT(*) AS cnt
      FROM users
      WHERE subscription_type IS NOT NULL
        AND subscription_expires_at > NOW()
      GROUP BY subscription_type
    `);

    const { rows: subRevenueRows } = await pool.query(`
      SELECT price_currency, COALESCE(SUM(price_amount), 0) AS total
      FROM shop_purchases WHERE item_key IN ('sub_vip', 'sub_premium')
      GROUP BY price_currency
    `);

    res.json({ packRows, subRows, subRevenueRows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/admin/subscribers', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countRes = await pool.query(`SELECT COUNT(*) FROM users WHERE subscription_type IS NOT NULL AND subscription_expires_at > NOW()`);
    const total = parseInt(countRes.rows[0].count);
    const { rows } = await pool.query(`SELECT telegram_id, first_name, subscription_type, subscription_expires_at FROM users WHERE subscription_type IS NOT NULL AND subscription_expires_at > NOW() ORDER BY subscription_expires_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ subscribers: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/admin/shop-history', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countRes = await pool.query(`SELECT COUNT(*) FROM shop_purchases`);
    const total = parseInt(countRes.rows[0].count);
    const { rows } = await pool.query(`SELECT sp.id, sp.user_id, u.first_name, sp.item_key, sp.price_amount, sp.price_currency, sp.purchased_at AS created_at FROM shop_purchases sp LEFT JOIN users u ON u.telegram_id = sp.user_id ORDER BY sp.purchased_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ purchases: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/admin/reset-cooldown', adminRateLimit, requireAdmin, async (req, res) => {
  const { telegram_id } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'Missing telegram_id' });
  try {
    await pool.query(
      'UPDATE users SET last_cogniq_pack_purchase = NULL WHERE telegram_id = $1',
      [telegram_id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/admin/set-subscription', adminRateLimit, requireAdmin, async (req, res) => {
  const { telegram_id, subscription_type, days } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'Missing telegram_id' });
  try {
    if (!subscription_type) {
      await pool.query(
        'UPDATE users SET subscription_type = NULL, subscription_expires_at = NULL WHERE telegram_id = $1',
        [telegram_id]
      );
    } else {
      const expires = new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000);
      await pool.query(
        'UPDATE users SET subscription_type = $1, subscription_expires_at = $2 WHERE telegram_id = $3',
        [subscription_type, expires, telegram_id]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ИГРОКИ ====================
router.get('/api/admin/players', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE first_name ILIKE $1 OR username ILIKE $1 OR CAST(telegram_id AS TEXT) LIKE $1`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    const dataParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const { rows } = await pool.query(
      `SELECT telegram_id AS id, first_name AS name, username, balance AS total_score,
              games_today AS games_played, super_games_total, withdraw_tickets, total_burned
       FROM users ${whereClause}
       ORDER BY balance DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    );

    res.json({
      players: rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error('[ADMIN] /api/admin/players error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/admin/reset-player', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    await pool.query(
      `UPDATE users SET
        balance = 0,
        games_today = 0,
        super_games_total = 0,
        last_super_game_date = NULL,
        super_game_pending = false,
        current_game_index = 0,
        current_game_score = 0,
        current_question_order = '[]',
        current_hints_used = '[]',
        withdraw_tickets = 0
       WHERE telegram_id = $1`,
      [userId]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/admin/delete-player', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const { rowCount } = await pool.query('DELETE FROM users WHERE telegram_id = $1', [userId]);
    if (rowCount > 0) res.json({ ok: true });
    else res.status(404).json({ error: 'Игрок не найден' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
