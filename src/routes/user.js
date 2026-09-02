const express = require('express');
const router = express.Router();
const { Readable } = require('stream');
const pool = require('../db/pool');
const { requireInitData, requireInitDataStrict } = require('../middleware/auth');
const { publicRateLimit } = require('../middleware/rateLimit');
const { getOrCreateUser } = require('../services/users');
const { ACHIEVEMENTS, ACHIEVEMENT_TITLES } = require('../constants/achievements');
const { getUserRank } = require('../constants/ranks');
const { MIN_WITHDRAW, MAX_FREE_GAMES_PER_DAY } = require('../config');
const { logTx } = require('../services/burn');

async function getTgPhotoUrl(bot, userId) {
  try {
    const cached = await pool.query(
      'SELECT tg_photo_file_id FROM users WHERE telegram_id = $1',
      [userId]
    );
    const fileId = cached.rows[0]?.tg_photo_file_id;

    if (fileId) {
      try {
        const file = await bot.telegram.getFile(fileId);
        return `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
      } catch (e) {
        // file_id протух, идём за новым
      }
    }

    // Проверяем, существует ли пользователь
    try {
      await bot.telegram.getChat(userId);
    } catch (e) {
      // Пользователь не найден — тихо возвращаем null
      return null;
    }

    const photos = await bot.telegram.getUserProfilePhotos(userId, { limit: 1 });
    const newFileId = photos?.photos?.[0]?.[0]?.file_id || null;

    if (newFileId) {
      await pool.query('UPDATE users SET tg_photo_file_id = $1 WHERE telegram_id = $2', [newFileId, userId]);
      const file = await bot.telegram.getFile(newFileId);
      return `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    }

    return null;
  } catch (e) {
    // Тихо игнорируем ошибку
    return null;
  }
}

router.get('/api/user/achievements', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const existing = await pool.query(
      'SELECT achievement_key, unlocked_at FROM achievements WHERE user_id = $1',
      [userId]
    );
    const unlocked = new Map(existing.rows.map(r => [r.achievement_key, r.unlocked_at]));

    const list = ACHIEVEMENTS.map(ach => ({
      key: ach.key,
      emoji: ach.emoji,
      image: ach.image || null,
      title: ACHIEVEMENT_TITLES[ach.key] || {},
      unlocked: unlocked.has(ach.key),
      unlockedAt: unlocked.get(ach.key) || null,
    }));

    res.json({ achievements: list });
  } catch (e) {
    console.error('[ACHIEVEMENTS] GET error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/user', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.tgUser);

    const now = new Date();
    const subActive = user.subscription_type && user.subscription_expires_at && new Date(user.subscription_expires_at) > now;
    const subscriptionType = subActive ? user.subscription_type : null;

    const subDailyBonus = subscriptionType ? 10 : 0;
    const totalDailyLimit = MAX_FREE_GAMES_PER_DAY + subDailyBonus;
    const freeGamesLeft = Math.max(0, totalDailyLimit - user.games_today) + (user.extra_games || 0);

    const dailyHintsFree = subscriptionType === 'premium' ? 2 : subscriptionType === 'vip' ? 1 : 0;
    const hintsAvailable = Math.max(0, dailyHintsFree - (user.daily_hints_used || 0));

    const canWithdraw = (user.withdraw_tickets || 0) >= 1 && user.balance >= MIN_WITHDRAW;

    res.json({
      telegramId: user.telegram_id,
      firstName: user.first_name,
      balance: user.balance,
      freeGamesLeft,
      superGamePending: user.super_game_pending || false,
      grantedSuperGames: user.granted_super_games || 0,
      superGamesTotal: user.super_games_total || 0,
      canWithdraw,
      gamesPlayed: user.games_played_total || 0,
      withdrawTickets: user.withdraw_tickets || 0,
      channelBonusClaimed: user.channel_bonus_claimed || false,
      extraGames: user.extra_games || 0,
      subscriptionType,
      subscriptionExpiresAt: subActive ? user.subscription_expires_at : null,
      hintsAvailable,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/user/profile', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;

    const result = await pool.query(
      `SELECT telegram_id, first_name, nickname, avatar_emoji, privacy_mode, avatar_frame,
              balance AS total_score, games_played_total AS games_played,
              streak_count, streak_eternal_weeks, super_games_total,
              total_burned, referred_count, language_code,
              subscription_type, subscription_expires_at, created_at
       FROM users WHERE telegram_id = $1`,
      [userId]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

    const u = result.rows[0];
    const fileId = await getTgPhotoUrl(req.app.get('bot'), userId);
    const photo_url = fileId ? `/api/tg-photo/${userId}` : null;
    const displayName = u.nickname || `Игрок #${String(u.telegram_id).slice(-4)}`;

    const userLang = req.query.lang || u.language_code || req.tgUser?.language_code || 'ru';
    const rank = getUserRank(u.total_score, userLang);
    const now = new Date();
    const subActive = u.subscription_type && u.subscription_expires_at && new Date(u.subscription_expires_at) > now;
    const subscriptionType = subActive ? u.subscription_type : null;

    res.json({
      telegramId: u.telegram_id,
      firstName: u.first_name,
      nickname: u.nickname,
      displayName,
      avatarEmoji: u.avatar_emoji || '🧠',
      avatarFrame: u.avatar_frame || null,
      privacyMode: u.privacy_mode || 'nickname',
      photo_url: photo_url,
      totalScore: u.total_score,
      gamesPlayed: u.games_played,
      streakCount: u.streak_count,
      streakEternalWeeks: u.streak_eternal_weeks,
      superGamesTotal: u.super_games_total,
      totalBurned: u.total_burned,
      referralCount: u.referred_count,
      rankEmoji: rank.emoji,
      rankTitle: rank.title,
      subscriptionType,
      subscriptionExpiresAt: subActive ? u.subscription_expires_at : null,
      registeredAt: u.created_at,
    });
  } catch (e) {
    console.error('/api/user/profile error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/user/inventory', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const result = await pool.query(
      'SELECT item_key FROM shop_purchases WHERE user_id = $1 AND item_key LIKE $2',
      [userId, 'frame_%']
    );
    const inventory = result.rows.map(r => r.item_key);
    res.json({ inventory });
  } catch (e) {
    console.error('/api/user/inventory error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/user/equip-frame', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const { item_key } = req.body;

    if (item_key !== null && item_key !== undefined) {
      const owns = await pool.query(
        'SELECT id FROM shop_purchases WHERE user_id = $1 AND item_key = $2',
        [userId, item_key]
      );
      if (!owns.rows.length) {
        return res.status(403).json({ error: 'Frame not owned' });
      }
    }

    await pool.query(
      'UPDATE users SET avatar_frame = $1 WHERE telegram_id = $2',
      [item_key || null, userId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error('/api/user/equip-frame error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/user/nickname', requireInitData, publicRateLimit, async (req, res) => {
  const userId = req.tgUser.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { nickname, avatarEmoji, privacyMode, language_code } = req.body;

  if (nickname !== undefined) {
    if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 32) {
      return res.status(400).json({ error: 'Никнейм: от 2 до 32 символов' });
    }
    if (!/^[\p{L}\p{N} _-]+$/u.test(nickname.trim())) {
      return res.status(400).json({ error: 'Недопустимые символы в никнейме' });
    }
  }

  if (privacyMode !== undefined && !['nickname', 'anonymous'].includes(privacyMode)) {
    return res.status(400).json({ error: 'Неверный privacy_mode' });
  }

  try {
    await pool.query(
      `UPDATE users SET
        nickname = COALESCE($2, nickname),
        avatar_emoji = COALESCE($3, avatar_emoji),
        privacy_mode = COALESCE($4, privacy_mode),
        language_code = COALESCE($5, language_code)
       WHERE telegram_id = $1`,
      [userId, nickname?.trim() || null, avatarEmoji || null, privacyMode || null, language_code || null]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[nickname POST]', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/tg-photo/:userId', publicRateLimit, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId || userId <= 0) return res.status(400).end();

    const photoUrl = await getTgPhotoUrl(req.app.get('bot'), userId);
    if (!photoUrl) return res.status(404).end();

    const resp = await fetch(photoUrl);
    if (!resp.ok) return res.status(404).end();

    res.setHeader('Content-Type', resp.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    Readable.fromWeb(resp.body).pipe(res);
  } catch (e) {
    console.error('[TgPhoto] proxy error:', e.message);
    res.status(500).end();
  }
});

router.get('/api/user-info', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.json({ name: 'You', avatar: null });
  try {
    const bot = req.app.get('bot');
    let firstName = 'User';
    try { const chat = await bot.telegram.getChat(userId); firstName = chat.first_name || 'User'; } catch(e) {}
    
    const photos = await bot.telegram.getUserProfilePhotos(userId, { limit: 1 });
    const fileId = photos?.photos?.[0]?.[0]?.file_id || null;
    let avatarUrl = null;
    if (fileId) {
      const file = await bot.telegram.getFile(fileId);
      avatarUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    }
    res.json({ name: firstName, avatar: avatarUrl });
  } catch(e) {
    res.json({ name: 'You', avatar: null });
  }
});

router.get('/api/transactions', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (Math.max(parseInt(req.query.page) || 1, 1) - 1) * limit;

    const { rows } = await pool.query(
      `SELECT id, type, amount, direction, description, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const total = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE user_id = $1`,
      [userId]
    );

    res.json({
      transactions: rows,
      total: parseInt(total.rows[0].count),
      hasMore: offset + limit < parseInt(total.rows[0].count)
    });
  } catch (e) {
    console.error('transactions error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/check-user', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ exists: false });
  try {
    const { rows } = await pool.query('SELECT telegram_id FROM users WHERE telegram_id = $1', [userId]);
    res.json({ exists: rows.length > 0 });
  } catch(e) {
    res.status(500).json({ exists: false });
  }
});

module.exports = router;
