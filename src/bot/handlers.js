const pool = require('../db/pool');
const { getOrCreateUser } = require('../services/users');
const { withRetry, logTx } = require('../services/burn');
const { todayStr } = require('../services/users');
const { generateWelcomeCard, generateReferralNewUserCard, generateReferralReferrerCard, generatePurchaseCard } = require('../../channel');
const { postBetaCard } = require('../../channel');
const { REFERRAL_BONUS, REFERRAL_BONUS_NEW_USER, WEBAPP_URL } = require('../config');

function setupBotHandlers(bot) {
  
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
}

module.exports = { setupBotHandlers };
