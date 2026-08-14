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
const casinoRoutes = require('./src/routes/casino');
const exchangeRoutes = require('./src/routes/exchange');
const adminRoutes = require('./src/routes/admin');
const miscRoutes = require('./src/routes/misc');

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
app.use(casinoRoutes);
app.use(exchangeRoutes);
app.use(adminRoutes);
app.use(miscRoutes);

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

// ==================== КАЗИНО ====================
app.get('/casino', (req, res) => {
  res.sendFile(path.join(__dirname, 'casino.html'));
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
      app.set('botUsername', botUsername);
      
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
