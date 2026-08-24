const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireInitData, requireInitDataStrict } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimit');

// Нормализация options (как в questions.js)
function parseOptions(options) {
  if (typeof options === 'string') {
    try { return JSON.parse(options); } catch { return []; }
  }
  if (Array.isArray(options)) return options;
  return [];
}

async function getDuelQuestions() {
  const res = await pool.query(
    'SELECT id FROM questions ORDER BY RANDOM() LIMIT 10'
  );
  return res.rows.map(r => r.id);
}

// POST /api/duel/create
router.post('/api/duel/create', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userId = req.tgUser.id;
    const stake = parseInt(req.body.stake) || 100;
    
    if (![100, 500, 1000].includes(stake)) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Недопустимая ставка' });
    }

    // Проверяем баланс с блокировкой
    const userRes = await client.query('SELECT balance FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    if (!userRes.rows.length || userRes.rows[0].balance < stake) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Недостаточно COGNIQ' });
    }

    // Проверяем активные дуэли
    const existingDuel = await client.query(
      `SELECT id FROM duels 
       WHERE (player1_id = $1 OR player2_id = $1) 
       AND status IN ('waiting', 'active')
       LIMIT 1`,
      [userId]
    );
    if (existingDuel.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'У вас уже есть активная дуэль' });
    }

    // Списываем ставку
    await client.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [stake, userId]);

    // Создаём дуэль
    const questionIds = await getDuelQuestions();
    const duelRes = await client.query(
      `INSERT INTO duels (player1_id, stake, question_ids, status)
       VALUES ($1, $2, $3, 'waiting')
       RETURNING id`,
      [userId, stake, JSON.stringify(questionIds)]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      duelId: duelRes.rows[0].id,
      stake,
      inviteLink: `https://t.me/NeuronEcosystemBot?start=duel_${duelRes.rows[0].id}`
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[DUEL] create error:', e);
    res.json({ success: false, message: 'Ошибка создания дуэли' });
  } finally {
    client.release();
  }
});

// POST /api/duel/join
router.post('/api/duel/join', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userId = req.tgUser.id;
    const duelId = parseInt(req.body.duel_id);

    // Блокируем дуэль
    const duelRes = await client.query('SELECT * FROM duels WHERE id = $1 FOR UPDATE', [duelId]);
    if (!duelRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Дуэль не найдена' });
    }

    const duel = duelRes.rows[0];
    if (duel.status !== 'waiting') {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Дуэль уже начата или завершена' });
    }

    if (String(duel.player1_id) === String(userId)) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Нельзя играть с самим собой' });
    }

    // Проверяем активные дуэли второго игрока
    const existingDuel = await client.query(
      `SELECT id FROM duels 
       WHERE (player1_id = $1 OR player2_id = $1) 
       AND status IN ('waiting', 'active')
       LIMIT 1`,
      [userId]
    );
    if (existingDuel.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'У вас уже есть активная дуэль' });
    }

    // Проверяем баланс
    const userRes = await client.query('SELECT balance FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    if (!userRes.rows.length || userRes.rows[0].balance < duel.stake) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Недостаточно COGNIQ' });
    }

    // Списываем ставку
    await client.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [duel.stake, userId]);

    // Обновляем дуэль
    await client.query(
  'UPDATE duels SET player2_id = $1, status = $2::VARCHAR(20) WHERE id = $3',
  [userId, 'active', duelId]
);

    await client.query('COMMIT');
    res.json({ success: true, duelId });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[DUEL] join error:', e);
    res.json({ success: false, message: 'Ошибка присоединения' });
  } finally {
    client.release();
  }
});

// GET /api/duel/state
router.get('/api/duel/state', requireInitData, authRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const duelId = parseInt(req.query.duel_id);

    const duelRes = await pool.query(
      `SELECT d.*, 
              u1.nickname as p1_nick, u1.tg_photo_file_id as p1_photo,
              u1.first_name as p1_first_name,
              u2.nickname as p2_nick, u2.tg_photo_file_id as p2_photo,
              u2.first_name as p2_first_name
       FROM duels d
       LEFT JOIN users u1 ON d.player1_id = u1.telegram_id
       LEFT JOIN users u2 ON d.player2_id = u2.telegram_id
       WHERE d.id = $1`,
      [duelId]
    );

    if (!duelRes.rows.length) {
      return res.json({ success: false, message: 'Дуэль не найдена' });
    }

    const duel = duelRes.rows[0];
    const questionIds = duel.question_ids || [];

    let questions = [];
    if (questionIds.length > 0) {
      const qRes = await pool.query(
        `SELECT id, text, options FROM questions WHERE id = ANY($1)`,
        [questionIds]
      );
      const qMap = {};
      qRes.rows.forEach(q => {
        qMap[q.id] = {
          id: q.id,
          text: q.text,
          options: parseOptions(q.options)
        };
      });
      questions = questionIds.map(id => qMap[id]).filter(Boolean);
    }

    const answersRes = await pool.query(
      'SELECT * FROM duel_answers WHERE duel_id = $1 ORDER BY round',
      [duelId]
    );

    const isParticipant = String(duel.player1_id) === String(userId) || 
                          (duel.player2_id && String(duel.player2_id) === String(userId));

    res.json({
      success: true,
      isParticipant,
      duel: {
        id: duel.id,
        status: duel.status,
        stake: duel.stake,
        currentRound: duel.current_round || 0,
        score1: duel.score1 || 0,
        score2: duel.score2 || 0,
        winnerId: duel.winner_id,
        player1: { id: duel.player1_id, nick: duel.p1_nick || duel.p1_first_name || 'Игрок 1', photo: duel.p1_photo },
        player2: duel.player2_id ? { id: duel.player2_id, nick: duel.p2_nick || duel.p2_first_name || 'Игрок 2', photo: duel.p2_photo } : null,
        questions,
        answers: answersRes.rows,
        totalRounds: questionIds.length
      }
    });
  } catch (e) {
    console.error('[DUEL] state error:', e);
    res.json({ success: false, message: 'Ошибка получения состояния' });
  }
});

// POST /api/duel/answer
router.post('/api/duel/answer', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userId = req.tgUser.id;
    const duelId = parseInt(req.body.duel_id);
    const round = parseInt(req.body.round);
    const answerIdx = parseInt(req.body.answer_idx);
    const timeMs = parseInt(req.body.time_ms) || 15000;

    // Блокируем дуэль
    const duelRes = await client.query('SELECT * FROM duels WHERE id = $1 FOR UPDATE', [duelId]);
    if (!duelRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Дуэль не найдена' });
    }

    const duel = duelRes.rows[0];
    if (duel.status !== 'active') {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Дуэль не активна' });
    }

    const isPlayer1 = String(duel.player1_id) === String(userId);
    const isPlayer2 = duel.player2_id && String(duel.player2_id) === String(userId);
    if (!isPlayer1 && !isPlayer2) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Вы не участник этой дуэли' });
    }

    // ВАЖНО: current_round в БД = последний ЗАВЕРШЁННЫЙ раунд
    // Принимаем ответ для раунда current_round + 1
    const expectedRound = (duel.current_round || 0) + 1;
    
    if (round !== expectedRound) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Неверный раунд', expectedRound });
    }

    // Получаем вопрос
    const questionIds = duel.question_ids || [];
    const questionId = questionIds[round - 1];
    if (!questionId) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Вопрос не найден' });
    }

    const qRes = await client.query('SELECT correct, options FROM questions WHERE id = $1', [questionId]);
    if (!qRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Вопрос не найден' });
    }

    // Нормализуем options
    const options = parseOptions(qRes.rows[0].options);
    const correctText = qRes.rows[0].correct;
    const correctIndex = options.findIndex(opt => opt === correctText);
    
    const isCorrect = (answerIdx === correctIndex);

    let points = 0;
if (isCorrect) {
  points = 10;
}

    // Сохраняем ответ
    await client.query(
      `INSERT INTO duel_answers (duel_id, user_id, round, answer_idx, correct, time_ms, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (duel_id, user_id, round) DO UPDATE
       SET answer_idx = EXCLUDED.answer_idx,
           correct = EXCLUDED.correct,
           time_ms = EXCLUDED.time_ms,
           points = EXCLUDED.points`,
      [duelId, userId, round, answerIdx, isCorrect, timeMs, points]
    );

    // Проверяем, ответили ли оба
    const answersRes = await client.query(
      'SELECT * FROM duel_answers WHERE duel_id = $1 AND round = $2',
      [duelId, round]
    );

    let bothAnswered = answersRes.rows.length === 2;
    let duelFinished = false;
    let winnerId = null;
    let newScore1 = duel.score1 || 0;
    let newScore2 = duel.score2 || 0;

    if (bothAnswered) {
      const p1Answer = answersRes.rows.find(a => String(a.user_id) === String(duel.player1_id));
      const p2Answer = answersRes.rows.find(a => String(a.user_id) === String(duel.player2_id));

      newScore1 += (p1Answer?.points || 0);
      newScore2 += (p2Answer?.points || 0);

      const totalRounds = questionIds.length;
      
      if (round >= totalRounds) {
        duelFinished = true;
        if (newScore1 > newScore2) {
          winnerId = duel.player1_id;
        } else if (newScore2 > newScore1) {
          winnerId = duel.player2_id;
        }
      }

      let newStatus = duelFinished ? 'finished' : 'active';

      await client.query(
  `UPDATE duels SET 
    current_round = $1, 
    score1 = $2, 
    score2 = $3, 
    status = $4::VARCHAR(20), 
    winner_id = $5, 
    finished_at = CASE WHEN $4 = 'finished' THEN NOW() ELSE NULL END 
  WHERE id = $6`,
  [round, newScore1, newScore2, newStatus, winnerId, duelId]
);

      if (duelFinished) {
        const totalPot = duel.stake * 2;
        const burnAmount = Math.floor(totalPot * 0.05);
        const winAmount = totalPot - burnAmount;

        if (winnerId) {
          await client.query(
            'UPDATE users SET balance = balance + $1, duels_won = duels_won + 1, duels_played = duels_played + 1 WHERE telegram_id = $2', 
            [winAmount, winnerId]
          );
          const loserId = String(winnerId) === String(duel.player1_id) ? duel.player2_id : duel.player1_id;
          await client.query('UPDATE users SET duels_played = duels_played + 1 WHERE telegram_id = $1', [loserId]);
          await client.query(
            'INSERT INTO burn_pool (source, amount, telegram_id) VALUES ($1, $2, $3)', 
            ['duel_burn', burnAmount, winnerId]
          );
        } else {
          await client.query('UPDATE users SET balance = balance + $1, duels_played = duels_played + 1 WHERE telegram_id = $2', [duel.stake, duel.player1_id]);
          await client.query('UPDATE users SET balance = balance + $1, duels_played = duels_played + 1 WHERE telegram_id = $2', [duel.stake, duel.player2_id]);
        }
      }
    }

    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      points,
      isCorrect,
      correctIndex,
      bothAnswered,
      duelFinished,
      winnerId,
      newScore1,
      newScore2,
      currentRound: duelFinished ? round : round
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[DUEL] answer error:', e);
    res.json({ success: false, message: 'Ошибка ответа' });
  } finally {
    client.release();
  }
});

// POST /api/duel/cancel
router.post('/api/duel/cancel', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userId = req.tgUser.id;
    const duelId = parseInt(req.body.duel_id);

    const duelRes = await client.query('SELECT * FROM duels WHERE id = $1 FOR UPDATE', [duelId]);
    if (!duelRes.rows.length) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Дуэль не найдена' });
    }

    const duel = duelRes.rows[0];
    if (duel.status !== 'waiting') {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Дуэль уже началась' });
    }
    if (String(duel.player1_id) !== String(userId)) {
      await client.query('ROLLBACK');
      return res.json({ success: false, message: 'Только создатель может отменить дуэль' });
    }

    await client.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [duel.stake, duel.player1_id]);
    await client.query("UPDATE duels SET status = 'cancelled'::VARCHAR(20) WHERE id = $1", [duelId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Дуэль отменена, ставка возвращена' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[DUEL] cancel error:', e);
    res.json({ success: false, message: 'Ошибка отмены дуэли' });
  } finally {
    client.release();
  }
});

module.exports = router;
