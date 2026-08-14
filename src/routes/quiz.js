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
          superGamesTotal: user.super_games_total || 0,
          currentIsSuper: user.current_is_super || false,
          streakCount: user.streak_count || 0,
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
        superGamesTotal: user.super_games_total || 0,
        streakCount: user.streak_count || 0,
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
      text: tq.text,
      options: tq.options,
      index: 0,
    });
  } catch (e) {
    console.error('/api/question error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Здесь будут /api/answer, /api/use-hint, /api/replay-super
// Пока вырежи их из index.js и вставь сюда

module.exports = router;
