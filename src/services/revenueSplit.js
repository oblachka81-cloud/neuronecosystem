const pool = require('../db/pool');
const { sendJetton } = require('./ton');

const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

async function splitSuperGameRevenue(bot) {
  try {
    const key = process.env.TON_OPERATION_WALLET_PRIVATE_KEY;
    const liqWallet = process.env.LIQUIDITY_WALLET;
    if (!key || !liqWallet) {
      console.log('[SPLIT] пропущен: нет ключа или LIQUIDITY_WALLET');
      return;
    }

    const res = await pool.query(
      `SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS total
       FROM processed_ton_payments
       WHERE item = 'super_game' AND NOT split_done`
    );
    const total = parseInt(res.rows[0].total, 10);
    const cnt = parseInt(res.rows[0].cnt, 10);
    if (cnt === 0 || total < 1000000) return;

    const liqAmountBig = BigInt(Math.floor(total * 0.75));
    const liqAmount = Math.floor(total * 0.75);
    const devAmount = total - liqAmount;

    console.log(`[SPLIT] найдено ${cnt} супер-игр, всего ${(total/1e6).toFixed(2)} USDT, шлём ${(liqAmount/1e6).toFixed(2)} в ликвидность`);

    const tx1 = await sendJetton(USDT_MASTER, liqWallet, liqAmountBig, key);

    await pool.query(`UPDATE processed_ton_payments SET split_done = true
                      WHERE item = 'super_game' AND NOT split_done`);
    await pool.query(
      `INSERT INTO revenue_splits (games, total_usdt, liquidity_usdt, dev_usdt, liq_tx, dev_tx)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [cnt, total/1e6, liqAmount/1e6, devAmount/1e6, tx1, 'stays_on_operational']
    );

    if (bot) {
      try {
        const liqDisplay = (liqAmount / 1e6).toFixed(2);
        
        const messages = {
          ru: `💧 Авто-пополнение пула ликвидности COGNIQ/USDT

🎮 Супер-игр сыграно: ${cnt}
💰 Добавлено в пул: ${liqDisplay} USDT

🔗 TX: ${tx1}

🔥 Следующая супер-игра уже доступна!

С уважением, NEURON`,

          en: `💧 Auto-liquidity pool replenishment COGNIQ/USDT

🎮 Super games played: ${cnt}
💰 Added to pool: ${liqDisplay} USDT

🔗 TX: ${tx1}

🔥 Next super game is available!

Best regards, NEURON`,

          fr: `💧 Réapprovisionnement automatique du pool de liquidité COGNIQ/USDT

🎮 Super parties jouées: ${cnt}
💰 Ajouté au pool: ${liqDisplay} USDT

🔗 TX: ${tx1}

🔥 La prochaine super partie est disponible!

Cordialement, NEURON`,

          es: `💧 Reposición automática del pool de liquidez COGNIQ/USDT

🎮 Super partidas jugadas: ${cnt}
💰 Añadido al pool: ${liqDisplay} USDT

🔗 TX: ${tx1}

🔥 ¡La próxima super partida ya está disponible!

Saludos cordiales, NEURON`
        };

        const fullMessage = `${messages.ru}

---

${messages.en}

---

${messages.fr}

---

${messages.es}`;

        await bot.telegram.sendMessage(process.env.CHANNEL_ID, fullMessage);
      } catch (e) {
        console.error('[SPLIT] channel post error:', e.message);
      }
    }

    console.log(`[SPLIT] готово: ${cnt} игр, ${(total/1e6).toFixed(2)} USDT → 75% в ликвидность`);
  } catch (e) {
    console.error('[SPLIT] error:', e.message);
  }
}

module.exports = { splitSuperGameRevenue };
