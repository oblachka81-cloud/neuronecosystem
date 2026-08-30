// ==================== ШАХМАТЫ (ГОТОВЫЙ МОДУЛЬ) ====================

const CHESS_LANG = {
  ru: {
    title: 'Шахматы', subtitle: '1 на 1 • классика • ставка',
    desc: 'Брось вызов другу! Ставки: 100 / 500 / 1000 COGNIQ. Победитель забирает банк, 5% сжигается навсегда.',
    waiting: 'Ожидание соперника...', shareInvite: 'Отправить приглашение', copyLink: 'Скопировать ссылку',
    copied: '✅ Скопировано!', backBtn: '← Назад', errBalance: 'Недостаточно COGNIQ', errCreate: 'Не удалось создать партию',
    errConnect: 'Ошибка связи', cancelDuel: 'Отменить партию', cancelConfirm: 'Отменить партию и вернуть ставку?',
    yourTurn: 'Ваш ход', opponentTurn: 'Ход соперника', check: 'Шах!', checkmate: 'Мат!', stalemate: 'Пат',
    draw: 'Ничья! Ставки возвращены', youWin: 'Вы победили!', youLose: 'Вы проиграли', resign: 'Сдаться',
    returnToMenu: '← Вернуться в меню', opponentNotFound: 'Соперник не найден', duelCancelled: 'Партия отменена',
    whiteLabel: 'Белые', blackLabel: 'Чёрные'
  },
  en: {
    title: 'Chess', subtitle: '1 vs 1 • classic • stake',
    desc: 'Challenge a friend! Stakes: 100 / 500 / 1000 COGNIQ. Winner takes the pot, 5% burned forever.',
    waiting: 'Waiting for opponent...', shareInvite: 'Send invite', copyLink: 'Copy link',
    copied: '✅ Copied!', backBtn: '← Back', errBalance: 'Not enough COGNIQ', errCreate: 'Could not create game',
    errConnect: 'Connection error', cancelDuel: 'Cancel game', cancelConfirm: 'Cancel game and refund stake?',
    yourTurn: 'Your turn', opponentTurn: 'Opponent turn', check: 'Check!', checkmate: 'Checkmate!', stalemate: 'Stalemate',
    draw: 'Draw! Stakes refunded', youWin: 'You win!', youLose: 'You lose', resign: 'Resign',
    returnToMenu: '← Return to menu', opponentNotFound: 'Opponent not found', duelCancelled: 'Game cancelled',
    whiteLabel: 'White', blackLabel: 'Black'
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
let isMoving = false; // Защита от спама кликов
let lastKnownFen = '';

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function loadChessPanel() {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  const root = document.getElementById('dynamicContent') || document.body;
  root.innerHTML = '';
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  
  const chessContainer = document.createElement('div');
  chessContainer.id = 'chessContainer';
  chessContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:#0a0f1e;';
  
  chessContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      <button onclick="chessBackToMenu()" style="width:100px;height:50px;background:none;border:none;cursor:pointer;margin-bottom:20px;">
        <div style="color:#ffcc44;font-weight:700;">← Назад</div>
      </button>
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:2rem;font-weight:900;color:#ffcc44;">♟️ ${t.title}</div>
        <div style="font-size:0.8rem;color:#8ba3c1;">${t.subtitle}</div>
      </div>
      <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:16px;margin-bottom:24px;text-align:center;">
        <p style="color:#d4d4d8;font-size:0.9rem;margin:0;">${t.desc}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
        <button onclick="chessCreate(100)" style="background:#1a2332;border:1px solid #ffcc44;color:#ffcc44;padding:16px;border-radius:12px;font-weight:700;cursor:pointer;">100</button>
        <button onclick="chessCreate(500)" style="background:#1a2332;border:1px solid #00ffaa;color:#00ffaa;padding:16px;border-radius:12px;font-weight:700;cursor:pointer;">500</button>
        <button onclick="chessCreate(1000)" style="background:#1a2332;border:1px solid #ff6464;color:#ff6464;padding:16px;border-radius:12px;font-weight:700;cursor:pointer;">1000</button>
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
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = '';
  chessGameId = null; chessBoard = null; chessSelectedSquare = null; isMoving = false;
  if (typeof switchTab === 'function') switchTab('game');
}

async function chessCreate(stake) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stake })
    });
    const data = await res.json();
    if (!data.success) { showToast(data.message || t.errCreate, 3000); return; }
    
    chessGameId = data.gameId;
    document.getElementById('chessWaitingBlock').style.display = 'block';
    document.getElementById('chessWaitingBlock').innerHTML = `
      <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;text-align:center;">
        <div style="color:#00ffaa;font-weight:700;margin-bottom:8px;">⏳ ${t.waiting}</div>
        <div style="color:#d4d4d8;font-size:0.8rem;margin-bottom:16px;">ID: ${data.gameId}</div>
        <button onclick="chessShareInvite('${data.inviteLink}', ${stake})" style="width:100%;background:#00ffaa;color:#000;padding:14px;border-radius:10px;font-weight:700;border:none;cursor:pointer;margin-bottom:10px;">📤 ${t.shareInvite}</button>
        <button onclick="chessCopyLink('${data.inviteLink}')" style="width:100%;background:#ffcc44;color:#000;padding:14px;border-radius:10px;font-weight:700;border:none;cursor:pointer;margin-bottom:10px;">🔗 ${t.copyLink}</button>
        <button onclick="chessCancel(${data.gameId})" style="width:100%;background:#ff6464;color:#fff;padding:14px;border-radius:10px;font-weight:700;border:none;cursor:pointer;">❌ ${t.cancelDuel}</button>
      </div>
    `;
    chessStartPolling(data.gameId);
  } catch (e) { showToast(t.errConnect, 3000); }
}

function chessShareInvite(link, stake) {
  const shareText = `♟️ Вызов на шахматную партию в NEURON!\nСтавка: ${stake} COGNIQ\nПримешь вызов?`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;
  if (window.Telegram?.WebApp?.openTelegramLink) { window.Telegram.WebApp.openTelegramLink(shareUrl); } 
  else { window.open(shareUrl, '_blank'); }
}

function chessCopyLink(link) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => showToast(t.copied, 2000));
  } else {
    showToast('Скопируйте ссылку вручную', 2000);
  }
}

async function chessCancel(gameIdParam) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  if (!confirm(t.cancelConfirm)) return;
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game_id: gameIdParam })
    });
    const data = await res.json();
    if (data.success) { showToast(t.duelCancelled, 2000); chessBackToMenu(); } 
    else { showToast(data.message || t.errConnect, 3000); }
  } catch (e) { showToast(t.errConnect, 3000); }
}

function chessStartPolling(gameId) {
  if (chessPollInterval) clearInterval(chessPollInterval);
  chessPollInterval = setInterval(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/chess/state?game_id=${gameId}`);
      const data = await res.json();
      if (!data.success) return;
      if (data.timeExpired || data.game.status === 'cancelled') {
        clearInterval(chessPollInterval);
        showToast('⏱️ Время вышло. Партия отменена.', 3000);
        setTimeout(() => chessBackToMenu(), 2000);
        return;
      }
      if (data.game.status === 'active' && data.game.player2) {
        clearInterval(chessPollInterval);
        chessStartGame(gameId, data.game);
      }
    } catch (e) {}
  }, 2000);
}

function chessParseFen(fen) {
  const parts = fen.split(' ');
  const board = [];
  const rows = parts[0].split('/');
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

function chessStartGame(gameId, gameData) {
  chessGameId = gameId;
  lastKnownFen = gameData.fen; // Запоминаем начальное состояние
  const waitingBlock = document.getElementById('chessWaitingBlock');
  if (waitingBlock) waitingBlock.style.display = 'none';
  const isPlayer1 = String(gameData.player1.id) === String(userId);
  chessMyColor = isPlayer1 ? 'w' : 'b';
  chessRenderBoard(gameData.fen, gameData);
}

function chessRenderBoard(fen, gameData) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  const parts = fen.split(' ');
  const turn = parts[1];
  chessBoard = chessParseFen(fen);
  const isMyTurn = (turn === 'w' && chessMyColor === 'w') || (turn === 'b' && chessMyColor === 'b');
  
  let boardHtml = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const piece = chessBoard[row][col];
      const square = String.fromCharCode(97 + col) + (8 - row);
      const isSelected = chessSelectedSquare === square;
      boardHtml += `<div class="chess-cell" data-square="${square}" style="width:12.5%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:2rem;cursor:pointer;background:${isLight ? '#e8ebf0' : '#7b8ca5'};${isSelected ? 'box-shadow:inset 0 0 0 4px #00ffaa;' : ''}">
        ${piece ? `<span style="color:${piece[0] === 'w' ? '#fff' : '#000'};text-shadow:0 1px 2px rgba(0,0,0,0.3);">${PIECES[piece]}</span>` : ''}
      </div>`;
    }
  }
  
  const gameBlock = document.getElementById('chessGameBlock');
  gameBlock.innerHTML = `
    <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
      <div style="text-align:center;flex:1;"><div style="color:#00ffaa;font-weight:700;">${escapeHtml(gameData.player1.nick)}</div><div style="font-size:0.7rem;color:#8ba3c1;">Белые</div></div>
      <div style="text-align:center;padding:0 8px;"><div style="color:#ffcc44;font-weight:700;">${isMyTurn ? t.yourTurn : t.opponentTurn}</div></div>
      <div style="text-align:center;flex:1;"><div style="color:#ff6464;font-weight:700;">${gameData.player2 ? escapeHtml(gameData.player2.nick) : '...'}</div><div style="font-size:0.7rem;color:#8ba3c1;">Чёрные</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:0;border:4px solid #334466;border-radius:8px;overflow:hidden;margin-bottom:16px;touch-action:manipulation;">
      ${boardHtml}
    </div>
    <button onclick="chessResign()" style="width:100%;background:#ff6464;color:#fff;padding:14px;border-radius:10px;font-weight:700;border:none;cursor:pointer;">${t.resign}</button>
  `;
  gameBlock.style.display = 'block';
  
  document.querySelectorAll('.chess-cell').forEach(cell => {
    cell.addEventListener('click', () => chessCellClick(cell.dataset.square, gameData));
  });
  
  chessStartGamePolling(gameId);
}

function chessCellClick(square, gameData) {
  if (isMoving || gameData.status !== 'active') return;
  const parts = gameData.fen.split(' ');
  const turn = parts[1];
  const isMyTurn = (turn === 'w' && chessMyColor === 'w') || (turn === 'b' && chessMyColor === 'b');
  if (!isMyTurn) return;

  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1]);
  const piece = chessBoard[row] ? chessBoard[row][col] : null;

  if (!chessSelectedSquare) {
    if (piece && piece[0] === chessMyColor) {
      chessSelectedSquare = square;
      chessRenderBoard(gameData.fen, gameData);
    }
    return;
  }

  if (chessSelectedSquare === square) {
    chessSelectedSquare = null;
    chessRenderBoard(gameData.fen, gameData);
    return;
  }

  if (piece && piece[0] === chessMyColor) {
    chessSelectedSquare = square;
    chessRenderBoard(gameData.fen, gameData);
    return;
  }

  chessMakeMove(chessSelectedSquare, square, gameData);
  chessSelectedSquare = null;
}

async function chessMakeMove(from, to, gameData) {
  if (isMoving || !chessGameId) return;
  isMoving = true;
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: chessGameId, from, to, promotion: 'q' })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Недопустимый ход', 3000);
      chessSelectedSquare = null;
      chessRenderBoard(gameData.fen, gameData);
      return;
    }
    const stateRes = await authFetch(`${BASE_URL}/api/chess/state?game_id=${chessGameId}`);
    const stateData = await stateRes.json();
    if (stateData.success) {
      if (stateData.game.status === 'finished') {
        chessShowResult(stateData.game);
      } else {
        lastKnownFen = stateData.game.fen;
        chessRenderBoard(stateData.game.fen, stateData.game);
      }
    }
  } catch (e) {
    showToast('Ошибка соединения', 3000);
  } finally {
    isMoving = false;
  }
}

function chessStartGamePolling(gameId) {
  if (chessPollInterval) clearInterval(chessPollInterval);
  chessPollInterval = setInterval(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/chess/state?game_id=${gameId}`);
      const data = await res.json();
      if (data.success && data.game.status === 'active') {
        if (data.game.fen !== lastKnownFen) {
          lastKnownFen = data.game.fen;
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
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game_id: chessGameId })
    });
    chessBackToMenu();
  } catch (e) {}
}

function chessShowResult(gameData) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  const myId = String(userId);
  const winnerId = gameData.winnerId ? String(gameData.winnerId) : null;
  let resultText, resultColor, resultEmoji;
  
  if (!winnerId) { resultText = t.draw; resultColor = '#ffcc44'; resultEmoji = '🤝'; } 
  else if (winnerId === myId) { resultText = t.youWin; resultColor = '#00ffaa'; resultEmoji = '🏆'; } 
  else { resultText = t.youLose; resultColor = '#ff6464'; resultEmoji = '😢'; }
  
  const gameBlock = document.getElementById('chessGameBlock');
  if (gameBlock) {
    gameBlock.innerHTML = `
      <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:32px 16px;margin-bottom:20px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:16px;">${resultEmoji}</div>
        <div style="font-size:1.5rem;font-weight:900;color:${resultColor};margin-bottom:8px;">${resultText}</div>
      </div>
      <button onclick="chessBackToMenu()" style="width:100%;background:#ffcc44;color:#000;padding:14px;border-radius:10px;font-weight:700;border:none;cursor:pointer;">${t.returnToMenu}</button>
    `;
  }
}

function loadChessJoinPanel(gameIdParam) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  const root = document.getElementById('dynamicContent') || document.body;
  root.innerHTML = '';
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  
  const joinContainer = document.createElement('div');
  joinContainer.id = 'chessJoinContainer';
  joinContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:#0a0f1e;';
  joinContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
      <div style="font-size:2rem;font-weight:900;color:#ffcc44;margin-bottom:24px;">♟️ ${t.title}</div>
      <div id="chessJoinLoader" style="background:rgba(255,255,255,0.05);border-radius:16px;padding:24px;color:#d4d4d8;margin-bottom:16px;">⏳ Проверяем партию...</div>
      <div id="chessJoinActions" style="display:none;flex-direction:column;gap:12px;">
        <button onclick="chessAcceptInvite(${gameIdParam})" style="width:100%;background:#00ffaa;color:#000;padding:16px;border-radius:10px;font-weight:700;border:none;cursor:pointer;">⚔️ Принять вызов</button>
        <button onclick="chessBackToMenu()" style="width:100%;background:#ff6464;color:#fff;padding:16px;border-radius:10px;font-weight:700;border:none;cursor:pointer;">${t.backBtn}</button>
      </div>
    </div>
  `;
  document.body.appendChild(joinContainer);
  
  authFetch(`${BASE_URL}/api/chess/state?game_id=${gameIdParam}`)
    .then(r => r.json())
    .then(data => {
      const loader = document.getElementById('chessJoinLoader');
      const actions = document.getElementById('chessJoinActions');
      if (!loader) return;
      loader.style.display = 'none';
      if (data.success && data.game.status === 'waiting') {
        actions.style.display = 'flex';
      } else {
        loader.style.display = 'block';
        loader.textContent = t.opponentNotFound || 'Партия не найдена';
        loader.style.color = '#ff6464';
      }
    })
    .catch(() => {
      const loader = document.getElementById('chessJoinLoader');
      if (loader) { loader.style.display = 'block'; loader.textContent = t.errConnect; loader.style.color = '#ff6464'; }
    });
}

async function chessAcceptInvite(gameIdParam) {
  const t = CHESS_LANG[currentLang] || CHESS_LANG.en;
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/join`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game_id: gameIdParam })
    });
    const data = await res.json();
    if (data.success) {
      chessGameId = gameIdParam;
      const joinContainer = document.getElementById('chessJoinContainer');
      if (joinContainer) joinContainer.remove();
      const stateRes = await authFetch(`${BASE_URL}/api/chess/state?game_id=${gameIdParam}`);
      const stateData = await stateRes.json();
      if (stateData.success) chessStartGame(gameIdParam, stateData.game);
    } else {
      showToast(data.message || t.errConnect, 3000);
    }
  } catch (e) { showToast(t.errConnect, 3000); }
}

window.loadChessPanel = loadChessPanel;
window.chessBackToMenu = chessBackToMenu;
window.chessCreate = chessCreate;
window.chessShareInvite = chessShareInvite;
window.chessCopyLink = chessCopyLink;
window.chessCancel = chessCancel;
window.chessResign = chessResign;
window.chessAcceptInvite = chessAcceptInvite;
window.loadChessJoinPanel = loadChessJoinPanel;
