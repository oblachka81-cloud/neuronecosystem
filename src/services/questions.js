const pool = require('../db/pool');

const state = {
  questionsCache: [],
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function pickGameQuestions(recentQuestions = []) {
  if (!state.questionsCache || state.questionsCache.length === 0) {
    console.warn('[pickGameQuestions] questionsCache пустой — загружаю из БД');
    try {
      await loadQuestionsFromDB();
    } catch (err) {
      console.error('[pickGameQuestions] Ошибка загрузки из БД:', err);
      return [];
    }
    if (!state.questionsCache || state.questionsCache.length === 0) {
      console.error('[pickGameQuestions] В БД нет вопросов');
      return [];
    }
  }

  const recentSet = new Set(recentQuestions || []);
  const available = [];
  for (let i = 0; i < state.questionsCache.length; i++) {
    if (!recentSet.has(i)) available.push(i);
  }
  if (available.length < 10) {
    const remaining = 10 - available.length;
    const oldIndices = (recentQuestions || []).slice(0, remaining);
    available.push(...oldIndices);
  }
  return shuffleArray(available).slice(0, 10);
}

async function loadQuestionsFromDB() {
  const { rows } = await pool.query('SELECT * FROM questions ORDER BY id');
  const mapped = rows.map(r => ({
    id: r.id,
    text: r.text,
    options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options,
    correct: r.correct,
    lang: r.lang || 'ru',
    translations: r.translations || {}
  }));
  state.questionsCache.length = 0;
  state.questionsCache.push(...mapped);
  console.log(`Загружено ${state.questionsCache.length} вопросов из БД`);
}

async function yandexTranslate(text, targetLang) {
  const apiKey = process.env.YANDEX_TRANSLATE_API_KEY;
  const folderId = process.env.YANDEX_FOLDER_ID;
  if (!apiKey || !folderId) return text;

  try {
    const response = await fetch('https://translate.api.cloud.yandex.net/translate/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`
      },
      body: JSON.stringify({
        folderId,
        texts: [text],
        targetLanguageCode: targetLang,
        sourceLanguageCode: 'ru'
      })
    });
    const data = await response.json();
    return data.translations?.[0]?.text || text;
  } catch {
    return text;
  }
}

async function translateQuestion(q, lang) {
  if (!lang || lang === 'ru') return q;

  const saved = q.translations?.[lang];
  if (saved?.text && saved?.options) {
    return { ...q, text: saved.text, options: saved.options };
  }

  try {
    const [translatedText, ...translatedOptions] = await Promise.all([
      yandexTranslate(q.text, lang),
      ...q.options.map(opt => yandexTranslate(opt, lang))
    ]);

    const newTranslations = { ...q.translations, [lang]: { text: translatedText, options: translatedOptions } };
    await pool.query(
      'UPDATE questions SET translations = $1 WHERE id = $2',
      [JSON.stringify(newTranslations), q.id]
    );

    return { ...q, text: translatedText, options: translatedOptions };
  } catch (e) {
    console.error('[TRANSLATE] Error:', e.message);
    return q;
  }
}

module.exports = {
  loadQuestionsFromDB,
  pickGameQuestions,
  translateQuestion,
  yandexTranslate,
  shuffleArray,
  get questionsCache() {
    return state.questionsCache;
  },
};
