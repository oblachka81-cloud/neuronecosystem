const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireInitData } = require('../middleware/auth');
const { publicRateLimit, heavyRateLimit } = require('../middleware/rateLimit');
const { todayStr, normalizeDateStr } = require('../services/users');
const { logTx } = require('../services/burn');
const { generatePurchaseCard } = require('../../channel');
const { withRetry } = require('../services/burn');
const {
  COGNIQ_PACK_PRICE,
  COGNIQ_PACK_COOLDOWN_DAYS,
  PACK_GAMES,
  VIP_PRICE_STARS,
  PREMIUM_PRICE_STARS,
  VIP_DURATION_DAYS,
  PREMIUM_DURATION_DAYS,
  VIP_PRICE_USDT,
  PREMIUM_PRICE_USDT,
  CHANNEL_BONUS,
} = require('../config');

router.post('/api/create-stars-invoice', requireInitData, publicRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.tgUser.id;
    const today = todayStr();

    const userRes = await client.query(
      'SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE',
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const lastSuperDate = normalizeDateStr(user.last_super_game_date);

    if (lastSuperDate === today) {
      await client.query('ROLLBACK');
      const lang = user.language_code || 'en';
      const msgs = {
        ru: 'Супер-игра доступна только 1 раз в день. Возвращайся завтра!',
        en: 'Super game is available once a day. Come back tomorrow!',
        fr: 'Le super jeu est disponible une fois par jour. Reviens demain !',
        es: '¡El super juego está disponible una vez al día. ¡Vuelve mañana!'
      };
      return res.status(403).json({
        error: msgs[lang] || msgs.en,
        superGameLimit: true,
      });
    }

    const bot = req.app.get('bot');
    let link;
    try {
      link = await bot.telegram.createInvoiceLink({
        title: '🔥 Супер игра NEURON',
        description: 'x15 COGNIQ за вопрос. Максимум 150 COGNIQ!',
        payload: `super_game_${userId}`,
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: 'Супер игра', amount: 50 }],
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }

    await client.query('COMMIT');
    res.json({ link });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Stars invoice error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/api/create-stars-invoice-pack', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const bot = req.app.get('bot');
    const link = await bot.telegram.createInvoiceLink({
      title: '⚡ Пакет +10 игр',
      description: '+10 игр в NEURON Quiz',
      payload: `pack_20_${userId}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: 'Пакет +10 игр', amount: 50 }],
    });
    res.json({ ok: true, link });
  } catch (e) {
    console.error('[STARS] pack invoice error:', e.message);
    res.json({ ok: false, error: e.message });
  }
});

router.post('/api/create-stars-invoice-vip', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const bot = req.app.get('bot');
    const link = await bot.telegram.createInvoiceLink({
      title: '👑 VIP подписка — 7 дней',
      description: '+10 игр/день, бейдж, 1 подсказка/день',
      payload: `sub_vip_${userId}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: 'VIP 7 дней', amount: 150 }],
    });
    res.json({ ok: true, link });
  } catch (e) {
    console.error('[STARS] vip invoice error:', e.message);
    res.json({ ok: false, error: e.message });
  }
});

router.post('/api/create-stars-invoice-premium', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const bot = req.app.get('bot');
    const link = await bot.telegram.createInvoiceLink({
      title: '💎 PREMIUM подписка — 30 дней',
      description: '+10 игр/день, рамка, 2 подсказки/день',
      payload: `sub_premium_${userId}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: 'Premium 30 дней', amount: 400 }],
    });
    res.json({ ok: true, link });
  } catch (e) {
    console.error('[STARS] premium invoice error:', e.message);
    res.json({ ok: false, error: e.message });
  }
});

router.post('/api/shop/buy-pack', requireInitData, heavyRateLimit, async (req, res) => {
  const userId = req.tgUser.id;
  const { currency } = req.body;

  if (!userId || !currency) return res.status(400).json({ error: 'Missing params' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];

    if (currency === 'cogniq') {
      if (user.last_cogniq_pack_purchase) {
        const daysSince = (Date.now() - new Date(user.last_cogniq_pack_purchase)) / (1000 * 60 * 60 * 24);
        if (daysSince < COGNIQ_PACK_COOLDOWN_DAYS) {
          const hoursLeft = Math.ceil((COGNIQ_PACK_COOLDOWN_DAYS * 24) - daysSince * 24);
          return res.status(403).json({ error: 'cooldown', hoursLeft });
        }
      }

      if (user.balance < COGNIQ_PACK_PRICE) {
        return res.status(403).json({ error: 'insufficient_cogniq' });
      }

      await pool.query(
        `UPDATE users SET balance = balance - $1, extra_games = COALESCE(extra_games, 0) + $3, last_cogniq_pack_purchase = NOW() WHERE telegram_id = $2`,
        [COGNIQ_PACK_PRICE, userId, PACK_GAMES]
      );

      await pool.query(
        `INSERT INTO shop_purchases (user_id, item_key, price_amount, price_currency) VALUES ($1, 'pack_20', $2, 'cogniq')`,
        [userId, COGNIQ_PACK_PRICE]
      );
      await logTx(userId, 'shop_purchase', COGNIQ_PACK_PRICE, 'out', { item: 'pack_20' });

      return res.json({ ok: true, method: 'cogniq', gamesAdded: PACK_GAMES });
    }

    if (currency === 'usdt' || currency === 'stars') {
      return res.json({ ok: true, method: currency, action: 'create_invoice' });
    }

    return res.status(400).json({ error: 'Unknown currency' });
  } catch (e) {
    console.error('/api/shop/buy-pack error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/shop/buy-frame', requireInitData, heavyRateLimit, async (req, res) => {
  const userId = req.tgUser.id;
  const { frameKey, currency } = req.body;

  if (!userId || !frameKey || !currency) return res.status(400).json({ error: 'Missing params' });

  try {
    const item = await pool.query('SELECT * FROM shop_items WHERE key = $1 AND type = $2 AND active = true', [frameKey, 'avatar_frame']);
    if (!item.rows.length) return res.status(404).json({ error: 'Frame not found' });

    const frame = item.rows[0];
    const user = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [userId]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    if (currency === 'cogniq') {
      if (!frame.price_cogniq) return res.status(400).json({ error: 'Not available for COGNIQ' });
      if (user.rows[0].balance < frame.price_cogniq) return res.status(403).json({ error: 'Insufficient COGNIQ' });

      await pool.query('UPDATE users SET balance = balance - $1, avatar_frame = $2 WHERE telegram_id = $3', [frame.price_cogniq, frameKey, userId]);
      await pool.query('INSERT INTO shop_purchases (user_id, item_key, price_amount, price_currency) VALUES ($1, $2, $3, $4)', [userId, frameKey, frame.price_cogniq, 'cogniq']);
      await logTx(userId, 'shop_purchase', frame.price_cogniq, 'out', { item: frameKey });

      return res.json({ ok: true, frameKey });
    }

    if (currency === 'usdt') {
      if (!frame.price_usdt) return res.status(400).json({ error: 'Not available for USDT' });
      return res.json({ ok: true, action: 'ton_payment', context: `frame_${frameKey}`, amount: frame.price_usdt });
    }

    return res.status(400).json({ error: 'Unknown currency' });
  } catch (e) {
    console.error('/api/shop/buy-frame error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/shop/subscribe', requireInitData, heavyRateLimit, async (req, res) => {
  const userId = req.tgUser.id;
  const { type, currency } = req.body;

  if (!userId || !type || !currency) return res.status(400).json({ error: 'Missing params' });
  if (!['vip', 'premium'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  if (!['usdt', 'stars'].includes(currency)) return res.status(400).json({ error: 'Invalid currency' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const durationDays = type === 'vip' ? VIP_DURATION_DAYS : PREMIUM_DURATION_DAYS;
    const priceStars = type === 'vip' ? 150 : 400;

    return res.json({
      ok: true,
      action: 'create_invoice',
      type,
      currency,
      durationDays,
      priceStars,
      priceUsdt: type === 'vip' ? VIP_PRICE_USDT : PREMIUM_PRICE_USDT
    });
  } catch (e) {
    console.error('/api/shop/subscribe error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/shop/activate-subscription', requireInitData, heavyRateLimit, async (req, res) => {
  const userId = req.tgUser.id;
  const { type } = req.body;

  if (!userId || !type) return res.status(400).json({ error: 'Missing params' });
  if (!['vip', 'premium'].includes(type)) return res.status(400).json({ error: 'Invalid type' });

  try {
    const durationDays = type === 'vip' ? VIP_DURATION_DAYS : PREMIUM_DURATION_DAYS;

    const { rows } = await pool.query('SELECT subscription_expires_at FROM users WHERE telegram_id = $1', [userId]);
    const current = rows[0]?.subscription_expires_at;
    const base = current && new Date(current) > new Date() ? new Date(current) : new Date();
    const expiresAt = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET subscription_type = $1, subscription_expires_at = $2 WHERE telegram_id = $3`,
      [type, expiresAt, userId]
    );

    await pool.query(
      `INSERT INTO subscriptions (user_id, type, expires_at) VALUES ($1, $2, $3)`,
      [userId, type, expiresAt]
    );

    return res.json({ ok: true, type, expiresAt });
  } catch (e) {
    console.error('/api/shop/activate-subscription error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/claim-channel-bonus', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const CHANNEL_ID = process.env.CHANNEL_ID;
    const bot = req.app.get('bot');

    if (!CHANNEL_ID) {
      return res.status(500).json({ error: 'CHANNEL_ID не настроен' });
    }

    const userRes = await pool.query(
      'SELECT channel_bonus_claimed FROM users WHERE telegram_id = $1',
      [userId]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });
    if (userRes.rows[0].channel_bonus_claimed) {
      return res.json({ success: false, message: 'Бонус уже получен' });
    }

    let chatMember;
    try {
      chatMember = await bot.telegram.getChatMember(CHANNEL_ID, userId);
    } catch (e) {
      console.error('getChatMember error:', e.message);
      return res.status(500).json({ error: 'Не удалось проверить подписку' });
    }

    if (!['member', 'administrator', 'creator'].includes(chatMember.status)) {
      return res.json({ success: false, message: 'Подпишитесь на канал чтобы получить бонус' });
    }

    await pool.query(
      'UPDATE users SET balance = balance + $1, channel_bonus_claimed = true WHERE telegram_id = $2',
      [CHANNEL_BONUS, userId]
    );

    return res.json({ success: true, bonus: CHANNEL_BONUS, message: `+${CHANNEL_BONUS} COGNIQ за подписку!` });
  } catch (e) {
    console.error('Channel bonus error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
