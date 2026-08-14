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

// ==================== CRASH ====================

// СТАВКА + ГЕНЕРАЦИЯ ТОЧКИ КРАША (один запрос вместо двух)
router.post('/api/casino/crash/bet', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const bet_amount = parseInt(req.body.bet_amount);
    if (!bet_amount || bet_amount < 10 || bet_amount > 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ставка: 10-100 IMPULSE' });
    }

    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!user.rows[0] || user.rows[0].balance < bet_amount) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Недостаточно IMPULSE' });
    }

    const existing = await client.query(
      "SELECT id FROM crash_bets WHERE telegram_id = $1 AND status = 'active'", [userId]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Уже есть активная ставка' });
    }

    const newBalance = user.rows[0].balance - bet_amount;
    const crashPoint = generateCrashPoint();
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(serverSeed + crashPoint.toString()).digest('hex');

    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    await client.query(
      `INSERT INTO crash_bets (telegram_id, bet_amount, round_start, crash_point, server_seed, status)
       VALUES ($1, $2, NOW(), $3, $4, 'active')
       ON CONFLICT (telegram_id) DO UPDATE
       SET bet_amount = $2, round_start = NOW(), crash_point = $3, server_seed = $4, status = 'active'`,
      [userId, bet_amount, crashPoint, serverSeed]
    );
    await client.query('COMMIT');

    await logTx(userId, 'impulse_bet', bet_amount, 'out', { game: 'KRASH' });

    // Отдаём crash_point клиенту для анимации + hash для честности
    res.json({
      success: true,
      new_balance: newBalance,
      crash_point: crashPoint,
      hash
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] bet error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// КЭШАУТ — только если множитель МЕНЬШЕ точки краша
router.post('/api/casino/crash/cashout', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const { multiplier } = req.body;

    if (!multiplier || multiplier < 1.0 || multiplier > 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Неверный множитель' });
    }

    const betRow = await client.query(
      "SELECT bet_amount, crash_point, server_seed, round_start FROM crash_bets WHERE telegram_id = $1 AND status = 'active' FOR UPDATE",
      [userId]
    );
    if (!betRow.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Нет активной ставки' });
    }

    const { bet_amount, crash_point, server_seed, round_start } = betRow.rows[0];
    const crashPointFloat = parseFloat(crash_point);

    // ГЛАВНАЯ ПРОВЕРКА: множитель >= точки краша = ПРОИГРЫШ
    if (multiplier >= crashPointFloat) {
      await client.query(
        "UPDATE crash_bets SET status = 'crashed' WHERE telegram_id = $1", [userId]
      );
      await client.query('COMMIT');
      const userBal = await pool.query('SELECT balance FROM impulse_balance WHERE user_id = $1', [userId]);
      await addToBurnPool('impulse_crash', Math.max(1, Math.floor(bet_amount * 0.05)), userId);
      return res.json({
        success: false,
        crashed: true,
        crash_point: crashPointFloat,
        new_balance: userBal.rows[0]?.balance || 0,
        server_seed: server_seed
      });
    }

    // Анти-чит: множитель физически возможен по времени
    const elapsedMs = Date.now() - new Date(round_start).getTime();
    const maxPossible = crashMultiplierAt(elapsedMs) * 1.15;
    const clampedMultiplier = Math.min(multiplier, maxPossible);
    const actualMultiplier = Math.min(clampedMultiplier, crashPointFloat);
    const wonAmount = Math.floor(bet_amount * actualMultiplier);

    const user = await client.query('SELECT balance FROM impulse_balance WHERE user_id = $1 FOR UPDATE', [userId]);
    const newBalance = user.rows[0].balance + wonAmount;

    await client.query('UPDATE impulse_balance SET balance = $1 WHERE user_id = $2', [newBalance, userId]);
    await client.query("UPDATE crash_bets SET status = 'cashed_out' WHERE telegram_id = $1", [userId]);
    await client.query(
      'INSERT INTO casino_spins (telegram_id, bet_amount, bet_type, result_number, win_amount) VALUES ($1, $2, $3, $4, $5)',
      [userId, bet_amount, 'crash', Math.floor(actualMultiplier * 100), wonAmount]
    );
    await client.query('COMMIT');

    await logTx(userId, 'impulse_win', wonAmount, 'in', { game: 'KRASH' });

    res.json({
      success: true,
      new_balance: newBalance,
      actual_multiplier: actualMultiplier,
      won_amount: wonAmount,
      crash_point: crashPointFloat,
      server_seed: server_seed
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] cashout error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ПРОИГРЫШ (клиент увидел краш до кэшаута)
router.post('/api/casino/crash/lose', requireInitDataStrict, casinoRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;

    const betRow = await client.query(
      "SELECT bet_amount, crash_point, server_seed FROM crash_bets WHERE telegram_id = $1 AND status = 'active' FOR UPDATE",
      [userId]
    );

    if (!betRow.rows[0]) {
      await client.query('ROLLBACK');
      const user = await pool.query('SELECT balance FROM impulse_balance WHERE user_id = $1', [userId]);
      return res.json({ success: true, new_balance: user.rows[0]?.balance || 0 });
    }

    const { bet_amount, crash_point, server_seed } = betRow.rows[0];

    await client.query("UPDATE crash_bets SET status = 'crashed' WHERE telegram_id = $1", [userId]);
    if (bet_amount > 0) {
      await client.query(
        'INSERT INTO casino_spins (telegram_id, bet_amount, bet_type, result_number, win_amount) VALUES ($1, $2, $3, $4, $5)',
        [userId, bet_amount, 'crash', 0, 0]
      );
      await addToBurnPool('impulse_crash', Math.max(1, Math.floor(bet_amount * 0.05)), userId);
    }
    await client.query('COMMIT');

    const user = await pool.query('SELECT balance FROM impulse_balance WHERE user_id = $1', [userId]);
    res.json({
      success: true,
      new_balance: user.rows[0]?.balance || 0,
      crash_point: parseFloat(crash_point) || null,
      server_seed: server_seed || null
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CRASH] lose error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});
// ==================== BLACKJACK ====================
router.post('/api/casino/blackjack/deal', requireInitDataStrict, casinoRateLimit, async (req, res) => {
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

router.post('/api/casino/blackjack/action', requireInitDataStrict, casinoRateLimit, async (req, res) => {
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

router.post('/api/casino/blackjack/result', requireInitDataStrict, casinoRateLimit, async (req, res) => {
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

// ==================== MINES ====================
router.post('/api/casino/mines/start', requireInitDataStrict, casinoRateLimit, async (req, res) => {
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

router.post('/api/casino/mines/open', requireInitDataStrict, casinoRateLimit, async (req, res) => {
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

router.post('/api/casino/mines/cashout', requireInitDataStrict, casinoRateLimit, async (req, res) => {
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

module.exports = router;
