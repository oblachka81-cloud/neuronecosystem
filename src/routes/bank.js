const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireInitData, requireInitDataStrict } = require('../middleware/auth');
const { publicRateLimit } = require('../middleware/rateLimit');
const { todayStr } = require('../services/users');
const { logTx, addToBurnPool } = require('../services/burn');
const { generateTransferReceivedCard } = require('../../channel');
const { MAX_FREE_GAMES_PER_DAY, REFERRAL_BONUS } = require('../config');

// ==================== STAKING ====================
router.get('/api/staking/list', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));
    const offset = (page - 1) * limit;

    const countRes = await pool.query('SELECT COUNT(*) FROM stakes WHERE user_id = $1 AND claimed = false', [userId]);
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await pool.query(
      'SELECT * FROM stakes WHERE user_id = $1 AND claimed = false ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    res.json({ stakes: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/staking/create', requireInitData, publicRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const { amount, term } = req.body;

    if (!amount || amount < 100) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Min 100 COGNIQ' }); }
    if (![30, 60, 90].includes(term)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Invalid term' }); }

    const percent = term === 30 ? 5 : term === 60 ? 12 : 20;
    const user = await client.query('SELECT balance FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    if (user.rows[0].balance < amount) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Insufficient COGNIQ' }); }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + term);

    await client.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [amount, userId]);
    await client.query('INSERT INTO stakes (user_id, amount, percent, start_date, end_date) VALUES ($1, $2, $3, $4, $5)',
      [userId, amount, percent, new Date().toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]);

    await client.query('COMMIT');
    await logTx(userId, 'stake_deposit', amount, 'out', { term: `${term} дн` });
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/api/staking/claim', requireInitData, publicRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const { id } = req.body;

    const stake = await client.query('SELECT * FROM stakes WHERE id = $1 AND user_id = $2 AND claimed = false FOR UPDATE', [id, userId]);
    if (!stake.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Stake not found' }); }

    const s = stake.rows[0];
    if (new Date(s.end_date).getTime() > Date.now()) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Not matured' }); }

    const total = s.amount + Math.floor(s.amount * s.percent / 100);
    await client.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [total, userId]);
    await client.query('UPDATE stakes SET claimed = true WHERE id = $1', [id]);

    await client.query('COMMIT');
    await logTx(userId, 'stake_reward', total, 'in');
    res.json({ ok: true, amount: total });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ==================== IMPULSE ====================
router.get('/api/impulse/balance', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const today = todayStr();
    const { rows } = await pool.query(
      'SELECT balance, last_claim_date FROM impulse_balance WHERE user_id = $1', [userId]
    );
    const balance = rows[0]?.balance || 0;
    const lastClaim = rows[0]?.last_claim_date 
      ? new Date(rows[0].last_claim_date).toISOString().slice(0, 10) 
      : null;
    const canClaim = lastClaim !== today;
    res.json({ balance, last_claim_date: lastClaim, can_claim: canClaim });
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/api/impulse/daily', requireInitData, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const today = todayStr();
    
    const { rows } = await client.query(
      'SELECT user_id, balance, last_claim_date FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]
    );
    
    const lastClaim = rows[0]?.last_claim_date 
      ? new Date(rows[0].last_claim_date).toISOString().slice(0, 10) 
      : null;
    
    if (lastClaim === today) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already claimed today' });
    }
    
    if (!rows[0]) {
      await client.query(
        'INSERT INTO impulse_balance (user_id, balance, last_claim_date) VALUES ($1, 500, $2)',
        [userId, today]
      );
    } else {
      await client.query(
        'UPDATE impulse_balance SET balance = balance + 500, last_claim_date = $1 WHERE user_id = $2',
        [today, userId]
      );
    }
    
    await client.query('COMMIT');
    
    const newBal = await pool.query('SELECT balance FROM impulse_balance WHERE user_id = $1', [userId]);
    res.json({ received: 500, balance: newBal.rows[0]?.balance || 500 });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[IMPULSE] daily error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/api/impulse/spend', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const { amount } = req.body;
    const result = await pool.query(
      'UPDATE impulse_balance SET balance = balance - $1 WHERE user_id = $2 AND balance >= $1',
      [amount, userId]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Insufficient IMPULSE' });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/api/impulse/add', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    await pool.query(
      'INSERT INTO impulse_balance (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = impulse_balance.balance + $2',
      [userId, amount]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/api/impulse/exchange', requireInitData, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const { amount } = req.body;
    
    if (![100, 1000].includes(amount)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const result = await client.query(
      'UPDATE impulse_balance SET balance = balance - $1 WHERE user_id = $2 AND balance >= $1',
      [amount, userId]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient IMPULSE' });
    }
    
    if (amount === 1000) {
      await client.query(
        "UPDATE users SET super_game_pending = true, last_super_game_date = $1 WHERE telegram_id = $2",
        [todayStr(), userId]
      );
    } else {
      await client.query(
        "UPDATE users SET simple_game_pending = true, last_simple_game_date = $1 WHERE telegram_id = $2",
        [todayStr(), userId]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true, gameType: amount === 1000 ? 'super' : 'simple' });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'DB error' });
  } finally {
    client.release();
  }
});

router.post('/api/impulse/buy-game', requireInitData, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    
    const { rows } = await client.query(
      'SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]
    );
    
    if (!rows[0] || rows[0].balance < 200) {
      await client.query('ROLLBACK');
      return res.json({ success: false, error: 'Недостаточно IMPULSE. Нужно 200.' });
    }
    
    await client.query(
      'UPDATE impulse_balance SET balance = balance - 200 WHERE user_id = $1', [userId]
    );
    await client.query(
      "UPDATE users SET extra_games = COALESCE(extra_games, 0) + 1 WHERE telegram_id = $1",
      [userId]
    );
    
    await client.query('COMMIT');
    
    const user = await pool.query('SELECT games_today, extra_games FROM users WHERE telegram_id = $1', [userId]);
    const freeGamesLeft = Math.max(0, MAX_FREE_GAMES_PER_DAY - (user.rows[0]?.games_today || 0)) + (user.rows[0]?.extra_games || 0);
    
    res.json({ success: true, freeGamesLeft });
  } catch(e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/api/impulse/buy', requireInitData, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const amount = parseInt(req.body.amount);
    
    if (!amount || amount < 10 || amount > 1000) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Сумма: 10-1000 COGNIQ' });
    }
    
    const impulseAmount = amount * 5;
    
    const user = await client.query('SELECT balance FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    if (!user.rows[0] || user.rows[0].balance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Недостаточно COGNIQ' });
    }
    
    await client.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [amount, userId]);
    await client.query(
      'INSERT INTO impulse_balance (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = impulse_balance.balance + $2',
      [userId, impulseAmount]
    );
    
    await client.query('COMMIT');
    await logTx(userId, 'cogniq_to_impulse', amount, 'out', { impulse: impulseAmount });
    
    const newBal = await pool.query('SELECT balance FROM impulse_balance WHERE user_id = $1', [userId]);
    const cogBal = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [userId]);
    
    res.json({ 
      success: true, 
      impulse_balance: newBal.rows[0]?.balance || 0,
      cogniq_balance: cogBal.rows[0]?.balance || 0,
      received: impulseAmount 
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[IMPULSE] buy error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/api/impulse/buy-stars', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const { pack, lang } = req.body;
    const bot = req.app.get('bot');
    
    const packs = {
      small:  { stars: 50,  impulse: 500  },
      medium: { stars: 100, impulse: 1000 },
      big:    { stars: 500, impulse: 5000 },
    };
    
    const selected = packs[pack] || packs.small;
    
    const titles = {
      ru: `${selected.impulse} IMPULSE`,
      en: `${selected.impulse} IMPULSE`,
      fr: `${selected.impulse} IMPULSE`,
      es: `${selected.impulse} IMPULSE`,
    };
    
    const userLang = lang || 'ru';
    
    const link = await bot.telegram.createInvoiceLink({
      title: titles[userLang] || titles['en'],
      description: titles[userLang] || titles['en'],
      payload: `impulse_${pack}_${userId}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: titles[userLang] || titles['en'], amount: selected.stars }],
    });
    
    res.json({ ok: true, link });
  } catch (e) {
    console.error('[IMPULSE] stars invoice error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== TRANSFERS ====================
router.post('/api/transfer', requireInitDataStrict, publicRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fromId = req.tgUser.id;
    const { toUsername, amount } = req.body;
    const bot = req.app.get('bot');
    
    if (!amount || amount < 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Минимум 100 COGNIQ' });
    }
    const cleanUsername = toUsername.replace(/^@/, '');
    const toUser = await client.query(
      'SELECT telegram_id, first_name, nickname, username, language_code FROM users WHERE nickname = $1 OR username = $1 OR telegram_id::text = $1',
      [cleanUsername]
    );
    if (!toUser.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Игрок не найден' });
    }
    const toId = toUser.rows[0].telegram_id;
    if (toId === fromId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Нельзя переводить самому себе' });
    }
    const sender = await client.query('SELECT balance FROM users WHERE telegram_id = $1 FOR UPDATE', [fromId]);
    if (sender.rows[0].balance < amount) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Недостаточно COGNIQ' });
    }
    const commission = Math.max(1, Math.floor(amount * 0.01));
    const amountToReceive = amount - commission;
    await client.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [amount, fromId]);
    await client.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [amountToReceive, toId]);
    await client.query('UPDATE users SET total_burned = total_burned + $1 WHERE telegram_id = $2', [commission, fromId]);
    await client.query(
      'INSERT INTO transfers (from_user, to_user, amount, commission) VALUES ($1, $2, $3, $4)',
      [fromId, toId, amount, commission]
    );
    const toUserLang = toUser.rows[0]?.language_code || 'ru';
    await client.query('COMMIT');
    const senderRow = await pool.query('SELECT nickname, first_name FROM users WHERE telegram_id = $1', [fromId]);
    const senderName = senderRow.rows[0]?.nickname || senderRow.rows[0]?.first_name || 'Игрок';
    await logTx(fromId, 'transfer_sent', amount, 'out', { to: toUser.rows[0]?.nickname || toUser.rows[0]?.first_name || 'Игрок' });
    await logTx(toId, 'transfer_received', amountToReceive, 'in', { from: senderName });
    try {
      const card = await generateTransferReceivedCard({ amount: amountToReceive, fromName: senderName, lang: toUserLang });
      await bot.telegram.sendPhoto(toId, { source: card });
    } catch {}
    res.json({ ok: true, sent: amount, received: amountToReceive, commission });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[TRANSFER] error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

module.exports = router;
