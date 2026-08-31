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
const { generateStreakWarningCard, generateStreakMilestoneCard, generateQuestionOfDayCard, generateWelcomeCard, generateWeeklyTopCard, generateReferralReferrerCard, generateReferralNewUserCard, generateWeeklyHeroesCard, generateStreakBattleCard, generateFactOfDayCard, generateRankRatingCard, generateAchievementCard, generatePurchaseCard, generateExchangeCard, generateTransferReceivedCard, postBurnCard, postBetaCard, generateDuelInviteCard } = require('./channel.js');

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
const { bjBuildDeck, bjCardValue, bjHandScore, minesMultiplier, generateCrashPoint, crashMultiplierAt } = require('./src/services/casino');
const { COGNIQ_FEE, TOKEN_MAP, DECIMALS, OPERATIONAL_WALLET, omniston, isSwapQuote, toUnitsForSwap, toAssetId, safePayload, requestQuoteWithFee } = require('./src/services/exchange');
const { postDailyQuestion, postWeeklyTop, sendStreakWarnings, postWeeklyAchievements, postStreakBattle, postDailyFact, postRankLeaderboard, postDailyPoll } = require('./src/services/channel');
const { setupCron } = require('./src/cron/jobs');
const { startNewRound } = require('./src/services/crashMaster');
const quizRoutes = require('./src/routes/quiz');
const userRoutes = require('./src/routes/user');
const shopRoutes = require('./src/routes/shop');
const withdrawRoutes = require('./src/routes/withdraw');
const bankRoutes = require('./src/routes/bank');
const casinoRoutes = require('./src/routes/casino');
const exchangeRoutes = require('./src/routes/exchange');
const adminRoutes = require('./src/routes/admin');
const miscRoutes = require('./src/routes/misc');
const portfolioRoutes = require('./src/routes/portfolio'); 
const { setupBotHandlers } = require('./src/bot/handlers');
const { checkTonUsdtPayments } = require('./src/services/tonPayments');

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
app.use(portfolioRoutes);
app.use(require('./src/routes/duels'));
app.use(require('./src/routes/chess'));
app.use(require('./src/routes/aml'));

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
    
    // Запуск Crash Master Loop
    setTimeout(() => {
    console.log('[CRASH] Starting master loop...');
    startNewRound();
  }, 2000);
    
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
