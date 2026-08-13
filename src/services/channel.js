const pool = require('../db/pool');
const { ACHIEVEMENTS, ACHIEVEMENT_TITLES } = require('../constants/achievements');
const { RANKS } = require('../constants/ranks');
const { STREAK_TRANSLATIONS } = require('../constants/streakTranslations');
const { withRetry } = require('./burn');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function postDailyQuestion(bot, botUsername) {
  try {
    const today = todayStr();
    const already = await pool.query('SELECT id FROM daily_questions WHERE posted_date = $1', [today]);
    if (already.rows.length > 0) return;

    const result = await pool.query(
      `WITH last_used AS (
         SELECT question_id FROM daily_questions ORDER BY posted_date DESC LIMIT 7
       )
       SELECT q.* FROM questions q
       WHERE q.id NOT IN (SELECT question_id FROM last_used)
       ORDER BY RANDOM()
       LIMIT 1`
    );
    if (!result.rows.length) return;

    const q = result.rows[0];
    const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    const tr = q.translations || {};

    const langs = [
      { code: 'en', question: tr.en?.text || q.text, options: tr.en?.options || opts, btnText: '🔥 Answer the question' },
      { code: 'fr', question: tr.fr?.text || q.text, options: tr.fr?.options || opts, btnText: '🔥 Répondre à la question' },
      { code: 'es', question: tr.es?.text || q.text, options: tr.es?.options || opts, btnText: '🔥 Responder a la pregunta' },
      { code: 'ru', question: q.text, options: opts, btnText: '🔥 Ответить на вопрос' },
    ];

    for (const lang of langs) {
      try {
        const card = await generateQuestionOfDayCard({ question: lang.question, options: lang.options, date: today, language_code: lang.code });
        await withRetry(() => bot.telegram.sendPhoto(process.env.CHANNEL_ID, { source: card }, { reply_markup: { inline_keyboard: [[{ text: lang.btnText, url: `https://t.me/${botUsername}?start=daily` }]] } }));
        await new Promise(r => setTimeout(r, 5000));
      } catch (e) { console.error(`[DAILY] Ошибка карточки ${lang.code}:`, e.message); }
    }

    await pool.query('INSERT INTO daily_questions (question_id, posted_date) VALUES ($1, $2)', [q.id, today]);
    console.log(`[DAILY] Вопрос дня опубликован: id=${q.id}`);
  } catch (e) { console.error('[DAILY] Ошибка публикации вопроса дня:', e.message); }
}

async function postWeeklyTop(bot, botUsername) {
  try {
    const { rows } = await pool.query(
      `SELECT telegram_id, first_name, nickname, privacy_mode, balance FROM users ORDER BY balance DESC LIMIT 5`
    );
    if (!rows.length) return;
    if (rows.length > 0) {
      const winnerId = rows[0].telegram_id;
      await pool.query(`UPDATE users SET avatar_frame = NULL WHERE avatar_frame = 'frame_neon_gold' AND telegram_id != $1`, [winnerId]);
      await pool.query(`DELETE FROM shop_purchases WHERE item_key = 'frame_neon_gold' AND user_id != $1`, [winnerId]);
      await pool.query(`UPDATE users SET avatar_frame = 'frame_neon_gold' WHERE telegram_id = $1`, [winnerId]);
      await pool.query(
        `INSERT INTO shop_purchases (user_id, item_key, price_amount, price_currency) VALUES ($1, 'frame_neon_gold', 0, 'reward') ON CONFLICT DO NOTHING`,
        [winnerId]
      );
    }

    const card = await generateWeeklyTopCard(rows);
    await withRetry(() => bot.telegram.sendPhoto(process.env.CHANNEL_ID, { source: card }, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🕹️ Играть / Play / Jouer / Jugar', url: `https://t.me/${botUsername}?start=weeklytop` }
        ]]
      }
    }));
    console.log(`[WEEKLY] Топ недели опубликован`);
  } catch (e) {
    console.error('[WEEKLY] postWeeklyTop error:', e.message);
  }
}

async function sendStreakWarnings(bot) {
  try {
    const { rows } = await pool.query(
      `SELECT telegram_id, streak_count, language_code
       FROM users
       WHERE last_activity_date = CURRENT_DATE - INTERVAL '1 day'
         AND streak_count > 0`
    );
    console.log(`[STREAK] Проверка угрозы стрика: ${rows.length} пользователей`);

    for (const user of rows) {
      try {
        const card = await generateStreakWarningCard({
          streak_count: user.streak_count,
          language_code: user.language_code,
        });
        await bot.telegram.sendPhoto(user.telegram_id, { source: card });
      } catch (err) {
        console.error(`Streak card error for ${user.telegram_id}:`, err.message);
        const lang = user.language_code || 'en';
        const warnText = STREAK_TRANSLATIONS.warning[lang] || STREAK_TRANSLATIONS.warning['en'];
        try { await bot.telegram.sendMessage(user.telegram_id, warnText(user.streak_count)); } catch (e2) {}
      }
    }
  } catch (e) {
    console.error('[STREAK] sendStreakWarnings error:', e.message);
  }
}

async function postWeeklyAchievements(bot, botUsername) {
  try {
    const { rows } = await pool.query(`
      SELECT a.achievement_key, u.telegram_id, u.first_name, u.nickname, u.privacy_mode, u.language_code
      FROM achievements a JOIN users u ON u.telegram_id = a.user_id
      WHERE a.unlocked_at >= NOW() - INTERVAL '7 days'
      ORDER BY a.unlocked_at DESC LIMIT 10
    `);
    if (!rows.length) return;
    const seen = new Set();
    const heroes = rows
      .filter(r => {
        if (seen.has(r.telegram_id)) return false;
        seen.add(r.telegram_id);
        return true;
      })
      .slice(0, 3)
      .map(r => ({
        telegram_id: r.telegram_id, first_name: r.first_name, nickname: r.nickname,
        privacy_mode: r.privacy_mode,
        achievement_emoji: ACHIEVEMENTS.find(a => a.key === r.achievement_key)?.emoji || '🏅',
        achievement_name: ACHIEVEMENT_TITLES[r.achievement_key]?.ru || r.achievement_key,
      }));
    try {
      const card = await generateWeeklyHeroesCard(heroes);
      await withRetry(() => bot.telegram.sendPhoto(process.env.CHANNEL_ID, { source: card }, {
        reply_markup: { inline_keyboard: [[{ text: '🕹️ Играть / Play / Jouer / Jugar', url: `https://t.me/${botUsername}?start=achievements` }]] }
      }));
    } catch (e) { console.error('[CHANNEL] postWeeklyAchievements card error:', e.message); }
    console.log('[CHANNEL] postWeeklyAchievements');
  } catch (e) { console.error('[CHANNEL] postWeeklyAchievements error:', e.message); }
}

async function postStreakBattle(bot, botUsername) {
  try {
    const { rows } = await pool.query(`
      SELECT telegram_id, first_name, nickname, privacy_mode, streak_count AS streak
      FROM users WHERE last_activity_date >= CURRENT_DATE - INTERVAL '7 days' AND streak_count > 0
      ORDER BY streak_count DESC LIMIT 5
    `);
    if (!rows.length) return;
    try {
      const card = await generateStreakBattleCard(rows, 'en');
      await withRetry(() => bot.telegram.sendPhoto(process.env.CHANNEL_ID, { source: card }, {
        reply_markup: { inline_keyboard: [[{ text: '🕹️ Играть / Play / Jouer / Jugar', url: `https://t.me/${botUsername}?start=streakbattle` }]] }
      }));
    } catch (e) { console.error('[CHANNEL] postStreakBattle card error:', e.message); }
    console.log('[CHANNEL] postStreakBattle');
  } catch (e) { console.error('[CHANNEL] postStreakBattle error:', e.message); }
}

async function postDailyFact(bot) {
  try {
    const { rows } = await pool.query(`SELECT text, correct FROM questions ORDER BY RANDOM() LIMIT 1`);
    if (!rows.length) return;
    const q = rows[0];
    const today = todayStr();
    try {
      const card = await generateFactOfDayCard({ question: q.text, correct_answer: q.correct, date: today });
      await withRetry(() => bot.telegram.sendPhoto(process.env.CHANNEL_ID, { source: card }));
    } catch (e) { console.error('[CHANNEL] postDailyFact card error:', e.message); }
    console.log('[CHANNEL] postDailyFact');
  } catch (e) { console.error('[CHANNEL] postDailyFact error:', e.message); }
}

async function postRankLeaderboard(bot, botUsername) {
  try {
    const { rows } = await pool.query(`SELECT balance FROM users`);
    if (!rows.length) return;
    const rankColors = ['#ffcc00', '#a855f7', '#3b82f6', '#00ffff', '#00ffaa'];
    const rankCounts = RANKS.map((rank, i) => ({
      rank: rank.ru, emoji: rank.emoji,
      count: rows.filter(r => {
        const max = i === 0 ? Infinity : RANKS[i - 1].min;
        return r.balance >= rank.min && r.balance < max;
      }).length,
      color: rankColors[i] || '#a855f7',
    }));
    try {
      const card = await generateRankRatingCard(rankCounts, 'en');
      await withRetry(() => bot.telegram.sendPhoto(process.env.CHANNEL_ID, { source: card }, {
        reply_markup: { inline_keyboard: [[{ text: '🕹️ Играть / Play / Jouer / Jugar', url: `https://t.me/${botUsername}?start=ranks` }]] }
      }));
    } catch (e) { console.error('[CHANNEL] postRankLeaderboard card error:', e.message); }
    console.log('[CHANNEL] postRankLeaderboard');
  } catch (e) { console.error('[CHANNEL] postRankLeaderboard error:', e.message); }
}

async function postDailyPoll(bot) {
  try {
    const { rows } = await pool.query(
      `SELECT id, text, options, correct, translations FROM questions ORDER BY RANDOM() LIMIT 1`
    );
    if (!rows.length) return;
    const q = rows[0];
    const tr = typeof q.translations === 'string' ? JSON.parse(q.translations) : (q.translations || {});
    const optsRu = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    const correctIdx = optsRu.indexOf(q.correct);
    if (correctIdx === -1) return;

    const langs = ['ru', 'en', 'fr', 'es'];
    for (const lang of langs) {
      try {
        let pollText, pollOptions, correctOptionId;
        if (lang === 'ru') {
          pollText = q.text;
          pollOptions = optsRu;
          correctOptionId = correctIdx;
        } else {
          const trLang = tr[lang];
          if (!trLang) continue;
          pollText = trLang.text;
          if (!pollText) continue;
          pollOptions = trLang.options ? (typeof trLang.options === 'string' ? JSON.parse(trLang.options) : trLang.options) : null;
          if (!pollOptions || !pollOptions.length) continue;
          const correctTranslated = trLang.correct || (trLang.options && pollOptions[correctIdx]);
          correctOptionId = correctTranslated ? pollOptions.indexOf(correctTranslated) : correctIdx;
          if (correctOptionId === -1) correctOptionId = correctIdx;
          if (correctOptionId >= pollOptions.length) continue;
        }
        await withRetry(() =>
          bot.telegram.sendPoll(process.env.CHANNEL_ID, pollText, pollOptions, {
            type: 'quiz',
            correct_option_id: correctOptionId,
            is_anonymous: true,
          })
        );
        console.log(`[CHANNEL] postDailyPoll sent [${lang}]`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (langErr) {
        console.error(`[CHANNEL] postDailyPoll error [${lang}]:`, langErr.message);
      }
    }
  } catch (e) {
    console.error('[CHANNEL] postDailyPoll error:', e.message);
  }
}

module.exports = {
  postDailyQuestion,
  postWeeklyTop,
  sendStreakWarnings,
  postWeeklyAchievements,
  postStreakBattle,
  postDailyFact,
  postRankLeaderboard,
  postDailyPoll,
};
