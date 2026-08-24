// ==================== ДУЭЛИ (отдельный модуль) ====================

// Делаем все функции глобальными
window.DUEL_LANG = DUEL_LANG;
window.loadDuelPanel = loadDuelPanel;
window.duelBackToMenu = duelBackToMenu;
window.duelCreate = duelCreate;
window.duelShareInvite = duelShareInvite;
window.duelCopyLink = duelCopyLink;
window.duelCancel = duelCancel;
window.duelAcceptInvite = duelAcceptInvite;
window.loadDuelJoinPanel = loadDuelJoinPanel;

const DUEL_LANG = {
  ru: { 
    title: 'Дуэли', 
    subtitle: '1 на 1 • 10 вопросов • ставка', 
    desc: 'Брось вызов другу или найди соперника. Ставки: 100 / 500 / 1000 COGNIQ. Победитель забирает банк, 5% сжигается навсегда.', 
    waiting: 'Ожидание соперника...', 
    shareInvite: 'Отправить приглашение', 
    copyLink: 'Скопировать ссылку', 
    copied: '✅ Скопировано!', 
    backBtn: '← Назад', 
    errBalance: 'Недостаточно COGNIQ', 
    errCreate: 'Не удалось создать дуэль', 
    errConnect: 'Ошибка связи',
    cancelDuel: 'Отменить дуэль',
    cancelConfirm: 'Отменить дуэль и вернуть ставку?',
    roundLabel: 'Раунд',
    of: 'из',
    timeToAnswer: '⏱️ Время на ответ',
    yourAnswer: 'Ваш ответ',
    opponentAnswer: 'Ответ соперника',
    waitingOpponent: 'Ждём соперника...',
    youWin: '🏆 Вы победили!',
    youLose: '😢 Вы проиграли',
    draw: '🤝 Ничья! Ставки возвращены',
    duelFinished: '⚔️ Дуэль завершена!',
    returnToMenu: '← Вернуться в меню',
    opponentNotFound: 'Соперник не найден',
    duelCancelled: 'Дуэль отменена'
  },
  en: { 
    title: 'Duels', 
    subtitle: '1 vs 1 • 10 questions • stake', 
    desc: 'Challenge a friend or find an opponent. Stakes: 100 / 500 / 1000 COGNIQ. Winner takes the pot, 5% burned forever.', 
    waiting: 'Waiting for opponent...', 
    shareInvite: 'Send invite', 
    copyLink: 'Copy link', 
    copied: '✅ Copied!', 
    backBtn: '← Back', 
    errBalance: 'Not enough COGNIQ', 
    errCreate: 'Could not create duel', 
    errConnect: 'Connection error',
    cancelDuel: 'Cancel duel',
    cancelConfirm: 'Cancel duel and refund stake?',
    roundLabel: 'Round',
    of: 'of',
    timeToAnswer: '⏱️ Time to answer',
    yourAnswer: 'Your answer',
    opponentAnswer: 'Opponent answer',
    waitingOpponent: 'Waiting for opponent...',
    youWin: '🏆 You win!',
    youLose: '😢 You lose',
    draw: '🤝 Draw! Stakes refunded',
    duelFinished: '⚔️ Duel finished!',
    returnToMenu: '← Return to menu',
    opponentNotFound: 'Opponent not found',
    duelCancelled: 'Duel cancelled'
  },
  fr: { 
    title: 'Duels', 
    subtitle: '1 contre 1 • 10 questions • mise', 
    desc: 'Défiez un ami ou trouvez un adversaire. Mises: 100 / 500 / 1000 COGNIQ. Le gagnant prend le pot, 5% brûlés.', 
    waiting: 'Attente adversaire...', 
    shareInvite: 'Envoyer invitation', 
    copyLink: 'Copier lien', 
    copied: '✅ Copié !', 
    backBtn: '← Retour', 
    errBalance: 'COGNIQ insuffisants', 
    errCreate: 'Impossible de créer le duel', 
    errConnect: 'Erreur de connexion',
    cancelDuel: 'Annuler le duel',
    cancelConfirm: 'Annuler le duel et rembourser la mise ?',
    roundLabel: 'Manche',
    of: 'de',
    timeToAnswer: '⏱️ Temps de réponse',
    yourAnswer: 'Votre réponse',
    opponentAnswer: 'Réponse adversaire',
    waitingOpponent: 'Attente de l\'adversaire...',
    youWin: '🏆 Vous gagnez !',
    youLose: '😢 Vous perdez',
    draw: '🤝 Égalité ! Mises remboursées',
    duelFinished: '⚔️ Duel terminé !',
    returnToMenu: '← Retour au menu',
    opponentNotFound: 'Adversaire introuvable',
    duelCancelled: 'Duel annulé'
  },
  es: { 
    title: 'Duelos', 
    subtitle: '1 vs 1 • 10 preguntas • apuesta', 
    desc: 'Reta a un amigo o encuentra un oponente. Apuestas: 100 / 500 / 1000 COGNIQ. El ganador se lleva el bote, 5% quemado.', 
    waiting: 'Esperando oponente...', 
    shareInvite: 'Enviar invitación', 
    copyLink: 'Copiar enlace', 
    copied: '✅ ¡Copiado!', 
    backBtn: '← Volver', 
    errBalance: 'COGNIQ insuficientes', 
    errCreate: 'No se pudo crear el duelo', 
    errConnect: 'Error de conexión',
    cancelDuel: 'Cancelar duelo',
    cancelConfirm: '¿Cancelar duelo y devolver apuesta?',
    roundLabel: 'Ronda',
    of: 'de',
    timeToAnswer: '⏱️ Tiempo de respuesta',
    yourAnswer: 'Tu respuesta',
    opponentAnswer: 'Respuesta del oponente',
    waitingOpponent: 'Esperando oponente...',
    youWin: '🏆 ¡Ganas!',
    youLose: '😢 Pierdes',
    draw: '🤝 ¡Empate! Apuestas devueltas',
    duelFinished: '⚔️ ¡Duelo terminado!',
    returnToMenu: '← Volver al menú',
    opponentNotFound: 'Oponente no encontrado',
    duelCancelled: 'Duelo cancelado'
  }
};

let duelPollInterval = null;
let duelTimerInterval = null;
let duelCurrentRound = 0;
let duelTimeLeft = 15;
let duelAnswered = false;
let duelId = null;
let duelData = null;
let duelQuestions = [];
let duelTotalRounds = 10;
let duelScores = { score1: 0, score2: 0 };
let duelWaitingForOpponent = false;


function loadDuelPanel() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  root.innerHTML = '';
  
  const header = document.querySelector('.header');
  const footer = document.querySelector('footer');
  if (header) header.style.display = 'none';
  if (footer) footer.style.display = 'none';
  
  const duelContainer = document.createElement('div');
  duelContainer.id = 'duelContainer';
  duelContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:rgba(4,8,20,0.97);';
  
  duelContainer.innerHTML = `
    <div class="duel-panel" style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      <button onclick="duelBackToMenu()" style="background:none;border:none;color:#ffcc44;font-size:0.9rem;font-weight:700;padding:6px 0;margin-bottom:12px;cursor:pointer;">${t.backBtn}</button>

      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:1.6rem;font-weight:900;background:linear-gradient(90deg,#ffcc44,#e8d9a0,#ffcc44);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;">⚔️ ${t.title}</div>
        <div style="font-size:0.78rem;color:#7799bb;margin-top:4px;">${t.subtitle}</div>
      </div>

      <div style="background:rgba(10,20,38,0.6);border:1px solid rgba(255,204,68,0.25);border-radius:18px;padding:16px;margin-bottom:20px;">
        <p style="font-size:0.85rem;color:#c8c8dc;line-height:1.5;">${t.desc}</p>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button onclick="duelCreate(100)" style="flex:1;padding:14px 8px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(255,204,68,0.35);border-radius:14px;color:#ffcc44;font-size:0.85rem;font-weight:800;cursor:pointer;">100 COGNIQ</button>
        <button onclick="duelCreate(500)" style="flex:1;padding:14px 8px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(255,204,68,0.55);border-radius:14px;color:#ffcc44;font-size:0.85rem;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(255,204,68,0.2);">500 COGNIQ</button>
        <button onclick="duelCreate(1000)" style="flex:1;padding:14px 8px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(255,150,50,0.55);border-radius:14px;color:#ffaa44;font-size:0.85rem;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(255,150,50,0.25);">1000 COGNIQ</button>
      </div>

      <div id="duelWaitingBlock" style="display:none;"></div>
    </div>
  `;
  
  document.body.appendChild(duelContainer);
}


function duelBackToMenu() {
  if (duelPollInterval) { clearInterval(duelPollInterval); duelPollInterval = null; }
  if (duelTimerInterval) { clearInterval(duelTimerInterval); duelTimerInterval = null; }
  
  const container = document.getElementById('duelContainer');
  if (container) container.remove();
  
  const joinContainer = document.getElementById('duelJoinContainer');
  if (joinContainer) joinContainer.remove();
  
  const battleContainer = document.getElementById('duelBattleContainer');
  if (battleContainer) battleContainer.remove();
  
  const header = document.querySelector('.header');
  const footer = document.querySelector('footer');
  if (header) header.style.display = '';
  if (footer) footer.style.display = '';
  
  duelId = null;
  duelData = null;
  duelQuestions = [];
  duelAnswered = false;
  duelWaitingForOpponent = false;
  
  switchTab('game');
}


async function duelCreate(stake) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  try {
    const res = await authFetch(`${BASE_URL}/api/duel/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, stake })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || t.errCreate, 3000);
      return;
    }
    
    duelId = data.duelId;
    
    document.getElementById('duelWaitingBlock').innerHTML = `
      <div style="background:rgba(10,20,38,0.8);border:2px solid rgba(0,255,170,0.4);border-radius:18px;padding:20px;text-align:center;box-shadow:0 0 20px rgba(0,255,170,0.15);">
        <div style="font-size:0.95rem;font-weight:700;color:#00ffaa;margin-bottom:12px;">⏳ ${t.waiting}</div>
        <div style="font-size:0.75rem;color:#7799bb;margin-bottom:14px;">ID: ${data.duelId}</div>
        <button onclick="duelShareInvite('${data.inviteLink}', ${stake})" style="width:100%;padding:12px;background:rgba(0,255,170,0.1);border:1px solid rgba(0,255,170,0.4);border-radius:12px;color:#00ffaa;font-weight:700;font-size:0.88rem;cursor:pointer;margin-bottom:8px;">📤 ${t.shareInvite}</button>
        <button onclick="duelCopyLink('${data.inviteLink}', this)" style="width:100%;padding:12px;background:rgba(255,204,68,0.1);border:1px solid rgba(255,204,68,0.4);border-radius:12px;color:#ffcc44;font-weight:700;font-size:0.88rem;cursor:pointer;margin-bottom:8px;">🔗 ${t.copyLink}</button>
        <button onclick="duelCancel(${data.duelId})" style="width:100%;padding:12px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:12px;color:#ff6464;font-weight:700;font-size:0.88rem;cursor:pointer;">❌ ${t.cancelDuel}</button>
      </div>
    `;
    document.getElementById('duelWaitingBlock').style.display = 'block';
    
    duelStartPolling(data.duelId);
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}


function duelShareInvite(link, stake) {
  const shareText = `⚔️ Вызов на дуэль в NEURON!\nСтавка: ${stake} COGNIQ\nПримешь вызов?`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;
  
  if (tg && typeof tg.openTelegramLink === 'function') {
    tg.openTelegramLink(shareUrl);
    return;
  }
  if (tg && typeof tg.openLink === 'function') {
    tg.openLink(shareUrl);
    return;
  }
  window.open(shareUrl, '_blank');
}


function duelCopyLink(link, btn) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  const showSuccess = () => {
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = t.copied;
      btn.style.color = '#00ffaa';
      setTimeout(() => { btn.innerHTML = originalText; btn.style.color = '#ffcc44'; }, 2000);
    } else {
      showToast(t.copied, 2000);
    }
  };
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(showSuccess).catch(() => {
      prompt('Copy:', link);
      showSuccess();
    });
  } else {
    prompt('Copy:', link);
    showSuccess();
  }
}


async function duelCancel(duelIdParam) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  if (!confirm(t.cancelConfirm)) return;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/duel/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, duel_id: duelIdParam })
    });
    const data = await res.json();
    if (data.success) {
      showToast(t.duelCancelled, 2000);
      if (duelPollInterval) { clearInterval(duelPollInterval); duelPollInterval = null; }
      duelBackToMenu();
      loadWelcome();
    } else {
      showToast(data.message || t.errConnect, 3000);
    }
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}


function duelStartPolling(duelIdParam) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  if (duelPollInterval) clearInterval(duelPollInterval);
  
  duelPollInterval = setInterval(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelIdParam}`);
      const data = await res.json();
      
      if (!data.success) return;
      
      if (data.duel.status === 'cancelled') {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        showToast(t.duelCancelled, 2000);
        duelBackToMenu();
        return;
      }
      
      if (data.duel.status === 'active' && data.duel.player2) {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        duelStartBattle(duelIdParam, data.duel);
      }
    } catch (e) {}
  }, 2000);
}


function duelStartBattle(duelIdParam, duelDataParam) {
  duelId = duelIdParam;
  duelData = duelDataParam;
  duelQuestions = duelDataParam.questions || [];
  duelTotalRounds = duelQuestions.length || 10;
  duelCurrentRound = 1;
  duelTimeLeft = 15;
  duelAnswered = false;
  duelScores = { score1: duelDataParam.score1 || 0, score2: duelDataParam.score2 || 0 };
  
  const container = document.getElementById('duelContainer');
  if (container) container.remove();
  
  const joinContainer = document.getElementById('duelJoinContainer');
  if (joinContainer) joinContainer.remove();
  
  duelRenderBattleScreen();
}


function duelRenderBattleScreen() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  const p1Name = duelData?.player1?.nick || 'Игрок 1';
  const p2Name = duelData?.player2?.nick || 'Игрок 2';
  
  root.innerHTML = '';
  
  const battleContainer = document.createElement('div');
  battleContainer.id = 'duelBattleContainer';
  battleContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:rgba(4,8,20,0.97);';
  
  battleContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      <div style="background:rgba(10,20,38,0.7);border:2px solid rgba(255,204,68,0.3);border-radius:20px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="text-align:center;flex:1;">
            <div style="width:60px;height:60px;border-radius:50%;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;">👤</div>
            <div style="font-size:0.8rem;font-weight:700;color:#00ffaa;">${escapeHtml(p1Name)}</div>
            <div style="font-size:1.4rem;font-weight:900;color:#fff;margin-top:4px;" id="duelScore1">${duelScores.score1}</div>
          </div>
          
          <div style="text-align:center;padding:0 12px;">
            <div style="font-size:1.2rem;font-weight:900;color:#ffcc44;">VS</div>
            <div style="font-size:0.7rem;color:#7799bb;margin-top:4px;">${t.roundLabel} <span id="duelRoundNum">${duelCurrentRound}</span>/${duelTotalRounds}</div>
          </div>
          
          <div style="text-align:center;flex:1;">
            <div style="width:60px;height:60px;border-radius:50%;background:rgba(255,100,100,0.2);border:2px solid #ff6464;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;">👤</div>
            <div style="font-size:0.8rem;font-weight:700;color:#ff6464;">${escapeHtml(p2Name)}</div>
            <div style="font-size:1.4rem;font-weight:900;color:#fff;margin-top:4px;" id="duelScore2">${duelScores.score2}</div>
          </div>
        </div>
        
        <div style="text-align:center;padding:10px;background:rgba(0,0,0,0.4);border-radius:12px;">
          <div style="font-size:0.75rem;color:#7799bb;margin-bottom:4px;">${t.timeToAnswer}</div>
          <div id="duelTimer" style="font-size:2rem;font-weight:900;color:#ffcc44;">15</div>
        </div>
      </div>
      
      <div id="duelQuestionBlock" style="background:rgba(10,20,38,0.7);border:2px solid rgba(255,204,68,0.3);border-radius:16px;padding:16px;margin-bottom:16px;min-height:100px;display:flex;align-items:center;justify-content:center;">
        <div style="font-size:1.1rem;font-weight:600;color:#fff;text-align:center;">${t.waitingOpponent}</div>
      </div>
      
      <div id="duelAnswersBlock" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
      </div>
      
      <div id="duelRoundResult" style="display:none;text-align:center;padding:12px;background:rgba(0,255,170,0.1);border:1px solid rgba(0,255,170,0.3);border-radius:12px;margin-bottom:16px;">
        <div style="font-size:1.1rem;font-weight:700;color:#00ffaa;"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(battleContainer);
  
  duelLoadQuestion();
}


async function duelLoadQuestion() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  try {
    const stateRes = await authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelId}`);
    const stateData = await stateRes.json();
    if (stateData.success) {
      const serverRound = stateData.duel.currentRound || 0;
      duelCurrentRound = serverRound + 1;
      
      if (stateData.duel.score1 !== undefined) {
        duelScores.score1 = stateData.duel.score1;
        const el1 = document.getElementById('duelScore1');
        if (el1) el1.textContent = stateData.duel.score1;
      }
      if (stateData.duel.score2 !== undefined) {
        duelScores.score2 = stateData.duel.score2;
        const el2 = document.getElementById('duelScore2');
        if (el2) el2.textContent = stateData.duel.score2;
      }
      
      if (stateData.duel.questions && stateData.duel.questions.length > 0) {
        duelQuestions = stateData.duel.questions;
      }
      
      if (stateData.duel.status === 'finished') {
        duelFinishBattle();
        return;
      }
    }
  } catch (e) {}
  
  const roundEl = document.getElementById('duelRoundNum');
  if (roundEl) roundEl.textContent = duelCurrentRound;
  
  duelTimeLeft = 15;
  duelAnswered = false;
  
  const timerEl = document.getElementById('duelTimer');
  if (timerEl) timerEl.textContent = '15';
  
  if (duelQuestions.length >= duelCurrentRound) {
    const question = duelQuestions[duelCurrentRound - 1];
    if (question) {
      duelRenderQuestion(question);
      duelStartTimer();
      return;
    }
  }
}


function duelRenderQuestion(question) {
  const questionEl = document.getElementById('duelQuestionBlock');
  const answersEl = document.getElementById('duelAnswersBlock');
  
  if (questionEl) {
    questionEl.innerHTML = `<div style="font-size:1.1rem;font-weight:600;color:#fff;text-align:center;">${escapeHtml(question.text)}</div>`;
  }
  
  if (answersEl) {
    answersEl.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    question.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:14px;background:rgba(0,0,0,0.5);border:2px solid rgba(255,204,68,0.3);border-radius:12px;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;';
      btn.innerHTML = `<div style="color:#ffcc44;font-size:0.75rem;margin-bottom:4px;">${letters[idx]}</div><div>${escapeHtml(opt)}</div>`;
      btn.onclick = () => duelHandleAnswer(idx);
      answersEl.appendChild(btn);
    });
  }
}


function duelStartTimer() {
  if (duelTimerInterval) clearInterval(duelTimerInterval);
  
  duelTimerInterval = setInterval(() => {
    duelTimeLeft--;
    const timerEl = document.getElementById('duelTimer');
    if (timerEl) {
      timerEl.textContent = duelTimeLeft;
      if (duelTimeLeft <= 5) timerEl.style.color = '#ff6464';
      if (duelTimeLeft <= 0) {
        clearInterval(duelTimerInterval);
        duelTimerInterval = null;
        if (!duelAnswered) {
          duelHandleAnswer(-1);
        }
      }
    }
  }, 1000);
}


async function duelHandleAnswer(answerIdx) {
  if (duelAnswered) return;
  duelAnswered = true;
  
  if (duelTimerInterval) {
    clearInterval(duelTimerInterval);
    duelTimerInterval = null;
  }
  
  const timeMs = (15 - duelTimeLeft) * 1000;
  
  const resultEl = document.getElementById('duelRoundResult');
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.querySelector('div').textContent = '⏳ Отправка ответа...';
  }
  
  try {
    const res = await authFetch(`${BASE_URL}/api/duel/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        duel_id: duelId,
        round: duelCurrentRound,
        answer_idx: answerIdx,
        time_ms: timeMs
      })
    });
    const data = await res.json();
    
    if (!data.success) {
      if (resultEl) {
        resultEl.querySelector('div').textContent = data.message || 'Ошибка';
        resultEl.style.background = 'rgba(255,100,100,0.1)';
        resultEl.style.borderColor = 'rgba(255,100,100,0.3)';
      }
      return;
    }
    
    const buttons = document.querySelectorAll('#duelAnswersBlock button');
    if (data.correctIndex !== undefined && buttons[data.correctIndex]) {
      buttons[data.correctIndex].style.background = 'rgba(0,255,170,0.3)';
      buttons[data.correctIndex].style.borderColor = '#00ffaa';
    }
    if (answerIdx >= 0 && !data.isCorrect && buttons[answerIdx]) {
      buttons[answerIdx].style.background = 'rgba(255,100,100,0.3)';
      buttons[answerIdx].style.borderColor = '#ff6464';
    }
    
    if (data.newScore1 !== undefined) {
      duelScores.score1 = data.newScore1;
      const el1 = document.getElementById('duelScore1');
      if (el1) el1.textContent = data.newScore1;
    }
    if (data.newScore2 !== undefined) {
      duelScores.score2 = data.newScore2;
      const el2 = document.getElementById('duelScore2');
      if (el2) el2.textContent = data.newScore2;
    }
    
    const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
    const resultText = data.isCorrect 
      ? `✅ Правильно! +${data.points} очков` 
      : answerIdx === -1 
        ? '⏱️ Время вышло!' 
        : '❌ Неправильно';
    
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.querySelector('div').textContent = resultText;
      resultEl.style.background = data.isCorrect ? 'rgba(0,255,170,0.1)' : 'rgba(255,100,100,0.1)';
      resultEl.style.borderColor = data.isCorrect ? 'rgba(0,255,170,0.3)' : 'rgba(255,100,100,0.3)';
    }
    
    if (data.bothAnswered) {
      if (data.duelFinished) {
        setTimeout(() => duelFinishBattle(), 2000);
      } else {
        setTimeout(() => {
          if (resultEl) resultEl.style.display = 'none';
          duelCurrentRound = duelCurrentRound + 1;
          duelLoadQuestion();
        }, 2500);
      }
    } else {
      if (resultEl) {
        resultEl.querySelector('div').textContent = resultText + ' — ' + t.waitingOpponent;
      }
      duelWaitForOpponent();
    }
    
  } catch (e) {
    if (resultEl) {
      resultEl.querySelector('div').textContent = t.errConnect;
      resultEl.style.background = 'rgba(255,100,100,0.1)';
      resultEl.style.borderColor = 'rgba(255,100,100,0.3)';
    }
  }
}


function duelWaitForOpponent() {
  if (duelPollInterval) clearInterval(duelPollInterval);
  
  let pollCount = 0;
  const maxPolls = 90;
  
  duelPollInterval = setInterval(async () => {
    pollCount++;
    if (pollCount > maxPolls) {
      clearInterval(duelPollInterval);
      duelPollInterval = null;
      return;
    }
    
    try {
      const res = await authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelId}`);
      const data = await res.json();
      
      if (!data.success) return;
      
      const serverRound = data.duel.currentRound || 0;
      
      if (serverRound >= duelCurrentRound) {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        
        if (data.duel.score1 !== undefined) {
          duelScores.score1 = data.duel.score1;
          const el1 = document.getElementById('duelScore1');
          if (el1) el1.textContent = data.duel.score1;
        }
        if (data.duel.score2 !== undefined) {
          duelScores.score2 = data.duel.score2;
          const el2 = document.getElementById('duelScore2');
          if (el2) el2.textContent = data.duel.score2;
        }
        
        if (data.duel.status === 'finished') {
          setTimeout(() => duelFinishBattle(), 1000);
        } else {
          const resultEl = document.getElementById('duelRoundResult');
          if (resultEl) resultEl.style.display = 'none';
          setTimeout(() => {
            duelCurrentRound = serverRound + 1;
            duelLoadQuestion();
          }, 1500);
        }
      }
    } catch (e) {}
  }, 2000);
}


function duelFinishBattle() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  if (duelPollInterval) { clearInterval(duelPollInterval); duelPollInterval = null; }
  if (duelTimerInterval) { clearInterval(duelTimerInterval); duelTimerInterval = null; }
  
  authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelId}`)
    .then(r => r.json())
    .then(data => {
      let resultText;
      let resultColor;
      
      if (data.success) {
        duelScores.score1 = data.duel.score1 || duelScores.score1;
        duelScores.score2 = data.duel.score2 || duelScores.score2;
        
        const myId = String(userId);
        const winnerId = data.duel.winnerId ? String(data.duel.winnerId) : null;
        
        if (!winnerId) {
          resultText = t.draw;
          resultColor = '#ffcc44';
        } else if (winnerId === myId) {
          resultText = t.youWin;
          resultColor = '#00ffaa';
        } else {
          resultText = t.youLose;
          resultColor = '#ff6464';
        }
      } else {
        resultText = t.duelFinished;
        resultColor = '#ffcc44';
      }
      
      const p1Name = duelData?.player1?.nick || 'Игрок 1';
      const p2Name = duelData?.player2?.nick || 'Игрок 2';
      
      const battleContainer = document.getElementById('duelBattleContainer');
      if (battleContainer) {
        battleContainer.innerHTML = `
          <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
            <div style="font-size:1.8rem;font-weight:900;color:${resultColor};margin-bottom:12px;">${resultText}</div>
            <div style="background:rgba(10,20,38,0.7);border:2px solid rgba(255,204,68,0.3);border-radius:16px;padding:20px;margin-bottom:20px;">
              <div style="display:flex;justify-content:space-around;align-items:center;">
                <div>
                  <div style="color:#00ffaa;font-size:0.9rem;">${escapeHtml(p1Name)}</div>
                  <div style="font-size:2rem;font-weight:900;color:#fff;">${duelScores.score1}</div>
                </div>
                <div style="font-size:1.5rem;color:#7799bb;">VS</div>
                <div>
                  <div style="color:#ff6464;font-size:0.9rem;">${escapeHtml(p2Name)}</div>
                  <div style="font-size:2rem;font-weight:900;color:#fff;">${duelScores.score2}</div>
                </div>
              </div>
            </div>
            <button onclick="duelBackToMenu()" style="width:100%;padding:16px;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;border-radius:14px;color:#00ffaa;font-size:1rem;font-weight:700;cursor:pointer;">${t.returnToMenu}</button>
          </div>
        `;
      }
    })
    .catch(() => {
      const battleContainer = document.getElementById('duelBattleContainer');
      if (battleContainer) {
        battleContainer.innerHTML = `
          <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
            <div style="font-size:1.8rem;font-weight:900;color:#ffcc44;margin-bottom:12px;">${t.duelFinished}</div>
            <button onclick="duelBackToMenu()" style="width:100%;padding:16px;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;border-radius:14px;color:#00ffaa;font-size:1rem;font-weight:700;cursor:pointer;">${t.returnToMenu}</button>
          </div>
        `;
      }
    });
}


function loadDuelJoinPanel(duelIdParam) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  root.innerHTML = '';
  
  const joinContainer = document.createElement('div');
  joinContainer.id = 'duelJoinContainer';
  joinContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:rgba(4,8,20,0.97);';
  
  joinContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
      <div style="font-size:3rem;margin-bottom:16px;">⚔️</div>
      <div style="font-size:1.5rem;font-weight:900;color:#ffcc44;margin-bottom:8px;">${t.title}</div>
      <div style="color:#7799bb;margin-bottom:24px;">ID: ${duelIdParam}</div>
      
      <div id="duelJoinLoader" style="padding:20px;color:#ffcc44;">⏳ Проверяем дуэль...</div>
      
      <div id="duelJoinActions" style="display:none;flex-direction:column;gap:12px;">
        <div style="background:rgba(10,20,38,0.7);border:1px solid rgba(255,204,68,0.3);border-radius:12px;padding:16px;margin-bottom:16px;">
          <div style="color:#7799bb;font-size:0.8rem;">${t.subtitle}</div>
          <div style="color:#fff;font-size:1.5rem;font-weight:800;" id="joinStakeAmount">0 COGNIQ</div>
        </div>
        <button onclick="duelAcceptInvite(${duelIdParam})" style="width:100%;padding:16px;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;border-radius:14px;color:#00ffaa;font-size:1rem;font-weight:700;cursor:pointer;">⚔️ ${t.title}</button>
        <button onclick="duelBackToMenu()" style="width:100%;padding:14px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:14px;color:#ff6464;font-size:0.9rem;font-weight:600;cursor:pointer;">${t.backBtn}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(joinContainer);
  
  authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelIdParam}`)
    .then(r => r.json())
    .then(data => {
      const loader = document.getElementById('duelJoinLoader');
      if (!loader) return;
      
      loader.style.display = 'none';
      if (data.success && data.duel.status === 'waiting') {
        const stakeEl = document.getElementById('joinStakeAmount');
        if (stakeEl) stakeEl.textContent = data.duel.stake + ' COGNIQ';
        const actions = document.getElementById('duelJoinActions');
        if (actions) actions.style.display = 'flex';
      } else {
        loader.style.display = 'block';
        loader.textContent = t.opponentNotFound || 'Дуэль не найдена';
        loader.style.color = '#ff6464';
      }
    })
    .catch(() => {
      const loader = document.getElementById('duelJoinLoader');
      if (loader) {
        loader.style.display = 'block';
        loader.textContent = t.errConnect || 'Ошибка';
        loader.style.color = '#ff6464';
      }
    });
}


async function duelAcceptInvite(duelIdParam) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/duel/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, duel_id: duelIdParam })
    });
    const data = await res.json();
    
    if (data.success) {
      const joinContainer = document.getElementById('duelJoinContainer');
      if (joinContainer) joinContainer.remove();
      
      const stateRes = await authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelIdParam}`);
      const stateData = await stateRes.json();
      if (stateData.success) {
        duelStartBattle(duelIdParam, stateData.duel);
      }
    } else {
      showToast(data.message || t.errConnect, 3000);
    }
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.DUEL_LANG = DUEL_LANG;
window.loadDuelPanel = loadDuelPanel;
window.duelBackToMenu = duelBackToMenu;
window.duelCreate = duelCreate;
window.duelShareInvite = duelShareInvite;
window.duelCopyLink = duelCopyLink;
window.duelCancel = duelCancel;
window.duelAcceptInvite = duelAcceptInvite;
window.loadDuelJoinPanel = loadDuelJoinPanel;
