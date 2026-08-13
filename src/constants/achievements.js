const ACHIEVEMENTS = [
  { key: 'streak_3',      emoji: '🔥', image: '/streak3.png',      bonus: 0,   condition: (u) => u.streak_count >= 3 },
  { key: 'streak_7',      emoji: '🔥', image: '/streak7.png',      bonus: 0,   condition: (u) => u.streak_count >= 7 },
  { key: 'streak_30',     emoji: '⚡', image: '/streak30.png',     bonus: 0,   condition: (u) => u.streak_count >= 30 },
  { key: 'top3',          emoji: '🏆', image: '/top3.png',         bonus: 200, condition: (u) => u.leaderboard_rank && u.leaderboard_rank <= 3 },
  { key: 'referral_1',    emoji: '👥', image: '/referral1.png',    bonus: 50,  condition: (u) => u.referred_count >= 1 },
  { key: 'referral_5',    emoji: '👥', image: '/referral5.png',    bonus: 200, condition: (u) => u.referred_count >= 5 },
  { key: 'balance_1000',  emoji: '🪙', image: '/balance1000.png',  bonus: 50,  condition: (u) => u.balance >= 1000 },
  { key: 'balance_10000', emoji: '💎', image: '/balance10000.png', bonus: 300, condition: (u) => u.balance >= 10000 },
  { key: 'supergame_1',   emoji: '🎮', image: '/supergame1.png',   bonus: 50,  condition: (u) => u.super_games_total >= 1 },
  { key: 'games_100',     emoji: '🧠', image: '/games100.png',     bonus: 100, condition: (u) => u.games_played_total >= 100 },
];

const ACHIEVEMENT_TITLES = {
  streak_3:     { ru: 'Стрик 3 дня',       en: '3-Day Streak',       fr: 'Série de 3 jours',       es: 'Racha de 3 días' },
  streak_7:     { ru: 'Стрик 7 дней',      en: '7-Day Streak',       fr: 'Série de 7 jours',       es: 'Racha de 7 días' },
  streak_30:    { ru: 'Стрик 30 дней',     en: '30-Day Streak',      fr: 'Série de 30 jours',      es: 'Racha de 30 días' },
  top3:         { ru: 'Топ-3 лидерборда',  en: 'Top-3 Leaderboard',  fr: 'Top-3 du classement',   es: 'Top-3 de la clasificación' },
  referral_1:   { ru: 'Первый реферал',    en: 'First Referral',     fr: 'Premier parrainage',     es: 'Primer referido' },
  referral_5:   { ru: '5 рефералов',       en: '5 Referrals',        fr: '5 parrainages',          es: '5 referidos' },
  balance_1000: { ru: '1000 COGNIQ',       en: '1000 COGNIQ',        fr: '1000 COGNIQ',            es: '1000 COGNIQ' },
  balance_10000:{ ru: '10000 COGNIQ',      en: '10000 COGNIQ',       fr: '10000 COGNIQ',           es: '10000 COGNIQ' },
  supergame_1:  { ru: 'Первая супер-игра', en: 'First Super Game',   fr: 'Première super partie',  es: 'Primer super juego' },
  games_100:    { ru: '100 игр сыграно',   en: '100 Games Played',   fr: '100 parties jouées',     es: '100 partidas jugadas' },
};

const ACHIEVEMENT_UNLOCK_PREFIX = {
  ru: '🏆 Достижение разблокировано',
  en: '🏆 Achievement unlocked',
  fr: '🏆 Succès débloqué',
  es: '🏆 Logro desbloqueado',
};

module.exports = { ACHIEVEMENTS, ACHIEVEMENT_TITLES, ACHIEVEMENT_UNLOCK_PREFIX };
