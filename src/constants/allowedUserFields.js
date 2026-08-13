const ALLOWED_USER_FIELDS = new Set([
  'username', 'first_name', 'balance', 'games_today', 'last_game_date',
  'last_super_game_date', 'super_games_total', 'super_game_pending',
  'referrer_id', 'referred_count', 'current_game_index', 'current_game_score',
  'current_question_order', 'current_hints_used', 'current_is_super',
  'question_start_time', 'withdraw_tickets',
  'streak_count', 'last_activity_date', 'daily_question_answered',
  'last_streak_bonus_level',
  'streak_eternal_weeks',
  'recent_questions',
  'games_played_total',
]);

module.exports = { ALLOWED_USER_FIELDS };
