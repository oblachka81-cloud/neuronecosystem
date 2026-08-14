const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireInitData } = require('../middleware/auth');
const { publicRateLimit } = require('../middleware/rateLimit');
const { getOrCreateUser } = require('../services/users');
const { questionsCache, translateQuestion } = require('../services/questions');
const { askAI } = require('../services/ai');
const { getUserRank } = require('../constants/ranks');
const { REFERRAL_BONUS } = require('../config');

// ==================== AI CHAT ====================
router.post('/api/chat', requireInitData, async (req, res) => {
  const { message, mode } = req.body;
  const userId = req.tgUser?.id;
  
  if (!userId) return res.json({ reply: 'Доступ только через NEURON.' });
  
  try {
    const { rows } = await pool.query('SELECT telegram_id FROM users WHERE telegram_id = $1', [userId]);
    if (!rows.length) return res.json({ reply: 'Доступ только через NEURON.' });
  } catch(e) {
    return res.json({ reply: 'Ошибка.' });
  }
  
  const reply = await askAI(message || '', mode || 'support');
  res.json({ reply: reply || 'Извините, не смог ответить.' });
});

// ==================== ВОПРОС ДНЯ ====================
router.get('/api/daily-question', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const lang = req.query.lang || 'ru';

    const userId = req.tgUser.id;
    const userRes = await pool.query(
      'SELECT daily_question_answered, daily_deeplink_used FROM users WHERE telegram_id = $1',
      [userId]
    );
    const user = userRes.rows[0];
    if (!user?.daily_deeplink_used) {
      return res.json({ available: false });
    }
    const answered = user.daily_question_answered || false;

    const dqRes = await pool.query(
      'SELECT question_id FROM daily_questions WHERE posted_date = $1',
      [today]
    );
    if (!dqRes.rows.length) {
      return res.json({ available: false });
    }

    const questionId = dqRes.rows[0].question_id;
    const q = questionsCache.find(x => x.id === questionId);
    if (!q) return res.json({ available: false });

    const tq = await translateQuestion(q, lang);

    res.json({
      available: true,
      answered,
      text: tq.text,
      options: tq.options,
    });
  } catch (e) {
    console.error('/api/daily-question error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/daily-question/answer', requireInitData, publicRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.tgUser.id;
    const { answerIndex, lang } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    const userRes = await client.query(
      'SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE',
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.daily_question_answered) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'already_answered', message: 'Ты уже отвечал сегодня!' });
    }

    const dqRes = await client.query(
      'SELECT question_id FROM daily_questions WHERE posted_date = $1',
      [today]
    );
    if (!dqRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Вопрос дня не найден' });
    }

    const questionId = dqRes.rows[0].question_id;
    const q = questionsCache.find(x => x.id === questionId);
    if (!q) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Вопрос не в кэше' });
    }

    const isCorrect = q.options[answerIndex] === q.correct;
    const bonus = isCorrect ? 20 : 0;
    const correctIndex = q.options.findIndex(o => o === q.correct);

    await client.query(
      `UPDATE users SET daily_question_answered = true, balance = balance + $1 WHERE telegram_id = $2`,
      [bonus, userId]
    );

    await client.query('COMMIT');

    res.json({
      correct: isCorrect,
      correctIndex,
      bonus,
      message: isCorrect ? `✅ Правильно! +20 COGNIQ` : `❌ Неправильно. Правильный ответ: ${q.correct}`
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('/api/daily-question/answer error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ==================== ЛИДЕРБОРД ====================
router.get('/api/leaderboard', publicRateLimit, async (req, res) => {
  try {
    const userId = req.query.user_id ? String(req.query.user_id) : null;
    const { rows } = await pool.query(
      'SELECT telegram_id AS id, first_name AS name, balance AS total_score, games_played_total AS games_played, language_code, subscription_type, subscription_expires_at, avatar_frame FROM users ORDER BY balance DESC LIMIT 100'
    );

    const now = new Date();

    const top10 = rows.slice(0, 10).map(r => {
      const userLang = r.language_code || 'ru';
      const rank = getUserRank(r.total_score, userLang);
      const subActive = r.subscription_type && r.subscription_expires_at && new Date(r.subscription_expires_at) > now;
      return {
        id: r.id,
        name: r.name,
        totalScore: r.total_score,
        gamesPlayed: r.games_played,
        rankEmoji: rank.emoji,
        rankTitle: rank.title,
        subscriptionType: subActive ? r.subscription_type : null,
        avatarFrame: r.avatar_frame || null,
        photo_url: `/api/tg-photo/${r.id}`,
      };
    });

    const myRank = rows.findIndex(r => String(r.id) === userId) + 1;
    const meRow = rows.find(r => String(r.id) === userId);
    const meLang = meRow?.language_code || 'ru';
    const me = meRow ? {
      id: meRow.id,
      name: meRow.name,
      totalScore: meRow.total_score,
      gamesPlayed: meRow.games_played,
      rankEmoji: getUserRank(meRow.total_score, meLang).emoji,
      rankTitle: getUserRank(meRow.total_score, meLang).title,
      subscriptionType: meRow.subscription_type && meRow.subscription_expires_at && new Date(meRow.subscription_expires_at) > now ? meRow.subscription_type : null,
      avatarFrame: meRow.avatar_frame || null,
    } : null;

    res.json({ top10, myRank, me });
  } catch (e) {
    console.error('/api/leaderboard error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== РЕФЕРАЛЫ ====================
router.get('/api/referral-stats', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const user = await getOrCreateUser(req.tgUser);
    const botUsername = req.app.get('botUsername') || 'NeuronEcosystemBot';
    const referralLink = `https://t.me/${botUsername}?start=ref_${userId}`;
    res.json({
      referralCount: user.referred_count || 0,
      referralLink,
      bonusPerReferral: REFERRAL_BONUS,
    });
  } catch (e) {
    console.error('/api/referral-stats error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== TON БАЛАНСЫ ====================
router.get('/api/ton-balance', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'No address' });
    const r = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}&api_key=${process.env.TON_CENTER_API_KEY || ''}`);
    const data = await r.json();
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/api/usdt-balance', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'No address' });
    const JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
    const r = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(address)}&jetton_address=${encodeURIComponent(JETTON_MASTER)}&limit=1&api_key=${process.env.TON_CENTER_API_KEY || ''}`);
    const data = await r.json();
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== BETA COUNT ====================
router.get('/api/beta/count', async (req, res) => {
  try {
    const r = await pool.query('SELECT COUNT(*) FROM users WHERE is_beta_tester = TRUE');
    const taken = parseInt(r.rows[0].count);
    res.json({ taken, remaining: Math.max(0, 100 - taken), closed: taken >= 100 });
  } catch(e) {
    res.json({ taken: 0, remaining: 100, closed: false });
  }
});

module.exports = router;
