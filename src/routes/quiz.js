const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const config = require('../config');
const { requireInitData, requireInitDataStrict } = require('../middleware/auth');
const { publicRateLimit, authRateLimit, heavyRateLimit } = require('../middleware/rateLimit');
const { getOrCreateUser, saveUser, calcGamesLeft, checkAndResetDailyLimit, todayStr, normalizeDateStr } = require('../services/users');
const { loadQuestionsFromDB, pickGameQuestions, translateQuestion, questionsCache } = require('../services/questions');
const { addToBurnPool, logTx } = require('../services/burn');
const { checkAndUnlockAchievements } = require('../services/achievements');
const { STREAK_TRANSLATIONS } = require('../constants/streakTranslations');
const { ALLOWED_USER_FIELDS } = require('../constants/allowedUserFields');
const { withRetry } = require('../services/burn');
const { generateStreakMilestoneCard } = require('../../channel');

const {
  QUESTIONS_PER_GAME,
  MAX_FREE_GAMES_PER_DAY,
  TOKENS_PER_QUESTION_FREE,
  TOKENS_SUPER_GAME,
} = config;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

router.get('/api/question', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const lang = req.query.lang || 'ru';
    const user = await getOrCreateUser(req.tgUser);
    const freeGamesLeft = calcGamesLeft(user);

    const currentIndex = user.current_game_index || 0;
    const questionOrder = Array.isArray(user.current_question_order) ? user.current_question_order : JSON.parse(user.current_question_order || '[]');

    if (currentIndex >= 0 && currentIndex < QUESTIONS_PER_GAME && questionOrder.length > 0 && !user.super_game_pending) {
      const qIndex = questionOrder[currentIndex];
      if (qIndex !== undefined && questionsCache[qIndex]) {
        const tq = await translateQuestion(questionsCache[qIndex], lang);
        if (!user.question_start_time) {
          await saveUser(userId, { question_start_time: Date.now() });
        }
        return res.json({
          total: QUESTIONS_PER_GAME,
          score: user.current_game_score || 0,
          totalScore: user.balance,
          hintsUsed: user.current_hints_used || [],
          gamesPlayed: user.games_today,
          freeGamesLeft,
          superGamePending: user.super_game_pending || false,
          grantedSuperGames: user.granted_super_games || 0,
          superGamesTotal: user.super_games_total || 0,
          currentIsSuper: user.current_is_super || false,
          streakCount: user.streak_count || 0,
          channelBonusClaimed: !!user.channel_bonus_claimed,
          withdrawTickets: user.withdraw_tickets || 0,
          text: tq.text,
          options: tq.options,
          index: currentIndex,
        });
      }
    }

    if (currentIndex >= QUESTIONS_PER_GAME) {
      const updatedUser = await pool.query('SELECT games_today, extra_games FROM users WHERE telegram_id = $1', [userId]);
      const actualGamesToday = updatedUser.rows[0]?.games_today || 0;
      const actualFreeGamesLeft = Math.max(0, MAX_FREE_GAMES_PER_DAY - actualGamesToday) + (updatedUser.rows[0]?.extra_games || 0);

      return res.json({
        total: QUESTIONS_PER_GAME,
        score: 0,
        totalScore: user.balance,
        gamesPlayed: actualGamesToday,
        freeGamesLeft: actualFreeGamesLeft,
        superGamePending: user.super_game_pending || false,
        grantedSuperGames: user.granted_super_games || 0,
        superGamesTotal: user.super_games_total || 0,
        streakCount: user.streak_count || 0,
        channelBonusClaimed: !!user.channel_bonus_claimed,
        withdrawTickets: user.withdraw_tickets || 0,
        finished: true,
      });
    }

    const isSuperGame = user.super_game_pending || false;
    const isSimpleGame = user.simple_game_pending || false;
    if (isSimpleGame) {
      await saveUser(userId, { simple_game_pending: false });
    }
    if (!isSuperGame && freeGamesLeft <= 0) {
      return res.json({
        finished: true,
        noGamesLeft: true,
        totalScore: user.balance,
        gamesPlayed: user.games_today,
        freeGamesLeft: 0,
        superGamePending: false,
        grantedSuperGames: user.granted_super_games || 0,
        channelBonusClaimed: !!user.channel_bonus_claimed,
        withdrawTickets: user.withdraw_tickets || 0,
      });
    }

    const recentQuestions = user.recent_questions || [];
    const newOrder = await pickGameQuestions(recentQuestions);
    const updatedRecent = [...newOrder, ...recentQuestions].slice(0, 200);
    await saveUser(userId, {
      current_game_index: 0,
      current_game_score: 0,
      current_question_order: JSON.stringify(newOrder),
      current_hints_used: JSON.stringify([]),
      current_is_super: isSuperGame,
      question_start_time: Date.now(),
      super_game_pending: false,
      recent_questions: JSON.stringify(updatedRecent),
    });

    const firstQ = questionsCache[newOrder[0]];
    if (!firstQ) {
      return res.json({ finished: true, score: 0 });
    }

    const tq = await translateQuestion(firstQ, lang);
    res.json({
      total: QUESTIONS_PER_GAME,
      score: 0,
      totalScore: user.balance,
      hintsUsed: [],
      gamesPlayed: user.games_today,
      freeGamesLeft,
      superGamePending: isSuperGame,
      currentIsSuper: isSuperGame,
      superGamesTotal: user.super_games_total || 0,
      streakCount: user.streak_count || 0,
      channelBonusClaimed: !!user.channel_bonus_claimed,
      withdrawTickets: user.withdraw_tickets || 0,
      text: tq.text,
      options: tq.options,
      index: 0,
    });
  } catch (e) {
    console.error('/api/question error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/answer', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.tgUser.id;
    const { answer, lang } = req.body;
    const userLang = lang || 'ru';

    const userRes = await client.query('SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    let user = userRes.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    await checkAndResetDailyLimit(client, user);

    if (answer === 'reset') {
      const currentIsSuper = user.current_is_super || false;
      const isSuperPending = user.super_game_pending || false;
      let gamesToday = user.games_today || 0;
      const gameStarted = (user.current_game_index || 0) > 0 && (user.current_game_index || 0) < QUESTIONS_PER_GAME;

      if (!currentIsSuper && gameStarted) {
        gamesToday += 1;
      }

      const freeGamesLeft = calcGamesLeft({ ...user, games_today: gamesToday });

      if (!isSuperPending && !currentIsSuper && freeGamesLeft <= 0) {
        await client.query('COMMIT');
        return res.json({ noGamesLeft: true, freeGamesLeft: 0, totalScore: user.balance });
      }

      const recentQuestions = user.recent_questions || [];
      const newOrder = await pickGameQuestions(recentQuestions);
      const updatedRecent = [...newOrder, ...recentQuestions].slice(0, 200);
      const keepSuperGamePending = isSuperPending && !gameStarted && !currentIsSuper;

      await client.query(
        `UPDATE users SET
          current_game_index = 0,
          current_game_score = 0,
          current_question_order = $1,
          current_hints_used = $2,
          current_is_super = false,
          question_start_time = 0,
          super_game_pending = $4,
          games_today = $5,
          recent_questions = $6
        WHERE telegram_id = $3`,
        [JSON.stringify(newOrder), JSON.stringify([]), userId, keepSuperGamePending, gamesToday, JSON.stringify(updatedRecent)]
      );
      await client.query('COMMIT');
      return res.json({ reset: true, freeGamesLeft, isSuperGame: keepSuperGamePending });
    }

    const currentIndex = user.current_game_index || 0;
    const questionOrder = Array.isArray(user.current_question_order) ? user.current_question_order : JSON.parse(user.current_question_order || '[]');
    const currentIsSuper = user.current_is_super || false;

    if (currentIndex >= QUESTIONS_PER_GAME || questionOrder.length === 0) {
      await client.query('COMMIT');
      return res.json({ finished: true, score: user.current_game_score || 0, totalScore: user.balance });
    }

    if (Date.now() - (user.question_start_time || 0) < 2000) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Слишком быстро! Прочитай вопрос.' });
    }

    const q = questionsCache[questionOrder[currentIndex]];
    if (!q) {
      const recentQuestions = user.recent_questions || [];
      const newOrder = await pickGameQuestions(recentQuestions);
      const updatedRecent = [...newOrder, ...recentQuestions].slice(0, 200);
      await client.query(
        `UPDATE users SET
          current_game_index = 0,
          current_game_score = 0,
          current_question_order = $1,
          current_hints_used = $2,
          recent_questions = $3
        WHERE telegram_id = $4`,
        [JSON.stringify(newOrder), JSON.stringify([]), JSON.stringify(updatedRecent), userId]
      );
      await client.query('COMMIT');
      return res.json({ finished: true, score: 0, totalScore: user.balance });
    }

    const answerIdx = parseInt(answer);
    let isCorrect = false;
    let correctIndex = -1;
    if (!isNaN(answerIdx)) {
      isCorrect = q.options[answerIdx] === q.correct;
      correctIndex = q.options.findIndex(opt => opt === q.correct);
    } else {
      isCorrect = answer === q.correct;
      correctIndex = q.options.findIndex(opt => opt === q.correct);
    }

    const tokensNow = currentIsSuper ? TOKENS_SUPER_GAME : TOKENS_PER_QUESTION_FREE;
    let newGameScore = (user.current_game_score || 0);
    if (isCorrect) newGameScore += tokensNow;

    const newIndex = currentIndex + 1;
    const isFinished = newIndex >= QUESTIONS_PER_GAME || newIndex >= questionOrder.length;

    let newBalance = user.balance;
    let newGamesToday = user.games_today || 0;
    let superGamePending = user.super_game_pending || false;
    let superGamesTotal = user.super_games_total || 0;
    let withdrawTickets = user.withdraw_tickets || 0;

    if (isFinished) {
      newBalance += newGameScore;
      await logTx(userId, 'quiz_win', newGameScore, 'in');
      if (!currentIsSuper) {
        newGamesToday = newGamesToday + 1;
      } else {
        superGamesTotal = superGamesTotal + 1;
        superGamePending = false;
        if (!user.super_replay_used) {
          withdrawTickets = withdrawTickets + 1;
        }
      }
    }

    const lastActivityStr = normalizeDateStr(user.last_activity_date);
    const isNewDay = lastActivityStr !== todayStr();

    let streakBonus = 0;

    const updates = {
      current_game_index: newIndex,
      current_game_score: newGameScore,
      balance: newBalance,
      games_today: newGamesToday,
      last_game_date: todayStr(),
      super_games_total: superGamesTotal,
      super_game_pending: superGamePending,
      current_is_super: currentIsSuper && !isFinished,
      withdraw_tickets: withdrawTickets,
      games_played_total: isFinished && !currentIsSuper ? (user.games_played_total || 0) + 1 : (user.games_played_total || 0),
    };

    if (isFinished) {
      updates.last_activity_date = todayStr();
      
      let newStreakCount = user.streak_count || 0;
      let lastBonusLevel = user.last_streak_bonus_level || 0;
      let eternalWeeks = user.streak_eternal_weeks || 0;
      
      if (isNewDay) {
        const todayDate = new Date(todayStr());
        todayDate.setDate(todayDate.getDate() - 1);
        const yesterdayStr = todayDate.toISOString().slice(0, 10);
        const lastAct = normalizeDateStr(user.last_activity_date);
        
        if (lastAct !== null && lastAct < yesterdayStr) {
          newStreakCount = 1;
          lastBonusLevel = 0;
          eternalWeeks = 0;
        } else {
          newStreakCount = newStreakCount + 1;
        }
        
        if (newStreakCount >= 30 && lastBonusLevel < 30) {
          streakBonus = 350;
          lastBonusLevel = 30;
        } else if (newStreakCount >= 14 && lastBonusLevel < 14) {
          streakBonus = 150;
          lastBonusLevel = 14;
        } else if (newStreakCount >= 7 && lastBonusLevel < 7) {
          streakBonus = 70;
          lastBonusLevel = 7;
        } else if (newStreakCount >= 3 && lastBonusLevel < 3) {
          streakBonus = 20;
          lastBonusLevel = 3;
        }
        
        if (newStreakCount > 30 && (newStreakCount - 30) % 7 === 0) {
          const weekNumber = Math.floor((newStreakCount - 30) / 7);
          if (weekNumber > eternalWeeks) {
            streakBonus += 50;
            eternalWeeks = weekNumber;
          }
        }
        
        if (streakBonus > 0) {
          newBalance += streakBonus;
          await logTx(userId, 'streak_bonus', streakBonus, 'in');
          updates.balance = newBalance;
        }
      }

      updates.streak_count = newStreakCount;
      updates.last_streak_bonus_level = lastBonusLevel;
      updates.streak_eternal_weeks = eternalWeeks;

      if ([3, 7, 14, 30].includes(newStreakCount)) {
        const streakLang = user.language_code || 'en';
        try {
          const card = await generateStreakMilestoneCard({ streak_count: newStreakCount, language_code: streakLang });
          const _bot = req.app.get('bot');
          await withRetry(() => _bot.telegram.sendPhoto(userId, { source: card }));
        } catch (e) {
          console.warn(`[STREAK] milestone card failed for ${userId}: ${e.message}`);
          const t = STREAK_TRANSLATIONS.milestone[streakLang] || STREAK_TRANSLATIONS.milestone['en'];
          try { await withRetry(() => _bot.telegram.sendMessage(userId, t(newStreakCount))); } catch (e2) {}
        }
      }
    }

    if (!isFinished) {
      updates.question_start_time = Date.now();
    }
    if (isFinished) {
      updates.question_start_time = 0;
    }

    const fields = Object.keys(updates).filter(f => ALLOWED_USER_FIELDS.has(f));
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map(f => updates[f]);
    await client.query(
      `UPDATE users SET ${setClause} WHERE telegram_id = $1`,
      [userId, ...values]
    );

    await client.query('COMMIT');

    checkAndUnlockAchievements(userId, req.app.get('bot')).catch(e => console.error('[ACHIEVEMENTS] check error:', e.message));

    const freeGamesLeft = calcGamesLeft({ ...user, games_today: newGamesToday, extra_games: user.extra_games || 0 });

    // ===== Мультиязычные сообщения =====
const msg = {
  ru: {
    correct: (t, s) => `✅ Правильно! +${t} COGNIQ. Счёт: ${s}`,
    wrong:   (c)   => `❌ Неправильно. Правильный ответ: ${c}.`,
    finished:(s)   => `\n\n🎉 Игра завершена! Ты набрал ${s} COGNIQ.`
  },
  en: {
    correct: (t, s) => `✅ Correct! +${t} COGNIQ. Score: ${s}`,
    wrong:   (c)   => `❌ Wrong. Correct answer: ${c}.`,
    finished:(s)   => `\n\n🎉 Game finished! You scored ${s} COGNIQ.`
  },
  fr: {
    correct: (t, s) => `✅ Correct ! +${t} COGNIQ. Score : ${s}`,
    wrong:   (c)   => `❌ Incorrect. Bonne réponse : ${c}.`,
    finished:(s)   => `\n\n🎉 Partie terminée ! Tu as marqué ${s} COGNIQ.`
  },
  es: {
    correct: (t, s) => `✅ ¡Correcto! +${t} COGNIQ. Puntuación: ${s}`,
    wrong:   (c)   => `❌ Incorrecto. Respuesta correcta: ${c}.`,
    finished:(s)   => `\n\n🎉 ¡Juego terminado! Has conseguido ${s} COGNIQ.`
  }
};

const m = msg[userLang] || msg.ru;

// Берём переведённый правильный ответ
let correctText = q.correct;
if (userLang && userLang !== 'ru') {
  try {
    const tq = await translateQuestion(q, userLang);
    if (tq.options && tq.options[correctIndex] !== undefined) {
      correctText = tq.options[correctIndex];
    }
  } catch (e) {}
}

let message = isCorrect
  ? m.correct(tokensNow, newGameScore)
  : m.wrong(correctText);

if (isFinished) {
  message += m.finished(newGameScore);
}

    const response = {
      correct: isCorrect,
      correctIndex,
      finished: isFinished,
      score: newGameScore,
      totalScore: newBalance,
      gamesPlayed: newGamesToday,
      freeGamesLeft,
      message,
      total: QUESTIONS_PER_GAME,
      superGamePending,
      grantedSuperGames: user.granted_super_games || 0,
      superGamesTotal,
      withdrawTickets,
      wasSuper: currentIsSuper,
      streakBonus: streakBonus || 0,
      streakCount: updates.streak_count || user.streak_count || 0,
    };

    if (!isFinished) {
      const nextQ = questionsCache[questionOrder[newIndex]];
      if (nextQ) {
        const tNextQ = await translateQuestion(nextQ, userLang);
        response.nextQuestion = { text: tNextQ.text, options: tNextQ.options };
        response.nextIndex = newIndex;
      } else {
        response.finished = true;
      }
    }

    res.json(response);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('/api/answer error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/api/use-hint', requireInitDataStrict, authRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.tgUser.id;
    const { hint, lang } = req.body;

    const userRes = await client.query('SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    const user = userRes.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    await checkAndResetDailyLimit(client, user);

    const currentIndex = user.current_game_index || 0;
    const questionOrder = Array.isArray(user.current_question_order) ? user.current_question_order : JSON.parse(user.current_question_order || '[]');
    const hintsUsed = Array.isArray(user.current_hints_used) ? user.current_hints_used : JSON.parse(user.current_hints_used || '[]');

    if (questionOrder.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Нет активной игры' });
    }
    if (currentIndex >= QUESTIONS_PER_GAME) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Викторина завершена' });
    }
    if (hintsUsed.includes(hint)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Подсказка уже использована' });
    }

    const cost = hint === '5050' ? 1 : hint === 'replace' ? 1 : null;
    if (cost === null) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Неизвестная подсказка' });
    }

    const now = new Date();
    const subActive = user.subscription_type && user.subscription_expires_at && new Date(user.subscription_expires_at) > now;
    const dailyHintsFree = subActive && user.subscription_type === 'premium' ? 2 : subActive && user.subscription_type === 'vip' ? 1 : 0;
    const hintsUsedToday = user.daily_hints_used || 0;
    const hasFreeHint = hintsUsedToday < dailyHintsFree;

    if (!hasFreeHint && user.balance < cost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостаточно COGNIQ. Нужно ${cost}` });
    }

    const newBalance = hasFreeHint ? user.balance : user.balance - cost;
    const newHintsUsed = [...hintsUsed, hint];

    if (hint === '5050') {
      const q = questionsCache[questionOrder[currentIndex]];
      if (!q) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Вопрос не найден в кэше' });
      }
      const wrongIndices = [0, 1, 2, 3].filter(i => q.options[i] !== q.correct);
      const removedIndices = shuffleArray(wrongIndices).slice(0, 2);
      await client.query(
        `UPDATE users SET balance = $1, current_hints_used = $2, daily_hints_used = CASE WHEN $4 THEN daily_hints_used + 1 ELSE daily_hints_used END WHERE telegram_id = $3`,
        [newBalance, JSON.stringify(newHintsUsed), userId, hasFreeHint]
      );
      if (!hasFreeHint) {
        await client.query('UPDATE users SET total_burned = total_burned + $1 WHERE telegram_id = $2', [cost, userId]);
        await addToBurnPool('hint', cost, userId);
      }
      await client.query('COMMIT');
      return res.json({ removedIndices, newScore: newBalance });
    } else {
  // Собираем индексы, которые уже были в этой игре
  const usedInGame = new Set(questionOrder);

  // Ищем свободные вопросы из всего кэша
  const available = [];
  for (let i = 0; i < questionsCache.length; i++) {
    if (!usedInGame.has(i)) available.push(i);
  }

  const userLang = lang || 'ru';

  if (available.length === 0) {
    await client.query('ROLLBACK');
    return res.status(400).json({ 
      error: userLang === 'en' ? 'No questions available for replacement' :
             userLang === 'fr' ? 'Aucune question disponible pour le remplacement' :
             userLang === 'es' ? 'No hay preguntas disponibles para reemplazar' :
             'Нет вопросов для замены' 
    });
  }

  // Берём случайный новый вопрос
  const newQIndex = available[Math.floor(Math.random() * available.length)];
  const newOrder = [...questionOrder];
  newOrder[currentIndex] = newQIndex;
  
  const newQ = questionsCache[newQIndex];
  const translatedQ = await translateQuestion(newQ, userLang);

      await client.query(
        `UPDATE users SET balance = $1, current_question_order = $2, current_hints_used = $3, daily_hints_used = CASE WHEN $5 THEN daily_hints_used + 1 ELSE daily_hints_used END WHERE telegram_id = $4`,
        [newBalance, JSON.stringify(newOrder), JSON.stringify(newHintsUsed), userId, hasFreeHint]
      );
      if (!hasFreeHint) {
        await client.query('UPDATE users SET total_burned = total_burned + $1 WHERE telegram_id = $2', [cost, userId]);
        await addToBurnPool('hint', cost, userId);
      }
      await client.query('COMMIT');
      return res.json({
        newQuestion: { text: translatedQ.text, options: translatedQ.options },
        newScore: newBalance,
      });
    }
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('/api/use-hint error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/api/replay-super', requireInitData, heavyRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.tgUser.id;

    const userRes = await client.query(
      'SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE',
      [userId]
    );
    const user = userRes.rows[0];

    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.super_replay_used) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'replayAlreadyUsed' });
    }

    if (user.balance < 50) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'notEnoughTokens' });
    }

    const newBalance = user.balance - 50;
    const newOrder = await pickGameQuestions();

    await client.query(
      `UPDATE users SET
        balance = $1,
        current_game_index = 0,
        current_game_score = 0,
        current_question_order = $2,
        current_hints_used = $3,
        current_is_super = true,
        question_start_time = 0,
        super_replay_used = true,
        total_burned = total_burned + 50
      WHERE telegram_id = $4`,
      [newBalance, JSON.stringify(newOrder), JSON.stringify([]), userId]
    );
    await addToBurnPool('super_retry', 50, userId);

    await client.query('COMMIT');
    res.json({ ok: true, newBalance });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('/api/replay-super error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Здесь будут /api/answer, /api/use-hint, /api/replay-super
// Пока вырежи их из index.js и вставь сюда

module.exports = router;
