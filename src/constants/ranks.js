const RANKS = [
  { min: 200000, emoji: '👑', ru: 'Легенда', en: 'Legend', fr: 'Légende', es: 'Leyenda' },
  { min: 50000,  emoji: '🎓', ru: 'Мастер',  en: 'Master', fr: 'Maître',  es: 'Maestro' },
  { min: 10000,  emoji: '🔬', ru: 'Эксперт', en: 'Expert', fr: 'Expert',  es: 'Experto' },
  { min: 1000,   emoji: '📚', ru: 'Знаток',  en: 'Scholar', fr: 'Érudit',  es: 'Erudito' },
  { min: 0,      emoji: '🧠', ru: 'Новичок', en: 'Novice', fr: 'Novice',  es: 'Novato' },
];

function getUserRank(balance, lang = 'en') {
  const rank = RANKS.find(r => balance >= r.min);
  return {
    emoji: rank.emoji,
    title: rank[lang] || rank['en'],
  };
}

module.exports = { RANKS, getUserRank };
