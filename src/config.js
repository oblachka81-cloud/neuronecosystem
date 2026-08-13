// src/config.js
module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  WEBAPP_URL: process.env.WEBAPP_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,

  BESTCHANGE_API_KEY: process.env.BESTCHANGE_API_KEY,
  BESTCHANGE_PARTNER_ID: process.env.BESTCHANGE_PARTNER_ID || '1344120',
  BESTCHANGE_API_HOSTS: [
    'bestchange.app',
    'mirror1.bestchange.app',
    'mirror2.bestchange.app',
    'mirror3.bestchange.app',
    'mirror4.bestchange.app',
  ],

  // Игра
  QUESTIONS_PER_GAME: 10,
  MAX_FREE_GAMES_PER_DAY: 10,
  TOKENS_PER_QUESTION_FREE: 2,
  TOKENS_SUPER_GAME: 15,
  REFERRAL_BONUS: 50,
  REFERRAL_BONUS_NEW_USER: 10,
  MIN_WITHDRAW: 1000,
  COGNIQ_PACK_PRICE: 150,
  COGNIQ_PACK_COOLDOWN_DAYS: 3,
  PACK_GAMES: 10,
  VIP_PRICE_STARS: 300,
  PREMIUM_PRICE_STARS: 800,
  VIP_DURATION_DAYS: 7,
  PREMIUM_DURATION_DAYS: 30,
  VIP_PRICE_USDT: 3,
  PREMIUM_PRICE_USDT: 8,
  CHANNEL_BONUS: 50,
};
