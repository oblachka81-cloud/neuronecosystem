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

    // BigInt для отправки, number для отображения
    const liqAmountBig = BigInt(Math.floor(total * 0.75));
    const liqAmount = Math.floor(total * 0.75);  // обычный number
    const devAmount = total - liqAmount;

    // Логи для диагностики
    console.log('[SPLIT] total nano:', total, 'type:', typeof total);
    console.log('[SPLIT] liqAmount nano:', liqAmount, 'type:', typeof liqAmount);
    console.log('[SPLIT] liqAmountBig:', liqAmountBig.toString(), 'type:', typeof liqAmountBig);
    console.log('[SPLIT] LIQUIDITY_WALLET:', liqWallet);

    console.log(`[SPLIT] найдено ${cnt} супер-игр, всего ${total/1e6} USDT, шлём ${liqAmount/1e6} в ликвидность`);

    // Отправляем BigInt
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
        await bot.telegram.sendMessage(process.env.CHANNEL_ID,
          `💧 Авто-деление выручки супер-игр\nИгр: ${cnt} | Сумма: ${(total/1e6).toFixed(2)} USDT\n75% → ликвидность: ${(liqAmount/1e6).toFixed(2)} USDT\n25% → развитие (операционный): ${(devAmount/1e6).toFixed(2)} USDT\nTX: ${tx1}`);
      } catch (e) {}
    }
    console.log(`[SPLIT] готово: ${cnt} игр, ${(total/1e6).toFixed(2)} USDT → 75% в ликвидность`);
  } catch (e) {
    console.error('[SPLIT] error:', e.message);
  }
}

module.exports = { splitSuperGameRevenue };
