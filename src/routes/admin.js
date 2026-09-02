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

// ==================== ВОПРОСЫ ====================
router.get('/api/admin/questions', questionsAdminRateLimit, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    let filtered = questionsCache;
    if (search) {
      const s = search.toLowerCase();
      filtered = questionsCache.filter(q =>
        q.text.toLowerCase().includes(s) ||
        q.correct.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    res.json({
      questions: paginated,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error('[ADMIN] /api/admin/questions error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/admin/questions/add', questionsAdminRateLimit, requireAdmin, async (req, res) => {
  try {
    const { text, options, correct, lang } = req.body;
    if (!text || !options || correct === undefined) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const translations = {};
    const targetLangs = ['en', 'fr', 'es'];
    if (process.env.YANDEX_TRANSLATE_API_KEY) {
      for (const tLang of targetLangs) {
        try {
          const [translatedText, ...translatedOptions] = await Promise.all([
            yandexTranslate(text, tLang),
            ...options.map(opt => yandexTranslate(opt, tLang))
          ]);
          translations[tLang] = {
            text: translatedText,
            options: translatedOptions,
          };
        } catch (e) {
          console.error(`[TRANSLATE] Failed for ${tLang}:`, e.message);
        }
      }
    }

    const result = await pool.query(
      'INSERT INTO questions (lang, text, options, correct, translations) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [lang || 'ru', text, JSON.stringify(options), correct, JSON.stringify(translations)]
    );
    await loadQuestionsFromDB();
    res.json({ ok: true, total: questionsCache.length, id: result.rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/admin/questions/delete', questionsAdminRateLimit, requireAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID не указан' });
    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    await loadQuestionsFromDB();
    res.json({ ok: true, total: questionsCache.length });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/admin/questions/edit', questionsAdminRateLimit, requireAdmin, async (req, res) => {
  const { id, text, options, correct } = req.body;
  if (!id || !text || !options || !correct) {
    return res.status(400).json({ error: 'Неверные данные' });
  }

  try {
    let translations = {};
    if (process.env.YANDEX_TRANSLATE_API_KEY) {
      try {
        const langs = ['en', 'fr', 'es'];
        for (const lang of langs) {
          const translated = await yandexTranslate(text, lang);
          const translatedOptions = await Promise.all(options.map(o => yandexTranslate(o, lang)));
          translations[lang] = {
            text: translated,
            options: translatedOptions,
          };
        }
      } catch (e) {
        console.error('[TRANSLATE] Edit question translation failed:', e.message);
        translations = {};
      }
    }

    const { rowCount } = await pool.query(
      'UPDATE questions SET text=$1, options=$2, correct=$3, translations=$4 WHERE id=$5',
      [text, JSON.stringify(options), correct, JSON.stringify(translations), id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Вопрос не найден' });

    await loadQuestionsFromDB();
    res.json({ ok: true });
  } catch (e) {
    console.error('[ADMIN] Edit question error:', e.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/api/admin/questions/translate-all', questionsAdminRateLimit, requireAdmin, async (req, res) => {
  if (!process.env.YANDEX_TRANSLATE_API_KEY) {
    return res.json({ error: 'YANDEX_TRANSLATE_API_KEY не задан' });
  }

  try {
    const result = await pool.query(
      "SELECT id, text, options FROM questions WHERE translations = '{}' OR translations IS NULL"
    );

    let translated = 0;
    let skipped = 0;

    for (const row of result.rows) {
      try {
        const langs = ['en', 'fr', 'es'];
        const translations = {};

        for (const lang of langs) {
          const options = typeof row.options === 'string'
            ? JSON.parse(row.options)
            : row.options;

          const tText = await yandexTranslate(row.text, lang);
          const tOptions = await Promise.all(options.map(o => yandexTranslate(o, lang)));

          translations[lang] = {
            text: tText,
            options: tOptions,
          };
        }

        await pool.query(
          'UPDATE questions SET translations=$1 WHERE id=$2',
          [JSON.stringify(translations), row.id]
        );
        translated++;
      } catch (e) {
        console.error(`[TRANSLATE-ALL] Failed for question id=${row.id}:`, e.message);
        skipped++;
      }
    }

    await loadQuestionsFromDB();
    res.json({ ok: true, translated, skipped });
  } catch (e) {
    console.error('[ADMIN] Translate all error:', e.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== ВЫВОДЫ ====================
router.get('/api/admin/withdrawals', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const status = req.query.status || 'all';
    const offset = (page - 1) * limit;
    const whereClause = status !== 'all' ? `WHERE w.status = $1` : '';
    const params = status !== 'all' ? [status] : [];
    const countRes = await pool.query(`SELECT COUNT(*) FROM withdrawals w ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    const { rows: statsRows } = await pool.query(`SELECT status, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS total FROM withdrawals GROUP BY status`);
    const stats = { pending: 0, approved: 0, rejected: 0, totalApproved: 0 };
    for (const r of statsRows) {
      if (r.status === 'pending') stats.pending = parseInt(r.cnt);
      if (r.status === 'approved') { stats.approved = parseInt(r.cnt); stats.totalApproved = parseInt(r.total); }
      if (r.status === 'rejected') stats.rejected = parseInt(r.cnt);
    }

    const dataParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    const { rows } = await pool.query(`SELECT w.id, w.telegram_id, w.amount, w.wallet, w.status, w.aml_status, w.created_at, w.processed_at, u.first_name FROM withdrawals w LEFT JOIN users u ON u.telegram_id = w.telegram_id ${whereClause} ORDER BY w.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`, dataParams);

    res.json({ withdrawals: rows, stats, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/admin/exchange-orders', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM exchange_orders');
    const total = parseInt(countRes.rows[0].count);
    const { rows } = await pool.query(
      `SELECT e.*, u.first_name FROM exchange_orders e LEFT JOIN users u ON u.telegram_id = e.telegram_id ORDER BY e.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ orders: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error('[ADMIN] exchange-orders error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/admin/withdrawals/update', adminRateLimit, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id, status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    await client.query('BEGIN');

    // ✅ FOR UPDATE — блокируем строку от гонок
    const withdrawal = await client.query(
      'SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (!withdrawal.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const w = withdrawal.rows[0];

    // ✅ Защита от двойной обработки
    if (w.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Заявка уже обработана (статус: ${w.status})` });
    }

    // ===== APPROVE =====
    if (status === 'approved') {
      const privateKey = process.env.TON_OPERATION_WALLET_PRIVATE_KEY;
      if (!privateKey) {
        await client.query('ROLLBACK');
        return res.status(500).json({
          error: 'Приватный ключ не настроен. Добавь TON_OPERATION_WALLET_PRIVATE_KEY.'
        });
      }

      try {
        const txHash = await sendCogniqJetton(w.wallet, w.amount, privateKey);

        // Статус 'completed', tx_hash записан
        await client.query(
          `UPDATE withdrawals
           SET status = 'completed', processed_at = NOW(), tx_hash = $1
           WHERE id = $2`,
          [txHash, id]
        );
        await client.query('COMMIT');

        const bot = req.app.get('bot');
        try {
          await bot.telegram.sendMessage(
            w.telegram_id,
            `✅ Вывод ${w.amount.toLocaleString()} COGNIQ выполнен!\n\n🔗 TX: https://tonviewer.com/transaction/${txHash}`
          );
        } catch(e) {
          console.error('[WITHDRAW] notify error:', e.message);
        }

        console.log(`[WITHDRAW] Completed id=${id}, TX: ${txHash}`);
        return res.json({ ok: true, txHash });

      } catch(e) {
        console.error('[WITHDRAW] On-chain error:', e.message);

        // ✅ Возвращаем И БАЛАНС И ТИКЕТЫ
        await client.query(
          'UPDATE users SET balance = balance + $1, withdraw_tickets = withdraw_tickets + $2 WHERE telegram_id = $3',
          [w.amount, Math.floor(w.amount / 1000), w.telegram_id]
        );
        await client.query(
          "UPDATE withdrawals SET status = 'failed', processed_at = NOW() WHERE id = $1",
          [id]
        );
        await client.query('COMMIT');

        return res.status(500).json({ error: 'Ошибка ончейн-вывода: ' + e.message });
      }
    }

    // ===== REJECT =====
    // ✅ Возвращаем И БАЛАНС И ТИКЕТЫ
    await client.query(
      'UPDATE users SET balance = balance + $1, withdraw_tickets = withdraw_tickets + $2 WHERE telegram_id = $3',
      [w.amount, Math.floor(w.amount / 1000), w.telegram_id]
    );
    await client.query(
      `UPDATE withdrawals SET status = 'rejected', processed_at = NOW() WHERE id = $1`,
      [id]
    );
    await client.query('COMMIT');

    res.json({ ok: true });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('[WITHDRAW] update error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ==================== ТРАНСФЕРЫ ====================
router.get('/api/admin/transfers/stats', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) as total_count, COALESCE(SUM(amount), 0) as total_volume, COALESCE(SUM(commission), 0) as total_commission FROM transfers`);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/admin/transfers/list', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM transfers');
    const total = parseInt(countRes.rows[0].count);
    const { rows } = await pool.query(`SELECT t.*, uf.nickname as from_nick, uf.first_name as from_name, ut.nickname as to_nick, ut.first_name as to_name FROM transfers t LEFT JOIN users uf ON uf.telegram_id = t.from_user LEFT JOIN users ut ON ut.telegram_id = t.to_user ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ transfers: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== BURN ====================
router.get('/api/admin/burn/stats', requireAdmin, async (req, res) => {
  try {
    const { rows: poolRows } = await pool.query(`SELECT COALESCE(SUM(CASE WHEN source LIKE 'impulse_%' THEN amount / 5.0 ELSE amount END), 0) AS total FROM burn_pool`);
    const { rows: histRows } = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total_burned, MAX(burned_at) AS last_burned_at FROM burn_history');
    const { rows: sources } = await pool.query(`SELECT source, COUNT(*) AS count, SUM(CASE WHEN source LIKE 'impulse_%' THEN amount / 5.0 ELSE amount END) AS total FROM burn_pool GROUP BY source ORDER BY total DESC`);
    const { rows: history } = await pool.query('SELECT id, amount, tx_hash, burned_at FROM burn_history ORDER BY burned_at DESC LIMIT 20');
    res.json({ total: parseInt(poolRows[0].total), totalBurned: parseInt(histRows[0].total_burned), lastBurnedAt: histRows[0].last_burned_at, sources, history });
  } catch(e) { console.error('[BURN] stats error:', e); res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/admin/burn/execute', requireAdmin, async (req, res) => {
  const { txHash } = req.body;
  if (!txHash) return res.status(400).json({ error: 'txHash обязателен' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT COALESCE(SUM(amount), 0) AS total FROM burn_pool');
    const total = parseInt(rows[0].total);
    if (total <= 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Пул пуст, нечего сжигать' }); }
    await client.query('INSERT INTO burn_history (amount, tx_hash) VALUES ($1, $2)', [total, txHash]);
    await client.query('DELETE FROM burn_pool');
    await client.query('COMMIT');
    const bot = req.app.get('bot');
    try { await postBurnCard(bot, total, txHash); } catch(e) { console.error('[BURN] card error:', e.message); }
    res.json({ ok: true, burned: total });
  } catch(e) { await client.query('ROLLBACK'); console.error('[BURN] execute error:', e); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

module.exports = router;
