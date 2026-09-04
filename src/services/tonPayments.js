const pool = require('../db/pool');
const { todayStr } = require('./users');
const { withRetry, logTx } = require('./burn');
const { generatePurchaseCard, generateExchangeCard } = require('../../channel');

async function checkTonUsdtPayments(bot) {
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
            `INSERT INTO processed_ton_payments (tx_hash, user_id, amount, processed_at, item) VALUES ($1, $2, $3, NOW(), 'super_game') ON CONFLICT DO NOTHING RETURNING id`,
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
          try { 
            const userLang = await pool.query('SELECT language_code FROM users WHERE telegram_id = $1', [userId]);
            const lang = userLang.rows[0]?.language_code || 'ru';
            try {
              const img = await generatePurchaseCard('pack10', lang);
              await withRetry(() => bot.telegram.sendPhoto(userId, { source: img }));
            } catch (e) {
              await withRetry(() => bot.telegram.sendMessage(userId, '⚡ Пакет +10 игр активирован!'));
            } 
          } catch (e) {}
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
          const rate = 2000;
          const amountCogniq = Math.floor(amountUSDT * rate);
          const grantedGames = Math.floor(amountUSDT);
          
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
              'INSERT INTO processed_ton_payments (tx_hash, user_id, amount, processed_at, item) VALUES ($1, $2, $3, NOW(), $4)',
              [txHash, userId, amount, 'bank_exchange']
            );
            
            await client.query(
              'UPDATE users SET balance = balance + $1, balance_purchased = COALESCE(balance_purchased, 0) + $1, granted_super_games = granted_super_games + $2 WHERE telegram_id = $3',
              [amountCogniq, grantedGames, userId]
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
          
          console.log(`[TON] Exchange: ${amountUSDT} USDT → ${amountCogniq} COGNIQ + ${grantedGames} super games for user ${userId}`);
        }

      if (transfers.length < limit) break;
      offset += limit;
    }
  } catch (e) {
    console.error('[TON] checkTonUsdtPayments error:', e.message);
  }
}


module.exports = { checkTonUsdtPayments };
