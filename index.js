const express = require('express');
const { Telegraf } = require('telegraf');
const crypto = require('crypto');
const path = require('path');
const cron = require('node-cron');
const { Readable } = require('stream');
const { toNano } = require('@ton/core');
const { TonClient, WalletContractV4, internal, Address } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { beginCell } = require('@ton/core');
const { generateStreakWarningCard, generateStreakMilestoneCard, generateQuestionOfDayCard, generateWelcomeCard, generateWeeklyTopCard, generateReferralReferrerCard, generateReferralNewUserCard, generateWeeklyHeroesCard, generateStreakBattleCard, generateFactOfDayCard, generateRankRatingCard, generateAchievementCard, generatePurchaseCard, generateExchangeCard, generateTransferReceivedCard, postBurnCard, postBetaCard } = require('./channel.js');

// ==================== CONFIG + DB ====================
const config = require('./src/config');
const pool = require('./src/db/pool');
const initDB = require('./src/db/init');
const { RANKS, getUserRank } = require('./src/constants/ranks');
const { STREAK_TRANSLATIONS } = require('./src/constants/streakTranslations');
const { ACHIEVEMENTS, ACHIEVEMENT_TITLES, ACHIEVEMENT_UNLOCK_PREFIX } = require('./src/constants/achievements');
const { ALLOWED_USER_FIELDS } = require('./src/constants/allowedUserFields');
const { publicRateLimit, authRateLimit, heavyRateLimit, casinoRateLimit, adminRateLimit, questionsAdminRateLimit } = require('./src/middleware/rateLimit');
const { requireInitData, requireInitDataStrict, requireAdmin } = require('./src/middleware/auth');
const { getOrCreateUser, saveUser, calcGamesLeft, checkAndResetDailyLimit, todayStr, normalizeDateStr } = require('./src/services/users');
const { loadQuestionsFromDB, pickGameQuestions, translateQuestion, yandexTranslate, questionsCache } = require('./src/services/questions');
const { addToBurnPool, logTx, withRetry } = require('./src/services/burn');
const { checkAndUnlockAchievements } = require('./src/services/achievements');
const { askAI } = require('./src/services/ai');
const { bestchangeCache, bestchangeFetch, CACHE_TTL_MS } = require('./src/services/bestchange');
const { getJettonWalletAddress, sendCogniqJetton } = require('./src/services/ton');
const { bjBuildDeck, bjCardValue, bjHandScore, minesMultiplier, generateCrashPoint } = require('./src/services/casino');
const { COGNIQ_FEE, TOKEN_MAP, DECIMALS, OPERATIONAL_WALLET, omniston, isSwapQuote, toUnitsForSwap, toAssetId, safePayload, requestQuoteWithFee } = require('./src/services/exchange');
const { postDailyQuestion, postWeeklyTop, sendStreakWarnings, postWeeklyAchievements, postStreakBattle, postDailyFact, postRankLeaderboard, postDailyPoll } = require('./src/services/channel');
const { setupCron } = require('./src/cron/jobs');
const quizRoutes = require('./src/routes/quiz');
const userRoutes = require('./src/routes/user');
const shopRoutes = require('./src/routes/shop');
const withdrawRoutes = require('./src/routes/withdraw');
const bankRoutes = require('./src/routes/bank');

const {
  BOT_TOKEN,
  WEBHOOK_URL,
  WEBAPP_URL,
  ADMIN_PASSWORD,
  PORT,
  BESTCHANGE_API_KEY,
  BESTCHANGE_PARTNER_ID,
  BESTCHANGE_API_HOSTS,
  QUESTIONS_PER_GAME,
  MAX_FREE_GAMES_PER_DAY,
  TOKENS_PER_QUESTION_FREE,
  TOKENS_SUPER_GAME,
  REFERRAL_BONUS,
  REFERRAL_BONUS_NEW_USER,
  MIN_WITHDRAW,
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
} = config;

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.set('trust proxy', 1);
app.use(quizRoutes);
app.use(userRoutes);
app.use(shopRoutes);
app.use(withdrawRoutes);
app.use(bankRoutes);

if (!BESTCHANGE_API_KEY) {
  console.warn('⚠️ BESTCHANGE_API_KEY не задан в .env — BestChange API работать не будет');
}

if (!BOT_TOKEN) { console.error('BOT_TOKEN is not set'); process.exit(1); }
if (!config.DATABASE_URL) { console.error('DATABASE_URL is not set'); process.exit(1); }
if (!ADMIN_PASSWORD) { console.error('ADMIN_PASSWORD is not set'); process.exit(1); }

// ==================== TELEGRAM BOT ====================
const bot = new Telegraf(BOT_TOKEN);
let botUsername = '';
app.set('bot', bot);

// ==================== КОНСТАНТЫ ИГРЫ (из config) ====================
// ==================== РАНГИ ====================
// ==================== ДОСТИЖЕНИЯ ====================
// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// ==================== РАБОТА С ВОПРОСАМИ ====================
// ==================== ЯНДЕКС TRANSLATE ====================
// BURN — добавить в пул
// ==================== ПОЛУЧЕНИЕ/СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ ====================
// ==================== RATE LIMITING ====================
// ==================== TELEGRAM INIT DATA VERIFY ====================
// ==================== API ЭНДПОИНТЫ ====================
// ==================== TELEGRAM PHOTO CACHE ================
app.get('/tonconnect-manifest.json', (req, res) => {
  res.json({
    url: WEBAPP_URL,
    name: 'NEURON Game',
    iconUrl: `${WEBAPP_URL}/icon.png`,
  });
});


app.post('/api/chat', requireInitData, async (req, res) => {
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


app.get('/api/leaderboard', publicRateLimit, async (req, res) => {
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

app.get('/api/referral-stats', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const user = await getOrCreateUser(req.tgUser);
    const referralLink = `https://t.me/${botUsername || 'NeuronEcosystemBot'}?start=ref_${userId}`;
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

app.get('/api/daily-question', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const today = todayStr();
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

app.post('/api/daily-question/answer', requireInitData, publicRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.tgUser.id;
    const { answerIndex, lang } = req.body;
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

// Stars invoice — Pack +20
// Stars invoice — VIP 7 дней
// Stars invoice — Premium 30 дней
// ==================== TON CONNECT USDT CHECKER ====================
 async function checkTonUsdtPayments() {
  try {
    const wallet = process.env.TON_OPERATION_WALLET;
    const apiKey = process.env.TON_CENTER_API_KEY;
    if (!wallet || !apiKey) return;

    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const url = `https://toncenter.com/api/v3/jetton/transfers?direction=in&owner_address=${encodeURIComponent(wallet)}&limit=${limit}&offset=${offset}&decode_payload=true`;
      const resp = await fetch(url, { headers: { 'X-API-Key': apiKey } });
      if (!resp.ok) break;

      const data = await resp.json();
      const transfers = data?.jetton_transfers || [];
      if (transfers.length === 0) break;

      const hashes = transfers.map(tx => tx.transaction_hash);
      const existingRes = await pool.query(
     'SELECT tx_hash FROM processed_ton_payments WHERE tx_hash = ANY($1)',
     [hashes]
   );
      const existingSet = new Set(existingRes.rows.map(r => r.tx_hash));

      for (const tx of transfers) {
      if (existingSet.has(tx.transaction_hash)) continue;
        const txHash = tx.transaction_hash;

        const comment = tx?.decoded_forward_payload?.comment;
        if (!comment) continue;

        const amount = parseInt(tx.amount || '0');

        if (comment.startsWith('super_game_')) {
          if (amount < 1000000) continue;
          const rawId = comment.replace('super_game_', '');
          if (!/^\d+$/.test(rawId)) continue;
          const userId = parseInt(rawId, 10);
          if (!userId || userId <= 0) continue;

          const insertResult = await pool.query(
            `INSERT INTO processed_ton_payments (tx_hash, user_id, amount, processed_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING RETURNING id`,
            [txHash, userId, amount]
          );
          if (insertResult.rows.length === 0) continue;

          await pool.query(
            `UPDATE users SET super_game_pending = true, last_super_game_date = $1, super_replay_used = false WHERE telegram_id = $2 AND super_game_pending = false`,
            [todayStr(), userId]
          );
          await logTx(userId, 'deposit', amount, 'in', { method: 'usdt', item: 'super_game' });

          try {
            const userLang = await pool.query('SELECT language_code FROM users WHERE telegram_id = $1', [userId]);
const lang = userLang.rows[0]?.language_code || 'ru';
try {
  const img = await generatePurchaseCard('super_game', lang);
  await withRetry(() => bot.telegram.sendPhoto(userId, { source: img }));
} catch (e) {
  await withRetry(() => bot.telegram.sendMessage(userId, '🔥 Супер игра активирована!'));
}
          } catch (e) { console.error('[TON] notify error:', e.message); }

          try {
            const user = await pool.query('SELECT first_name, nickname, privacy_mode, language_code FROM users WHERE telegram_id = $1', [userId]);
            const u = user.rows[0];
            const name = u?.privacy_mode === 'anonymous' ? `Игрок #${String(userId).slice(-4)}` : (u?.nickname || u?.first_name || `Игрок #${String(userId).slice(-4)}`);
            const lang = u?.language_code || 'en';
            const texts = {
              ru: `🔥 ${name} только что активировал супер-игру!\nКто следующий? Открой приложение и попробуй обогнать!`,
              en: `🔥 ${name} just activated a super game!\nWho's next? Open the app and try to beat them!`,
              fr: `🔥 ${name} vient d'activer une super partie !\nQui est le prochain ? Ouvrez l'appli et essayez de le battre !`,
              es: `🔥 ¡${name} acaba de activar un super juego!\n¿Quién es el siguiente? ¡Abre la app e intenta superarlo!`
            };
            await withRetry(() => bot.telegram.sendMessage(process.env.CHANNEL_ID, texts[lang] || texts['en']));
          } catch (e) { console.error('[TON] channel post error:', e.message); }

          console.log(`[TON] Super game activated for user ${userId}, tx: ${txHash}`);
        }

        else if (comment.startsWith('pack_20_')) {
          if (amount < 1000000) continue;
          const rawId = comment.replace('pack_20_', '');
          if (!/^\d+$/.test(rawId)) continue;
          const userId = parseInt(rawId, 10);
          if (!userId || userId <= 0) continue;

          const insertResult = await pool.query(
            `INSERT INTO processed_ton_payments (tx_hash, user_id, amount, processed_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING RETURNING id`,
            [txHash, userId, amount]
          );
          if (insertResult.rows.length === 0) continue;

          await pool.query(`UPDATE users SET extra_games = extra_games + 10 WHERE telegram_id = $1`, [userId]);
          await logTx(userId, 'deposit', amount, 'in', { method: 'usdt', item: 'pack_10' });
          try { const userLang = await pool.query('SELECT language_code FROM users WHERE telegram_id = $1', [userId]);
const lang = userLang.rows[0]?.language_code || 'ru';
try {
  const img = await generatePurchaseCard('pack10', lang);
  await withRetry(() => bot.telegram.sendPhoto(userId, { source: img }));
} catch (e) {
  await withRetry(() => bot.telegram.sendMessage(userId, '⚡ Пакет +10 игр активирован!'));
} } catch (e) {}
          console.log(`[TON] Pack +10 activated for user ${userId}, tx: ${txHash}`);
        }

        else if (comment.startsWith('sub_vip_')) {
          if (amount < 3000000) continue;
          const rawId = comment.replace('sub_vip_', '');
          if (!/^\d+$/.test(rawId)) continue;
          const userId = parseInt(rawId, 10);
          if (!userId || userId <= 0) continue;

          const insertResult = await pool.query(
            `INSERT INTO processed_ton_payments (tx_hash, user_id, amount, processed_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING RETURNING id`,
            [txHash, userId, amount]
          );
          if (insertResult.rows.length === 0) continue;

          const expires = new Date();
          expires.setDate(expires.getDate() + 7);
          await pool.query(`UPDATE users SET subscription_type = 'vip', subscription_expires_at = $1 WHERE telegram_id = $2`, [expires, userId]);
          await pool.query(`UPDATE users SET avatar_frame = 'frame_vip' WHERE telegram_id = $1`, [userId]);
          await logTx(userId, 'deposit', amount, 'in', { method: 'usdt', item: 'vip_7d' });
          try { await withRetry(() => bot.telegram.sendMessage(userId, '👑 VIP подписка активирована на 7 дней! Открой приложение.')); } catch (e) {}
          console.log(`[TON] VIP sub activated for user ${userId}, tx: ${txHash}`);
        }

        else if (comment.startsWith('sub_premium_')) {
          if (amount < 8000000) continue;
          const rawId = comment.replace('sub_premium_', '');
          if (!/^\d+$/.test(rawId)) continue;
          const userId = parseInt(rawId, 10);
          if (!userId || userId <= 0) continue;

          const insertResult = await pool.query(
            `INSERT INTO processed_ton_payments (tx_hash, user_id, amount, processed_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING RETURNING id`,
            [txHash, userId, amount]
          );
          if (insertResult.rows.length === 0) continue;

          const expires = new Date();
          expires.setDate(expires.getDate() + 30);
          await pool.query(`UPDATE users SET subscription_type = 'premium', subscription_expires_at = $1 WHERE telegram_id = $2`, [expires, userId]);
          await pool.query(`UPDATE users SET avatar_frame = 'frame_premium' WHERE telegram_id = $1`, [userId]);
          await logTx(userId, 'deposit', amount, 'in', { method: 'usdt', item: 'premium_30d' });
          try { await withRetry(() => bot.telegram.sendMessage(userId, '💎 PREMIUM подписка активирована на 30 дней! Открой приложение.')); } catch (e) {}
          console.log(`[TON] Premium sub activated for user ${userId}, tx: ${txHash}`);
        }
        else if (comment.startsWith('exchange_')) {
  const rawId = comment.replace('exchange_', '');
  if (!/^\d+$/.test(rawId)) continue;
  const userId = parseInt(rawId, 10);
  if (!userId || userId <= 0) continue;

  const amountUSDT = amount / 1000000;
  const rate = 200;
  const amountCogniq = Math.floor(amountUSDT * rate);

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const exists = await client.query(
      'SELECT 1 FROM processed_ton_payments WHERE tx_hash = $1',
      [txHash]
    );
    if (exists.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      client = null;
      continue;
    }

    await client.query(
      'INSERT INTO processed_ton_payments (tx_hash, user_id, amount, processed_at) VALUES ($1, $2, $3, NOW())',
      [txHash, userId, amount]
    );
    await client.query(
      'UPDATE users SET balance = balance + $1, balance_purchased = COALESCE(balance_purchased, 0) + $1 WHERE telegram_id = $2',
      [amountCogniq, userId]
    );
    await client.query(
      'INSERT INTO exchange_orders (telegram_id, tx_hash, amount_usdt, amount_cogniq, rate, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, txHash, amountUSDT, amountCogniq, rate, 'completed']
    );
    await client.query('COMMIT');
    client.release();
    client = null;

    await logTx(userId, 'usdt_exchange', amountCogniq, 'in', { usdt: amountUSDT });
  } catch (e) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      client.release();
      client = null;
    }
    console.error('[TON] exchange tx error:', e.message);
    continue;
  }

  try {
    const userLang = await pool.query(
      'SELECT language_code FROM users WHERE telegram_id = $1',
      [userId]
    );
    const lang = userLang.rows[0]?.language_code || 'ru';
    try {
      const img = await generateExchangeCard({ amountCogniq, amountUSDT, lang });
      await withRetry(() => bot.telegram.sendPhoto(userId, { source: img }));
    } catch (e) {
      await withRetry(() =>
        bot.telegram.sendMessage(userId, `💱 Обмен: +${amountCogniq} COGNIQ за ${amountUSDT} USDT!`)
      );
    }
  } catch (e) {}

  console.log(`[TON] Exchange: ${amountUSDT} USDT → ${amountCogniq} COGNIQ for user ${userId}`);
}
      }

      if (transfers.length < limit) break;
      offset += limit;
    }
  } catch (e) {
    console.error('[TON] checkTonUsdtPayments error:', e.message);
  }
}

app.get('/api/ton-balance', async (req, res) => {
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

app.get('/api/usdt-balance', async (req, res) => {
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
// ==================== АДМИНКА ====================
app.get('/admin', adminRateLimit, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/bank', (req, res) => {
  res.sendFile(path.join(__dirname, 'bank.html'));
});


app.get('/api/admin/stats', requireAdmin, async (req, res) => {
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
app.get('/api/admin/shop-stats', adminRateLimit, requireAdmin, async (req, res) => {
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
app.get('/api/admin/subscribers', adminRateLimit, requireAdmin, async (req, res) => {
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
app.get('/api/admin/shop-history', adminRateLimit, requireAdmin, async (req, res) => {
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
app.post('/api/admin/reset-cooldown', adminRateLimit, requireAdmin, async (req, res) => {
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

app.post('/api/admin/set-subscription', adminRateLimit, requireAdmin, async (req, res) => {
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

// ==================== ИГРОКИ С ПАГИНАЦИЕЙ ====================
app.get('/api/admin/players', adminRateLimit, requireAdmin, async (req, res) => {
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
app.get('/api/admin/questions', questionsAdminRateLimit, requireAdmin, async (req, res) => {
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

app.post('/api/admin/questions/add', questionsAdminRateLimit, requireAdmin, async (req, res) => {
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

app.post('/api/admin/questions/delete', questionsAdminRateLimit, requireAdmin, async (req, res) => {
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

app.post('/api/admin/questions/edit', questionsAdminRateLimit, requireAdmin, async (req, res) => {
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

app.post('/api/admin/questions/translate-all', questionsAdminRateLimit, requireAdmin, async (req, res) => {
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

app.post('/api/admin/reset-player', adminRateLimit, requireAdmin, async (req, res) => {
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

app.post('/api/admin/delete-player', adminRateLimit, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const { rowCount } = await pool.query('DELETE FROM users WHERE telegram_id = $1', [userId]);
    if (rowCount > 0) res.json({ ok: true });
    else res.status(404).json({ error: 'Игрок не найден' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/withdrawals', adminRateLimit, requireAdmin, async (req, res) => {
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
    const { rows } = await pool.query(`SELECT w.id, w.telegram_id, w.amount, w.wallet, w.status, w.created_at, w.processed_at, u.first_name FROM withdrawals w LEFT JOIN users u ON u.telegram_id = w.telegram_id ${whereClause} ORDER BY w.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`, dataParams);

    res.json({ withdrawals: rows, stats, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});
app.get('/api/admin/exchange-orders', adminRateLimit, requireAdmin, async (req, res) => {
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

app.post('/api/admin/withdrawals/update', adminRateLimit, requireAdmin, async (req, res) => {
    try {
        const { id, status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Неверный статус' });
        }
        
        // Если статус "approved" — выполняем ончейн-вывод
        if (status === 'approved') {
            const withdrawal = await pool.query(
                'SELECT * FROM withdrawals WHERE id = $1 AND status = $2',
                [id, 'pending']
            );
            
            if (!withdrawal.rows.length) {
                return res.status(404).json({ error: 'Заявка не найдена или уже обработана' });
            }
            
            const w = withdrawal.rows[0];
            
            // Проверяем наличие приватного ключа
            const privateKey = process.env.TON_OPERATION_WALLET_PRIVATE_KEY;
            if (!privateKey) {
                return res.status(500).json({ 
                    error: 'Приватный ключ операционного кошелька не настроен. Добавь TON_OPERATION_WALLET_PRIVATE_KEY в переменные окружения.' 
                });
            }
            
            try {
                // Отправляем COGNIQ Jetton
                const txHash = await sendCogniqJetton(
                    w.wallet,           // адрес получателя
                    w.amount,           // сумма в COGNIQ
                    privateKey          // приватный ключ операционного кошелька
                );
                
                // Обновляем статус и сохраняем TX хеш
                await pool.query(
                    `UPDATE withdrawals 
                     SET status = 'completed', 
                         processed_at = NOW(),
                         tx_hash = $1 
                     WHERE id = $2`,
                    [txHash, id]
                );
                
                // Уведомляем пользователя
                try {
                    await bot.telegram.sendMessage(
                        w.telegram_id,
                        `✅ Вывод ${w.amount.toLocaleString()} COGNIQ выполнен!\n\n🔗 TX: https://tonviewer.com/transaction/${txHash}`
                    );
                } catch(e) {
                    console.error('[WITHDRAW] Notification error:', e.message);
                }
                
                console.log(`[WITHDRAW] Completed id=${id}, TX: ${txHash}`);
                return res.json({ ok: true, txHash });
                
            } catch(e) {
                console.error('[WITHDRAW] On-chain error:', e.message);
                // Возвращаем COGNIQ на баланс игрока при ошибке
                await pool.query(
                    'UPDATE users SET balance = balance + $1 WHERE telegram_id = $2',
                    [w.amount, w.telegram_id]
                );
                await pool.query(
                    "UPDATE withdrawals SET status = 'failed' WHERE id = $1",
                    [id]
                );
                return res.status(500).json({ error: 'Ошибка ончейн-вывода: ' + e.message });
            }
        }
        
        // Для статуса "rejected" — просто обновляем статус
        const { rowCount } = await pool.query(
            `UPDATE withdrawals SET status = $1, processed_at = NOW() WHERE id = $2`,
            [status, id]
        );
        
        if (rowCount === 0) return res.status(404).json({ error: 'Заявка не найдена' });
        
        // Если отклонено — возвращаем COGNIQ на баланс
        if (status === 'rejected') {
            const w = await pool.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
            if (w.rows.length) {
                await pool.query(
                    'UPDATE users SET balance = balance + $1 WHERE telegram_id = $2',
                    [w.rows[0].amount, w.rows[0].telegram_id]
                );
            }
        }
        
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
// Статистика переводов
app.get('/api/admin/transfers/stats', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) as total_count, COALESCE(SUM(amount), 0) as total_volume, COALESCE(SUM(commission), 0) as total_commission FROM transfers`);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/admin/transfers/list', requireAdmin, async (req, res) => {
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
// ==================== ADMIN BURN ====================
app.get('/api/admin/burn/stats', requireAdmin, async (req, res) => {
  try {
    const { rows: poolRows } = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total FROM burn_pool');
    const { rows: histRows } = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total_burned, MAX(burned_at) AS last_burned_at FROM burn_history');
    const { rows: sources } = await pool.query('SELECT source, COUNT(*) AS count, SUM(amount) AS total FROM burn_pool GROUP BY source ORDER BY total DESC');
    const { rows: history } = await pool.query('SELECT id, amount, tx_hash, burned_at FROM burn_history ORDER BY burned_at DESC LIMIT 20');
    res.json({ total: parseInt(poolRows[0].total), totalBurned: parseInt(histRows[0].total_burned), lastBurnedAt: histRows[0].last_burned_at, sources, history });
  } catch(e) { console.error('[BURN] stats error:', e); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/admin/burn/execute', requireAdmin, async (req, res) => {
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
    try { await postBurnCard(bot, total, txHash); } catch(e) { console.error('[BURN] card error:', e.message); }
    res.json({ ok: true, burned: total });
  } catch(e) { await client.query('ROLLBACK'); console.error('[BURN] execute error:', e); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

// ==================== TELEGRAM BOT HANDLERS ====================
bot.start(async (ctx) => {
  const tgId = ctx.from.id;
  const tgName = ctx.from.first_name || ctx.from.username || 'Player';
  const payload = ctx.startPayload;
  const lang = ctx.from.language_code || 'en';
  if (payload === 'beta') {
  try {
    await getOrCreateUser({ id: tgId, username: ctx.from.username, first_name: tgName, language_code: lang });
  } catch (e) {
    console.error('[BETA] DB error:', e.message);
    return;
  }

  const betaCount = await pool.query('SELECT COUNT(*) FROM users WHERE is_beta_tester = TRUE');
  const taken = parseInt(betaCount.rows[0].count);
  
  if (taken >= 100) {
    const msgs = {
      ru: '🔒 Набор закрыт. 100 тестеров уже в игре!',
      en: '🔒 Enrollment closed. 100 testers are already in!',
      fr: '🔒 Inscription terminée. 100 testeurs sont déjà là!',
      es: '🔒 ¡Inscripción cerrada. 100 testers ya están dentro!'
    };
    await ctx.reply(msgs[lang] || msgs['en']);
    return;
  }
  
  const result = await pool.query(
    'UPDATE users SET is_beta_tester = TRUE, beta_registered_at = NOW() WHERE telegram_id = $1 AND is_beta_tester = FALSE',
    [tgId]
  );
  
  if (result.rowCount > 0) {
    await pool.query('UPDATE users SET balance = balance + 1000 WHERE telegram_id = $1', [tgId]);
    
    try {
      await postBetaCard(bot, tgId, lang);
    } catch(e) {
      console.error('[BETA] card error:', e.message);
    }
  }
  
  const welcomeMsgs = {
    ru: '🧠 Ты в команде NEURON Beta! Ты получаешь 1000 COGNIQ на старт. Все наигранные COGNIQ останутся у тебя навсегда. Бонус за активность до 10 000 COGNIQ!',
    en: '🧠 You are in the NEURON Beta team! You get 1000 COGNIQ to start. All earned COGNIQ stays yours forever. Activity bonus up to 10,000 COGNIQ!',
    fr: '🧠 Tu es dans l\'équipe NEURON Beta ! Tu reçois 1000 COGNIQ au départ. Tous tes COGNIQ gagnés restent à toi pour toujours. Bonus d\'activité jusqu\'à 10 000 COGNIQ !',
    es: '🧠 ¡Estás en el equipo NEURON Beta! Recibes 1000 COGNIQ al inicio. Todos los COGNIQ que ganes se quedan contigo para siempre. ¡Bono de actividad de hasta 10 000 COGNIQ!'
};
  
  const webAppUrl = WEBAPP_URL;
  await ctx.reply(welcomeMsgs[lang] || welcomeMsgs['en'], {
    reply_markup: {
      inline_keyboard: [[{ text: '🕹️ Играть / Play', web_app: { url: webAppUrl } }]]
    }
  });
  return;
}

  const i18n = {
    ru: {
      welcome: '🧠 Добро пожаловать в NEURON! Игра, где твой ум приносит COGNIQ.',
      playBtn: '🕹️ Играть в NEURON',
      referralNotif: (name) => `🎉 Твой друг ${name} присоединился по твоей ссылке!\n+${REFERRAL_BONUS} COGNIQ начислено! 🏆`,
      referralText: '🧠 Играй в викторину и зарабатывай COGNIQ на TON блокчейне!',
    },
    en: {
      welcome: '🧠 Welcome to NEURON! The game where your mind earns COGNIQ.',
      playBtn: '🕹️ Play NEURON',
      referralNotif: (name) => `🎉 Your friend ${name} joined via your link!\n+${REFERRAL_BONUS} COGNIQ earned! 🏆`,
      referralText: '🧠 Play the quiz and earn COGNIQ on TON blockchain!',
    },
    fr: {
      welcome: '🧠 Bienvenue sur NEURON ! Le jeu où ton esprit rapporte des COGNIQ.',
      playBtn: '🕹️ Jouer à NEURON',
      referralNotif: (name) => `🎉 Ton ami(e) ${name} a rejoint via ton lien !\n+${REFERRAL_BONUS} COGNIQ gagné ! 🏆`,
      referralText: '🧠 Joue au quiz et gagne des COGNIQ sur la blockchain TON!',
    },
    es: {
      welcome: '🧠 ¡Bienvenido a NEURON! El juego donde tu mente gana COGNIQ.',
      playBtn: '🕹️ Jugar NEURON',
      referralNotif: (name) => `🎉 ¡Tu amigo ${name} se unió por tu enlace!\n+${REFERRAL_BONUS} COGNIQ ganado! 🏆`,
      referralText: '🧠 ¡Juega el quiz y gana COGNIQ en la blockchain TON!',
    },
  };
  const t = i18n[lang] || i18n['en'];

  try {
    await getOrCreateUser({ id: tgId, username: ctx.from.username, first_name: tgName, language_code: lang });
  } catch (e) {
    console.error('[BOT /start] DB error:', e.message);
    const busyMsg = { ru: '⚠️ Сервер занят. Попробуй позже.', en: '⚠️ Server busy. Retry in a moment.', fr: "⚠️ Serveur occupé. Réessaie.", es: '⚠️ Servidor ocupado. Inténtalo.' };
    try { await ctx.reply(busyMsg[lang] || busyMsg['en']); } catch (_) {}
    return;
  }

  if (payload && payload.startsWith('ref_')) {
    const referrerId = parseInt(payload.replace('ref_', ''));
    if (referrerId && referrerId !== tgId) {
      let client;
      try {
        client = await pool.connect();
        await client.query('BEGIN');
        const res = await client.query(
          `UPDATE users SET balance = balance + $1, referrer_id = $2
           WHERE telegram_id = $3 AND referrer_id IS NULL
           RETURNING referrer_id`,
          [REFERRAL_BONUS_NEW_USER, referrerId, tgId]
        );
        if (res.rowCount > 0) {
          await client.query(
            'UPDATE users SET balance = balance + $1, referred_count = referred_count + 1 WHERE telegram_id = $2',
            [REFERRAL_BONUS, referrerId]
          );
          try {
            const referrerNameRes = await client.query('SELECT username, first_name FROM users WHERE telegram_id = $1', [referrerId]);
            const referrerDisplayName = referrerNameRes.rows[0]?.username ? `@${referrerNameRes.rows[0].username}` : (referrerNameRes.rows[0]?.first_name || 'друга');
            const card = await generateReferralNewUserCard(referrerDisplayName, lang);
            await withRetry(() => ctx.telegram.sendPhoto(tgId, { source: card }, { caption: `🎁 +${REFERRAL_BONUS_NEW_USER} COGNIQ начислено!` }));
          } catch {}
          try {
            const referrerRes = await client.query('SELECT language_code FROM users WHERE telegram_id = $1', [referrerId]);
            const referrerLang = referrerRes.rows[0]?.language_code || 'en';
            const tRef = i18n[referrerLang] || i18n['en'];
            try {
              const card = await generateReferralReferrerCard(tgName, referrerLang);
              await withRetry(() => ctx.telegram.sendPhoto(referrerId, { source: card }, { caption: tRef.referralNotif(tgName) }));
            } catch {
              await withRetry(() => ctx.telegram.sendMessage(referrerId, tRef.referralNotif(tgName)));
            }
          } catch {}
        }
        await client.query('COMMIT');
      } catch (e) {
        if (client) { try { await client.query('ROLLBACK'); } catch (_) {} }
        console.error('[BOT /start] referral DB error:', e.message);
      } finally {
        if (client) client.release();
      }
    }
  }

  if (payload === 'daily') {
    try {
      await pool.query(`UPDATE users SET daily_deeplink_used = true WHERE telegram_id = $1`, [tgId]);
    } catch (e) {
      console.error('[BOT /start] daily deeplink error:', e.message);
    }
  }

  const webAppUrl = WEBAPP_URL;
  const keyboard = { inline_keyboard: [] };
  if (WEBAPP_URL) {
    keyboard.inline_keyboard.push([{ text: t.playBtn, web_app: { url: webAppUrl } }]);
  }

  try {
    const cardBuffer = await Promise.race([
      generateWelcomeCard(tgName, lang),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000))
    ]);
    await ctx.replyWithPhoto({ source: cardBuffer }, { reply_markup: keyboard });
  } catch (e) {
    console.error('[WELCOME CARD] error:', e.message);
    await ctx.reply(t.welcome, { reply_markup: keyboard });
  }
});
bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));
bot.on('successful_payment', async (ctx) => {
  const payment = ctx.message?.successful_payment;
  const payload = payment?.invoice_payload;
  if (!payload) return;
  const userId = ctx.from?.id;
  if (!userId) return;
  await pool.query(
  'UPDATE users SET stars_spent = stars_spent + $1 WHERE telegram_id = $2',
  [payment.total_amount, userId]
);

  const userRow = await pool.query('SELECT language_code FROM users WHERE telegram_id = $1', [userId]);
  const lang = userRow.rows[0]?.language_code || 'en';

  // super_game
  if (payload.startsWith('super_game_')) {
    await pool.query(
      `UPDATE users SET super_game_pending = true, last_super_game_date = $1, super_replay_used = false WHERE telegram_id = $2 AND super_game_pending = false`,
      [todayStr(), userId]
    );
    await logTx(userId, 'deposit', payment.total_amount, 'in', { method: 'stars', item: 'super_game' });
    try {
  const img = await generatePurchaseCard('super_game', lang);
  await bot.telegram.sendPhoto(userId, { source: img });
} catch (e) {
  try { await bot.telegram.sendMessage(userId, '🔥 Супер игра активирована! Открой приложение.'); } catch (e2) {}
}
  }
  // pack_20
  else if (payload.startsWith('pack_20_')) {
  await pool.query(`UPDATE users SET extra_games = extra_games + 10 WHERE telegram_id = $1`, [userId]);
    await logTx(userId, 'deposit', payment.total_amount, 'in', { method: 'stars', item: 'pack_10' });
  try {
    const img = await generatePurchaseCard('pack10', lang);
    await bot.telegram.sendPhoto(userId, { source: img });
  } catch (e) {
    try { await bot.telegram.sendMessage(userId, '⚡ Пакет +10 игр активирован!'); } catch (e2) {}
  }
}
  // sub_vip
  else if (payload.startsWith('sub_vip_')) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await pool.query(`UPDATE users SET subscription_type = 'vip', subscription_expires_at = $1 WHERE telegram_id = $2`, [expires, userId]);
    await pool.query(`UPDATE users SET avatar_frame = 'frame_vip' WHERE telegram_id = $1`, [userId]);
    await logTx(userId, 'deposit', payment.total_amount, 'in', { method: 'stars', item: 'vip_7d' });
  try {
    const img = await generatePurchaseCard('vip', lang);
    await bot.telegram.sendPhoto(userId, { source: img });
  } catch (e) {
    try { await bot.telegram.sendMessage(userId, '👑 VIP подписка активирована на 7 дней!'); } catch (e2) {}
  }
}
  // sub_premium
  else if (payload.startsWith('sub_premium_')) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  await pool.query(`UPDATE users SET subscription_type = 'premium', subscription_expires_at = $1 WHERE telegram_id = $2`, [expires, userId]);
    await pool.query(`UPDATE users SET avatar_frame = 'frame_premium' WHERE telegram_id = $1`, [userId]);
    await logTx(userId, 'deposit', payment.total_amount, 'in', { method: 'stars', item: 'premium_30d' });
  try {
    const img = await generatePurchaseCard('premium', lang);
    await bot.telegram.sendPhoto(userId, { source: img });
  } catch (e) {
    try { await bot.telegram.sendMessage(userId, '💎 PREMIUM подписка активирована на 30 дней!'); } catch (e2) {}
  }
}
  else if (payload.startsWith('impulse_')) {
  const parts = payload.split('_');
  const pack = parts[1];
  const amounts = { small: 500, medium: 1000, big: 5000 };
  const amount = amounts[pack] || 500;
  
  await pool.query(
    'INSERT INTO impulse_balance (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = impulse_balance.balance + $2',
    [userId, amount]
  );
  await logTx(userId, 'deposit', amount, 'in', { method: 'stars', item: 'impulse' });
  
  const msgs = {
    ru: `⚡ +${amount} IMPULSE зачислено!`,
    en: `⚡ +${amount} IMPULSE credited!`,
    fr: `⚡ +${amount} IMPULSE crédité !`,
    es: `⚡ +${amount} IMPULSE acreditado!`,
  };
  try { await bot.telegram.sendMessage(userId, msgs['ru']); } catch (e2) {}
}
  });

// ==================== IMPULSE =================
// ==================== КАЗИНО ====================
app.get('/casino', (req, res) => {
  res.sendFile(path.join(__dirname, 'casino.html'));
});
app.post('/api/casino/spin', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const { bet_amount, bet_type } = req.body;

    if (!bet_amount || bet_amount < 10 || bet_amount > 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ставка: 10-100 IMPULSE' });
    }

    const validTypes = ['red','black','even','odd','low','high','dozen1','dozen2','dozen3'];
    if (!validTypes.includes(bet_type)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Неверный тип ставки' });
    }

    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!user.rows[0] || user.rows[0].balance < bet_amount) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Недостаточно IMPULSE' });
    }

    // Честный результат через crypto
    const buf = crypto.randomBytes(4);
    const result = buf.readUInt32BE(0) % 37;
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(serverSeed + result.toString()).digest('hex');

    const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    let win = 0;

    switch (bet_type) {
      case 'red': win = RED_NUMBERS.includes(result) ? bet_amount * 2 : 0; break;
      case 'black': win = (result !== 0 && !RED_NUMBERS.includes(result)) ? bet_amount * 2 : 0; break;
      case 'even': win = (result !== 0 && result % 2 === 0) ? bet_amount * 2 : 0; break;
      case 'odd': win = (result !== 0 && result % 2 === 1) ? bet_amount * 2 : 0; break;
      case 'low': win = (result >= 1 && result <= 18) ? bet_amount * 2 : 0; break;
      case 'high': win = (result >= 19 && result <= 36) ? bet_amount * 2 : 0; break;
      case 'dozen1': win = (result >= 1 && result <= 12) ? bet_amount * 3 : 0; break;
      case 'dozen2': win = (result >= 13 && result <= 24) ? bet_amount * 3 : 0; break;
      case 'dozen3': win = (result >= 25 && result <= 36) ? bet_amount * 3 : 0; break;
    }

    const newBalance = user.rows[0].balance - bet_amount + win;

    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    await client.query(
      'INSERT INTO casino_spins (telegram_id, bet_amount, bet_type, result_number, win_amount) VALUES ($1, $2, $3, $4, $5)',
      [userId, bet_amount, bet_type, result, win]
    );
    if (win === 0) await addToBurnPool('impulse_roulette', Math.max(1, Math.floor(bet_amount * 0.05)), userId);

    await client.query('COMMIT');
    await logTx(userId, 'impulse_bet', bet_amount, 'out', { game: 'FORTUNA' });
    if (win > 0) await logTx(userId, 'impulse_win', win, 'in', { game: 'FORTUNA' });
    res.json({ result, win, new_balance: newBalance, bet_type, hash, server_seed: serverSeed });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CASINO] spin error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ===== СЛОТ-МАШИНА =====
app.post('/api/casino/slot', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const { bet_amount } = req.body;

    if (!bet_amount || bet_amount < 10 || bet_amount > 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ставка: 10-100 IMPULSE' });
    }

    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!user.rows[0] || user.rows[0].balance < bet_amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ставка: 10-100 IMPULSE' });
    }

    const symbols = [
      '/public/images/cogniq/spark_sym_btc.png',
      '/public/images/cogniq/spark_sym_eth.png',
      '/public/images/cogniq/spark_sym_sol.png',
      '/public/images/cogniq/spark_sym_trx.png',
      '/public/images/cogniq/spark_sym_ton.png',
      '/public/images/cogniq/spark_sym_xrp.png',
      '/public/images/cogniq/spark_sym_cogniq.png'
    ];

    const buf = crypto.randomBytes(5);
    const roll = crypto.randomBytes(1)[0] / 255;
    let reels = [];

    // Вероятности: 3 = ~8%, 4 = ~2%, 5 = ~0.5%, джекпот = 0.1%
    if (roll < 0.001) {
      // Джекпот: все 5 COGNIQ (0.1%)
      const cogniq = symbols[symbols.length - 1];
      reels = [cogniq, cogniq, cogniq, cogniq, cogniq];
    } else if (roll < 0.006) {
      // 5 одинаковых, не COGNIQ (0.5%)
      const sym = symbols[buf[0] % (symbols.length - 1)];
      reels = [sym, sym, sym, sym, sym];
    } else if (roll < 0.026) {
      // 4 одинаковых (2%)
      const sym = symbols[buf[0] % symbols.length];
      const otherIndex = (buf[1] % (symbols.length - 1));
      const other = symbols[otherIndex === symbols.indexOf(sym) ? (otherIndex + 1) % symbols.length : otherIndex];
      reels = [sym, sym, sym, sym, other];
    } else if (roll < 0.106) {
      // 3 одинаковых (8%)
      const sym = symbols[buf[0] % symbols.length];
      reels = [sym, sym, sym,
        symbols[(buf[1] % (symbols.length - 1) + 1) % symbols.length],
        symbols[(buf[2] % (symbols.length - 2) + 2) % symbols.length]
      ];
    } else {
      // Рандом
      for (let i = 0; i < 5; i++) {
        reels.push(symbols[buf[i] % symbols.length]);
      }
    }

    const serverSeed = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(serverSeed + reels.join('')).digest('hex');

    const counts = {};
    reels.forEach(s => counts[s] = (counts[s] || 0) + 1);
    const maxCount = Math.max(...Object.values(counts));
    const topSymbol = Object.keys(counts).find(k => counts[k] === maxCount);

    let win = 0;
    let jackpot = false;

    if (maxCount === 5 && topSymbol.includes('cogniq')) {
      win = bet_amount * 50;
      jackpot = true;
    } else if (maxCount === 5) {
      win = bet_amount * 20;
    } else if (maxCount === 4) {
      win = bet_amount * 5;
    } else if (maxCount === 3) {
      win = bet_amount * 2;
    }

    const newBalance = user.rows[0].balance - bet_amount + win;

    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    await client.query(
      'INSERT INTO casino_spins (telegram_id, bet_amount, bet_type, result_number, win_amount) VALUES ($1, $2, $3, $4, $5)',
      [userId, bet_amount, 'slot', 0, win]
    );
    if (win === 0) await addToBurnPool('impulse_slot', Math.max(1, Math.floor(bet_amount * 0.05)), userId);

    await client.query('COMMIT');
    await logTx(userId, 'impulse_bet', bet_amount, 'out', { game: 'SPARK' });
    if (win > 0) await logTx(userId, 'impulse_win', win, 'in', { game: 'SPARK' });
    res.json({ reels, win, new_balance: newBalance, hash, server_seed: serverSeed, jackpot });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[SLOT] spin error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});
// ==================== CRASH: ГЕНЕРАТОР ТОЧКИ КРАША ====================
// ===== CRASH (серверная логика) =====
app.post('/api/casino/crash/start', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  try {
    const r = Math.random();
    let crashPoint;
    if (r < 0.05) {
      crashPoint = 1.00;
    } else {
      crashPoint = Math.min(Math.max(1.01, Math.floor((99 / (1 - r)) * 0.95) / 100), 100);
    }
    crashPoint = Math.round(crashPoint * 100) / 100;
    res.json({ success: true, crash_point: crashPoint });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
app.post('/api/casino/crash/bet', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const bet_amount = parseInt(req.body.bet_amount);
    
    if (!bet_amount || bet_amount < 10 || bet_amount > 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid bet' });
    }
    
    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!user.rows[0] || user.rows[0].balance < bet_amount) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not enough balance' });
    }
    
    // Проверяем, нет ли уже активной ставки
    const existing = await client.query("SELECT id FROM crash_bets WHERE telegram_id = $1 AND status = 'active'", [userId]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already have active bet' });
    }
    
    const newBalance = user.rows[0].balance - bet_amount;
    const crashPoint = generateCrashPoint();
    const serverSeed = crypto.randomBytes(16).toString('hex');
    
    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    
    // Сохраняем ставку с точкой краша
    await client.query(
      `INSERT INTO crash_bets (telegram_id, bet_amount, round_start, crash_point, server_seed, status) 
       VALUES ($1, $2, NOW(), $3, $4, 'active') 
       ON CONFLICT (telegram_id) DO UPDATE 
       SET bet_amount = $2, round_start = NOW(), crash_point = $3, server_seed = $4, status = 'active'`,
      [userId, bet_amount, crashPoint, serverSeed]
    );
    
    await client.query('COMMIT');
    
    // Отдаём хеш для проверки, но НЕ точку краша
    const hash = crypto.createHash('sha256').update(serverSeed + crashPoint.toString()).digest('hex');
    res.json({ success: true, new_balance: newBalance, hash });
    
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] bet error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});
app.post('/api/casino/crash/cashout', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const { multiplier } = req.body;
    if (!multiplier || multiplier < 1.0 || multiplier > 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid multiplier' });
    }
    const betRow = await client.query(
      "SELECT bet_amount, crash_point, server_seed, round_start FROM crash_bets WHERE telegram_id = $1 AND status = 'active' FOR UPDATE",
      [userId]
    );
    if (!betRow.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active bet' });
    }
    const { bet_amount, crash_point, server_seed, round_start } = betRow.rows[0];
    const crashPointFloat = parseFloat(crash_point);
    const elapsedMs = Date.now() - new Date(round_start).getTime();
    const elapsedSec = elapsedMs / 1000;
    const maxPossibleMultiplier = Math.pow(1.06, elapsedSec * 8) * 1.1;
    const clampedMultiplier = Math.min(multiplier, maxPossibleMultiplier);
    const actualMultiplier = Math.min(clampedMultiplier, crashPointFloat);
    const wonAmount = Math.floor(bet_amount * actualMultiplier);
    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    const newBalance = user.rows[0].balance + wonAmount;
    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    await client.query(
      "UPDATE crash_bets SET status = 'cashed_out' WHERE telegram_id = $1 AND status = 'active'",
      [userId]
    );
    await client.query(
      'INSERT INTO casino_spins (telegram_id, bet_amount, bet_type, result_number, win_amount) VALUES ($1, $2, $3, $4, $5)',
      [userId, bet_amount, 'crash', Math.floor(actualMultiplier * 100), wonAmount]
    );
    await client.query('COMMIT');
    await logTx(userId, 'impulse_bet', bet_amount, 'out', { game: 'Crash' });
    await logTx(userId, 'impulse_win', wonAmount, 'in', { game: 'Crash' });
    res.json({
      success: true,
      new_balance: newBalance,
      actual_multiplier: actualMultiplier,
      won_amount: wonAmount,
      crash_point: crashPointFloat,
      server_seed: server_seed
    });
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] cashout error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

app.post('/api/casino/crash/lose', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    
    const betRow = await client.query(
      "SELECT bet_amount, crash_point, server_seed FROM crash_bets WHERE telegram_id = $1 AND status = 'active' FOR UPDATE",
      [userId]
    );
    
    // ИСПРАВЛЕНИЕ: если нет активной ставки — просто отвечаем ок
    if (!betRow.rows[0]) {
      await client.query('ROLLBACK');
      const user = await pool.query('SELECT balance FROM impulse_balance WHERE user_id = $1', [userId]);
      return res.json({ success: true, new_balance: user.rows[0]?.balance || 0 });
    }
    
    const { bet_amount, crash_point, server_seed } = betRow.rows[0];
    
    await client.query(
      "UPDATE crash_bets SET status = 'crashed' WHERE telegram_id = $1 AND status = 'active'",
      [userId]
    );
    
    if (bet_amount > 0) {
      await client.query(
        'INSERT INTO casino_spins (telegram_id, bet_amount, bet_type, result_number, win_amount) VALUES ($1, $2, $3, $4, $5)',
        [userId, bet_amount, 'crash', 0, 0]
      );
      await addToBurnPool('impulse_crash', Math.max(1, Math.floor(bet_amount * 0.05)), userId);
    }
    
    const user = await pool.query('SELECT balance FROM impulse_balance WHERE user_id = $1', [userId]);
    
    await client.query('COMMIT');
    if (bet_amount > 0) {
    await logTx(userId, 'impulse_bet', bet_amount, 'out', { game: 'KRASH' });
    await addToBurnPool('impulse_crash', Math.max(1, Math.floor(bet_amount * 0.05)), userId);
}
    res.json({ 
      success: true, 
      new_balance: user.rows[0]?.balance || 0,
      crash_point: parseFloat(crash_point) || null,
      server_seed: server_seed || null 
    });
    
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] lose error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});
// ==================== BLACKJACK: СЕРВЕРНАЯ ЛОГИКА ====================
// РАЗДАЧА
app.post('/api/casino/blackjack/deal', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const bet = parseInt(req.body.bet);
    if (!bet || bet < 10 || bet > 500) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid bet' });
    }
    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!user.rows[0] || user.rows[0].balance < bet) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough balance' });
    }
    await client.query('DELETE FROM blackjack_sessions WHERE telegram_id = $1', [userId]);
    const deck = bjBuildDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    const newBalance = user.rows[0].balance - bet;
    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    await client.query(
      `INSERT INTO blackjack_sessions (telegram_id, deck, player_hands, dealer_hand, bets, insurance_bet, status)
       VALUES ($1, $2, $3, $4, $5, 0, 'active')`,
      [userId, JSON.stringify(deck), JSON.stringify([playerHand]), JSON.stringify(dealerHand), JSON.stringify([bet])]
    );
    await client.query('COMMIT');
    const playerScore = bjHandScore(playerHand);
    const isBlackjack = playerScore === 21 && playerHand.length === 2;
    const dealerUpCard = dealerHand[0];
    res.json({
      success: true, new_balance: newBalance,
      player_hands: [playerHand], dealer_up: dealerUpCard,
      player_scores: [playerScore], is_blackjack: isBlackjack,
      can_insurance: dealerUpCard.v === 'A' && newBalance >= Math.floor(bet / 2)
    });
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('[BJ] deal error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

// ХОД ИГРОКА
app.post('/api/casino/blackjack/action', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const { action, hand_index = 0 } = req.body;
    if (!['hit','stand','double','split','insurance'].includes(action)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid action' });
    }
    const sess = await client.query(
      "SELECT * FROM blackjack_sessions WHERE telegram_id = $1 AND status = 'active' FOR UPDATE",
      [userId]
    );
    if (!sess.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active game' });
    }
    let { deck, player_hands, dealer_hand, bets, insurance_bet } = sess.rows[0];
    let hi = parseInt(hand_index);
    if (hi < 0 || hi >= player_hands.length) hi = 0;
    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    let balance = user.rows[0].balance;

    if (action === 'insurance') {
      const insuranceCost = Math.floor(bets[0] / 2);
      if (balance < insuranceCost) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Not enough balance' });
      }
      if (insurance_bet > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insurance already taken' });
      }
      balance -= insuranceCost;
      insurance_bet = insuranceCost;
      await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [balance, userId]);
      await client.query('UPDATE blackjack_sessions SET insurance_bet = $1 WHERE telegram_id = $2', [insurance_bet, userId]);
      await client.query('COMMIT');
      return res.json({ success: true, new_balance: balance, insurance_bet });
    }

    if (action === 'hit') {
      player_hands[hi].push(deck.pop());
      const score = bjHandScore(player_hands[hi]);
      const bust = score > 21;
      await client.query(
        'UPDATE blackjack_sessions SET deck = $1, player_hands = $2 WHERE telegram_id = $3',
        [JSON.stringify(deck), JSON.stringify(player_hands), userId]
      );
      await client.query('COMMIT');
      return res.json({ success: true, player_hands, player_scores: player_hands.map(bjHandScore), bust, new_balance: balance });
    }

    if (action === 'double') {
      const doubleCost = bets[hi];
      if (balance < doubleCost) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Not enough balance' });
      }
      balance -= doubleCost;
      bets[hi] *= 2;
      player_hands[hi].push(deck.pop());
      await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [balance, userId]);
      await client.query(
        'UPDATE blackjack_sessions SET deck = $1, player_hands = $2, bets = $3 WHERE telegram_id = $4',
        [JSON.stringify(deck), JSON.stringify(player_hands), JSON.stringify(bets), userId]
      );
      await client.query('COMMIT');
      const score = bjHandScore(player_hands[hi]);
      return res.json({ success: true, player_hands, player_scores: player_hands.map(bjHandScore), bets, bust: score > 21, new_balance: balance, force_stand: true });
    }

    if (action === 'split') {
      if (player_hands[hi].length !== 2) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot split' });
      }
      const c1 = player_hands[hi][0], c2 = player_hands[hi][1];
      if (bjCardValue(c1) !== bjCardValue(c2)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cards do not match for split' });
      }
      if (balance < bets[hi]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Not enough balance for split' });
      }
      balance -= bets[hi];
      const splitBet = bets[hi];
      bets.splice(hi, 1, splitBet, splitBet);
      player_hands.splice(hi, 1, [c1, deck.pop()], [c2, deck.pop()]);
      await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [balance, userId]);
      await client.query(
        'UPDATE blackjack_sessions SET deck = $1, player_hands = $2, bets = $3 WHERE telegram_id = $4',
        [JSON.stringify(deck), JSON.stringify(player_hands), JSON.stringify(bets), userId]
      );
      await client.query('COMMIT');
      return res.json({ success: true, player_hands, player_scores: player_hands.map(bjHandScore), bets, new_balance: balance });
    }

    if (action === 'stand') {
      await client.query('COMMIT');
      return res.json({ success: true, stand: true });
    }

    await client.query('ROLLBACK');
    res.status(400).json({ error: 'Unknown action' });
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('[BJ] action error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

// ФИНАЛ — сервер сам считает результат
app.post('/api/casino/blackjack/result', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const sess = await client.query(
      "SELECT * FROM blackjack_sessions WHERE telegram_id = $1 AND status = 'active' FOR UPDATE",
      [userId]
    );
    if (!sess.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active game' });
    }
    let { deck, player_hands, dealer_hand, bets, insurance_bet } = sess.rows[0];
    while (bjHandScore(dealer_hand) < 17) { dealer_hand.push(deck.pop()); }
    const dScore = bjHandScore(dealer_hand);
    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    let balance = user.rows[0].balance;
    let totalWin = 0;
    const results = [];
    for (let hi = 0; hi < player_hands.length; hi++) {
      const hand = player_hands[hi];
      const pScore = bjHandScore(hand);
      const bet = bets[hi];
      const isNaturalBJ = pScore === 21 && hand.length === 2 && player_hands.length === 1;
      let payout = 0, resultType = 'lose';
      if (pScore > 21) { payout = 0; resultType = 'lose'; }
      else if (isNaturalBJ) { payout = bet + Math.floor(bet * 1.5); resultType = 'blackjack'; }
      else if (dScore > 21) { payout = bet * 2; resultType = 'win'; }
      else if (pScore > dScore) { payout = bet * 2; resultType = 'win'; }
      else if (pScore === dScore) { payout = bet; resultType = 'push'; }
      else { payout = 0; resultType = 'lose'; }
      totalWin += payout;
      results.push({ hand, score: pScore, bet, payout, result: resultType });
    }
    if (insurance_bet > 0 && dScore === 21 && dealer_hand.length === 2) {
      totalWin += insurance_bet * 3;
    }
    balance += totalWin;
    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [balance, userId]);
    await client.query("UPDATE blackjack_sessions SET status = 'finished' WHERE telegram_id = $1", [userId]);
    const totalBet = bets.reduce((a, b) => a + b, 0);
    await client.query(
      'INSERT INTO casino_spins (telegram_id, bet_amount, bet_type, result_number, win_amount) VALUES ($1, $2, $3, $4, $5)',
      [userId, totalBet, 'blackjack', dScore, totalWin]
    );
    // Burn 2% с проигранных рук
for (const r of results) {
  if (r.payout === 0) await addToBurnPool('impulse_blackjack', Math.max(1, Math.floor(r.bet * 0.05)), userId);
}
    await client.query('COMMIT');
    await logTx(userId, 'impulse_bet', totalBet, 'out', { game: 'XXI' });
    if (totalWin > 0) await logTx(userId, 'impulse_win', totalWin, 'in', { game: 'XXI' });
    res.json({ success: true, new_balance: balance, dealer_hand, dealer_score: dScore, results, total_win: totalWin });
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('[BJ] result error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});
// ─── MINES ────────────────────────────────────────────────

app.post('/api/casino/mines/start', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const bet = parseInt(req.body.bet);
    const minesCount = parseInt(req.body.mines);

    if (!bet || bet < 10 || bet > 500) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid bet' });
    }
    if (!minesCount || minesCount < 1 || minesCount > 24) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid mines count' });
    }

    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!user.rows[0] || user.rows[0].balance < bet) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough balance' });
    }

    const positions = Array(25).fill(false);
    const shuffled = [...Array(25).keys()].sort(() => Math.random() - 0.5);
    for (let i = 0; i < minesCount; i++) positions[shuffled[i]] = true;

    const newBalance = user.rows[0].balance - bet;
    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    await client.query('DELETE FROM mines_sessions WHERE telegram_id = $1', [userId]);
    await client.query(
      `INSERT INTO mines_sessions (telegram_id, grid, mines_count, opened, bet, status)
       VALUES ($1, $2, $3, '[]', $4, 'active')`,
      [userId, JSON.stringify(positions), minesCount, bet]
    );

    await client.query('COMMIT');
    res.json({
      ok: true,
      balance: newBalance,
      mines: minesCount,
      multiplier: minesMultiplier(25, minesCount, 0)
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[MINES] start error:', e.message);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

app.post('/api/casino/mines/open', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const cell = parseInt(req.body.cell);

    if (isNaN(cell) || cell < 0 || cell > 24) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid cell' });
    }

    const sess = await client.query(
      'SELECT * FROM mines_sessions WHERE telegram_id = $1 FOR UPDATE', [userId]
    );
    if (!sess.rows[0] || sess.rows[0].status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active session' });
    }

    const { grid, mines_count, opened, bet } = sess.rows[0];
    if (opened.includes(cell)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cell already opened' });
    }

    const isMine = grid[cell];

    if (isMine) {
      await client.query(
        'UPDATE mines_sessions SET status = $1 WHERE telegram_id = $2',
        ['lost', userId]
      );
      await client.query('COMMIT');

      await addToBurnPool('impulse_mines', Math.max(1, Math.floor(bet * 0.05)), userId);
      await logTx(userId, 'impulse_bet', bet, 'out', { game: 'MINES' });

      return res.json({ ok: true, result: 'mine', grid, opened });
    }

    const newOpened = [...opened, cell];
    const multiplier = minesMultiplier(25, mines_count, newOpened.length);

    const safeCells = 25 - mines_count;
    let status = 'active';
    let autoWin = false;

    if (newOpened.length >= safeCells) {
      status = 'won';
      autoWin = true;
    }

    await client.query(
      'UPDATE mines_sessions SET opened = $1, status = $2 WHERE telegram_id = $3',
      [JSON.stringify(newOpened), status, userId]
    );

    if (autoWin) {
      const payout = Math.floor(bet * multiplier);
      const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
      const newBalance = user.rows[0].balance + payout;
      await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
      await client.query('COMMIT');
      await logTx(userId, 'impulse_win', payout, 'in', { game: 'MINES' });
      return res.json({ ok: true, result: 'autowin', payout, multiplier, balance: newBalance, opened: newOpened, grid });
    }

    await client.query('COMMIT');
    res.json({ ok: true, result: 'safe', multiplier, opened: newOpened });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[MINES] open error:', e.message);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

app.post('/api/casino/mines/cashout', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;

    const sess = await client.query(
      'SELECT * FROM mines_sessions WHERE telegram_id = $1 FOR UPDATE', [userId]
    );
    if (!sess.rows[0] || sess.rows[0].status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active session' });
    }

    const { mines_count, opened, bet } = sess.rows[0];
    if (!opened || opened.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Open at least one cell first' });
    }

    const multiplier = minesMultiplier(25, mines_count, opened.length);
    const payout = Math.floor(bet * multiplier);

    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    const newBalance = user.rows[0].balance + payout;

    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    await client.query(
      'UPDATE mines_sessions SET status = $1 WHERE telegram_id = $2',
      ['won', userId]
    );

    await client.query('COMMIT');
    await logTx(userId, 'impulse_win', payout, 'in', { game: 'MINES' });
    res.json({ ok: true, payout, multiplier, balance: newBalance });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[MINES] cashout error:', e.message);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});
// ===== BETA COUNT =====
app.get('/api/beta/count', async (req, res) => {
  try {
    const r = await pool.query('SELECT COUNT(*) FROM users WHERE is_beta_tester = TRUE');
    const taken = parseInt(r.rows[0].count);
    res.json({ taken, remaining: Math.max(0, 100 - taken), closed: taken >= 100 });
  } catch(e) {
    res.json({ taken: 0, remaining: 100, closed: false });
  }
});

app.get('/exchange', (req, res) => {
  res.sendFile(path.join(__dirname, 'exchange.html'));
});

app.get('/exchange-info.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'exchange-info.html'));
});
app.get('/fiat.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'fiat.html'));
});

// ─── MINES END ────────────────────────────────────────────
// ==================== BESTCHANGE API ====================
// GET /api/bestchange/currencies/:lang
app.get('/api/bestchange/currencies/:lang', publicRateLimit, async (req, res) => {
  if (!BESTCHANGE_API_KEY) return res.status(503).json({ success: false, error: 'API key not configured' });
  try {
    const lang = ['ru', 'en', 'fr', 'es'].includes(req.params.lang) ? req.params.lang : 'en';
    const cached = bestchangeCache.currencies[lang];
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }
    const data = await bestchangeFetch(`/currencies/${lang}`);
    bestchangeCache.currencies[lang] = { data, timestamp: now };
    res.json({ success: true, data });
  } catch (e) {
    console.error('[BestChange] currencies error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch currencies' });
  }
});

// GET /api/bestchange/rates/:from/:to
app.get('/api/bestchange/rates/:from/:to', publicRateLimit, async (req, res) => {
  if (!BESTCHANGE_API_KEY) return res.status(503).json({ success: false, error: 'API key not configured' });
  try {
    const { from, to } = req.params;
    if (!/^\d+$/.test(from) || !/^\d+$/.test(to)) {
      return res.status(400).json({ success: false, error: 'Invalid currency IDs' });
    }
    const key = `${from}-${to}`;
    const cached = bestchangeCache.rates[key];
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }
    const data = await bestchangeFetch(`/rates/${key}`);
    bestchangeCache.rates[key] = { data, timestamp: now };
    res.json({ success: true, data });
  } catch (e) {
    console.error('[BestChange] rates error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch rates' });
  }
});

// GET /api/bestchange/changers/:lang
app.get('/api/bestchange/changers/:lang', publicRateLimit, async (req, res) => {
  if (!BESTCHANGE_API_KEY) return res.status(503).json({ success: false, error: 'API key not configured' });
  try {
    const lang = ['ru', 'en', 'fr', 'es'].includes(req.params.lang) ? req.params.lang : 'en';
    const cached = bestchangeCache.changers[lang];
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }
    const data = await bestchangeFetch(`/changers/${lang}`);
    bestchangeCache.changers[lang] = { data, timestamp: now };
    res.json({ success: true, data });
  } catch (e) {
    console.error('[BestChange] changers error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch changers' });
  }
});

// GET /api/bestchange/partner-id — возвращает ID для реферальной ссылки
app.get('/api/bestchange/partner-id', publicRateLimit, (req, res) => {
  res.json({ success: true, partnerId: BESTCHANGE_PARTNER_ID });
});
// ==================== БИРЖА ====================

// Получение курсов стон.фи API
app.get('/api/exchange/rates', async (req, res) => {
    const TOKEN_MAP = {
        'TON':   'eqbnGWMcf3-fzzq1w4iwcwigac3phuz0_h-7sad2oy00o83s',
        'USDT':  'eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds',
        'BTC':   'EQDhyPzbIjJT_WnY3gGprjSYUK9fiGMjWMezxO8MZiUdfb_B',
        'XAUt0': 'EQA1R_LuQCLHlMgOo1S4G7Y7W1cd0FrAkbA10Zq7rddKxi9k',
        'AAPLx': 'EQDsjAwfKo-6FVZv2EYt-1CaZTY_ZL-pfkSId6jeQchNwmdo',
        'NVDAx': 'EQCva-Of7acQdU_piADdlcbzsFtA-xJwZoctz8ZOXBdBoaB8',
        'TSLAx': 'EQB4IwqWZPUczntdry8vSN2tsJKt-9F7iIb7gEFREYYOB563',
        'AMZNx': 'EQCtD2-7qxHhQoNhxri2JSzH-dlmWqKYCDtlEZqRi3-56gd9',
        'SPYx':  'EQB1fyBAA9qQDP6LEGaF3cbU-Xbr-p6ESBZGnqlHkHIHAJZv'
    };

    const FALLBACK_PRICES = { TON: 1.58, BTC: 60906, XAUt0: 2400, USDT: 1 };

    async function fetchT(url, ms = 5000) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms);
        try { return await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } }); }
        finally { clearTimeout(t); }
    }

    async function fetchCrypto() {
        const priceBySymbol = {};
        try {
            const response = await fetchT('https://api.ston.fi/v1/assets');
            if (response.ok) {
                const data = await response.json();
                const assets = data.asset_list || [];
                for (const a of assets) {
                    const addr = (a.contract_address || '').toLowerCase();
                    let price = parseFloat(a.dex_usd_price ?? '0');
                    if (!price || price === 0) price = parseFloat(a.third_party_usd_price ?? '0');
                    if (!price || price === 0) continue;
                    if (addr === TOKEN_MAP.USDT) priceBySymbol.USDT = price;
                    else if (a.kind === 'Ton') priceBySymbol.TON = price;
                }
            }
        } catch (e) { console.error('STON.fi list error:', e.message); }

        const [btcRes, xautRes] = await Promise.allSettled([
            fetchT(`https://api.ston.fi/v1/assets/${TOKEN_MAP.BTC}`),
            fetchT(`https://api.ston.fi/v1/assets/${TOKEN_MAP.XAUt0}`)
        ]);
        if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
            const btc = (await btcRes.value.json()).asset;
            let p = parseFloat(btc?.dex_usd_price ?? '0');
            if (!p) p = parseFloat(btc?.third_party_usd_price ?? '0');
            if (p > 0) priceBySymbol.BTC = p;
        }
        if (xautRes.status === 'fulfilled' && xautRes.value.ok) {
            const x = (await xautRes.value.json()).asset;
            let p = parseFloat(x?.dex_usd_price ?? '0');
            if (!p) p = parseFloat(x?.third_party_usd_price ?? '0');
            if (p > 0) priceBySymbol.XAUt0 = p;
        }

        for (const k of Object.keys(FALLBACK_PRICES)) {
            if (!priceBySymbol[k] || priceBySymbol[k] === 0) priceBySymbol[k] = FALLBACK_PRICES[k];
        }

        const rates = {};
        if (priceBySymbol.TON > 0) { rates['TON/USDT'] = priceBySymbol.TON; rates['USDT/TON'] = 1 / priceBySymbol.TON; }
        if (priceBySymbol.BTC > 0) { rates['BTC/USDT'] = priceBySymbol.BTC; rates['USDT/BTC'] = 1 / priceBySymbol.BTC; }
        if (rates['BTC/USDT'] && rates['TON/USDT']) { rates['BTC/TON'] = rates['BTC/USDT'] / rates['TON/USDT']; rates['TON/BTC'] = 1 / rates['BTC/TON']; }
        if (priceBySymbol.XAUt0 > 0) { rates['XAUt0/USDT'] = priceBySymbol.XAUt0; rates['USDT/XAUt0'] = 1 / priceBySymbol.XAUt0; }
        return rates;
    }

    async function fetchXstocks() {
    const rates = {};
    const xStocksList = ['AAPLx','NVDAx','TSLAx','AMZNx','SPYx'];
    const XSTOCKS_ADDRS = {
        'AAPLx': 'EQDsjAwfKo-6FVZv2EYt-1CaZTY_ZL-pfkSId6jeQchNwmdo',
        'NVDAx': 'EQCva-Of7acQdU_piADdlcbzsFtA-xJwZoctz8ZOXBdBoaB8',
        'TSLAx': 'EQB4IwqWZPUczntdry8vSN2tsJKt-9F7iIb7gEFREYYOB563',
        'AMZNx': 'EQCtD2-7qxHhQoNhxri2JSzH-dlmWqKYCDtlEZqRi3-56gd9',
        'SPYx':  'EQB1fyBAA9qQDP6LEGaF3cbU-Xbr-p6ESBZGnqlHkHIHAJZv'
    };

    await Promise.allSettled(
        xStocksList.map(async (ticker) => {
            try {
                const addr = XSTOCKS_ADDRS[ticker];
                const pr = await fetchT(`https://api.ston.fi/v1/assets/${addr}`, 15000);
                if (!pr.ok) {
                    console.error(`xStocks ${ticker}: STON.fi HTTP ${pr.status}`);
                    return;
                }
                const data = await pr.json();
                const asset = data.asset;
                let price = parseFloat(asset?.dex_usd_price ?? '0');
                if (!price || price === 0) price = parseFloat(asset?.third_party_usd_price ?? '0');
                if (price > 0) {
                    rates[`${ticker}/USDT`] = price;
                    rates[`USDT/${ticker}`] = 1 / price;
                    console.log(`xStocks ${ticker} OK (STON.fi): ${price}`);
                } else {
                    console.error(`xStocks ${ticker}: цена 0`);
                }
            } catch (e) {
                console.error(`xStocks ${ticker} error:`, e.message);
            }
        })
    );
    return rates;
}

    try {
        const [cryptoRates, xstocksRates] = await Promise.all([fetchCrypto(), fetchXstocks()]);
        const rates = { ...cryptoRates, ...xstocksRates };
        if (Object.keys(rates).length === 0) throw new Error('Все источники цен недоступны');

        for (const [pair, rate] of Object.entries(rates)) {
            await pool.query('INSERT INTO exchange_rates (pair, rate) VALUES ($1, $2) ON CONFLICT (pair) DO UPDATE SET rate = $2, updated_at = NOW()', [pair, rate]);
        }
        res.json({ success: true, rates });
    } catch (err) {
        console.error('Rates error:', err.message);
        const { rows } = await pool.query('SELECT pair, rate FROM exchange_rates');
        const cachedRates = {};
        rows.forEach(r => cachedRates[r.pair] = r.rate);
        if (Object.keys(cachedRates).length > 0) {
            res.json({ success: true, rates: cachedRates, cached: true });
        } else {
            res.status(503).json({ success: false, error: err.message });
        }
    }
});
// Создание сделки
app.post('/api/exchange/swap', requireInitData, async (req, res) => {
    const { fromCurrency, toCurrency, fromAmount } = req.body;
    const userId = req.tgUser.id;
    
    try {
        const pair = `${fromCurrency}/${toCurrency}`;
        const { rows: rateRows } = await pool.query('SELECT rate FROM exchange_rates WHERE pair = $1', [pair]);
        
        let rate;
        if (rateRows.length > 0) {
            rate = rateRows[0].rate;
        } else {
            const rateRes = await fetch(`${req.protocol}://${req.get('host')}/api/exchange/rates`);
            const rateData = await rateRes.json();
            rate = rateData.rates[pair];
        }
        
        if (!rate) throw new Error('Rate not found');
        
        const rawAmount = fromAmount * rate;
        const fee = rawAmount * 0.003;
        const toAmount = rawAmount - fee;
        
        const { rows } = await pool.query(
    `INSERT INTO exchange_swaps (user_id, from_currency, to_currency, from_amount, to_amount, rate, fee, cogniq_fee, status, created_at)
 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW()) RETURNING id`,
[userId, fromCurrency, toCurrency, fromAmount, toAmount, rate, fee, COGNIQ_FEE]
          );
        
        res.json({ 
            success: true, 
            swapId: rows[0].id,
            fromAmount,
            toAmount,
            fee,
            rate,
            message: 'Подтвердите обмен через TON Connect'
        });
        
    } catch (err) {
        console.error('Swap error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Подтверждение сделки
app.post('/api/exchange/confirm', requireInitData, async (req, res) => {
    const { swapId } = req.body;
    const userId = req.tgUser.id;
    
    try {
        const result = await pool.query(
            'UPDATE exchange_swaps SET status = $1, completed_at = NOW() WHERE id = $2 AND user_id = $3 AND status = $4 RETURNING id',
            ['completed', swapId, userId, 'pending']
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Swap not found or already completed' });
        }
        
        res.json({ success: true, message: 'Обмен завершён' });
    } catch (err) {
        console.error('Confirm error:', err);
        res.status(500).json({ error: err.message });
    }
});
// История сделок биржи
app.get('/api/exchange/history', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const { rows } = await pool.query(
      'SELECT * FROM exchange_swaps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json({ success: true, swaps: rows });
  } catch (err) {
    console.error('Exchange history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/exchange/swap-data', requireInitData, async (req, res) => {
  const userId = req.tgUser.id;
  const { fromCurrency, toCurrency, fromAmount, walletAddress } = req.body;

  try {
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
    // Проверка баланса COGNIQ
const userRow = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [userId]);
if (!userRow.rows[0]) {
  return res.status(404).json({ error: 'Пользователь не найден' });
}
if (userRow.rows[0].balance < COGNIQ_FEE) {
  return res.status(400).json({ 
    error: 'Недостаточно COGNIQ',
    required: COGNIQ_FEE,
    balance: userRow.rows[0].balance
  });
}
// Списываем COGNIQ
await pool.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [COGNIQ_FEE, userId]);

    const units = toUnitsForSwap(fromAmount, fromCurrency);
    const inputAsset = toAssetId(fromCurrency);
    const outputAsset = toAssetId(toCurrency);

    const quote = await requestQuoteWithFee(omniston, { inputAsset, outputAsset, units });

    if (!isSwapQuote(quote)) {
      return res.status(400).json({ error: 'Not a swap quote' });
    }

    const traderAddress = { chain: { $case: 'ton', value: walletAddress } };

    const swapTx = await Promise.race([
      omniston.tonBuildSwap({
        quoteId: quote.quoteId,
        transferSrcAddress: traderAddress,
        refundSrcAddress: traderAddress,
        gasExcessAddress: traderAddress,
        traderDstAddress: traderAddress
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('tonBuildSwap timeout 15s')), 15000))
    ]);

    const messages = swapTx.messages.map(m => ({
      address: m.targetAddress ?? m.to ?? m.address,
      amount: (m.sendAmount ?? m.value ?? m.amount ?? '0').toString(),
      payload: safePayload(m.payload ?? m.body)
    }));

    res.json({ success: true, messages, quoteId: quote.quoteId });
  } catch (err) {
    console.error('Omniston error:', err);
    res.status(500).json({ error: err.message });
  }
});
// ==================== ОБМЕННИК ====================
app.get('/api/exchange/rate', requireInitData, authRateLimit, async (req, res) => {
  const wallet = process.env.TON_OPERATION_WALLET;
  res.json({ rate: 200, address: wallet || 'UQBniD_M-MTeVqUbWshZrXdQcz0m8lPstG3mQg1AL5KKCGSv', min_usdt: 1, max_usdt: 100 });
});

app.get('/api/transactions', requireInitData, publicRateLimit, async (req, res) => {
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
app.get('/api/check-user', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ exists: false });
  try {
    const { rows } = await pool.query('SELECT telegram_id FROM users WHERE telegram_id = $1', [userId]);
    res.json({ exists: rows.length > 0 });
  } catch(e) {
    res.status(500).json({ exists: false });
  }
});
// ==================== ОНЧЕЙН ВЫВОД COGNIQ JETTON ====================
// ==================== ЗАПУСК ====================
const WEBHOOK_PATH = '/webhook';

async function start() {
  await initDB(pool, loadQuestionsFromDB);

  if (WEBHOOK_URL) {
    app.post(WEBHOOK_PATH, (req, res) => {
      res.sendStatus(200);
      bot.handleUpdate(req.body).catch(err => console.error('Ошибка обработки обновления:', err));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    try {
      const botInfo = await bot.telegram.getMe();
      botUsername = botInfo.username;
      console.log(`Бот: @${botUsername}`);

      setupCron(bot, botUsername);
      
    } catch (e) {
      console.error('Не удалось получить username бота:', e.message);
    }

    if (WEBHOOK_URL) {
      try {
        await bot.telegram.setWebhook(`${WEBHOOK_URL}${WEBHOOK_PATH}`);
        console.log(`Вебхук установлен: ${WEBHOOK_URL}${WEBHOOK_PATH}`);
      } catch (err) {
        console.error('Ошибка установки вебхука:', err.message);
      }
    } else {
      bot.launch();
      console.log('Бот запущен в режиме polling');
    }
  });
}

start().catch(err => {
  console.error('Ошибка запуска:', err);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
