// ==================== ДУЭЛИ (отдельный модуль) ====================

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
    youWin: 'Вы победили!',
    youLose: 'Вы проиграли',
    draw: 'Ничья! Ставки возвращены',
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
    youWin: 'You win!',
    youLose: 'You lose',
    draw: 'Draw! Stakes refunded',
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
    youWin: 'Vous gagnez !',
    youLose: 'Vous perdez',
    draw: 'Égalité ! Mises remboursées',
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
    youWin: '¡Ganas!',
    youLose: 'Pierdes',
    draw: '¡Empate! Apuestas devueltas',
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
  
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  
  const duelContainer = document.createElement('div');
  duelContainer.id = 'duelContainer';
  duelContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:transparent;';
  
  duelContainer.innerHTML = `
    <div class="duel-panel" style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      
      <!-- Назад -->
      <button onclick="duelBackToMenu()" style="
        position:relative;
        width:100px;
        height:50px;
        padding:0;
        background:none;
        border:none;
        cursor:pointer;
        transition:all 0.2s;
        overflow:hidden;
        margin-bottom:20px;
      " onmouseover="this.style.transform='translateY(-3px)';this.style.filter='brightness(1.15)'" 
         onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
        <img src="/main/btn_duel_back.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
      </button>

     <!-- Логотип дуэли -->
      <div style="text-align:center;margin-bottom:24px;position:relative;">
        <img src="/main/duel_logo_${currentLang}.webp" 
             alt="Duel" 
             style="width:260px;height:auto;display:block;margin:0 auto;filter:drop-shadow(0 0 25px rgba(255,204,68,0.35));">
      </div> 

      <!-- Описание с платиновой рамкой -->
      <div style="
        background:rgba(10,15,30,0.35);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:20px;
        padding:18px 16px;
        margin-bottom:24px;
        box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter:blur(8px);
      ">
        <p style="
          font-size:0.87rem;
          background:linear-gradient(90deg,#d4d4d8 0%,#ffffff 50%,#d4d4d8 100%);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          line-height:1.55;
          margin:0;
          text-align:center;
          font-weight:500;
          letter-spacing:0.3px;
        ">${t.desc}</p>
      </div>

      <!-- Ставки -->
      <div style="
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:10px;
        margin-bottom:20px;
      ">
        <!-- 100 -->
        <button onclick="duelCreate(100)" style="
          position:relative;
          width:100%;
          height:90px;
          padding:0;
          background:none;
          border:none;
          cursor:pointer;
          transition:all 0.2s;
          overflow:hidden;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.filter='brightness(1.15)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_stake.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <span style="font-size:0.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;margin-bottom:2px;text-shadow:0 0 4px rgba(0,0,0,0.8);">СТАВКА</span>
            <span style="font-size:1.3rem;color:#ffcc44;font-weight:900;line-height:1;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.4);">100</span>
            <span style="font-size:0.65rem;color:#ffcc44;font-weight:700;letter-spacing:0.5px;margin-top:3px;text-shadow:0 0 4px rgba(0,0,0,0.8);">COGNIQ</span>
          </div>
        </button>

        <!-- 500 (HOT) -->
        <button onclick="duelCreate(500)" style="
          position:relative;
          width:100%;
          height:90px;
          padding:0;
          background:none;
          border:none;
          cursor:pointer;
          transition:all 0.2s;
          overflow:hidden;
          animation:hotPulse 2s ease-in-out infinite;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.filter='brightness(1.2)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_stake.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
          <div style="
            position:absolute;
            top:4px;
            right:6px;
            background:rgba(0,255,170,0.25);
            color:#00ffaa;
            font-size:0.5rem;
            font-weight:800;
            padding:2px 5px;
            border-radius:6px;
            letter-spacing:0.5px;
            animation:badgePulse 1.5s ease-in-out infinite;
          ">HOT</div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <span style="font-size:0.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;margin-bottom:2px;text-shadow:0 0 4px rgba(0,0,0,0.8);">СТАВКА</span>
            <span style="font-size:1.3rem;color:#ffcc44;font-weight:900;line-height:1;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.4);">500</span>
            <span style="font-size:0.65rem;color:#ffcc44;font-weight:700;letter-spacing:0.5px;margin-top:3px;text-shadow:0 0 4px rgba(0,0,0,0.8);">COGNIQ</span>
          </div>
        </button>

        <!-- 1000 -->
        <button onclick="duelCreate(1000)" style="
          position:relative;
          width:100%;
          height:90px;
          padding:0;
          background:none;
          border:none;
          cursor:pointer;
          transition:all 0.2s;
          overflow:hidden;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.filter='brightness(1.15)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_stake.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <span style="font-size:0.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;margin-bottom:2px;text-shadow:0 0 4px rgba(0,0,0,0.8);">СТАВКА</span>
            <span style="font-size:1.3rem;color:#ffcc44;font-weight:900;line-height:1;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.4);">1000</span>
            <span style="font-size:0.65rem;color:#ffcc44;font-weight:700;letter-spacing:0.5px;margin-top:3px;text-shadow:0 0 4px rgba(0,0,0,0.8);">COGNIQ</span>
          </div>
        </button>
      </div>

      <!-- Блок ожидания (скрыт по умолчанию) -->
      <div id="duelWaitingBlock" style="display:none;"></div>
    </div>
  `;
  
  document.body.appendChild(duelContainer);
  
  // Добавляем CSS-анимации
  if (!document.getElementById('duelAnimations')) {
    const style = document.createElement('style');
    style.id = 'duelAnimations';
    style.textContent = `
      @keyframes glowPulse {
        0%, 100% { text-shadow: 0 0 30px rgba(255,204,68,0.3); }
        50% { text-shadow: 0 0 40px rgba(255,204,68,0.5), 0 0 60px rgba(255,204,68,0.3); }
      }
      @keyframes hotPulse {
        0%, 100% { box-shadow: 0 0 20px rgba(0,255,170,0.18), 0 4px 15px rgba(0,0,0,0.3); }
        50% { box-shadow: 0 0 30px rgba(0,255,170,0.3), 0 4px 15px rgba(0,0,0,0.3); }
      }
      @keyframes badgePulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }
}


function duelBackToMenu() {
  if (duelPollInterval) { clearInterval(duelPollInterval); duelPollInterval = null; }
  if (duelTimerInterval) { clearInterval(duelTimerInterval); duelTimerInterval = null; }

  if (window._duelCountdownInterval) { clearInterval(window._duelCountdownInterval); window._duelCountdownInterval = null; }
  
  const container = document.getElementById('duelContainer');
  if (container) container.remove();
  
  const joinContainer = document.getElementById('duelJoinContainer');
  if (joinContainer) joinContainer.remove();
  
  const battleContainer = document.getElementById('duelBattleContainer');
  if (battleContainer) battleContainer.remove();
  
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = '';
  
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
      <div style="
        background:rgba(10,15,30,0.8);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:18px;
        padding:20px;
        text-align:center;
        box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter:blur(8px);
      ">
        <div style="font-size:0.95rem;font-weight:700;color:#00ffaa;margin-bottom:8px;">⏳ ${t.waiting}</div>
        <div style="font-size:0.75rem;color:#d4d4d8;margin-bottom:14px;letter-spacing:0.5px;">ID: ${data.duelId}</div>
        
        <!-- ТАЙМЕР ОБРАТНОГО ОТСЧЁТА -->
        <div style="
          background:rgba(0,0,0,0.4);
          border-radius:12px;
          padding:10px;
          margin-bottom:16px;
          border:1px solid rgba(255,204,68,0.3);
        ">
          <div style="font-size:0.7rem;color:#d4d4d8;margin-bottom:4px;">Автоотмена через:</div>
          <div id="duelCountdown" style="font-size:1.8rem;font-weight:900;color:#ffcc44;text-shadow:0 0 10px rgba(255,204,68,0.4);">2:00</div>
        </div>
        
        <!-- Кнопки действий -->
        <button onclick="duelShareInvite('${data.inviteLink}', ${stake})" style="
          position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; margin-bottom:10px; border-radius:12px;
        " onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.15)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#00ffaa;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,255,170,0.4);">
             ${t.shareInvite}
          </div>
        </button>

        <button onclick="duelCopyLink('${data.inviteLink}', this)" style="
          position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; margin-bottom:10px; border-radius:12px;
        " onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.15)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#ffcc44;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,204,68,0.4);">
             ${t.copyLink}
          </div>
        </button>

        <button onclick="duelCancel(${data.duelId})" style="
          position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; border-radius:12px;
        " onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.15)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#ff6464;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,100,100,0.4);">
             ${t.cancelDuel}
          </div>
        </button>
      </div>
    `;
    document.getElementById('duelWaitingBlock').style.display = 'block';
    
    // 🔥 Запускаем локальный таймер для отображения
    let countdown = 120;
    const countdownEl = document.getElementById('duelCountdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownEl) {
        const mins = Math.floor(countdown / 60);
        const secs = countdown % 60;
        countdownEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        // Красный когда мало времени
        if (countdown <= 30) {
          countdownEl.style.color = '#ff6464';
          countdownEl.style.textShadow = '0 0 10px rgba(255,100,100,0.6)';
        }
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        if (countdownEl) {
          countdownEl.textContent = '0:00';
          countdownEl.style.color = '#ff6464';
        }
      }
    }, 1000);
    
    // Сохраняем интервал чтобы очистить при переходе
    window._duelCountdownInterval = countdownInterval;
    
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
      
      // 🔥 Сервер сам отменил дуэль по таймауту (2 минуты)
      if (data.timeExpired || data.duel.status === 'cancelled') {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        if (window._duelCountdownInterval) {
          clearInterval(window._duelCountdownInterval);
          window._duelCountdownInterval = null;
        }
        showToast('⏱️ Время вышло. Дуэль отменена, ставка возвращена.', 3000);
        setTimeout(() => duelBackToMenu(), 2000);
        return;
      }
      
      if (data.duel.status === 'active' && data.duel.player2) {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        if (window._duelCountdownInterval) {
          clearInterval(window._duelCountdownInterval);
          window._duelCountdownInterval = null;
        }
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

  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  
  duelRenderBattleScreen();
}


function duelRenderBattleScreen() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  const p1Name = duelData?.player1?.nick || 'Игрок 1';
  const p2Name = duelData?.player2?.nick || 'Игрок 2';
  const p1Photo = duelData?.player1?.photo || '';
  const p2Photo = duelData?.player2?.photo || '';
  
  root.innerHTML = '';
  
  const battleContainer = document.createElement('div');
  battleContainer.id = 'duelBattleContainer';
  battleContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:transparent;';
  
  battleContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      
      <!-- СТОЛ С ИГРОКАМИ (платиновая рамка) -->
      <div style="
        background:rgba(10,15,30,0.35);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:20px;
        padding:16px;
        margin-bottom:16px;
        box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter:blur(8px);
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          
          <!-- Игрок 1 -->
          <div style="text-align:center;flex:1;">
            ${p1Photo ? `
              <div style="width:75px;height:75px;border-radius:50%;border:2px solid #00ffaa;margin:0 auto 6px;overflow:hidden;background:rgba(0,255,170,0.2);">
                <img src="${p1Photo}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:2rem;">👤</div>
              </div>
            ` : `
              <div style="width:75px;height:75px;border-radius:50%;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:2rem;"></div>
            `}
            <div style="font-size:0.8rem;font-weight:700;color:#00ffaa;">${escapeHtml(p1Name)}</div>
            <div style="font-size:1.4rem;font-weight:900;color:#fff;margin-top:4px;" id="duelScore1">${duelScores.score1}</div>
          </div>
          
          <!-- VS -->
          <div style="text-align:center;padding:0 12px;">
            <div style="font-size:1.2rem;font-weight:900;color:#ffcc44;">VS</div>
            <div style="font-size:0.7rem;color:#d4d4d8;margin-top:4px;">${t.roundLabel} <span id="duelRoundNum">${duelCurrentRound}</span>/${duelTotalRounds}</div>
          </div>
          
          <!-- Игрок 2 -->
          <div style="text-align:center;flex:1;">
            ${p2Photo ? `
              <div style="width:75px;height:75px;border-radius:50%;border:2px solid #ff6464;margin:0 auto 6px;overflow:hidden;background:rgba(255,100,100,0.2);">
                <img src="${p2Photo}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:2rem;">👤</div>
              </div>
            ` : `
              <div style="width:75px;height:75px;border-radius:50%;background:rgba(255,100,100,0.2);border:2px solid #ff6464;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:2rem;">👤</div>
            `}
            <div style="font-size:0.8rem;font-weight:700;color:#ff6464;">${escapeHtml(p2Name)}</div>
            <div style="font-size:1.4rem;font-weight:900;color:#fff;margin-top:4px;" id="duelScore2">${duelScores.score2}</div>
          </div>
        </div>
        
        <!-- ТАЙМЕР (с пульсацией) -->
        <div style="text-align:center;padding:10px;background:rgba(0,0,0,0.4);border-radius:12px;">
          <div style="font-size:0.75rem;color:#d4d4d8;margin-bottom:4px;">${t.timeToAnswer}</div>
          <div id="duelTimer" style="font-size:2rem;font-weight:900;color:#ffcc44;animation:timerPulse 1s ease-in-out infinite;">15</div>
        </div>
      </div>
      
      <!-- ВОПРОС (платиновая рамка) -->
      <div id="duelQuestionBlock" style="
        background:rgba(10,15,30,0.35);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:16px;
        padding:16px;
        margin-bottom:16px;
        min-height:100px;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter:blur(8px);
      ">
        <div style="font-size:1.1rem;font-weight:600;color:#fff;text-align:center;">${t.waitingOpponent}</div>
      </div>
      
      <!-- ВАРИАНТЫ ОТВЕТОВ (платиновые кнопки) -->
      <div id="duelAnswersBlock" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
      </div>
      
      <!-- РЕЗУЛЬТАТ РАУНДА -->
      <div id="duelRoundResult" style="display:none;text-align:center;padding:12px;background:rgba(0,255,170,0.1);border:1px solid rgba(0,255,170,0.3);border-radius:12px;margin-bottom:16px;">
        <div style="font-size:1.1rem;font-weight:700;color:#00ffaa;"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(battleContainer);
  
  // Добавляем анимацию таймера
  if (!document.getElementById('duelBattleAnimations')) {
    const style = document.createElement('style');
    style.id = 'duelBattleAnimations';
    style.textContent = `
      @keyframes timerPulse {
        0%, 100% { text-shadow: 0 0 10px rgba(255,204,68,0.5); }
        50% { text-shadow: 0 0 20px rgba(255,204,68,0.8), 0 0 30px rgba(255,204,68,0.4); }
      }
    `;
    document.head.appendChild(style);
  }
  
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
      btn.style.cssText = `
        padding:14px;
        background:rgba(10,15,30,0.35);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:12px;
        color:#fff;
        font-size:0.9rem;
        font-weight:600;
        cursor:pointer;
        transition:all 0.2s;
        backdrop-filter:blur(8px);
      `;
      btn.innerHTML = `<div style="color:#ffcc44;font-size:0.75rem;margin-bottom:4px;font-weight:700;">${letters[idx]}</div><div>${escapeHtml(opt)}</div>`;
      btn.onmouseover = function() { this.style.transform='translateY(-2px)'; this.style.borderColor='rgba(220,220,225,0.8)'; this.style.boxShadow='0 4px 15px rgba(220,220,225,0.2)'; };
      btn.onmouseout = function() { this.style.transform='translateY(0)'; this.style.borderColor='rgba(220,220,225,0.5)'; this.style.boxShadow='none'; };
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

    if (data.isCorrect) {
    if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  } else {
    if (navigator.vibrate) navigator.vibrate(150);
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
  }

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
      let resultEmoji;
      
      if (data.success) {
        duelScores.score1 = data.duel.score1 || duelScores.score1;
        duelScores.score2 = data.duel.score2 || duelScores.score2;
        
        const myId = String(userId);
        const winnerId = data.duel.winnerId ? String(data.duel.winnerId) : null;
        
        if (!winnerId) {
          resultText = t.draw;
          resultColor = '#ffcc44';
          resultEmoji = '';
        } else if (winnerId === myId) {
          resultText = t.youWin;
          resultColor = '#00ffaa';
          resultEmoji = '🏆';
          if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 150]);
          if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          // Запускаем конфетти при победе!
          setTimeout(() => {
            if (typeof launchConfettiTop === 'function') launchConfettiTop();
          }, 300);
        } else {
          resultText = t.youLose;
          resultColor = '#ff6464';
          resultEmoji = '😢';
          if (navigator.vibrate) navigator.vibrate(150);
          if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
      } else {
        resultText = t.duelFinished;
        resultColor = '#ffcc44';
        resultEmoji = '️';
      }
      
      const p1Name = duelData?.player1?.nick || 'Игрок 1';
      const p2Name = duelData?.player2?.nick || 'Игрок 2';
      
      const battleContainer = document.getElementById('duelBattleContainer');
      if (battleContainer) {
        battleContainer.innerHTML = `
          <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
            
            <!-- Результат с платиновой рамкой -->
            <div style="
              background:rgba(10,15,30,0.35);
              border:1.5px solid rgba(220,220,225,0.5);
              border-radius:20px;
              padding:24px 16px;
              margin-bottom:20px;
              box-shadow:0 0 30px rgba(220,220,225,0.1), inset 0 1px 0 rgba(255,255,255,0.1);
              backdrop-filter:blur(8px);
            ">
              <div style="font-size:2rem;font-weight:900;color:${resultColor};margin-bottom:16px;text-shadow:0 0 20px ${resultColor}40;">
                ${resultEmoji} ${resultText}
              </div>
              
              <!-- Счёт -->
              <div style="display:flex;justify-content:space-around;align-items:center;padding:16px 0;">
                <div style="flex:1;">
                  <div style="color:#00ffaa;font-size:0.85rem;font-weight:700;margin-bottom:6px;">${escapeHtml(p1Name)}</div>
                  <div style="font-size:2.5rem;font-weight:900;color:#fff;text-shadow:0 0 15px rgba(255,255,255,0.3);">${duelScores.score1}</div>
                </div>
                <div style="font-size:1.5rem;color:#d4d4d8;padding:0 12px;">VS</div>
                <div style="flex:1;">
                  <div style="color:#ff6464;font-size:0.85rem;font-weight:700;margin-bottom:6px;">${escapeHtml(p2Name)}</div>
                  <div style="font-size:2.5rem;font-weight:900;color:#fff;text-shadow:0 0 15px rgba(255,255,255,0.3);">${duelScores.score2}</div>
                </div>
              </div>
            </div>
            
            <!-- Кнопка возврата (универсальная) -->
            <button onclick="duelBackToMenu()" style="
              position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; border-radius:12px;
            " onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.15)'" 
               onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
              <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
              <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#ffcc44;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.5);">
                ← ${t.returnToMenu.replace('← ','')}
              </div>
            </button>
          </div>
        `;
      }
    })
    .catch(() => {
      const battleContainer = document.getElementById('duelBattleContainer');
      if (battleContainer) {
        battleContainer.innerHTML = `
          <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
            <div style="
              background:rgba(10,15,30,0.35);
              border:1.5px solid rgba(220,220,225,0.5);
              border-radius:20px;
              padding:24px 16px;
              margin-bottom:20px;
              backdrop-filter:blur(8px);
            ">
              <div style="font-size:2rem;font-weight:900;color:#ffcc44;margin-bottom:16px;"> ${t.duelFinished}</div>
            </div>
            <button onclick="duelBackToMenu()" style="
              position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; border-radius:12px;
            ">
              <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
              <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#ffcc44;text-shadow:0 0 6px rgba(0,0,0,0.9);">
                ← ${t.returnToMenu.replace('← ','')}
              </div>
            </button>
          </div>
        `;
      }
    });
}


function loadDuelJoinPanel(duelIdParam) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  root.innerHTML = '';

  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  
  const joinContainer = document.createElement('div');
  joinContainer.id = 'duelJoinContainer';
  joinContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:transparent;';
  
  joinContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      
      <!-- Логотип дуэли -->
      <div style="text-align:center;margin-bottom:20px;">
        <img src="/main/duel_logo_${currentLang}.webp" 
             alt="Duel" 
             style="width:260px;height:auto;display:block;margin:0 auto;filter:drop-shadow(0 0 25px rgba(255,204,68,0.35));">
      </div>
      
      <!-- Информация о дуэли (платиновая рамка) -->
      <div style="
        background:rgba(10,15,30,0.35);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:20px;
        padding:20px 16px;
        margin-bottom:20px;
        box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter:blur(8px);
        text-align:center;
      ">
        <div style="font-size:0.82rem;color:#8ba3c1;letter-spacing:0.5px;margin-bottom:8px;">1 на 1 • 10 вопросов • ставка</div>
        <div style="font-size:1.5rem;font-weight:900;background:linear-gradient(90deg,#d4d4d8 0%,#ffffff 50%,#d4d4d8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${duelIdParam}</div>
      </div>
      
      <!-- Загрузка (платиновая рамка) -->
      <div id="duelJoinLoader" style="
        background:rgba(10,15,30,0.35);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:18px;
        padding:24px;
        text-align:center;
        box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.05);
        backdrop-filter:blur(8px);
        font-size:0.95rem;color:#d4d4d8;
        margin-bottom:16px;
      ">⏳ Проверяем дуэль...</div>
      
      <!-- Кнопки действий (скрыты по умолчанию) -->
      <div id="duelJoinActions" style="display:none;flex-direction:column;gap:12px;">
        
        <!-- Принять вызов (универсальная кнопка с зелёным текстом) -->
        <button onclick="duelAcceptInvite(${duelIdParam})" style="
          position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; border-radius:12px;
        " onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.15)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#00ffaa;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,255,170,0.5);">
             Принять вызов
          </div>
        </button>

        <!-- Назад (универсальная кнопка с красным текстом) -->
        <button onclick="duelBackToMenu()" style="
          position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; border-radius:12px;
        " onmouseover="this.style.transform='translateY(-2px)';this.style.filter='brightness(1.15)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#ff6464;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,100,100,0.4);">
            ← ${t.backBtn.replace('← ','')}
          </div>
        </button>

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

      // Скрываем хедер и футер
      const header = document.querySelector('.header');
      const footer = document.querySelector('footer');
      if (header) header.style.display = 'none';
      if (footer) footer.style.display = 'none';
      
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
