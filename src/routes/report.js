const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireInitData } = require('../middleware/auth');
const { publicRateLimit } = require('../middleware/rateLimit');

const RANK_TITLES = {
  ru: [
    { min: 200000, emoji: '👑', title: 'Легенда' },
    { min: 50000, emoji: '🎓', title: 'Мастер' },
    { min: 10000, emoji: '🔬', title: 'Эксперт' },
    { min: 1000, emoji: '📚', title: 'Знаток' },
    { min: 0, emoji: '🧠', title: 'Новичок' }
  ],
  en: [
    { min: 200000, emoji: '👑', title: 'Legend' },
    { min: 50000, emoji: '🎓', title: 'Master' },
    { min: 10000, emoji: '🔬', title: 'Expert' },
    { min: 1000, emoji: '📚', title: 'Scholar' },
    { min: 0, emoji: '🧠', title: 'Novice' }
  ],
  fr: [
    { min: 200000, emoji: '👑', title: 'Légende' },
    { min: 50000, emoji: '🎓', title: 'Maître' },
    { min: 10000, emoji: '🔬', title: 'Expert' },
    { min: 1000, emoji: '📚', title: 'Érudit' },
    { min: 0, emoji: '🧠', title: 'Novice' }
  ],
  es: [
    { min: 200000, emoji: '👑', title: 'Leyenda' },
    { min: 50000, emoji: '🎓', title: 'Maestro' },
    { min: 10000, emoji: '🔬', title: 'Experto' },
    { min: 1000, emoji: '📚', title: 'Erudito' },
    { min: 0, emoji: '🧠', title: 'Novato' }
  ]
};

function getRank(balance, lang) {
  const titles = RANK_TITLES[lang] || RANK_TITLES.en;
  for (const rank of titles) {
    if (balance >= rank.min) {
      return { emoji: rank.emoji, title: rank.title };
    }
  }
  return { emoji: '🧠', title: 'Novice' };
}

// GET /api/weekly-report
router.get('/api/weekly-report', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const lang = ['ru', 'en', 'fr', 'es'].includes(req.query.lang) ? req.query.lang : 'en';
    
    // ==================== ВИКТОРИНЫ ====================
    const quizRes = await pool.query(
      `SELECT COUNT(*) as games_count, COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END), 0) as earned
       FROM transactions 
       WHERE user_id = $1 AND type = 'quiz_win' 
       AND created_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    // ==================== ДУЭЛИ ====================
    const duelsRes = await pool.query(
      `SELECT 
        COUNT(*) as total_duels,
        COUNT(*) FILTER (WHERE winner_id = $1) as won_duels
       FROM duels 
       WHERE (player1_id = $1 OR player2_id = $1) 
       AND status = 'finished' 
       AND finished_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    // ==================== ШАХМАТЫ ====================
    const chessRes = await pool.query(
      `SELECT 
        COUNT(*) as total_chess,
        COUNT(*) FILTER (WHERE winner_id = $1) as won_chess
       FROM chess_games 
       WHERE (player1_id = $1 OR player2_id = $1) 
       AND status = 'finished' 
       AND finished_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    // ==================== COGNIQ ====================
    const cogniqRes = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END), 0) as earned,
        COALESCE(SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END), 0) as spent
       FROM transactions 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    const burnedRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as burned
       FROM burn_pool 
       WHERE telegram_id = $1 
       AND created_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    // ==================== IMPULSE ====================
    const impulseRes = await pool.query(
      `SELECT 
        COUNT(*) as bets_count,
        COALESCE(SUM(CASE WHEN win_amount > 0 THEN win_amount ELSE 0 END), 0) as won,
        COALESCE(SUM(CASE WHEN win_amount = 0 THEN bet_amount ELSE 0 END), 0) as lost
       FROM casino_spins 
       WHERE telegram_id = $1 
       AND created_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    // ==================== ДОСТИЖЕНИЯ ====================
    const achievementsRes = await pool.query(
      `SELECT COUNT(*) as new_achievements
       FROM achievements 
       WHERE user_id = $1 
       AND unlocked_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    // ==================== РАНГ ====================
    const rankRes = await pool.query(
      `SELECT balance FROM users WHERE telegram_id = $1`,
      [userId]
    );
    const balance = rankRes.rows[0]?.balance || 0;
    const rank = getRank(balance, lang);
    
    res.json({
      success: true,
      quiz: {
        games: parseInt(quizRes.rows[0].games_count),
        earned: parseInt(quizRes.rows[0].earned)
      },
      duels: {
        total: parseInt(duelsRes.rows[0].total_duels),
        won: parseInt(duelsRes.rows[0].won_duels)
      },
      chess: {
        total: parseInt(chessRes.rows[0].total_chess),
        won: parseInt(chessRes.rows[0].won_chess)
      },
      cogniq: {
        earned: parseInt(cogniqRes.rows[0].earned),
        spent: parseInt(cogniqRes.rows[0].spent),
        burned: parseInt(burnedRes.rows[0].burned)
      },
      impulse: {
        bets: parseInt(impulseRes.rows[0].bets_count),
        won: parseInt(impulseRes.rows[0].won),
        lost: parseInt(impulseRes.rows[0].lost)
      },
      achievements: {
        new: parseInt(achievementsRes.rows[0].new_achievements)
      },
      rank: {
        emoji: rank.emoji,
        title: rank.title,
        balance: balance
      }
    });
    
  } catch (e) {
    console.error('[REPORT] error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
