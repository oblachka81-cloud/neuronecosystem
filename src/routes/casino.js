const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db/pool');
const { requireInitDataStrict } = require('../middleware/auth');
const { casinoRateLimit } = require('../middleware/rateLimit');
const { addToBurnPool, logTx } = require('../services/burn');
const { bjBuildDeck, bjCardValue, bjHandScore, minesMultiplier, generateCrashPoint } = require('../services/casino');

// ==================== РУЛЕТКА ====================
router.post('/api/casino/spin', requireInitDataStrict, casinoRateLimit, async (req, res) => {
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

// ==================== СЛОТЫ ====================
router.post('/api/casino/slot', requireInitDataStrict, casinoRateLimit, async (req, res) => {
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

    if (roll < 0.001) {
      const cogniq = symbols[symbols.length - 1];
      reels = [cogniq, cogniq, cogniq, cogniq, cogniq];
    } else if (roll < 0.006) {
      const sym = symbols[buf[0] % (symbols.length - 1)];
      reels = [sym, sym, sym, sym, sym];
    } else if (roll < 0.026) {
      const sym = symbols[buf[0] % symbols.length];
      const otherIndex = (buf[1] % (symbols.length - 1));
      const other = symbols[otherIndex === symbols.indexOf(sym) ? (otherIndex + 1) % symbols.length : otherIndex];
      reels = [sym, sym, sym, sym, other];
    } else if (roll < 0.106) {
      const sym = symbols[buf[0] % symbols.length];
      reels = [sym, sym, sym,
        symbols[(buf[1] % (symbols.length - 1) + 1) % symbols.length],
        symbols[(buf[2] % (symbols.length - 2) + 2) % symbols.length]
      ];
    } else {
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

module.exports = router;
