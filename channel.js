const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
let _cardQueue = Promise.resolve();
function queuedHtmlToImage(html, width, height) {
  const result = _cardQueue.then(() => htmlToImage(html, width, height));
  _cardQueue = result.catch(() => {});
  return result;
}

async function htmlToImage(html, width = 600, height = 320) {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    headless: true,
    args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-zygote',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-sync',
  '--no-first-run',
  '--disable-web-security',
  '--disable-features=VizDisplayCompositor',
  '--disable-accelerated-2d-canvas',
  '--disable-software-rasterizer',
  '--disable-dev-tools',
  '--mute-audio',
  '--hide-scrollbars',
],
    protocolTimeout: 120000,
  });
  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(120000);
    await page.setDefaultTimeout(120000);
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const buffer = await page.screenshot({ type: 'png', fullPage: false });
    return buffer;
  } finally {
    await browser.close();
  }
}
const milestones = {
  1: {
    ru: { title: 'ПЕРВЫЙ ШАГ!', cta: 'Ты начал —\nне останавливайся', label: 'ДЕНЬ' },
    en: { title: 'FIRST STEP!', cta: "You started —\ndon't stop now", label: 'DAY' },
    fr: { title: 'PREMIER PAS!', cta: "Tu as commencé —\nne t'arrête pas", label: 'JOUR' },
    es: { title: '¡PRIMER PASO!', cta: 'Empezaste —\nno te detengas', label: 'DÍA' },
    colors: {
      particle: ['#00ffff','#3b82f6','#00aaff','#0066ff','#00ffaa','#a855f7'],
      numberGrad: 'linear-gradient(160deg,#00ffff 0%,#3b82f6 50%,#a855f7 100%)',
      numberShadow: 'rgba(0,200,255,0.9)',
      titleGrad: 'linear-gradient(90deg,#ffffff 0%,#00ffff 60%,#3b82f6 100%)',
      titleShadow: 'rgba(0,200,255,0.6)',
      cta1Grad: 'linear-gradient(90deg,#00ffff,#3b82f6)',
      cta2Grad: 'linear-gradient(90deg,#3b82f6,#a855f7)',
      divider: 'linear-gradient(to bottom, transparent, rgba(0,200,255,0.6) 30%, rgba(168,85,247,0.6) 70%, transparent)',
      glowTop: 'rgba(0,200,255,0.22)',
      glowBot: 'rgba(59,130,246,0.18)',
      glowCyan: 'rgba(0,255,255,0.12)',
      topLine: 'linear-gradient(90deg, transparent, #00aaff 20%, #3b82f6 50%, #a855f7 80%, transparent)',
      badgeBorder: 'rgba(0,200,255,0.45)',
      badgeBg: 'rgba(0,200,255,0.1)',
      badgeDot: '#00ffff',
      badgeDotShadow: '#00ffff',
      fireBadgeBorder: 'rgba(0,200,255,0.45)',
      fireBadgeBg: 'linear-gradient(90deg,rgba(0,200,255,0.15),rgba(59,130,246,0.12),rgba(168,85,247,0.1))',
      cogniqGrad: 'linear-gradient(90deg,#00ffff,#3b82f6,#a855f7)',
      cornerTL: 'rgba(0,255,255,0.6)',
      cornerTR: 'rgba(59,130,246,0.6)',
      cornerBL: 'rgba(59,130,246,0.6)',
      cornerBR: 'rgba(0,255,255,0.6)',
      fireEmoji: 'drop-shadow(0 0 20px rgba(0,200,255,1)) drop-shadow(0 0 40px rgba(0,150,255,0.8))',
      cardBorder: 'rgba(0,200,255,0.3)',
    }
  },
  3: {
    ru: { title: '3 ДНЯ ПОДРЯД!', cta: 'Ты в игре —\nпродолжай гореть', label: 'ДНЯ' },
    en: { title: '3 DAYS IN A ROW!', cta: 'You are in —\nkeep the fire', label: 'DAYS' },
    fr: { title: '3 JOURS DE SUITE!', cta: "Tu es dans la course —\ncontinue", label: 'JOURS' },
    es: { title: '¡3 DÍAS SEGUIDOS!', cta: 'Estás en juego —\nsigue ardiendo', label: 'DÍAS' },
    colors: {
      particle: ['#00ffff','#a855f7','#3b82f6','#00aaff','#cc44ff','#00ffaa'],
      numberGrad: 'linear-gradient(160deg,#00ffff 0%,#a855f7 60%,#cc44ff 100%)',
      numberShadow: 'rgba(168,85,247,0.9)',
      titleGrad: 'linear-gradient(90deg,#ffffff 0%,#a855f7 60%,#00ffff 100%)',
      titleShadow: 'rgba(168,85,247,0.6)',
      cta1Grad: 'linear-gradient(90deg,#00ffff,#a855f7)',
      cta2Grad: 'linear-gradient(90deg,#a855f7,#cc44ff)',
      divider: 'linear-gradient(to bottom, transparent, rgba(0,200,255,0.5) 30%, rgba(168,85,247,0.7) 70%, transparent)',
      glowTop: 'rgba(168,85,247,0.22)',
      glowBot: 'rgba(0,200,255,0.15)',
      glowCyan: 'rgba(204,68,255,0.12)',
      topLine: 'linear-gradient(90deg, transparent, #00ffff 20%, #a855f7 50%, #cc44ff 80%, transparent)',
      badgeBorder: 'rgba(168,85,247,0.45)',
      badgeBg: 'rgba(168,85,247,0.1)',
      badgeDot: '#a855f7',
      badgeDotShadow: '#a855f7',
      fireBadgeBorder: 'rgba(168,85,247,0.45)',
      fireBadgeBg: 'linear-gradient(90deg,rgba(168,85,247,0.15),rgba(0,200,255,0.12),rgba(204,68,255,0.1))',
      cogniqGrad: 'linear-gradient(90deg,#a855f7,#00ffff,#cc44ff)',
      cornerTL: 'rgba(0,255,255,0.6)',
      cornerTR: 'rgba(168,85,247,0.6)',
      cornerBL: 'rgba(168,85,247,0.6)',
      cornerBR: 'rgba(0,255,255,0.6)',
      fireEmoji: 'drop-shadow(0 0 20px rgba(168,85,247,1)) drop-shadow(0 0 40px rgba(0,200,255,0.8))',
      cardBorder: 'rgba(168,85,247,0.3)',
    }
  },
  7: {
    ru: { title: 'СТРИК ПОД УГРОЗОЙ!', cta: 'Сыграй сегодня —\nне теряй серию', label: 'ДНЕЙ' },
    en: { title: 'STREAK AT RISK!', cta: 'Play today —\nkeep your streak', label: 'DAYS' },
    fr: { title: 'SÉRIE EN DANGER!', cta: "Joue aujourd'hui —\nne perds pas ta série", label: 'JOURS' },
    es: { title: '¡RACHA EN PELIGRO!', cta: 'Juega hoy —\nno pierdas tu racha', label: 'DÍAS' },
    colors: {
      particle: ['#a855f7','#3b82f6','#00ffff','#ff6600','#ffaa00','#ff3300','#ff00aa'],
      numberGrad: 'linear-gradient(160deg,#ffaa00 0%,#ff6600 40%,#ff3300 70%,#a855f7 100%)',
      numberShadow: 'rgba(255,100,0,0.9)',
      titleGrad: 'linear-gradient(90deg,#ffffff 0%,#ff9955 60%,#ff6600 100%)',
      titleShadow: 'rgba(255,100,0,0.6)',
      cta1Grad: 'linear-gradient(90deg,#00ffff,#a855f7)',
      cta2Grad: 'linear-gradient(90deg,#a855f7,#ff6600)',
      divider: 'linear-gradient(to bottom, transparent, rgba(255,102,0,0.6) 30%, rgba(168,85,247,0.6) 70%, transparent)',
      glowTop: 'rgba(168,85,247,0.22)',
      glowBot: 'rgba(255,102,0,0.18)',
      glowCyan: 'rgba(0,255,255,0.1)',
      topLine: 'linear-gradient(90deg, transparent, #ff4400 20%, #a855f7 50%, #00ffff 80%, transparent)',
      badgeBorder: 'rgba(168,85,247,0.45)',
      badgeBg: 'rgba(168,85,247,0.1)',
      badgeDot: '#a855f7',
      badgeDotShadow: '#a855f7',
      fireBadgeBorder: 'rgba(255,140,0,0.45)',
      fireBadgeBg: 'linear-gradient(90deg,rgba(255,102,0,0.15),rgba(255,170,0,0.12),rgba(168,85,247,0.1))',
      cogniqGrad: 'linear-gradient(90deg,#ffaa00,#ff6600,#a855f7)',
      cornerTL: 'rgba(0,255,255,0.5)',
      cornerTR: 'rgba(255,102,0,0.5)',
      cornerBL: 'rgba(255,102,0,0.5)',
      cornerBR: 'rgba(0,255,255,0.5)',
      fireEmoji: 'drop-shadow(0 0 20px rgba(255,102,0,1)) drop-shadow(0 0 40px rgba(255,80,0,0.8)) drop-shadow(0 0 8px #ffaa00)',
      cardBorder: 'rgba(168,85,247,0.3)',
    }
  },
  14: {
    ru: { title: 'ТЫ ПОЛЫХАЕШЬ!', cta: '14 дней огня —\nне гаси пламя!', label: 'ДНЕЙ' },
    en: { title: 'YOU ARE ON FIRE!', cta: '14 days of fire —\ndon\'t stop now!', label: 'DAYS' },
    fr: { title: 'TU BRÛLES!', cta: '14 jours de feu —\nne t\'arrête pas!', label: 'JOURS' },
    es: { title: '¡ESTÁS EN LLAMAS!', cta: '14 días de fuego —\n¡no pares ahora!', label: 'DÍAS' },
    colors: {
      particle: ['#ff6600','#ffaa00','#ff3300','#ff0000','#ffcc00','#ff4400','#ff8800'],
      numberGrad: 'linear-gradient(160deg,#ffcc00 0%,#ffaa00 30%,#ff6600 70%,#ff3300 100%)',
      numberShadow: 'rgba(255,150,0,0.95)',
      titleGrad: 'linear-gradient(90deg,#ffcc00 0%,#ffaa00 50%,#ff6600 100%)',
      titleShadow: 'rgba(255,150,0,0.7)',
      cta1Grad: 'linear-gradient(90deg,#ffcc00,#ffaa00)',
      cta2Grad: 'linear-gradient(90deg,#ffaa00,#ff6600)',
      divider: 'linear-gradient(to bottom, transparent, rgba(255,170,0,0.7) 30%, rgba(255,80,0,0.7) 70%, transparent)',
      glowTop: 'rgba(255,150,0,0.22)',
      glowBot: 'rgba(255,60,0,0.22)',
      glowCyan: 'rgba(255,200,0,0.1)',
      topLine: 'linear-gradient(90deg, transparent, #ff3300 20%, #ffaa00 50%, #ff6600 80%, transparent)',
      badgeBorder: 'rgba(255,170,0,0.55)',
      badgeBg: 'rgba(255,150,0,0.12)',
      badgeDot: '#ffaa00',
      badgeDotShadow: '#ffaa00',
      fireBadgeBorder: 'rgba(255,170,0,0.55)',
      fireBadgeBg: 'linear-gradient(90deg,rgba(255,150,0,0.18),rgba(255,80,0,0.15))',
      cogniqGrad: 'linear-gradient(90deg,#ffcc00,#ffaa00,#ff6600)',
      cornerTL: 'rgba(255,200,0,0.6)',
      cornerTR: 'rgba(255,100,0,0.6)',
      cornerBL: 'rgba(255,100,0,0.6)',
      cornerBR: 'rgba(255,200,0,0.6)',
      fireEmoji: 'drop-shadow(0 0 24px rgba(255,150,0,1)) drop-shadow(0 0 48px rgba(255,100,0,0.9)) drop-shadow(0 0 12px #ffcc00)',
      cardBorder: 'rgba(255,150,0,0.35)',
    }
  },
  30: {
    ru: { title: 'ТЫ ЛЕГЕНДА!', cta: '30 дней — ты\nлегенда NEURON!', label: 'ДНЕЙ' },
    en: { title: 'YOU ARE A LEGEND!', cta: '30 days — you are\na NEURON legend!', label: 'DAYS' },
    fr: { title: 'TU ES UNE LÉGENDE!', cta: '30 jours — tu es\nune légende NEURON!', label: 'JOURS' },
    es: { title: '¡ERES UNA LEYENDA!', cta: '30 días — eres\nuna leyenda NEURON!', label: 'DÍAS' },
    colors: {
      particle: ['#ffcc00','#ff6600','#a855f7','#00ffff','#ff3300','#ffaa00','#00ffaa','#ff00aa'],
      numberGrad: 'linear-gradient(160deg,#ffcc00 0%,#ffaa00 20%,#ff6600 40%,#a855f7 70%,#00ffff 100%)',
      numberShadow: 'rgba(255,200,0,0.95)',
      titleGrad: 'linear-gradient(90deg,#ffcc00 0%,#ff6600 35%,#a855f7 65%,#00ffff 100%)',
      titleShadow: 'rgba(255,150,0,0.7)',
      cta1Grad: 'linear-gradient(90deg,#ffcc00,#ff6600,#a855f7)',
      cta2Grad: 'linear-gradient(90deg,#a855f7,#00ffff)',
      divider: 'linear-gradient(to bottom, transparent, rgba(255,200,0,0.5) 25%, rgba(168,85,247,0.6) 50%, rgba(0,255,255,0.5) 75%, transparent)',
      glowTop: 'rgba(255,200,0,0.2)',
      glowBot: 'rgba(168,85,247,0.2)',
      glowCyan: 'rgba(0,255,255,0.15)',
      topLine: 'linear-gradient(90deg, transparent, #ffcc00 15%, #ff6600 35%, #a855f7 60%, #00ffff 85%, transparent)',
      badgeBorder: 'rgba(255,200,0,0.55)',
      badgeBg: 'rgba(255,180,0,0.12)',
      badgeDot: '#ffcc00',
      badgeDotShadow: '#ffcc00',
      fireBadgeBorder: 'rgba(255,200,0,0.55)',
      fireBadgeBg: 'linear-gradient(90deg,rgba(255,200,0,0.15),rgba(168,85,247,0.15),rgba(0,255,255,0.1))',
      cogniqGrad: 'linear-gradient(90deg,#ffcc00,#ff6600,#a855f7,#00ffff)',
      cornerTL: 'rgba(0,255,255,0.7)',
      cornerTR: 'rgba(255,200,0,0.7)',
      cornerBL: 'rgba(255,100,0,0.7)',
      cornerBR: 'rgba(168,85,247,0.7)',
      fireEmoji: 'drop-shadow(0 0 28px rgba(255,200,0,1)) drop-shadow(0 0 56px rgba(255,100,0,0.9)) drop-shadow(0 0 14px #a855f7)',
      cardBorder: 'rgba(255,200,0,0.4)',
    }
  }
};

function getClosestMilestone(streak_count) {
  const keys = [1, 3, 7, 14, 30];
  if (streak_count >= 30) return 30;
  if (streak_count >= 14) return 14;
  if (streak_count >= 7) return 7;
  if (streak_count >= 3) return 3;
  return 1;
}

async function generateStreakWarningCard({ streak_count, language_code }) {
  const milestone = getClosestMilestone(streak_count);
  const data = milestones[milestone];
  const lang = data[language_code] || data.ru;
  const c = data.colors;

  const ctaLines = lang.cta.split('\n');

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_streak_warning.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[streakWarningCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 28px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: row; align-items: flex-end; padding: 0 44px; gap: 28px; }
.left { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 110px; }
.streak-number { font-size: 72px; font-weight: 900; line-height: 1; background: ${c.numberGrad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 16px ${c.numberShadow}); letter-spacing: -2px; }
.streak-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 4px; background: ${c.cta1Grad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
.divider { width: 1px; height: 80px; background: linear-gradient(to bottom, transparent, rgba(168,85,247,0.6), transparent); align-self: flex-end; margin-bottom: 8px; }
.right { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.title { font-size: 22px; font-weight: 900; line-height: 1.2; background: ${c.titleGrad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 10px ${c.titleShadow}); }
.cta-line1 { font-size: 14px; font-weight: 700; background: ${c.cta1Grad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
.cta-line2 { font-size: 14px; font-weight: 700; background: ${c.cta2Grad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="left">
    <div class="streak-number">${streak_count}</div>
    <div class="streak-label">${lang.label}</div>
  </div>
  <div class="divider"></div>
  <div class="right">
    <div class="title">${lang.title}</div>
    <div class="cta-line1">${ctaLines[0]}</div>
    <div class="cta-line2">${ctaLines[1] || ''}</div>
  </div>
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}
async function generateQuestionOfDayCard({ question, options, date, language_code }) {
  const labels = {
    ru: { flag: '🇷🇺' },
    en: { flag: '🇬🇧' },
    fr: { flag: '🇫🇷' },
    es: { flag: '🇪🇸' },
  };
  const l = labels[language_code] || labels.en;

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_question_of_day.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[questionOfDayCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.flag { position: absolute; top: 24px; right: 40px; font-size: 26px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.3)); }
.content { position: absolute; bottom: 28px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: row; align-items: flex-end; justify-content: space-between; padding: 0 44px; gap: 24px; }
.text-block { flex: 1; display: flex; flex-direction: column; gap: 14px; }
.date { font-size: 11px; font-weight: 700; color: rgba(150,160,200,0.8); letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 2px 8px rgba(0,0,0,0.9); }
.question { font-size: 22px; font-weight: 900; line-height: 1.4; background: linear-gradient(90deg, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 10px rgba(168,85,247,0.8)); }
.reward-block { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-width: 110px; padding: 16px 18px; border: 1px solid rgba(168,85,247,0.5); border-radius: 18px; background: rgba(12,12,28,0.75); box-shadow: 0 0 20px rgba(168,85,247,0.2), inset 0 0 20px rgba(168,85,247,0.05); }
.reward-plus { font-size: 28px; font-weight: 900; background: linear-gradient(90deg, #ffaa00, #ff6600); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 8px rgba(255,150,0,0.8)); line-height: 1; }
.reward-label { font-size: 13px; font-weight: 900; background: linear-gradient(90deg, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 1px; text-align: center; }
</style></head><body>
<div class="grid"></div>
<div class="flag">${l.flag}</div>
<div class="content">
  <div class="text-block">
    <div class="date">${date}</div>
    <div class="question">${escapeHtml(question)}</div>
  </div>
  <div class="reward-block">
    <div class="reward-plus">+20</div>
    <div class="reward-label">COGNIQ</div>
  </div>
</div>
</body></html>`;
  return queuedHtmlToImage(html, 600, 600);
}
// ==================== WEEKLY TOP CARD ====================
async function generateWeeklyTopCard(players, language_code = 'en') {
  const i18n = {
    ru: { title: 'ТОП НЕДЕЛИ', sub: 'Играй каждый день · Зарабатывай COGNIQ', coins: 'COGNIQ', anon: 'Игрок' },
    en: { title: 'WEEKLY TOP', sub: 'Play every day · Earn COGNIQ', coins: 'COGNIQ', anon: 'Player' },
    fr: { title: 'TOP SEMAINE', sub: 'Joue chaque jour · Gagne des COGNIQ', coins: 'COGNIQ', anon: 'Joueur' },
    es: { title: 'TOP SEMANAL', sub: 'Juega cada día · Gana COGNIQ', coins: 'COGNIQ', anon: 'Jugador' },
  };
  const l = i18n[language_code] || i18n['en'];

  const medals = [
    { emoji: '🥇', bg: 'linear-gradient(135deg,#ffcc00,#ff8800)', shadow: 'rgba(255,200,0,0.8)', border: 'rgba(255,200,0,0.5)', rowBg: 'rgba(255,180,0,0.08)', rowBorder: 'rgba(255,180,0,0.35)' },
    { emoji: '🥈', bg: 'linear-gradient(135deg,#d0d0d0,#909090)', shadow: 'rgba(200,200,200,0.6)', border: 'rgba(200,200,200,0.4)', rowBg: 'rgba(180,180,180,0.05)', rowBorder: 'rgba(180,180,180,0.2)' },
    { emoji: '🥉', bg: 'linear-gradient(135deg,#cd7f32,#8b4513)', shadow: 'rgba(180,100,30,0.6)', border: 'rgba(180,100,30,0.4)', rowBg: 'rgba(150,80,20,0.05)', rowBorder: 'rgba(150,80,20,0.2)' },
    { emoji: '4️⃣', bg: 'linear-gradient(135deg,#a855f7,#7c3aed)', shadow: 'rgba(168,85,247,0.5)', border: 'rgba(168,85,247,0.25)', rowBg: 'rgba(168,85,247,0.04)', rowBorder: 'rgba(168,85,247,0.12)' },
    { emoji: '5️⃣', bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', shadow: 'rgba(59,130,246,0.5)', border: 'rgba(59,130,246,0.25)', rowBg: 'rgba(59,130,246,0.04)', rowBorder: 'rgba(59,130,246,0.12)' },
  ];

  const rows = players.map((p, i) => {
    const m = medals[i] || medals[4];
    const name = p.privacy_mode === 'anonymous'
      ? `${l.anon} #${String(p.telegram_id).slice(-4)}`
      : (p.nickname || p.first_name || 'Anonymous');
    const balance = (p.balance || 0).toLocaleString();
    return `<div style="display:flex;align-items:center;gap:10px;padding:7px 12px;margin-bottom:4px;background:${m.rowBg};border:1px solid ${m.rowBorder};border-radius:10px;">
      <div style="position:relative;width:34px;height:34px;flex-shrink:0;">
        <img src="${APP_URL}/api/tg-photo/${p.telegram_id}"
          style="width:34px;height:34px;border-radius:50%;object-fit:cover;display:block;position:absolute;top:0;left:0;"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div style="display:none;width:34px;height:34px;border-radius:50%;background:${m.bg};box-shadow:0 0 10px ${m.shadow};align-items:center;justify-content:center;font-size:16px;position:absolute;top:0;left:0;border:1px solid ${m.border};">${m.emoji}</div>
      </div>
      <div style="flex:1;min-width:0;font-size:13px;font-weight:600;color:#e8eeff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:13px;font-weight:900;background:linear-gradient(90deg,#ffcc00,#ff6600,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${balance}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:1px;">${l.coins}</div>
      </div>
    </div>`;
  }).join('');

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_weekly_top.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[weeklyTopCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 20px; left: 0; right: 0; z-index: 10; padding: 0 20px; }
.header { text-align: center; margin-bottom: 10px; }
.title { font-size: 20px; font-weight: 900; background: linear-gradient(90deg, #ffcc00, #ff6600, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 10px rgba(0,0,0,1)); letter-spacing: 2px; }
.sub { font-size: 9px; color: rgba(255,255,255,0.35); margin-top: 2px; letter-spacing: 1.5px; text-shadow: 0 1px 4px rgba(0,0,0,0.9); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="header">
    <div class="title">🏆 ${l.title}</div>
    <div class="sub">${l.sub}</div>
  </div>
  ${rows}
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}
// ==================== WELCOME CARD ====================
async function generateWelcomeCard(name, lang = 'en') {
  const i18nCard = {
    ru: { title: 'Добро пожаловать!', tag: 'Твой разум — твоя валюта' },
    en: { title: 'Welcome!', tag: 'Your mind is your currency' },
    fr: { title: 'Bienvenue !', tag: 'Ton esprit est ta monnaie' },
    es: { title: '¡Bienvenido!', tag: 'Tu mente es tu moneda' },
  };
  const c = i18nCard[lang] || i18nCard['en'];

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_welcome.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[welcomeCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 20px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; padding: 0 40px; text-align: center; }
.name { font-size: 20px; font-weight: 800; background: linear-gradient(90deg, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(168,85,247,0.9)); margin-bottom: 10px; }
.title { font-size: 22px; font-weight: 900; margin-bottom: 18px; background: linear-gradient(90deg, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,255,255,0.8)); }
.tag { display: inline-block; border: 1px solid rgba(168,85,247,0.6); border-radius: 20px; padding: 6px 20px; font-size: 12px; font-weight: 700; background: linear-gradient(90deg, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 0 20px rgba(0,255,255,0.3), 0 0 40px rgba(168,85,247,0.2); filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
.bottom-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #a855f7, #00ffff, #ff6600, transparent); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="name">${escapeHtml(name)}</div>
  <div class="title">${c.title}</div>
  <div class="tag">${c.tag}</div>
</div>
<div class="bottom-bar"></div>
</body></html>`;
  return queuedHtmlToImage(html, 600, 600);
}
// ==================== REFERRAL CARDS ====================
async function generateReferralReferrerCard(friendName, lang = 'en') {
  const i18n = {
    ru: { friend: 'ДРУГ В ИГРЕ!', name: friendName },
    en: { friend: 'FRIEND IN THE GAME!', name: friendName },
    fr: { friend: 'TON AMI EST LÀ!', name: friendName },
    es: { friend: '¡AMIGO EN JUEGO!', name: friendName },
  };
  const l = i18n[lang] || i18n['en'];

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_referral.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[referralReferrerCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 32px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 40px; }
.friend-name { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.7); text-shadow: 0 2px 8px rgba(0,0,0,0.9); letter-spacing: 1px; }
.friend-label { font-size: 26px; font-weight: 900; background: linear-gradient(90deg, #ff6600, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 16px rgba(255,102,0,0.6)); letter-spacing: 2px; }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="friend-name">${escapeHtml(l.name)}</div>
  <div class="friend-label">${l.friend}</div>
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}

async function generateReferralNewUserCard(inviterName, lang = 'en') {
  const i18n = {
    ru: { invitedBy: `Тебя пригласил: ${inviterName}`, cta: 'ПРИГЛАСИ ДРУГА — ПОЛУЧИ 50 COGNIQ' },
    en: { invitedBy: `Invited by: ${inviterName}`, cta: 'INVITE A FRIEND — GET 50 COGNIQ' },
    fr: { invitedBy: `Invité par : ${inviterName}`, cta: 'INVITE UN AMI — REÇOIS 50 COGNIQ' },
    es: { invitedBy: `Te invitó: ${inviterName}`, cta: 'INVITA A UN AMIGO — OBTÉN 50 COGNIQ' },
  };
  const l = i18n[lang] || i18n['en'];

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_referral_new.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[referralNewUserCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 32px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 0 40px; }
.inviter { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.65); text-shadow: 0 2px 8px rgba(0,0,0,0.9); letter-spacing: 1px; text-align: center; }
.cta { font-size: 20px; font-weight: 900; background: linear-gradient(90deg, #00ffff, #a855f7, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 16px rgba(0,255,255,0.5)); letter-spacing: 1.5px; text-align: center; }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="inviter">${escapeHtml(l.invitedBy)}</div>
  <div class="cta">${l.cta}</div>
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}
// ==================== STREAK MILESTONE CARD ====================
async function generateStreakMilestoneCard({ streak_count, language_code }) {
  const milestoneTitles = {
    3: { ru: '3 ДНЯ ПОДРЯД!', en: '3 DAYS IN A ROW!', fr: '3 JOURS DE SUITE!', es: '¡3 DÍAS SEGUIDOS!' },
    7: { ru: '7 ДНЕЙ — ТЫ В ОГНЕ!', en: "7 DAYS — YOU'RE ON FIRE!", fr: '7 JOURS — TU BRÛLES!', es: '¡7 DÍAS — ESTÁS EN LLAMAS!' },
    14: { ru: 'ТЫ ПОЛЫХАЕШЬ!', en: 'YOU ARE ON FIRE!', fr: 'TU BRÛLES!', es: '¡ESTÁS EN LLAMAS!' },
    30: { ru: 'ТЫ ЛЕГЕНДА!', en: 'YOU ARE A LEGEND!', fr: 'TU ES UNE LÉGENDE!', es: '¡ERES UNA LEYENDA!' },
  };
  const milestoneCta = {
    3: { ru: 'Ты в игре —\nпродолжай гореть', en: 'You are in —\nkeep the fire', fr: "Tu es dans la course —\ncontinue", es: 'Estás en juego —\nsigue ardiendo' },
    7: { ru: '7 дней огня —\nне останавливайся!', en: "7 days of fire —\ndon't stop now!", fr: "7 jours de feu —\nne t'arrête pas!", es: '7 días de fuego —\n¡no pares ahora!' },
    14: { ru: '14 дней огня —\nне гаси пламя!', en: "14 days of fire —\ndon't stop now!", fr: "14 jours de feu —\nne t'arrête pas!", es: '14 días de fuego —\n¡no pares ahora!' },
    30: { ru: '30 дней — ты\nлегенда NEURON!', en: '30 days — you are\na NEURON legend!', fr: '30 jours — tu es\nune légende NEURON!', es: '30 días — eres\nuna leyenda NEURON!' },
  };
  const key = [3, 7, 14, 30].includes(streak_count) ? streak_count : 3;
  const lang = language_code || 'en';
  const colorKey = key === 7 ? 14 : key;
  const data = milestones[colorKey];
  const c = data.colors;
  const title = milestoneTitles[key][lang] || milestoneTitles[key]['en'];
  const cta = milestoneCta[key][lang] || milestoneCta[key]['en'];
  const ctaLines = cta.split('\n');
  const labelMap = {
    3: { ru: 'ДНЯ', en: 'DAYS', fr: 'JOURS', es: 'DÍAS' },
    7: { ru: 'ДНЕЙ', en: 'DAYS', fr: 'JOURS', es: 'DÍAS' },
    14: { ru: 'ДНЕЙ', en: 'DAYS', fr: 'JOURS', es: 'DÍAS' },
    30: { ru: 'ДНЕЙ', en: 'DAYS', fr: 'JOURS', es: 'DÍAS' },
  };
  const label = labelMap[key][lang] || 'DAYS';

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_streak_milestone.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[streakMilestoneCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 28px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: row; align-items: flex-end; padding: 0 44px; gap: 28px; }
.left { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 110px; }
.streak-number { font-size: 80px; font-weight: 900; line-height: 1; background: ${c.numberGrad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 16px ${c.numberShadow}); letter-spacing: -2px; }
.streak-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 4px; background: ${c.cta1Grad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
.divider { width: 1px; height: 80px; background: linear-gradient(to bottom, transparent, rgba(168,85,247,0.6), transparent); align-self: flex-end; margin-bottom: 8px; }
.right { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.title { font-size: 22px; font-weight: 900; line-height: 1.2; background: ${c.titleGrad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 10px ${c.titleShadow}); }
.cta-line1 { font-size: 14px; font-weight: 700; background: ${c.cta1Grad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
.cta-line2 { font-size: 14px; font-weight: 700; background: ${c.cta2Grad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="left">
    <div class="streak-number">${streak_count}</div>
    <div class="streak-label">${label}</div>
  </div>
  <div class="divider"></div>
  <div class="right">
    <div class="title">${title}</div>
    <div class="cta-line1">${ctaLines[0]}</div>
    <div class="cta-line2">${ctaLines[1] || ''}</div>
  </div>
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}
// ==================== WEEKLY HEROES CARD ====================
async function generateWeeklyHeroesCard(heroes, language_code = 'en') {
  const i18n = {
    ru: { title: 'ГЕРОИ НЕДЕЛИ', anon: 'Игрок', achievement: 'Достижение недели' },
    en: { title: 'HEROES OF THE WEEK', anon: 'Player', achievement: 'Achievement of the week' },
    fr: { title: 'HÉROS DE LA SEMAINE', anon: 'Joueur', achievement: 'Exploit de la semaine' },
    es: { title: 'HÉROES DE LA SEMANA', anon: 'Jugador', achievement: 'Logro de la semana' },
  };
  const l = i18n[language_code] || i18n['en'];

  const medals = ['🥇', '🥈', '🥉'];

  const rows = heroes.slice(0, 3).map((h, i) => {
    const name = h.privacy_mode === 'anonymous'
      ? `${l.anon} #${String(h.telegram_id).slice(-4)}`
      : (h.nickname || h.first_name || 'Anonymous');
    const isGold = i === 0;
    const rowBg = isGold ? 'rgba(255,200,0,0.07)' : 'rgba(168,85,247,0.04)';
    const rowBorder = isGold ? 'rgba(255,200,0,0.35)' : 'rgba(168,85,247,0.15)';
    return `<div style="display:flex;align-items:center;gap:12px;padding:${isGold ? '11px 14px' : '8px 14px'};margin-bottom:5px;background:${rowBg};border:1px solid ${rowBorder};border-radius:10px;">
      <span style="font-size:24px;line-height:1;flex-shrink:0;">${medals[i]}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:800;color:#e8eeff;line-height:1.4;text-shadow:0 0 20px rgba(168,85,247,0.3);">${escapeHtml(question)}</div>
        <div style="font-size:10px;margin-top:2px;color:rgba(255,255,255,0.4);text-shadow:0 1px 4px rgba(0,0,0,0.9);">${escapeHtml(h.achievement_emoji || '🏅')} ${escapeHtml(h.achievement_name || l.achievement)}</div>
      </div>
    </div>`;
  }).join('');

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_weekly_heroes.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[weeklyHeroesCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 20px; left: 0; right: 0; z-index: 10; padding: 0 20px; }
.title { font-size: 20px; font-weight: 900; text-align: center; background: linear-gradient(90deg, #ffcc00, #ff6600, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 10px rgba(0,0,0,1)); letter-spacing: 2px; margin-bottom: 10px; }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="title">🏆 ${l.title}</div>
  ${rows}
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}

// ==================== STREAK BATTLE CARD ====================
async function generateStreakBattleCard(streaks, language_code = 'en') {
  const i18n = {
    ru: { anon: 'Игрок', days: 'дней' },
    en: { anon: 'Player', days: 'days' },
    fr: { anon: 'Joueur', days: 'jours' },
    es: { anon: 'Jugador', days: 'días' },
  };
  const l = i18n[language_code] || i18n['en'];

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  const rows = streaks.map((p, i) => {
    const name = p.privacy_mode === 'anonymous'
      ? `${l.anon} #${String(p.telegram_id).slice(-4)}`
      : (p.nickname || p.first_name || 'Anonymous');
    const isTop = i === 0;
    const barWidth = streaks[0].streak > 0
  ? Math.round((p.streak / streaks[0].streak) * 100)
  : 0;
    return `<div style="display:flex;align-items:center;gap:12px;padding:${isTop ? '10px 14px' : '7px 14px'};margin-bottom:5px;background:${isTop ? 'rgba(255,100,0,0.08)' : 'rgba(168,85,247,0.04)'};border:1px solid ${isTop ? 'rgba(255,120,0,0.35)' : 'rgba(168,85,247,0.12)'};border-radius:11px;">
      <span style="font-size:20px;line-height:1;width:28px;text-align:center;">${medals[i]}</span>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:${isTop ? '14px' : '13px'};font-weight:${isTop ? '800' : '600'};color:#e8eeff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;text-shadow:0 1px 6px rgba(0,0,0,0.9);">${name}</span>
          <span style="font-size:13px;font-weight:900;background:linear-gradient(90deg,#ffaa00,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.9));">🔥 ${p.streak} ${l.days}</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${barWidth}%;background:linear-gradient(90deg,#ffcc00,#ff6600,#a855f7);border-radius:2px;"></div>
        </div>
      </div>
    </div>`;
  }).join('');

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_streak_battle.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[streakBattleCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,100,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,100,0,0.03) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 20px; left: 0; right: 0; z-index: 10; padding: 0 20px; }
</style></head><body>
<div class="grid"></div>
<div class="content">
  ${rows}
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}

// ==================== FACT OF DAY CARD ====================
async function generateFactOfDayCard({ question, correct_answer, date }) {
  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_fact_of_day.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[factOfDayCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 28px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: row; align-items: flex-end; justify-content: space-between; padding: 0 44px; gap: 24px; }
.text-block { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.date { font-size: 11px; font-weight: 700; color: rgba(150,160,200,0.8); letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 2px 8px rgba(0,0,0,0.9); }
.question { font-size: 20px; font-weight: 900; line-height: 1.4; background: linear-gradient(90deg, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 10px rgba(168,85,247,0.8)); }
.answer-block { display: inline-flex; align-items: center; gap: 10px; padding: 8px 20px; border: 1px solid rgba(0,255,255,0.4); border-radius: 14px; background: rgba(12,12,28,0.6); box-shadow: 0 0 16px rgba(0,255,255,0.15); width: fit-content; }
.answer-check { font-size: 18px; filter: drop-shadow(0 0 8px rgba(0,255,255,0.8)); }
.answer-text { font-size: 15px; font-weight: 900; background: linear-gradient(90deg, #00ffff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="text-block">
    <div class="date">${date || ''}</div>
    <div class="question">${question}</div>
    <div class="answer-block">
      <span class="answer-check">✅</span>
      <span class="answer-text">${escapeHtml(correct_answer)}</span>
    </div>
  </div>
</div>
</body></html>`;
  return queuedHtmlToImage(html, 600, 600);
}

// ==================== RANK RATING CARD ====================
async function generateRankRatingCard(ranks, language_code = 'en') {
  const i18n = {
    ru: { total: 'ВСЕГО ИГРОКОВ' },
    en: { total: 'TOTAL PLAYERS' },
    fr: { total: 'JOUEURS AU TOTAL' },
    es: { total: 'JUGADORES EN TOTAL' },
  };
  const l = i18n[language_code] || i18n['en'];

  const total = ranks.reduce((s, r) => s + r.count, 0);

  const rankRows = ranks.map(r => {
    const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:7px;">
      <span style="font-size:18px;width:26px;text-align:center;">${r.emoji}</span>
      <span style="font-size:13px;font-weight:700;color:#ccd6f6;min-width:110px;white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,0.9);">${r.rank}</span>
      <div style="flex:1;height:8px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${r.color || 'linear-gradient(90deg,#a855f7,#00ffff)'};border-radius:4px;box-shadow:0 0 8px ${r.color || '#a855f7'}80;"></div>
      </div>
      <span style="font-size:12px;font-weight:800;color:#e8eeff;min-width:40px;text-align:right;text-shadow:0 1px 6px rgba(0,0,0,0.9);">${r.count}</span>
      <span style="font-size:10px;color:rgba(255,255,255,0.35);min-width:34px;text-align:right;">${pct}%</span>
    </div>`;
  }).join('');

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_rank_rating.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[rankRatingCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 20px; left: 0; right: 0; z-index: 10; padding: 0 24px; }
.total { font-size: 9px; color: rgba(255,255,255,0.3); letter-spacing: 2px; text-align: center; margin-bottom: 10px; text-shadow: 0 1px 4px rgba(0,0,0,0.9); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="total">${l.total}: ${total.toLocaleString()}</div>
  ${rankRows}
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}
// ==================== ACHIEVEMENT CARD ====================
async function generateAchievementCard({ emoji, title, prefix, lang }) {
  const congratsText = {
    ru: 'Поздравляем! Ты разблокировал достижение',
    en: 'Congratulations! You unlocked an achievement',
    fr: 'Félicitations ! Vous avez débloqué un succès',
    es: '¡Felicidades! Has desbloqueado un logro',
  };
  const congrats = congratsText[lang] || congratsText['en'];

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_achievement.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[achievementCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:600px; height:600px; background:#0a0a0f; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; overflow:hidden; position:relative; ${bgStyle} }
.grid { position:absolute; inset:0; background-image:linear-gradient(rgba(0,255,200,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,200,0.04) 1px,transparent 1px); background-size:40px 40px; }
.content { position:absolute; bottom:32px; left:0; right:0; z-index:10; display:flex; flex-direction:column; align-items:center; gap:12px; padding:0 40px; }
.prefix { font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#00ffc8; opacity:0.85; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
.divider { width:60px; height:2px; background:linear-gradient(90deg,transparent,#00ffc8,transparent); }
.title { font-size:30px; font-weight:800; text-align:center; background:linear-gradient(135deg,#ffffff 0%,#00ffc8 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; line-height:1.2; filter:drop-shadow(0 2px 10px rgba(0,0,0,1)); }
.congrats { font-size:13px; color:rgba(255,255,255,0.5); text-align:center; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="prefix">${prefix}</div>
  <div class="divider"></div>
  <div class="title">${title}</div>
  <div class="congrats">${congrats}</div>
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}

// ========== PURCHASE CARDS ==========
const PURCHASE_TEXTS = {
  super_game: {
    ru: { title: 'Супер игра активирована!', sub: '🔥 Режим максимума включён', cta: 'Открой приложение и нажми «Начать игру»' },
    en: { title: 'Super Game Activated!', sub: '🔥 Maximum mode on', cta: 'Open the app and tap "Start game"' },
    fr: { title: 'Super partie activée !', sub: '🔥 Mode maximum activé', cta: "Ouvre l'appli et appuie sur « Démarrer »" },
    es: { title: '¡Super juego activado!', sub: '🔥 Modo máximo activado', cta: 'Abre la app y pulsa «Iniciar juego»' },
  },
  pack10: {
    ru: { title: '+10 игр активировано!', sub: '⚡ Заряд пополнен', cta: 'Открой приложение и играй' },
    en: { title: '+10 Games Activated!', sub: '⚡ Charge replenished', cta: 'Open the app and play' },
    fr: { title: '+10 parties activées !', sub: '⚡ Recharge effectuée', cta: "Ouvre l'appli et joue" },
    es: { title: '¡+10 partidas activadas!', sub: '⚡ Carga repuesta', cta: 'Abre la app y juega' },
  },
  vip: {
    ru: { title: 'VIP активирован!', sub: '👑 7 дней привилегий', cta: 'Открой приложение' },
    en: { title: 'VIP Activated!', sub: '👑 7 days of privileges', cta: 'Open the app' },
    fr: { title: 'VIP activé !', sub: '👑 7 jours de privilèges', cta: "Ouvre l'appli" },
    es: { title: '¡VIP activado!', sub: '👑 7 días de privilegios', cta: 'Abre la app' },
  },
  premium: {
    ru: { title: 'PREMIUM активирован!', sub: '💎 30 дней максимума', cta: 'Открой приложение' },
    en: { title: 'PREMIUM Activated!', sub: '💎 30 days of maximum', cta: 'Open the app' },
    fr: { title: 'PREMIUM activé !', sub: '💎 30 jours de maximum', cta: "Ouvre l'appli" },
    es: { title: '¡PREMIUM activado!', sub: '💎 30 días de máximo', cta: 'Abre la app' },
  },
};

async function generatePurchaseCard(type, lang = 'en') {
  const t = PURCHASE_TEXTS[type]?.[lang] || PURCHASE_TEXTS[type]?.['en'];
  if (!t) return null;

  const styles = {
    super_game: { accentColor: '#ff6b35' },
    pack10:     { accentColor: '#00ffc8' },
    vip:        { accentColor: '#f0c040' },
    premium:    { accentColor: '#a78bfa' },
  };
  const s = styles[type];
  if (!s) return null;

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_purchase.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error(`[purchaseCard] image not found, using fallback bg:`, e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:600px; height:600px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; overflow:hidden; position:relative; ${bgStyle} }
.grid { position:absolute; inset:0; background-image:linear-gradient(${s.accentColor}08 1px,transparent 1px),linear-gradient(90deg,${s.accentColor}08 1px,transparent 1px); background-size:40px 40px; }
.content { position:absolute; bottom:32px; left:0; right:0; z-index:10; display:flex; flex-direction:column; align-items:center; gap:12px; padding:0 40px; }
.title { font-size:28px; font-weight:800; text-align:center; line-height:1.2; background:linear-gradient(135deg,#ffffff 0%,${s.accentColor} 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 2px 10px rgba(0,0,0,1)); }
.divider { width:50px; height:2px; background:linear-gradient(90deg,transparent,${s.accentColor},transparent); }
.sub { font-size:15px; font-weight:600; color:${s.accentColor}; opacity:0.9; letter-spacing:0.5px; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
.cta { font-size:13px; color:rgba(255,255,255,0.45); text-align:center; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="title">${t.title}</div>
  <div class="divider"></div>
  <div class="sub">${t.sub}</div>
  <div class="cta">${t.cta}</div>
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}

async function generateExchangeCard({ amountCogniq, amountUSDT, lang = 'en' }) {
  const texts = {
    ru: { label: 'Обмен выполнен!', sub: `за ${amountUSDT} USDT`, cta: 'Средства зачислены на ваш баланс' },
    en: { label: 'Exchange Complete!', sub: `for ${amountUSDT} USDT`, cta: 'Funds credited to your balance' },
    fr: { label: 'Échange effectué !', sub: `pour ${amountUSDT} USDT`, cta: 'Fonds crédités sur votre solde' },
    es: { label: '¡Cambio completado!', sub: `por ${amountUSDT} USDT`, cta: 'Fondos acreditados en tu saldo' },
  };
  const t = texts[lang] || texts['en'];

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_exchange.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[exchangeCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:600px; height:600px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; overflow:hidden; position:relative; ${bgStyle} }
.grid { position:absolute; inset:0; background-image:linear-gradient(#26d9a808 1px,transparent 1px),linear-gradient(90deg,#26d9a808 1px,transparent 1px); background-size:40px 40px; }
.content { position:absolute; bottom:32px; left:0; right:0; z-index:10; display:flex; flex-direction:column; align-items:center; gap:10px; padding:0 40px; }
.label { font-size:18px; font-weight:700; color:rgba(255,255,255,0.6); letter-spacing:1px; text-transform:uppercase; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
.divider { width:50px; height:2px; background:linear-gradient(90deg,transparent,#26d9a8,transparent); }
.amount { font-size:44px; font-weight:900; line-height:1; background:linear-gradient(135deg,#ffffff,#26d9a8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 2px 12px rgba(0,0,0,1)); }
.currency { font-size:18px; font-weight:700; color:#26d9a8; opacity:0.85; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
.sub { font-size:14px; color:rgba(255,255,255,0.45); text-shadow:0 2px 8px rgba(0,0,0,0.9); }
.cta { font-size:12px; color:rgba(255,255,255,0.35); text-align:center; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="label">${t.label}</div>
  <div class="divider"></div>
  <div class="amount">+${Number(amountCogniq).toLocaleString()}</div>
  <div class="currency">COGNIQ</div>
  <div class="sub">${t.sub}</div>
  <div class="cta">${t.cta}</div>
</div>
</body></html>`;

  return queuedHtmlToImage(html, 600, 600);
}
// ==================== TRANSFER RECEIVED CARD ====================
async function generateTransferReceivedCard({ amount, fromName, lang = 'en' }) {
  const i18n = {
   ru: { title: 'ТЕБЕ ПЕРЕВЕЛИ!', sub: `от ${escapeHtml(fromName)}` },
   en: { title: 'YOU RECEIVED!', sub: `from ${escapeHtml(fromName)}` },
   fr: { title: 'TU AS REÇU!', sub: `de ${escapeHtml(fromName)}` },
   es: { title: '¡RECIBISTE!', sub: `de ${escapeHtml(fromName)}` }, 
  };
  const t = i18n[lang] || i18n['en'];

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_transfer.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[transferCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 600px; height: 600px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; overflow: hidden; position: relative; ${bgStyle} }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px); background-size: 40px 40px; }
.content { position: absolute; bottom: 28px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; padding: 0 40px; text-align: center; gap: 8px; }
.title { font-size: 22px; font-weight: 900; background: linear-gradient(90deg, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)) drop-shadow(0 0 10px rgba(168,85,247,0.8)); }
.amount { font-size: 48px; font-weight: 900; line-height: 1; background: linear-gradient(135deg, #00ddff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 12px rgba(0,0,0,1)); }
.currency { font-size: 16px; font-weight: 800; background: linear-gradient(90deg, #a855f7, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)); }
.sub { font-size: 14px; font-weight: 600; color: rgba(200,180,255,0.85); text-shadow: 0 2px 8px rgba(0,0,0,0.9); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="title">${t.title}</div>
  <div class="amount">+${Number(amount).toLocaleString()}</div>
  <div class="currency">COGNIQ</div>
  <div class="sub">${t.sub}</div>
</div>
</body></html>`;
  return queuedHtmlToImage(html, 600, 600);
}
// ==================== BURN CARD ====================
async function postBurnCard(bot, amount, txHash) {
  const langs = ['ru', 'en', 'fr', 'es'];
  const labels = {
    ru: { sub: 'COGNIQ навсегда выведены из оборота', tx: 'TX Hash' },
    en: { sub: 'COGNIQ permanently removed from supply', tx: 'TX Hash' },
    fr: { sub: 'COGNIQ retirés définitivement de la circulation', tx: 'TX Hash' },
    es: { sub: 'COGNIQ retirados permanentemente de circulación', tx: 'TX Hash' },
  };

  let bgStyle = 'background: #0b0f1a;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_burn.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0b0f1a;`;
  } catch(e) {
    console.error('[burnCard] image not found, using fallback bg:', e.message);
  }

  const html = (lang) => {
    const l = labels[lang];
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:600px; height:600px; font-family:-apple-system,sans-serif; overflow:hidden; position:relative; ${bgStyle} }
.grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,80,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,80,0,0.04) 1px,transparent 1px); background-size:40px 40px; }
.content { position:absolute; bottom:32px; left:0; right:0; z-index:10; display:flex; flex-direction:column; align-items:center; gap:10px; padding:0 40px; }
.amount { font-size:52px; font-weight:900; line-height:1; background:linear-gradient(135deg,#ffffff,#ff4400); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 2px 14px rgba(0,0,0,1)); }
.cogniq { font-size:18px; font-weight:700; color:#ff8844; opacity:0.9; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
.sub { font-size:13px; color:rgba(255,150,80,0.7); text-align:center; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
.tx { font-size:11px; color:#885533; font-family:monospace; background:rgba(255,60,0,0.08); border:1px solid rgba(255,60,0,0.2); border-radius:8px; padding:5px 12px; text-shadow:0 1px 4px rgba(0,0,0,0.9); }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="amount">${amount.toLocaleString()}</div>
  <div class="cogniq">COGNIQ</div>
  <div class="sub">${l.sub}</div>
  <div class="tx">${l.tx}: ${txHash.slice(0, 24)}...</div>
</div>
</body></html>`;
  };

  for (const lang of langs) {
    try {
      const imgBuffer = await queuedHtmlToImage(html(lang), 600, 600);
      const caption = lang === 'ru'
        ? `🔥 Сожжено <b>${amount.toLocaleString()} COGNIQ</b>\n\n<a href="https://tonviewer.com/transaction/${txHash}">Посмотреть транзакцию</a>`
        : lang === 'en'
        ? `🔥 <b>${amount.toLocaleString()} COGNIQ</b> burned\n\n<a href="https://tonviewer.com/transaction/${txHash}">View transaction</a>`
        : lang === 'fr'
        ? `🔥 <b>${amount.toLocaleString()} COGNIQ</b> brûlés\n\n<a href="https://tonviewer.com/transaction/${txHash}">Voir la transaction</a>`
        : `🔥 <b>${amount.toLocaleString()} COGNIQ</b> quemados\n\n<a href="https://tonviewer.com/transaction/${txHash}">Ver transacción</a>`;
      await bot.telegram.sendPhoto(process.env.CHANNEL_ID, { source: imgBuffer }, { caption, parse_mode: 'HTML' });
    } catch(e) { console.error(`[BURN] card lang=${lang} error:`, e.message); }
  }
}
// ===== BETA TESTER CARD =====
async function postBetaCard(bot, telegramId, lang = 'en') {
  const texts = {
    ru: { badge: 'БЕТА-ТЕСТЕР', title: 'ТЫ В КОМАНДЕ!', sub: 'NEURON BETA TESTER PROGRAM', line2: 'Все наигранные COGNIQ — твои навсегда', bonus: 'Бонус за активность до', bonusVal: '10 000 COGNIQ', footer: 'Играй · Находи баги · Зарабатывай' },
    en: { badge: 'BETA TESTER', title: "YOU'RE IN THE TEAM!", sub: 'NEURON BETA TESTER PROGRAM', line2: 'All earned COGNIQ stays yours forever', bonus: 'Activity bonus up to', bonusVal: '10,000 COGNIQ', footer: 'Play · Find bugs · Earn' },
    fr: { badge: 'BÊTA TESTEUR', title: "TU ES DANS L'ÉQUIPE !", sub: 'NEURON BETA TESTER PROGRAM', line2: 'Tous tes COGNIQ gagnés restent à toi', bonus: "Bonus d'activité jusqu'à", bonusVal: '10 000 COGNIQ', footer: 'Joue · Trouve les bugs · Gagne' },
    es: { badge: 'BETA TESTER', title: '¡ESTÁS EN EL EQUIPO!', sub: 'NEURON BETA TESTER PROGRAM', line2: 'Todos tus COGNIQ ganados son tuyos para siempre', bonus: 'Bonus por actividad hasta', bonusVal: '10.000 COGNIQ', footer: 'Juega · Encuentra bugs · Gana' }
  };
  const t = texts[lang] || texts['en'];

  let bgStyle = 'background: #0a0a0f;';
  try {
    const imgPath = path.join(__dirname, 'public', 'images', 'cogniq', 'cogniq_beta.webp');
    const imgData = fs.readFileSync(imgPath);
    const base64 = imgData.toString('base64');
    bgStyle = `background: url('data:image/png;base64,${base64}') center center/cover no-repeat; background-color: #0a0a0f;`;
  } catch(e) {
    console.error('[betaCard] image not found, using fallback bg:', e.message);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:600px; height:600px; font-family:'Segoe UI',Arial,sans-serif; overflow:hidden; position:relative; ${bgStyle} }
.grid { position:absolute; inset:0; background-image:linear-gradient(rgba(168,85,247,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.04) 1px,transparent 1px); background-size:40px 40px; }
.content { position:absolute; bottom:28px; left:0; right:0; z-index:10; padding:0 32px; display:flex; flex-direction:column; gap:12px; }
.badge { background:linear-gradient(135deg,#a855f7,#ec4899); border-radius:8px; padding:5px 14px; font-size:11px; font-weight:800; letter-spacing:2.5px; color:#fff; text-transform:uppercase; align-self:flex-start; }
.main-title { font-size:34px; font-weight:900; line-height:1; background:linear-gradient(135deg,#c084fc,#f472b6,#fb923c); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 2px 10px rgba(0,0,0,1)); }
.sub-title { font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:3px; text-transform:uppercase; text-shadow:0 1px 6px rgba(0,0,0,0.9); }
.info-line { display:flex; align-items:center; gap:8px; }
.dot { width:6px; height:6px; border-radius:50%; background:linear-gradient(135deg,#a855f7,#ec4899); box-shadow:0 0 6px rgba(168,85,247,0.7); flex-shrink:0; }
.info-text { font-size:13px; color:rgba(255,255,255,0.6); text-shadow:0 1px 6px rgba(0,0,0,0.9); }
.bonus-block { background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); border-radius:12px; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; }
.bonus-label { font-size:12px; color:rgba(255,255,255,0.4); text-shadow:0 1px 4px rgba(0,0,0,0.9); }
.bonus-val { font-size:18px; font-weight:900; background:linear-gradient(135deg,#a855f7,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.bonus-lightning { font-size:18px; }
.footer-row { display:flex; align-items:center; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.07); padding-top:10px; }
.footer-text { font-size:11px; color:rgba(255,255,255,0.25); letter-spacing:2px; text-shadow:0 1px 4px rgba(0,0,0,0.9); }
.neon-line { width:80px; height:2px; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.6),transparent); border-radius:1px; }
</style></head><body>
<div class="grid"></div>
<div class="content">
  <div class="badge">${t.badge}</div>
  <div class="main-title">${t.title}</div>
  <div class="sub-title">${t.sub}</div>
  <div class="info-line"><div class="dot"></div><div class="info-text">${t.line2}</div></div>
  <div class="bonus-block">
    <div><div class="bonus-label">${t.bonus}</div><div class="bonus-val">${t.bonusVal}</div></div>
    <div class="bonus-lightning">⚡</div>
  </div>
  <div class="footer-row">
    <div class="neon-line"></div>
    <div class="footer-text">${t.footer}</div>
    <div class="neon-line"></div>
  </div>
</div>
</body></html>`;

  try {
    const buffer = await queuedHtmlToImage(html, 600, 600);
    await bot.telegram.sendPhoto(telegramId, { source: buffer });
  } catch(e) {
    console.error('[betaCard] error:', e.message);
  }
}

module.exports = { generateStreakWarningCard, generateStreakMilestoneCard, generateQuestionOfDayCard, generateWelcomeCard, generateWeeklyTopCard, generateReferralReferrerCard, generateReferralNewUserCard, generateWeeklyHeroesCard, generateStreakBattleCard, generateFactOfDayCard, generateRankRatingCard, generateAchievementCard, generatePurchaseCard, generateExchangeCard, generateTransferReceivedCard, postBurnCard, postBetaCard };
