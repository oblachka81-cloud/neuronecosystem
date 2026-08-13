const STREAK_TRANSLATIONS = {
  warning: {
    ru: (n) => `🔥 Твой стрик ${n} дней под угрозой!\nСыграй сегодня — не теряй серию. 🧠`,
    en: (n) => `🔥 Your ${n}-day streak is at risk!\nPlay today — don't lose your streak. 🧠`,
    fr: (n) => `🔥 Ta série de ${n} jours est en danger !\nJoue aujourd'hui — ne la perds pas. 🧠`,
    es: (n) => `🔥 ¡Tu racha de ${n} días está en riesgo!\nJuega hoy — no pierdas tu racha. 🧠`,
  },
  milestone: {
    ru: (n) => `🏆 ${n} дней подряд! Ты на огне — держи темп! 🔥`,
    en: (n) => `🏆 ${n} days in a row! You're on fire — keep it up! 🔥`,
    fr: (n) => `🏆 ${n} jours d'affilée ! Tu es en feu — continue ! 🔥`,
    es: (n) => `🏆 ¡${n} días seguidos! ¡Estás en llamas — sigue así! 🔥`,
  },
};

module.exports = { STREAK_TRANSLATIONS };
