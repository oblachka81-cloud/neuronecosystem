// ==================== ШАХМАТЫ ====================

const CHESS_LANG = {
  ru: {
    title: 'Шахматы',
    back: '← Назад',
    waiting: 'Ожидание соперника...',
    shareInvite: 'Отправить приглашение',
    copyLink: 'Скопировать ссылку',
    copied: '✅ Скопировано!',
    yourTurn: 'Ваш ход',
    opponentTurn: 'Ход соперника',
    check: 'Шах!',
    checkmate: 'Мат!',
    stalemate: 'Пат',
    draw: 'Ничья',
    youWin: '🏆 Вы победили!',
    youLose: '😢 Вы проиграли',
    resign: 'Сдаться',
    stake: 'Ставка',
    create: 'Создать партию',
    stakeLabel: 'СТАВКА',
    cancel: 'Отменить'
  },
  en: {
    title: 'Chess',
    back: '← Back',
    waiting: 'Waiting for opponent...',
    shareInvite: 'Send invite',
    copyLink: 'Copy link',
    copied: '✅ Copied!',
    yourTurn: 'Your turn',
    opponentTurn: 'Opponent turn',
    check: 'Check!',
    checkmate: 'Checkmate!',
    stalemate: 'Stalemate',
    draw: 'Draw',
    youWin: '🏆 You win!',
    youLose: '😢 You lose',
    resign: 'Resign',
    stake: 'Stake',
    create: 'Create game',
    stakeLabel: 'STAKE',
    cancel: 'Cancel'
  },
  fr: {
    title: 'Échecs',
    back: '← Retour',
    waiting: 'Attente adversaire...',
    shareInvite: 'Envoyer invitation',
    copyLink: 'Copier lien',
    copied: '✅ Copié !',
    yourTurn: 'Votre tour',
    opponentTurn: 'Tour adversaire',
    check: 'Échec !',
    checkmate: 'Échec et mat !',
    stalemate: 'Pat',
    draw: 'Nulle',
    youWin: '🏆 Vous gagnez !',
    youLose: '😢 Vous perdez',
    resign: 'Abandonner',
    stake: 'Mise',
    create: 'Créer partie',
    stakeLabel: 'MISE',
    cancel: 'Annuler'
  },
  es: {
    title: 'Ajedrez',
    back: '← Volver',
    waiting: 'Esperando oponente...',
    shareInvite: 'Enviar invitación',
    copyLink: 'Copiar enlace',
    copied: '✅ ¡Copiado!',
    yourTurn: 'Tu turno',
    opponentTurn: 'Turno del oponente',
    check: '¡Jaque!',
    checkmate: '¡Jaque mate!',
    stalemate: 'Tablas',
    draw: 'Empate',
    youWin: '🏆 ¡Ganas!',
    youLose: '😢 Pierdes',
    resign: 'Rendirse',
    stake: 'Apuesta',
    create: 'Crear partida',
    stakeLabel: 'APUESTA',
    cancel: 'Cancelar'
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
      <button onclick="chessBackToMenu()" style="background:rgba(255,204,68,0.08);border:1px solid rgba(255,204,68,0.25);border-radius:12px;color:#ffcc44;font-size:0.85rem;font-weight:700;padding:8px 14px;margin-bottom:20px;cursor:pointer;">${t.back}</button>
      
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:2rem;font-weight:900;background:linear-gradient(90deg,#ffcc44,#fff3c4,#ffcc44);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;">♟️ ${t.title}</div>
      </div>
      
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <button onclick="chessCreate(100)" style="flex:1;padding:14px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(255,204,68,0.35);border-radius:14px;color:#ffcc44;font-size:0.85rem;font-weight:800;cursor:pointer;">100 COGNIQ</button>
        <button onclick="chessCreate(500)" style="flex:1;padding:14px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(0,255,170,0.55);border-radius:14px;color:#00ffaa;font-size:0.85rem;font-weight:800;cursor:pointer;">500 COGNIQ</button>
        <button onclick="chessCreate(1000)" style="flex:1;padding:14px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(255,150,50,0.55);border-radius:14px;color:#ffaa44;font-size:0.85rem;font-weight:800;cursor:pointer;">1000 COGNIQ</button>
      </div>
      
      <div id="chessWaitingBlock" style="display:none;"></div>
      <div id="chessGameBlock" style="display:none;"></div>
    </div>
  `;
  
  document.body.appendChild(chessContainer);
}

function chessBackToMenu() {
  if (chessPollInterval) { clearInterval(chessPollInterval); chessPollInterval = null; }
  
  const container = document.getElementById('chessContainer');
  if (container) container.remove();
  
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
      showToast(data.message || 'Ошибка', 3000);
      return;
    }
    
    chessGameId = data.gameId;
    
    document.getElementById('chessWaitingBlock').innerHTML = `
      <div style="background:rgba(10,20,38,0.8);border:2px solid rgba(0,255,170,0.4);border-radius:18px;padding:20px;text-align:center;box-shadow:0 0 20px rgba(0,255,170,0.15);">
        <div style="font-size:0.95rem;font-weight:700;color:#00ffaa;margin-bottom:12px;">⏳ ${t.waiting}</div>
        <div style="font-size:0.75rem;color:#7799bb;margin-bottom:14px;">ID: ${data.gameId}</div>
        <button onclick="chessShareInvite('${data.inviteLink}', ${stake})" style="width:100%;padding:12px;background:rgba(0,255,170,0.1);border:1px solid rgba(0,255,170,0.4);border-radius:12px;color:#00ffaa;font-weight:700;font-size:0.88rem;cursor:pointer;margin-bottom:8px;">📤 ${t.shareInvite}</button>
        <button onclick="chessCopyLink('${data.inviteLink}', this)" style="width:100%;padding:12px;background:rgba(255,204,68,0.1);border:1px solid rgba(255,204,68,0.4);border-radius:12px;color:#ffcc44;font-weight:700;font-size:0.88rem;cursor:pointer;">🔗 ${t.copyLink}</button>
      </div>
    `;
    document.getElementById('chessWaitingBlock').style.display = 'block';
    
    chessStartPolling(data.gameId);
  } catch (e) {
    showToast('Ошибка соединения', 3000);
  }
}

function chessShareInvite(link, stake) {
  const shareText = `♟️ Вызов на шахматную партию!\nСтавка: ${stake} COGNIQ`;
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

function chessCopyLink(link, btn) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  const showSuccess = () => {
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = t.copied;
      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    }
  };
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(showSuccess);
  } else {
    prompt('Copy:', link);
    showSuccess();
  }
}

function chessStartPolling(gameId) {
  if (chessPollInterval) clearInterval(chessPollInterval);
  
  chessPollInterval = setInterval(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/chess/state?user_id=${userId}&game_id=${gameId}`);
      const data = await res.json();
      
      if (data.success && data.game.status === 'active' && data.game.player2) {
        clearInterval(chessPollInterval);
        chessPollInterval = null;
        chessStartGame(gameId, data.game);
      }
    } catch (e) {}
  }, 2000);
}

function chessStartGame(gameId, gameData) {
  chessGameId = gameId;
  
  document.getElementById('chessWaitingBlock').style.display = 'none';
  
  const isPlayer1 = String(gameData.player1.id) === String(userId);
  chessMyColor = isPlayer1 ? 'w' : 'b';
  
  chessRenderBoard(gameData.fen, gameData);
}

function chessRenderBoard(fen, gameData) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  // Парсим FEN
  const parts = fen.split(' ');
  const boardStr = parts[0];
  const turn = parts[1];
  
  const board = [];
  const rows = boardStr.split('/');
  for (const row of rows) {
    const boardRow = [];
    for (const char of row) {
      if (isNaN(char)) {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const piece = color + char.toUpperCase();
        boardRow.push(piece);
      } else {
        for (let i = 0; i < parseInt(char); i++) boardRow.push(null);
      }
    }
    board.push(boardRow);
  }
  
  chessBoard = board;
  
  const p1Name = gameData.player1.nick || 'Игрок 1';
  const p2Name = gameData.player2 ? gameData.player2.nick : 'Игрок 2';
  
  const isMyTurn = (turn === 'w' && chessMyColor === 'w') || (turn === 'b' && chessMyColor === 'b');
  
  let boardHtml = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const piece = board[row][col];
      const square = String.fromCharCode(97 + col) + (8 - row);
      
      boardHtml += `
        <div class="chess-cell" data-square="${square}" data-row="${row}" data-col="${col}" 
             style="width:12.5%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.8rem;cursor:pointer;background:${isLight ? 'rgba(200,210,230,0.25)' : 'rgba(20,30,50,0.35)'};${chessSelectedSquare === square ? 'box-shadow:inset 0 0 0 3px #00ffaa;' : ''}">
          ${piece ? `<span style="color:${piece[0] === 'w' ? '#f0f0ff' : '#334466'};">${PIECES[piece]}</span>` : ''}
        </div>`;
    }
  }
  
  document.getElementById('chessGameBlock').innerHTML = `
    <div style="margin-bottom:16px;text-align:center;">
      <div style="font-size:0.85rem;color:#8899aa;">${isMyTurn ? t.yourTurn : t.opponentTurn}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="text-align:center;flex:1;">
        <div style="color:#00ffaa;font-weight:700;font-size:0.85rem;">${p1Name} (Белые)</div>
      </div>
      <div style="text-align:center;flex:1;">
        <div style="color:#ff6464;font-weight:700;font-size:0.85rem;">${p2Name} (Чёрные)</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:1px;border:2px solid #e9eef7;border-radius:8px;overflow:hidden;margin-bottom:16px;">
      ${boardHtml}
    </div>
    <button onclick="chessResign()" style="width:100%;padding:12px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:12px;color:#ff6464;font-weight:700;cursor:pointer;">${t.resign}</button>
  `;
  document.getElementById('chessGameBlock').style.display = 'block';
  
  // Обработчики кликов
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
        const currentBoard = chessBoard ? chessBoard.map(row => [...row]) : null;
        const newBoard = chessParseFen(data.game.fen);
        
        if (JSON.stringify(currentBoard) !== JSON.stringify(newBoard)) {
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

async function chessResign() {
  if (!confirm('Сдаться?')) return;
  
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
  
  let resultText, resultColor;
  
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
  
  const gameBlock = document.getElementById('chessGameBlock');
  if (gameBlock) {
    gameBlock.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <div style="font-size:2rem;font-weight:900;color:${resultColor};margin-bottom:20px;">${resultText}</div>
        <button onclick="chessBackToMenu()" style="width:100%;padding:16px;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;border-radius:14px;color:#00ffaa;font-size:1rem;font-weight:700;cursor:pointer;">${t.back}</button>
      </div>
    `;
  }
}

// Обработка приглашения из URL
function loadChessJoinPanel(gameId) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  
  root.innerHTML = '';
  
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  
  const joinContainer = document.createElement('div');
  joinContainer.id = 'chessJoinContainer';
  joinContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:transparent;';
  
  joinContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
      <div style="font-size:3rem;margin-bottom:16px;">♟️</div>
      <div style="font-size:1.5rem;font-weight:900;color:#ffcc44;margin-bottom:24px;">${t.title}</div>
      <div id="chessJoinLoader" style="padding:20px;color:#ffcc44;">⏳ ...</div>
      <div id="chessJoinActions" style="display:none;flex-direction:column;gap:12px;">
        <button onclick="chessAcceptInvite(${gameId})" style="width:100%;padding:16px;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;border-radius:14px;color:#00ffaa;font-size:1rem;font-weight:700;cursor:pointer;">♟️ ${t.create}</button>
        <button onclick="chessBackToMenu()" style="width:100%;padding:14px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:14px;color:#ff6464;font-size:0.9rem;font-weight:600;cursor:pointer;">${t.back}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(joinContainer);
  
  authFetch(`${BASE_URL}/api/chess/state?user_id=${userId}&game_id=${gameId}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('chessJoinLoader').style.display = 'none';
      if (data.success && data.game.status === 'waiting') {
        document.getElementById('chessJoinActions').style.display = 'flex';
      } else {
        document.getElementById('chessJoinLoader').style.display = 'block';
        document.getElementById('chessJoinLoader').textContent = 'Партия не найдена';
        document.getElementById('chessJoinLoader').style.color = '#ff6464';
      }
    })
    .catch(() => {
      document.getElementById('chessJoinLoader').style.display = 'block';
      document.getElementById('chessJoinLoader').textContent = 'Ошибка';
      document.getElementById('chessJoinLoader').style.color = '#ff6464';
    });
}

async function chessAcceptInvite(gameId) {
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, game_id: gameId })
    });
    const data = await res.json();
    
    if (data.success) {
      const joinContainer = document.getElementById('chessJoinContainer');
      if (joinContainer) joinContainer.remove();
      
      const stateRes = await authFetch(`${BASE_URL}/api/chess/state?user_id=${userId}&game_id=${gameId}`);
      const stateData = await stateRes.json();
      
      if (stateData.success) {
        chessGameId = gameId;
        chessStartGame(gameId, stateData.game);
      }
    } else {
      showToast(data.message || 'Ошибка', 3000);
    }
  } catch (e) {
    showToast('Ошибка соединения', 3000);
  }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.loadChessPanel = loadChessPanel;
window.chessBackToMenu = chessBackToMenu;
window.chessCreate = chessCreate;
window.chessShareInvite = chessShareInvite;
window.chessCopyLink = chessCopyLink;
window.chessResign = chessResign;
window.chessAcceptInvite = chessAcceptInvite;
window.loadChessJoinPanel = loadChessJoinPanel;
