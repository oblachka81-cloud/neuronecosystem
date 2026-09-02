router.get('/api/weekly-report', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const lang = ['ru', 'en', 'fr', 'es'].includes(req.query.lang) ? req.query.lang : 'en';
    const week = `NOW() - INTERVAL '7 days'`;
    const prevWeek = `NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'`;

    // ===== ВИКТОРИНЫ (текущая + прошлая неделя для дельты) =====
    const quizRes = await pool.query(
      `SELECT COUNT(*) as games_count, COALESCE(SUM(amount),0) as earned
       FROM transactions
       WHERE user_id = $1 AND type = 'quiz_win' AND direction = 'in'
       AND created_at > ${week}`, [userId]);
    const quizPrev = await pool.query(
      `SELECT COUNT(*) as games_count, COALESCE(SUM(amount),0) as earned
       FROM transactions
       WHERE user_id = $1 AND type = 'quiz_win' AND direction = 'in'
       AND created_at BETWEEN ${prevWeek}`, [userId]);

    // ===== ДУЭЛИ =====
    const duelsRes = await pool.query(
      `SELECT COUNT(*) as total_duels, COUNT(*) FILTER (WHERE winner_id = $1) as won_duels
       FROM duels WHERE (player1_id = $1 OR player2_id = $1)
       AND status = 'finished' AND finished_at > ${week}`, [userId]);

    // ===== ШАХМАТЫ =====
    const chessRes = await pool.query(
      `SELECT COUNT(*) as total_chess, COUNT(*) FILTER (WHERE winner_id = $1) as won_chess
       FROM chess_games WHERE (player1_id = $1 OR player2_id = $1)
       AND status = 'finished' AND finished_at > ${week}`, [userId]);

    // ===== COGNIQ: ЗАРАБОТАНО (только игры и бонусы) =====
    const earnedRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as earned
       FROM transactions
       WHERE user_id = $1 AND direction = 'in'
       AND type IN ('quiz_win','streak_bonus','achievement','daily_question','referral_bonus','channel_bonus','duel_win','chess_win')
       AND created_at > ${week}`, [userId]);

    // ===== COGNIQ: ПОТРАЧЕНО (только реальные траты) =====
    const spentRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as spent
       FROM transactions
       WHERE user_id = $1 AND direction = 'out'
       AND type IN ('shop_purchase','hint','replay_super')
       AND created_at > ${week}`, [userId]);

    // ===== COGNIQ: КОНВЕРТИРОВАНО / ЗАСТЕЙКАНО / ПЕРЕВОДЫ =====
    const movesRes = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type='cogniq_to_impulse' THEN amount ELSE 0 END),0) as converted,
        COALESCE(SUM(CASE WHEN type='stake_deposit' THEN amount ELSE 0 END),0) as staked,
        COALESCE(SUM(CASE WHEN type='transfer_sent' THEN amount ELSE 0 END),0) as transferred_out,
        COALESCE(SUM(CASE WHEN type='transfer_received' THEN amount ELSE 0 END),0) as transferred_in
       FROM transactions
       WHERE user_id = $1 AND created_at > ${week}`, [userId]);

    // ===== СОЖЖЕНО =====
    const burnedRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as burned FROM burn_pool
       WHERE telegram_id = $1 AND created_at > ${week}`, [userId]);

    // ===== БАНК: покупки за неделю =====
    const bankRes = await pool.query(
      `SELECT COUNT(*) as cnt, COALESCE(SUM(amount_usdt),0) as usdt, COALESCE(SUM(amount_cogniq),0) as cogniq
       FROM exchange_orders
       WHERE telegram_id = $1 AND status = 'completed' AND created_at > ${week}`, [userId]);

    // ===== IMPULSE + ЛУЧШИЙ ЗАНОС =====
    const impulseRes = await pool.query(
      `SELECT COUNT(*) as bets, COALESCE(SUM(bet_amount),0) as bet_sum,
        COALESCE(SUM(CASE WHEN win_amount > 0 THEN win_amount ELSE 0 END),0) as won,
        COALESCE(SUM(CASE WHEN win_amount = 0 THEN bet_amount ELSE 0 END),0) as lost,
        COALESCE(MAX(win_amount),0) as best_win
       FROM casino_spins WHERE telegram_id = $1 AND created_at > ${week}`, [userId]);

    // ===== ДОСТИЖЕНИЯ =====
    const achRes = await pool.query(
      `SELECT COUNT(*) as new_achievements FROM achievements
       WHERE user_id = $1 AND unlocked_at > ${week}`, [userId]);

    // ===== РАНГ + СТРИК + ТИКЕТЫ =====
    const userRes = await pool.query(
      `SELECT balance, streak_count, withdraw_tickets FROM users WHERE telegram_id = $1`, [userId]);
    const balance = userRes.rows[0]?.balance || 0;
    const rank = getRank(balance, lang);

    const quizGames = parseInt(quizRes.rows[0].games_count);
    const quizEarned = parseInt(quizRes.rows[0].earned);
    const prevGames = parseInt(quizPrev.rows[0].games_count);
    const earned = parseInt(earnedRes.rows[0].earned);
    const spent = parseInt(spentRes.rows[0].spent);
    const m = movesRes.rows[0];
    const imp = impulseRes.rows[0];

    res.json({
      success: true,
      activity: {
        quiz: quizGames,
        quizEarned,
        duels: { total: parseInt(duelsRes.rows[0].total_duels), won: parseInt(duelsRes.rows[0].won_duels) },
        chess: { total: parseInt(chessRes.rows[0].total_chess), won: parseInt(chessRes.rows[0].won_chess) },
      },
      cogniq: {
        earned,
        spent,
        net: earned - spent,
        converted: parseInt(m.converted),
        staked: parseInt(m.staked),
        transferredOut: parseInt(m.transferred_out),
        transferredIn: parseInt(m.transferred_in),
        burned: parseInt(burnedRes.rows[0].burned),
        bankBuys: parseInt(bankRes.rows[0].cnt),
        bankUsdt: parseFloat(bankRes.rows[0].usdt),
        bankCogniq: parseInt(bankRes.rows[0].cogniq),
      },
      impulse: {
        bets: parseInt(imp.bets),
        betSum: parseInt(imp.bet_sum),
        won: parseInt(imp.won),
        lost: parseInt(imp.lost),
        net: parseInt(imp.won) - parseInt(imp.lost),
        bestWin: parseInt(imp.best_win),
      },
      achievements: { new: parseInt(achRes.rows[0].new_achievements) },
      streak: userRes.rows[0]?.streak_count || 0,
      withdrawTickets: userRes.rows[0]?.withdraw_tickets || 0,
      delta: { gamesPrev: prevGames },
      rank: { emoji: rank.emoji, title: rank.title, balance },
    });
  } catch (e) {
    console.error('[REPORT] error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});
