const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireInitData, requireInitDataStrict } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimit');

// Получить 10 случайных вопросов для дуэли
async function getDuelQuestions() {
  const res = await pool.query(
    'SELECT id FROM questions ORDER BY RANDOM() LIMIT 10'
  );
  return res.rows.map(r => r.id);
}

// POST /api/duel/create — создать дуэль (лобби)
router.post('/api/duel/create', requireInitDataStrict, authRateLimit, async (req, res) => {
  try {
    const userId = req.body.user_id;
    const stake = parseInt(req.body.stake) || 100;
    
    if (![100, 500, 1000].includes(stake)) {
      return res.json({ success: false, message: 'Недопустимая ставка' });
    }

    // Проверяем баланс
    const userRes = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [userId]);
    if (!userRes.rows.length || userRes.rows[0].balance < stake) {
      return res.json({ success: false, message: 'Недостаточно COGNIQ' });
    }

    // Списываем ставку
    await pool.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [stake, userId]);

    // Создаём дуэль
    const questionIds = await getDuelQuestions();
    const duelRes = await pool.query(
      `INSERT INTO duels (player1_id, stake, question_ids, status)
       VALUES ($1, $2, $3, 'waiting')
       RETURNING id`,
      [userId, stake, JSON.stringify(questionIds)]
    );

    res.json({
      success: true,
      duelId: duelRes.rows[0].id,
      stake,
      inviteLink: `https://t.me/NeuronEcosystemBot?start=duel_${duelRes.rows[0].id}`
    });
  } catch (e) {
    console.error('[DUEL] create error:', e);
    res.json({ success: false, message: 'Ошибка создания дуэли' });
  }
});

// POST /api/duel/join — принять дуэль
router.post('/api/duel/join', requireInitDataStrict, authRateLimit, async (req, res) => {
  try {
    const userId = req.body.user_id;
    const duelId = parseInt(req.body.duel_id);

    // Получаем дуэль
    const duelRes = await pool.query('SELECT * FROM duels WHERE id = $1', [duelId]);
    if (!duelRes.rows.length) {
      return res.json({ success: false, message: 'Дуэль не найдена' });
    }

    const duel = duelRes.rows[0];
    if (duel.status !== 'waiting') {
      return res.json({ success: false, message: 'Дуэль уже начата' });
    }

    if (duel.player1_id == userId) {
      return res.json({ success: false, message: 'Нельзя играть с самим собой' });
    }

    // Проверяем баланс
    const userRes = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [userId]);
    if (!userRes.rows.length || userRes.rows[0].balance < duel.stake) {
      return res.json({ success: false, message: 'Недостаточно COGNIQ' });
    }

    // Списываем ставку у второго игрока
    await pool.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [duel.stake, userId]);

    // Обновляем дуэль
    await pool.query(
      'UPDATE duels SET player2_id = $1, status = $2 WHERE id = $3',
      [userId, 'active', duelId]
    );

    res.json({ success: true, duelId });
  } catch (e) {
    console.error('[DUEL] join error:', e);
    res.json({ success: false, message: 'Ошибка присоединения' });
  }
});

// GET /api/duel/state — состояние дуэли (для поллинга)
router.get('/api/duel/state', requireInitData, authRateLimit, async (req, res) => {
  try {
    const userId = req.query.user_id;
    const duelId = parseInt(req.query.duel_id);

    const duelRes = await pool.query(
      `SELECT d.*, 
              u1.nickname as p1_nick, u1.tg_photo_file_id as p1_photo,
              u2.nickname as p2_nick, u2.tg_photo_file_id as p2_photo
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

    // Получаем вопросы
    let questions = [];
    if (questionIds.length > 0) {
      const qRes = await pool.query(
        `SELECT id, text, options, correct FROM questions WHERE id = ANY($1)`,
        [questionIds]
      );
      questions = qRes.rows;
    }

    // Получаем ответы обоих игроков
    const answersRes = await pool.query(
      'SELECT * FROM duel_answers WHERE duel_id = $1 ORDER BY round',
      [duelId]
    );

    res.json({
      success: true,
      duel: {
        id: duel.id,
        status: duel.status,
        stake: duel.stake,
        currentRound: duel.current_round,
        score1: duel.score1,
        score2: duel.score2,
        winnerId: duel.winner_id,
        player1: { id: duel.player1_id, nick: duel.p1_nick, photo: duel.p1_photo },
        player2: duel.player2_id ? { id: duel.player2_id, nick: duel.p2_nick, photo: duel.p2_photo } : null,
        questions,
        answers: answersRes.rows
      }
    });
  } catch (e) {
    console.error('[DUEL] state error:', e);
    res.json({ success: false, message: 'Ошибка получения состояния' });
  }
});

// POST /api/duel/answer — отправить ответ
router.post('/api/duel/answer', requireInitDataStrict, authRateLimit, async (req, res) => {
  try {
    const userId = req.body.user_id;
    const duelId = parseInt(req.body.duel_id);
    const round = parseInt(req.body.round);
    const answerIdx = parseInt(req.body.answer_idx);
    const timeMs = parseInt(req.body.time_ms) || 0;

    // Получаем дуэль
    const duelRes = await pool.query('SELECT * FROM duels WHERE id = $1', [duelId]);
    if (!duelRes.rows.length) {
      return res.json({ success: false, message: 'Дуэль не найдена' });
    }

    const duel = duelRes.rows[0];
    if (duel.status !== 'active') {
      return res.json({ success: false, message: 'Дуэль не активна' });
    }

    if (round !== duel.current_round + 1) {
      return res.json({ success: false, message: 'Неверный раунд' });
    }

    // Получаем вопрос
    const questionIds = duel.question_ids || [];
    const questionId = questionIds[round - 1];
    if (!questionId) {
      return res.json({ success: false, message: 'Вопрос не найден' });
    }

    const qRes = await pool.query('SELECT correct FROM questions WHERE id = $1', [questionId]);
    if (!qRes.rows.length) {
      return res.json({ success: false, message: 'Вопрос не найден' });
    }

    const correct = qRes.rows[0].correct;
    const isCorrect = answerIdx === correct;

    // Считаем очки: правильный ответ + бонус за скорость
    let points = 0;
    if (isCorrect) {
      points = 10 + Math.max(0, Math.floor((15000 - timeMs) / 1000)); // базовые 10 + бонус за время
    }

    // Сохраняем ответ
    await pool.query(
      `INSERT INTO duel_answers (duel_id, user_id, round, answer_idx, correct, time_ms, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (duel_id, user_id, round) DO NOTHING`,
      [duelId, userId, round, answerIdx, isCorrect, timeMs, points]
    );

    // Проверяем, ответили ли оба игрока
    const answersRes = await pool.query(
      'SELECT * FROM duel_answers WHERE duel_id = $1 AND round = $2',
      [duelId, round]
    );

    if (answersRes.rows.length === 2) {
      // Оба ответили — обновляем счёт
      const p1Answer = answersRes.rows.find(a => a.user_id == duel.player1_id);
      const p2Answer = answersRes.rows.find(a => a.user_id == duel.player2_id);

      const newScore1 = duel.score1 + (p1Answer?.points || 0);
      const newScore2 = duel.score2 + (p2Answer?.points || 0);
      const newRound = round;

      // Проверяем, закончилась ли дуэль
      let newStatus = 'active';
      let winnerId = null;

      if (newRound >= (duel.question_ids || []).length) {
        // Дуэль окончена
        newStatus = 'finished';
        if (newScore1 > newScore2) {
          winnerId = duel.player1_id;
        } else if (newScore2 > newScore1) {
          winnerId = duel.player2_id;
        } else {
          // Ничья — возврат ставок
          await pool.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [duel.stake, duel.player1_id]);
          await pool.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [duel.stake, duel.player2_id]);
        }
      }

      await pool.query(
        `UPDATE duels SET current_round = $1, score1 = $2, score2 = $3, status = $4, winner_id = $5, finished_at = CASE WHEN $4 = 'finished' THEN NOW() ELSE finished_at END WHERE id = $6`,
        [newRound, newScore1, newScore2, newStatus, winnerId, duelId]
      );

      // Если дуэль окончена и есть победитель — выплачиваем выигрыш
      if (newStatus === 'finished' && winnerId) {
        const totalPot = duel.stake * 2;
        const burnAmount = Math.floor(totalPot * 0.05); // 5% сжигается
        const winAmount = totalPot - burnAmount;

        await pool.query('UPDATE users SET balance = balance + $1, duels_won = duels_won + 1, duels_played = duels_played + 1 WHERE telegram_id = $2', [winAmount, winnerId]);
        
        // Обновляем статистику проигравшего
        const loserId = winnerId == duel.player1_id ? duel.player2_id : duel.player1_id;
        await pool.query('UPDATE users SET duels_played = duels_played + 1 WHERE telegram_id = $1', [loserId]);

        // Записываем burn
        await pool.query('INSERT INTO burn_pool (source, amount, telegram_id) VALUES ($1, $2, $3)', ['duel_burn', burnAmount, winnerId]);
      }
    }

    res.json({ success: true, points });
  } catch (e) {
    console.error('[DUEL] answer error:', e);
    res.json({ success: false, message: 'Ошибка ответа' });
  }
});

module.exports = router;
