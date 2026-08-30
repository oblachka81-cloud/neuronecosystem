const express = require('express');
const BASE_URL = process.env.WEBAPP_URL || 'https://neuron.bothost.tech';
const router = express.Router();
const pool = require('../db/pool');
const { Chess } = require('chess.js');
const { requireInitData, requireInitDataStrict } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimit');

// POST /api/chess/create
router.post('/api/chess/create', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userId = req.tgUser.id;
    const stake = parseInt(req.body.stake) || 100;
    
    if (![100, 500, 1000].includes(stake)) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Недопустимая ставка' });
    }

    const userRes = await client.query('SELECT balance FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    if (!userRes.rows.length || userRes.rows[0].balance < stake) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Недостаточно COGNIQ' });
    }

    const existing = await client.query(
      `SELECT id FROM chess_games 
       WHERE (player1_id = $1 OR player2_id = $1) 
       AND status IN ('waiting', 'active')
       LIMIT 1`,
      [userId]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'У вас уже есть активная партия' });
    }

    await client.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [stake, userId]);

    const gameRes = await client.query(
      `INSERT INTO chess_games (player1_id, stake, status, created_at)
       VALUES ($1, $2, 'waiting', NOW())
       RETURNING id`,
      [userId, stake]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      gameId: gameRes.rows[0].id,
      stake,
      inviteLink: `https://t.me/NeuronEcosystemBot?start=chess_${gameRes.rows[0].id}`
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CHESS] create error:', e);
    res.json({ success: false, message: 'Ошибка создания партии' });
  } finally {
    client.release();
  }
});

// POST /api/chess/join
router.post('/api/chess/join', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userId = req.tgUser.id;
    const gameId = parseInt(req.body.game_id);

    const gameRes = await client.query('SELECT * FROM chess_games WHERE id = $1 FOR UPDATE', [gameId]);
    if (!gameRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия не найдена' });
    }

    const game = gameRes.rows[0];
    if (game.status !== 'waiting') {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия уже началась или завершена' });
    }

    if (String(game.player1_id) === String(userId)) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Нельзя играть с самим собой' });
    }

    const existing = await client.query(
      `SELECT id FROM chess_games 
       WHERE (player1_id = $1 OR player2_id = $1) 
       AND status IN ('waiting', 'active')
       LIMIT 1`,
      [userId]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'У вас уже есть активная партия' });
    }

    const userRes = await client.query('SELECT balance FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    if (!userRes.rows.length || userRes.rows[0].balance < game.stake) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Недостаточно COGNIQ' });
    }

    await client.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [game.stake, userId]);
    await client.query(
      'UPDATE chess_games SET player2_id = $1, status = $2::VARCHAR(20) WHERE id = $3',
      [userId, 'active', gameId]
    );

    await client.query('COMMIT');
    res.json({ success: true, gameId });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CHESS] join error:', e);
    res.json({ success: false, message: 'Ошибка присоединения' });
  } finally {
    client.release();
  }
});

// GET /api/chess/state
router.get('/api/chess/state', requireInitData, authRateLimit, async (req, res) => {
  const client = await pool.connect(); // 🔧 Используем клиент для транзакции
  try {
    await client.query('BEGIN');
    
    const userId = req.tgUser.id;
    const gameId = parseInt(req.query.game_id);

    // 🔧 FOR UPDATE блокирует строку от параллельных чтений
    const gameRes = await client.query(
      `SELECT g.*, 
              u1.nickname as p1_nick, u1.tg_photo_file_id as p1_photo,
              u1.first_name as p1_first_name,
              u2.nickname as p2_nick, u2.tg_photo_file_id as p2_photo,
              u2.first_name as p2_first_name
       FROM chess_games g
       LEFT JOIN users u1 ON g.player1_id = u1.telegram_id
       LEFT JOIN users u2 ON g.player2_id = u2.telegram_id
       WHERE g.id = $1 FOR UPDATE`,
      [gameId]
    );

    if (!gameRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия не найдена' });
    }

    const game = gameRes.rows[0];

    // АВТООТМЕНА ПО ТАЙМАУТУ (2 минуты)
    if (game.status === 'waiting') {
      const createdAt = new Date(game.created_at);
      const now = new Date();
      const secondsPassed = Math.floor((now - createdAt) / 1000);
      const timeLimit = 120;

      if (secondsPassed >= timeLimit) {
        await client.query(
          `UPDATE chess_games SET status = 'cancelled', finished_at = NOW() WHERE id = $1`,
          [gameId]
        );
        await client.query(
          `UPDATE users SET balance = balance + $1 WHERE telegram_id = $2`,
          [game.stake, game.player1_id]
        );
        
        await client.query('COMMIT'); // 🔧 Фиксируем возврат денег
        return res.json({ 
          success: true, 
          timeExpired: true,
          game: { ...game, status: 'cancelled' }
        });
      }
      
      const secondsLeft = Math.max(0, timeLimit - secondsPassed);
      await client.query('COMMIT');
      return res.json({ 
        success: true, 
        isParticipant: String(game.player1_id) === String(userId),
        game: { ...game, secondsLeft }
      });
    }

    await client.query('COMMIT'); // Для active/finished просто отпускаем блокировку

    const chess = new Chess(game.fen);

    const isParticipant = String(game.player1_id) === String(userId) || 
                          (game.player2_id && String(game.player2_id) === String(userId));

    res.json({
      success: true,
      isParticipant,
      game: {
        id: game.id,
        status: game.status,
        stake: game.stake,
        fen: game.fen,
        pgn: game.pgn,
        turn: chess.turn(),
        winnerId: game.winner_id,
        player1: { 
          id: game.player1_id, 
          nick: game.p1_nick || game.p1_first_name || 'Игрок 1', 
          photo: game.p1_photo ? `${BASE_URL}/api/tg-photo/${game.player1_id}` : null 
        },
        player2: game.player2_id ? { 
          id: game.player2_id, 
          nick: game.p2_nick || game.p2_first_name || 'Игрок 2', 
          photo: game.p2_photo ? `${BASE_URL}/api/tg-photo/${game.player2_id}` : null 
        } : null
      }
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CHESS] state error:', e);
    res.json({ success: false, message: 'Ошибка получения состояния' });
  } finally {
    client.release();
  }
});

// POST /api/chess/move
router.post('/api/chess/move', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const gameId = parseInt(req.body.game_id);
    const { from, to, promotion } = req.body;

    const gameRes = await client.query('SELECT * FROM chess_games WHERE id = $1 FOR UPDATE', [gameId]);
    if (!gameRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия не найдена' });
    }

    const game = gameRes.rows[0];
    if (game.status !== 'active') {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия не активна' });
    }

    const chess = new Chess(game.fen);
    const isWhiteTurn = chess.turn() === 'w';
    const isPlayer1 = String(game.player1_id) === String(userId);
    
    if ((isWhiteTurn && !isPlayer1) || (!isWhiteTurn && isPlayer1)) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Сейчас не ваш ход' });
    }

    let move;
    try {
      move = chess.move({ from, to, promotion: promotion || 'q' });
    } catch (e) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Недопустимый ход' });
    }

    const newFen = chess.fen();
    const newPgn = chess.pgn();

    let status = 'active';
    let winnerId = null;
    let finished = false;

    if (chess.isCheckmate()) {
      status = 'finished';
      winnerId = userId;
      finished = true;
    } else if (chess.isStalemate() || chess.isDraw() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      status = 'finished';
      finished = true;
    }

    await client.query(
      `INSERT INTO chess_moves (game_id, user_id, move_notation, fen_after)
       VALUES ($1, $2, $3, $4)`,
      [gameId, userId, move.san, newFen]
    );

    await client.query(
      `UPDATE chess_games SET 
        fen = $1, 
        pgn = $2, 
        status = $3::VARCHAR(20), 
        winner_id = $4, 
        finished_at = CASE WHEN $3 = 'finished' THEN NOW() ELSE NULL END 
      WHERE id = $5`,
      [newFen, newPgn, status, winnerId, gameId]
    );

    if (finished) {
      const totalPot = game.stake * 2;
      const burnAmount = Math.floor(totalPot * 0.05);
      const winAmount = totalPot - burnAmount;

      if (winnerId) {
        await client.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [winAmount, winnerId]);
        await client.query('INSERT INTO burn_pool (source, amount, telegram_id) VALUES ($1, $2, $3)', ['chess_burn', burnAmount, winnerId]);
      } else {
        await client.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [game.stake, game.player1_id]);
        await client.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [game.stake, game.player2_id]);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      fen: newFen,
      pgn: newPgn,
      status,
      winnerId,
      finished,
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw()
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CHESS] move error:', e);
    res.json({ success: false, message: 'Ошибка хода' });
  } finally {
    client.release();
  }
});

// POST /api/chess/resign
router.post('/api/chess/resign', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.tgUser.id;
    const gameId = parseInt(req.body.game_id);

    const gameRes = await client.query('SELECT * FROM chess_games WHERE id = $1 FOR UPDATE', [gameId]);
    if (!gameRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия не найдена' });
    }

    const game = gameRes.rows[0];
    if (game.status !== 'active') {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия не активна' });
    }

    const isPlayer1 = String(game.player1_id) === String(userId);
    const isPlayer2 = String(game.player2_id) === String(userId);
    if (!isPlayer1 && !isPlayer2) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Вы не участник' });
    }

    const winnerId = isPlayer1 ? game.player2_id : game.player1_id;
    const totalPot = game.stake * 2;
    const burnAmount = Math.floor(totalPot * 0.05);
    const winAmount = totalPot - burnAmount;

    await client.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [winAmount, winnerId]);
    await client.query("UPDATE chess_games SET status = 'finished'::VARCHAR(20), winner_id = $1, finished_at = NOW() WHERE id = $2", [winnerId, gameId]);
    await client.query('INSERT INTO burn_pool (source, amount, telegram_id) VALUES ($1, $2, $3)', ['chess_burn', burnAmount, winnerId]);

    await client.query('COMMIT');
    res.json({ success: true, winnerId, winAmount });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CHESS] resign error:', e);
    res.json({ success: false, message: 'Ошибка' });
  } finally {
    client.release();
  }
});

// POST /api/chess/cancel
router.post('/api/chess/cancel', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userId = req.tgUser.id;
    const gameId = parseInt(req.body.game_id);

    const gameRes = await client.query('SELECT * FROM chess_games WHERE id = $1 FOR UPDATE', [gameId]);
    if (!gameRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия не найдена' });
    }

    const game = gameRes.rows[0];
    if (game.status !== 'waiting') {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Партия уже началась' });
    }
    if (String(game.player1_id) !== String(userId)) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Только создатель может отменить партию' });
    }

    await client.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [game.stake, game.player1_id]);
    await client.query("UPDATE chess_games SET status = 'cancelled'::VARCHAR(20) WHERE id = $1", [gameId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Партия отменена, ставка возвращена' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[CHESS] cancel error:', e);
    res.json({ success: false, message: 'Ошибка отмены' });
  } finally {
    client.release();
  }
});

module.exports = router;
