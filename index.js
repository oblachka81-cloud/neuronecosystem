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
const { setupBotHandlers } = require('./src/bot/handlers');

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
setupBotHandlers(bot);


function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

app.get('/tonconnect-manifest.json', (req, res) => {
  res.json({
    url: WEBAPP_URL,
    name: 'NEURON Game',
    iconUrl: `${WEBAPP_URL}/icon.png`,
  });
});

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

// ==================== АДМИНКА ====================
app.get('/admin', adminRateLimit, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/bank', (req, res) => {
  res.sendFile(path.join(__dirname, 'bank.html'));
});

app.get('/casino', (req, res) => {
  res.sendFile(path.join(__dirname, 'casino.html'));
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

// ==================== ЗАПУСК ===================
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
