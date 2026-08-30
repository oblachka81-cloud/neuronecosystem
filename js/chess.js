// ==================== ШАХМАТЫ (отдельный модуль) ====================

const CHESS_LANG = {
  ru: {
    title: 'Шахматы',
    subtitle: '1 на 1 • классика • ставка',
    desc: 'Брось вызов другу! Ставки: 100 / 500 / 1000 COGNIQ. Победитель забирает банк, 5% сжигается навсегда.',
    waiting: 'Ожидание соперника...',
    shareInvite: 'Отправить приглашение',
    copyLink: 'Скопировать ссылку',
    copied: '✅ Скопировано!',
    backBtn: '← Назад',
    errBalance: 'Недостаточно COGNIQ',
    errCreate: 'Не удалось создать партию',
    errConnect: 'Ошибка связи',
    cancelDuel: 'Отменить партию',
    cancelConfirm: 'Отменить партию и вернуть ставку?',
    yourTurn: 'Ваш ход',
    opponentTurn: 'Ход соперника',
    check: 'Шах!',
    checkmate: 'Мат!',
    stalemate: 'Пат',
    draw: 'Ничья! Ставки возвращены',
    youWin: 'Вы победили!',
    youLose: 'Вы проиграли',
    resign: 'Сдаться',
    returnToMenu: '← Вернуться в меню',
    opponentNotFound: 'Соперник не найден',
    duelCancelled: 'Партия отменена',
    whiteLabel: 'Белые',
    blackLabel: 'Чёрные'
  },
  en: {
    title: 'Chess',
    subtitle: '1 vs 1 • classic • stake',
    desc: 'Challenge a friend! Stakes: 100 / 500 / 1000 COGNIQ. Winner takes the pot, 5% burned forever.',
    waiting: 'Waiting for opponent...',
    shareInvite: 'Send invite',
    copyLink: 'Copy link',
    copied: '✅ Copied!',
    backBtn: '← Back',
    errBalance: 'Not enough COGNIQ',
    errCreate: 'Could not create game',
    errConnect: 'Connection error',
    cancelDuel: 'Cancel game',
    cancelConfirm: 'Cancel game and refund stake?',
    yourTurn: 'Your turn',
    opponentTurn: 'Opponent turn',
    check: 'Check!',
    checkmate: 'Checkmate!',
    stalemate: 'Stalemate',
    draw: 'Draw! Stakes refunded',
    youWin: 'You win!',
    youLose: 'You lose',
    resign: 'Resign',
    returnToMenu: '← Return to menu',
    opponentNotFound: 'Opponent not found',
    duelCancelled: 'Game cancelled',
    whiteLabel: 'White',
    blackLabel: 'Black'
  },
  fr: {
    title: 'Échecs',
    subtitle: '1 contre 1 • classique • mise',
    desc: 'Défiez un ami ! Mises : 100 / 500 / 1000 COGNIQ. Le gagnant prend le pot, 5% brûlés.',
    waiting: 'Attente adversaire...',
    shareInvite: 'Envoyer invitation',
    copyLink: 'Copier lien',
    copied: '✅ Copié !',
    backBtn: '← Retour',
    errBalance: 'COGNIQ insuffisants',
    errCreate: 'Impossible de créer la partie',
    errConnect: 'Erreur de connexion',
    cancelDuel: 'Annuler la partie',
    cancelConfirm: 'Annuler la partie et rembourser la mise ?',
    yourTurn: 'Votre tour',
    opponentTurn: 'Tour adversaire',
    check: 'Échec !',
    checkmate: 'Échec et mat !',
    stalemate: 'Pat',
    draw: 'Nulle ! Mises remboursées',
    youWin: 'Vous gagnez !',
    youLose: 'Vous perdez',
    resign: 'Abandonner',
    returnToMenu: '← Retour au menu',
    opponentNotFound: 'Adversaire introuvable',
    duelCancelled: 'Partie annulée',
    whiteLabel: 'Blancs',
    blackLabel: 'Noirs'
  },
  es: {
    title: 'Ajedrez',
    subtitle: '1 vs 1 • clásico • apuesta',
    desc: '¡Reta a un amigo! Apuestas: 100 / 500 / 1000 COGNIQ. El ganador se lleva el bote, 5% quemado.',
    waiting: 'Esperando oponente...',
    shareInvite: 'Enviar invitación',
    copyLink: 'Copiar enlace',
    copied: '✅ ¡Copiado!',
    backBtn: '← Volver',
    errBalance: 'COGNIQ insuficientes',
    errCreate: 'No se pudo crear la partida',
    errConnect: 'Error de conexión',
    cancelDuel: 'Cancelar partida',
    cancelConfirm: '¿Cancelar partida y devolver apuesta?',
    yourTurn: 'Tu turno',
    opponentTurn: 'Turno del oponente',
    check: '¡Jaque!',
    checkmate: '¡Jaque mate!',
    stalemate: 'Tablas',
    draw: '¡Empate! Apuestas devueltas',
    youWin: '¡Ganas!',
    youLose: 'Pierdes',
    resign: 'Rendirse',
    returnToMenu: '← Volver al menú',
    opponentNotFound: 'Oponente no encontrado',
    duelCancelled: 'Partida cancelada',
    whiteLabel: 'Blancas',
    blackLabel: 'Negras'
  }
};

const PIECES = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

let chessGameId = null;
let chessBoard = null;
let chessSelectedSquare = null;
let chessPollInterval = null;
let chessMyColor = null;

function loadChessPanel() {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  root.innerHTML = '';
  
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  
  const chessContainer = document.createElement('div');
  chessContainer.id = 'chessContainer';
  chessContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:transparent;';
  
  chessContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      
      <!-- Назад -->
      <button onclick="chessBackToMenu()" style="
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

      <!-- Логотип -->
      <div style="text-align:center;margin-bottom:24px;position:relative;">
        <div style="font-size:2.2rem;font-weight:900;background:linear-gradient(90deg,#ffcc44 0%,#fff3c4 45%,#ffcc44 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;">♟️ ${t.title}</div>
        <div style="font-size:0.82rem;color:#8ba3c1;letter-spacing:0.5px;font-weight:500;margin-top:4px;">${t.subtitle}</div>
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
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
        <button onclick="chessCreate(100)" style="
          position:relative;width:100%;height:90px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.filter='brightness(1.15)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_stake.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <span style="font-size:0.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;margin-bottom:2px;text-shadow:0 0 4px rgba(0,0,0,0.8);">СТАВКА</span>
            <span style="font-size:1.3rem;color:#ffcc44;font-weight:900;line-height:1;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.4);">100</span>
            <span style="font-size:0.65rem;color:#ffcc44;font-weight:700;letter-spacing:0.5px;margin-top:3px;text-shadow:0 0 4px rgba(0,0,0,0.8);">COGNIQ</span>
          </div>
        </button>

        <button onclick="chessCreate(500)" style="
          position:relative;width:100%;height:90px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;animation:hotPulse 2s ease-in-out infinite;
        " onmouseover="this.style.transform='translateY(-3px)';this.style.filter='brightness(1.2)'" 
           onmouseout="this.style.transform='translateY(0)';this.style.filter='brightness(1)'">
          <img src="/main/btn_duel_stake.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
          <div style="position:absolute;top:4px;right:6px;background:rgba(0,255,170,0.25);color:#00ffaa;font-size:0.5rem;font-weight:800;padding:2px 5px;border-radius:6px;letter-spacing:0.5px;animation:badgePulse 1.5s ease-in-out infinite;">HOT</div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <span style="font-size:0.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;margin-bottom:2px;text-shadow:0 0 4px rgba(0,0,0,0.8);">СТАВКА</span>
            <span style="font-size:1.3rem;color:#ffcc44;font-weight:900;line-height:1;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.4);">500</span>
            <span style="font-size:0.65rem;color:#ffcc44;font-weight:700;letter-spacing:0.5px;margin-top:3px;text-shadow:0 0 4px rgba(0,0,0,0.8);">COGNIQ</span>
          </div>
        </button>

        <button onclick="chessCreate(1000)" style="
          position:relative;width:100%;height:90px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;
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

      <div id="chessWaitingBlock" style="display:none;"></div>
      <div id="chessGameBlock" style="display:none;"></div>
    </div>
  `;
  
  document.body.appendChild(chessContainer);
}

function chessBackToMenu() {
  if (chessPollInterval) { clearInterval(chessPollInterval); chessPollInterval = null; }
  if (window._chessCountdownInterval) { clearInterval(window._chessCountdownInterval); window._chessCountdownInterval = null; }
  
  const container = document.getElementById('chessContainer');
  if (container) container.remove();
  
  const joinContainer = document.getElementById('chessJoinContainer');
  if (joinContainer) joinContainer.remove();
  
  const gameContainer = document.getElementById('chessGameContainer');
  if (gameContainer) gameContainer.remove();
  
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = '';
  
  chessGameId = null;
  chessBoard = null;
  chessSelectedSquare = null;
  
  switchTab('game');
}

async function chessCreate(stake) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, stake })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || t.errCreate, 3000);
      return;
    }
    
    chessGameId = data.gameId;
    
    document.getElementById('chessWaitingBlock').innerHTML = `
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
        <div style="font-size:0.75rem;color:#d4d4d8;margin-bottom:14px;letter-spacing:0.5px;">ID: ${data.gameId}</div>
        
        <div style="background:rgba(0,0,0,0.4);border-radius:12px;padding:10px;margin-bottom:16px;border:1px solid rgba(255,204,68,0.3);">
          <div style="font-size:0.7rem;color:#d4d4d8;margin-bottom:4px;">Автоотмена через:</div>
          <div id="chessCountdown" style="font-size:1.8rem;font-weight:900;color:#ffcc44;text-shadow:0 0 10px rgba(255,204,68,0.4);">2:00</div>
        </div>
        
        <button onclick="chessShareInvite('${data.inviteLink}', ${stake})" style="
          position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; margin-bottom:10px; border-radius:12px;
        ">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#00ffaa;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,255,170,0.4);">📤 ${t.shareInvite}</div>
        </button>

        <button onclick="chessCopyLink('${data.inviteLink}', this)" style="
          position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; margin-bottom:10px; border-radius:12px;
        ">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#ffcc44;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,204,68,0.4);">🔗 ${t.copyLink}</div>
        </button>

        <button onclick="chessCancel(${data.gameId})" style="
          position:relative; width:100%; height:54px; padding:0; background:none; border:none; cursor:pointer; transition:all 0.2s; overflow:hidden; border-radius:12px;
        ">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#ff6464;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,100,100,0.4);">❌ ${t.cancelDuel}</div>
        </button>
      </div>
    `;
    document.getElementById('chessWaitingBlock').style.display = 'block';
    
    let countdown = 120;
    const countdownEl = document.getElementById('chessCountdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownEl) {
        const mins = Math.floor(countdown / 60);
        const secs = countdown % 60;
        countdownEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        if (countdown <= 30) {
          countdownEl.style.color = '#ff6464';
          countdownEl.style.textShadow = '0 0 10px rgba(255,100,100,0.6)';
        }
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        if (countdownEl) { countdownEl.textContent = '0:00'; countdownEl.style.color = '#ff6464'; }
      }
    }, 1000);
    
    window._chessCountdownInterval = countdownInterval;
    
    chessStartPolling(data.gameId);
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}

function chessShareInvite(link, stake) {
  const shareText = `♟️ Вызов на шахматную партию в NEURON!\nСтавка: ${stake} COGNIQ\nПримешь вызов?`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;
  
  if (tg && typeof tg.openTelegramLink === 'function') { tg.openTelegramLink(shareUrl); return; }
  if (tg && typeof tg.openLink === 'function') { tg.openLink(shareUrl); return; }
  window.open(shareUrl, '_blank');
}

function chessCopyLink(link, btn) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
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
    navigator.clipboard.writeText(link).then(showSuccess).catch(() => { prompt('Copy:', link); showSuccess(); });
  } else {
    prompt('Copy:', link);
    showSuccess();
  }
}

async function chessCancel(gameIdParam) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  if (!confirm(t.cancelConfirm)) return;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, game_id: gameIdParam })
    });
    const data = await res.json();
    if (data.success) {
      showToast(t.duelCancelled, 2000);
      if (chessPollInterval) { clearInterval(chessPollInterval); chessPollInterval = null; }
      chessBackToMenu();
      loadWelcome();
    } else {
      showToast(data.message || t.errConnect, 3000);
    }
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}

function chessStartPolling(gameId) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  if (chessPollInterval) clearInterval(chessPollInterval);
  
  chessPollInterval = setInterval(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/chess/state?user_id=${userId}&game_id=${gameId}`);
      const data = await res.json();
      
      if (!data.success) return;
      
      if (data.timeExpired || data.game.status === 'cancelled') {
        clearInterval(chessPollInterval);
        chessPollInterval = null;
        if (window._chessCountdownInterval) { clearInterval(window._chessCountdownInterval); window._chessCountdownInterval = null; }
        showToast('⏱️ Время вышло. Партия отменена, ставка возвращена.', 3000);
        setTimeout(() => chessBackToMenu(), 2000);
        return;
      }
      
      if (data.game.status === 'active' && data.game.player2) {
        clearInterval(chessPollInterval);
        chessPollInterval = null;
        if (window._chessCountdownInterval) { clearInterval(window._chessCountdownInterval); window._chessCountdownInterval = null; }
        chessStartGame(gameId, data.game);
      }
    } catch (e) {}
  }, 2000);
}

function chessStartGame(gameId, gameData) {
  chessGameId = gameId;
  
  const waitingBlock = document.getElementById('chessWaitingBlock');
  if (waitingBlock) waitingBlock.style.display = 'none';
  
  const isPlayer1 = String(gameData.player1.id) === String(userId);
  chessMyColor = isPlayer1 ? 'w' : 'b';
  
  chessRenderBoard(gameData.fen, gameData);
}

function chessParseFen(fen) {
  const parts = fen.split(' ');
  const boardStr = parts[0];
  const board = [];
  const rows = boardStr.split('/');
  for (const row of rows) {
    const boardRow = [];
    for (const char of row) {
      if (isNaN(char)) {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        boardRow.push(color + char.toUpperCase());
      } else {
        for (let i = 0; i < parseInt(char); i++) boardRow.push(null);
      }
    }
    board.push(boardRow);
  }
  return board;
}

function chessRenderBoard(fen, gameData) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  const parts = fen.split(' ');
  const turn = parts[1];
  
  chessBoard = chessParseFen(fen);
  
  const p1Name = gameData.player1.nick || 'Игрок 1';
  const p2Name = gameData.player2 ? gameData.player2.nick : 'Игрок 2';
  
  const isMyTurn = (turn === 'w' && chessMyColor === 'w') || (turn === 'b' && chessMyColor === 'b');
  
  let boardHtml = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const piece = chessBoard[row][col];
      const square = String.fromCharCode(97 + col) + (8 - row);
      
      boardHtml += `
        <div class="chess-cell" data-square="${square}" 
             style="width:12.5%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.8rem;cursor:pointer;background:${isLight ? 'rgba(200,210,230,0.25)' : 'rgba(20,30,50,0.35)'};${chessSelectedSquare === square ? 'box-shadow:inset 0 0 0 3px #00ffaa;' : ''}">
          ${piece ? `<span style="color:${piece[0] === 'w' ? '#f0f0ff' : '#334466'};">${PIECES[piece]}</span>` : ''}
        </div>`;
    }
  }
  
  const gameBlock = document.getElementById('chessGameBlock');
  gameBlock.innerHTML = `
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
        <div style="text-align:center;flex:1;">
          <div style="font-size:0.75rem;color:#00ffaa;font-weight:700;">${escapeHtml(p1Name)}</div>
          <div style="font-size:0.65rem;color:#d4d4d8;">${t.whiteLabel}</div>
        </div>
        <div style="text-align:center;padding:0 8px;">
          <div style="font-size:0.7rem;color:#d4d4d8;">${isMyTurn ? t.yourTurn : t.opponentTurn}</div>
        </div>
        <div style="text-align:center;flex:1;">
          <div style="font-size:0.75rem;color:#ff6464;font-weight:700;">${escapeHtml(p2Name)}</div>
          <div style="font-size:0.65rem;color:#d4d4d8;">${t.blackLabel}</div>
        </div>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:1px;border:2px solid #e9eef7;border-radius:8px;overflow:hidden;margin-bottom:16px;">
      ${boardHtml}
    </div>
    
    <button onclick="chessResign()" style="
      position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;
    ">
      <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
      <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#ff6464;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,100,100,0.4);">${t.resign}</div>
    </button>
  `;
  gameBlock.style.display = 'block';
  
  document.querySelectorAll('.chess-cell').forEach(cell => {
    cell.addEventListener('click', () => chessCellClick(cell.dataset.square, gameData));
  });
  
  chessStartGamePolling(gameId);
}

function chessCellClick(square, gameData) {
  if (!chessSelectedSquare) {
    chessSelectedSquare = square;
    chessRenderBoard(gameData.fen, gameData);
    return;
  }
  
  chessMakeMove(chessSelectedSquare, square);
  chessSelectedSquare = null;
}

async function chessMakeMove(from, to) {
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, game_id: chessGameId, from, to })
    });
    const data = await res.json();
    
    if (!data.success) {
      showToast(data.message || 'Ошибка хода', 3000);
      return;
    }
    
    const stateRes = await authFetch(`${BASE_URL}/api/chess/state?user_id=${userId}&game_id=${chessGameId}`);
    const stateData = await stateRes.json();
    
    if (stateData.success) {
      if (stateData.game.status === 'finished') {
        chessShowResult(stateData.game);
      } else {
        chessRenderBoard(stateData.game.fen, stateData.game);
      }
    }
  } catch (e) {
    showToast('Ошибка соединения', 3000);
  }
}

function chessStartGamePolling(gameId) {
  if (chessPollInterval) clearInterval(chessPollInterval);
  
  chessPollInterval = setInterval(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/chess/state?user_id=${userId}&game_id=${gameId}`);
      const data = await res.json();
      
      if (data.success && data.game.status === 'active') {
        const currentBoard = chessBoard ? JSON.stringify(chessBoard) : null;
        const newBoard = JSON.stringify(chessParseFen(data.game.fen));
        
        if (currentBoard !== newBoard) {
          chessRenderBoard(data.game.fen, data.game);
        }
      } else if (data.success && data.game.status === 'finished') {
        clearInterval(chessPollInterval);
        chessPollInterval = null;
        chessShowResult(data.game);
      }
    } catch (e) {}
  }, 2000);
}

async function chessResign() {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  if (!confirm(t.resign + '?')) return;
  
  try {
    await authFetch(`${BASE_URL}/api/chess/resign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, game_id: chessGameId })
    });
    
    chessBackToMenu();
    loadWelcome();
  } catch (e) {}
}

function chessShowResult(gameData) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  const myId = String(userId);
  const winnerId = gameData.winnerId ? String(gameData.winnerId) : null;
  
  let resultText, resultColor, resultEmoji;
  
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
    setTimeout(() => { if (typeof launchConfettiTop === 'function') launchConfettiTop(); }, 300);
  } else {
    resultText = t.youLose;
    resultColor = '#ff6464';
    resultEmoji = '😢';
    if (navigator.vibrate) navigator.vibrate(300);
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
  }
  
  const gameBlock = document.getElementById('chessGameBlock');
  if (gameBlock) {
    gameBlock.innerHTML = `
      <div style="
        background:rgba(10,15,30,0.35);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:20px;
        padding:24px 16px;
        margin-bottom:20px;
        box-shadow:0 0 30px rgba(220,220,225,0.1), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter:blur(8px);
        text-align:center;
      ">
        <div style="font-size:2rem;font-weight:900;color:${resultColor};margin-bottom:16px;">${resultEmoji} ${resultText}</div>
      </div>
      <button onclick="chessBackToMenu()" style="
        position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;
      ">
        <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
        <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#ffcc44;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9);">${t.returnToMenu}</div>
      </button>
    `;
  }
}

function loadChessJoinPanel(gameIdParam) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  root.innerHTML = '';
  
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  
  const joinContainer = document.createElement('div');
  joinContainer.id = 'chessJoinContainer';
  joinContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:transparent;';
  
  joinContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:2.2rem;font-weight:900;background:linear-gradient(90deg,#ffcc44 0%,#fff3c4 45%,#ffcc44 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;">♟️ ${t.title}</div>
      </div>
      
      <div id="chessJoinLoader" style="
        background:rgba(10,15,30,0.35);
        border:1.5px solid rgba(220,220,225,0.5);
        border-radius:18px;
        padding:24px;
        text-align:center;
        box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.05);
        backdrop-filter:blur(8px);
        font-size:0.95rem;color:#d4d4d8;
        margin-bottom:16px;
      ">⏳ Проверяем партию...</div>
      
      <div id="chessJoinActions" style="display:none;flex-direction:column;gap:12px;">
        <button onclick="chessAcceptInvite(${gameIdParam})" style="
          position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;
        ">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#00ffaa;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,255,170,0.5);">Принять вызов</div>
        </button>
        <button onclick="chessBackToMenu()" style="
          position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;
        ">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#ff6464;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9);">${t.backBtn}</div>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(joinContainer);
  
  authFetch(`${BASE_URL}/api/chess/state?user_id=${userId}&game_id=${gameIdParam}`)
    .then(r => r.json())
    .then(data => {
      const loader = document.getElementById('chessJoinLoader');
      if (!loader) return;
      
      loader.style.display = 'none';
      if (data.success && data.game.status === 'waiting') {
        const actions = document.getElementById('chessJoinActions');
        if (actions) actions.style.display = 'flex';
      } else {
        loader.style.display = 'block';
        loader.textContent = t.opponentNotFound || 'Партия не найдена';
        loader.style.color = '#ff6464';
      }
    })
    .catch(() => {
      const loader = document.getElementById('chessJoinLoader');
      if (loader) {
        loader.style.display = 'block';
        loader.textContent = t.errConnect || 'Ошибка';
        loader.style.color = '#ff6464';
      }
    });
}

async function chessAcceptInvite(gameIdParam) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, game_id: gameIdParam })
    });
    const data = await res.json();
    
    if (data.success) {
      const joinContainer = document.getElementById('chessJoinContainer');
      if (joinContainer) joinContainer.remove();
      
      const stateRes = await authFetch(`${BASE_URL}/api/chess/state?user_id=${userId}&game_id=${gameIdParam}`);
      const stateData = await stateRes.json();
      
      if (stateData.success) {
        chessStartGame(gameIdParam, stateData.game);
      }
    } else {
      showToast(data.message || t.errConnect, 3000);
    }
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.CHESS_LANG = CHESS_LANG;
window.loadChessPanel = loadChessPanel;
window.chessBackToMenu = chessBackToMenu;
window.chessCreate = chessCreate;
window.chessShareInvite = chessShareInvite;
window.chessCopyLink = chessCopyLink;
window.chessCancel = chessCancel;
window.chessResign = chessResign;
window.chessAcceptInvite = chessAcceptInvite;
window.loadChessJoinPanel = loadChessJoinPanel;
