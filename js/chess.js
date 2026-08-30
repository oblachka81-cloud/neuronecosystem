// ==================== NEURON CHESS v2 (чистовая сборка) ====================

const CHESS_LANG = {
  ru: { title:'Шахматы', subtitle:'1 на 1 • классика • ставка', desc:'Брось вызов другу! Ставки: 100 / 500 / 1000 COGNIQ. Победитель забирает банк, 5% сжигается навсегда.', waiting:'Ожидание соперника...', shareInvite:'Отправить приглашение', copyLink:'Скопировать ссылку', copied:'✅ Скопировано!', backBtn:'← Назад', errCreate:'Не удалось создать партию', errConnect:'Ошибка связи', cancelDuel:'Отменить партию', cancelConfirm:'Отменить партию и вернуть ставку?', yourTurn:'Ваш ход', opponentTurn:'Ход соперника', draw:'Ничья! Ставки возвращены', youWin:'Вы победили!', youLose:'Вы проиграли', resign:'Сдаться', returnToMenu:'← Вернуться в меню', opponentNotFound:'Соперник не найден', duelCancelled:'Партия отменена', whiteLabel:'Белые', blackLabel:'Чёрные', autoCancel:'Автоотмена через:' },
  en: { title:'Chess', subtitle:'1 vs 1 • classic • stake', desc:'Challenge a friend! Stakes: 100 / 500 / 1000 COGNIQ. Winner takes the pot, 5% burned forever.', waiting:'Waiting for opponent...', shareInvite:'Send invite', copyLink:'Copy link', copied:'✅ Copied!', backBtn:'← Back', errCreate:'Could not create game', errConnect:'Connection error', cancelDuel:'Cancel game', cancelConfirm:'Cancel game and refund stake?', yourTurn:'Your turn', opponentTurn:'Opponent turn', draw:'Draw! Stakes refunded', youWin:'You win!', youLose:'You lose', resign:'Resign', returnToMenu:'← Return to menu', opponentNotFound:'Opponent not found', duelCancelled:'Game cancelled', whiteLabel:'White', blackLabel:'Black', autoCancel:'Auto-cancel in:' },
  fr: { title:'Échecs', subtitle:'1 contre 1 • classique • mise', desc:'Défiez un ami ! Mises : 100 / 500 / 1000 COGNIQ. Le gagnant prend le pot, 5% brûlés.', waiting:'Attente adversaire...', shareInvite:'Envoyer invitation', copyLink:'Copier lien', copied:'✅ Copié !', backBtn:'← Retour', errCreate:'Impossible de créer la partie', errConnect:'Erreur de connexion', cancelDuel:'Annuler la partie', cancelConfirm:'Annuler la partie et rembourser la mise ?', yourTurn:'Votre tour', opponentTurn:'Tour adversaire', draw:'Nulle ! Mises remboursées', youWin:'Vous gagnez !', youLose:'Vous perdez', resign:'Abandonner', returnToMenu:'← Retour au menu', opponentNotFound:'Adversaire introuvable', duelCancelled:'Partie annulée', whiteLabel:'Blancs', blackLabel:'Noirs', autoCancel:'Annulation auto :' },
  es: { title:'Ajedrez', subtitle:'1 vs 1 • clásico • apuesta', desc:'¡Reta a un amigo! Apuestas: 100 / 500 / 1000 COGNIQ. El ganador se lleva el bote, 5% quemado.', waiting:'Esperando oponente...', shareInvite:'Enviar invitación', copyLink:'Copiar enlace', copied:'✅ ¡Copiado!', backBtn:'← Volver', errCreate:'No se pudo crear la partida', errConnect:'Error de conexión', cancelDuel:'Cancelar partida', cancelConfirm:'¿Cancelar partida y devolver apuesta?', yourTurn:'Tu turno', opponentTurn:'Turno del oponente', draw:'¡Empate! Apuestas devueltas', youWin:'¡Ganas!', youLose:'Pierdes', resign:'Rendirse', returnToMenu:'← Volver al menú', opponentNotFound:'Oponente no encontrado', duelCancelled:'Partida cancelada', whiteLabel:'Blancas', blackLabel:'Negras', autoCancel:'Auto-cancelación:' }
};

// ЗАЛИТЫЕ глифы для ОБЕИХ цветов — ключ к одинаковому виду на любом Android
const GLYPH = { K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟' };

let chessGameId = null, chessMyColor = null, chessBoard = null,
    chessSelected = null, chessLegalMap = {}, chessLastMove = null,
    chessFen = '', chessPollInterval = null, chessMoving = false,
    chessActive = false, chessP1 = null, chessP2 = null, chessStake = 0;

function chzT() { return CHESS_LANG[currentLang] || CHESS_LANG.en; }

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ---------- СТИЛИ (вводятся один раз) ----------
function chzInjectCSS() {
  if (document.getElementById('chz-css')) return;
  const s = document.createElement('style');
  s.id = 'chz-css';
  s.textContent = `
    #chessScreen{position:fixed;inset:0;z-index:9999;overflow-y:auto;padding:16px 12px 40px;background:rgba(5,8,18,0.92);backdrop-filter:blur(6px);}
    .chz-wrap{max-width:480px;margin:0 auto;}
    .chz-title{text-align:center;font-size:2.1rem;font-weight:900;letter-spacing:3px;background:linear-gradient(90deg,#ffcc44 0%,#fff3c4 45%,#ffcc44 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .chz-sub{text-align:center;font-size:.82rem;color:#8ba3c1;margin-top:4px;letter-spacing:.5px;}
    .chz-card{background:rgba(10,15,30,0.75);border:1.5px solid rgba(220,220,225,0.35);border-radius:18px;padding:16px;backdrop-filter:blur(10px);}
    .chz-desc{font-size:.87rem;color:#e5e7eb;line-height:1.55;margin:0;text-align:center;}
    .chz-btn{display:flex;align-items:center;justify-content:center;width:100%;height:52px;border:none;border-radius:12px;cursor:pointer;font-weight:800;font-size:.9rem;letter-spacing:.5px;background:linear-gradient(135deg,#1a2332,#0f1622);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
    .chz-btn.green{color:#00ffaa;border:1px solid rgba(0,255,170,.45);}
    .chz-btn.gold{color:#ffcc44;border:1px solid rgba(255,204,68,.45);}
    .chz-btn.red{color:#ff6464;border:1px solid rgba(255,100,100,.45);}
    .chz-btn.small{width:auto;padding:0 18px;height:44px;}
    .chz-stakes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:20px 0;}
    .chz-stake{position:relative;height:88px;border:none;border-radius:16px;cursor:pointer;background:linear-gradient(135deg,#1a2332,#0f1622);border:1px solid rgba(255,204,68,.4);box-shadow:0 4px 14px rgba(0,0,0,.4);-webkit-tap-highlight-color:transparent;}
    .chz-stake b{display:block;font-size:1.3rem;color:#ffcc44;font-weight:900;text-shadow:0 0 12px rgba(255,204,68,.4);}
    .chz-stake span{display:block;font-size:.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;}
    .chz-hot{position:absolute;top:4px;right:6px;background:rgba(0,255,170,.25);color:#00ffaa;font-size:.5rem;font-weight:800;padding:2px 5px;border-radius:6px;}
    .chz-timerbox{background:rgba(0,0,0,.4);border-radius:12px;padding:10px;margin:14px 0;border:1px solid rgba(255,204,68,.3);}
    .chz-timer{font-size:1.8rem;font-weight:900;color:#ffcc44;text-shadow:0 0 10px rgba(255,204,68,.4);}
    .chz-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;}
    .chz-chip{flex:1;text-align:center;font-size:.8rem;font-weight:800;color:#ffcc44;background:rgba(255,204,68,.12);border:1px solid rgba(255,204,68,.35);border-radius:10px;padding:10px 6px;}
    .chz-players{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:12px;}
    .chz-pname{font-size:.78rem;font-weight:700;max-width:38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .chz-pside{font-size:.62rem;color:#8ba3c1;}
    .chz-turn{font-size:.72rem;font-weight:800;padding:6px 10px;border-radius:10px;}
    .chz-turn.my{color:#00ffaa;background:rgba(0,255,170,.12);border:1px solid rgba(0,255,170,.4);}
    .chz-turn.op{color:#8ba3c1;background:rgba(139,163,193,.1);border:1px solid rgba(139,163,193,.3);}
    .chz-board{display:grid;grid-template-columns:repeat(8,1fr);border-radius:10px;overflow:hidden;border:3px solid rgba(255,204,68,.85);box-shadow:0 8px 30px rgba(0,0,0,.55),0 0 18px rgba(255,204,68,.22);margin-bottom:14px;}
    .chz-cell{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation;}
    .chz-light{background:#eeeed2;}
    .chz-dark{background:#769656;}
    .chz-last{box-shadow:inset 0 0 0 100px rgba(255,255,60,.35);}
    .chz-sel{box-shadow:inset 0 0 0 100px rgba(255,230,0,.5);}
    .chz-check{box-shadow:inset 0 0 14px 5px rgba(255,60,60,.8);}
    .chz-dot::after{content:'';position:absolute;width:27%;height:27%;border-radius:50%;background:rgba(20,60,20,.35);}
    .chz-cap::after{content:'';position:absolute;inset:5%;border-radius:50%;border:4px solid rgba(20,60,20,.35);}
    .chz-piece{position:relative;z-index:2;line-height:1;font-size:calc(min(100vw - 40px, 442px)/10);}
    .chz-w{color:#f8f8f8;text-shadow:0 0 3px #000,0 2px 3px rgba(0,0,0,.6);}
    .chz-b{color:#141414;text-shadow:0 0 3px rgba(255,255,255,.4),0 2px 3px rgba(0,0,0,.4);}
    .chz-coord{position:absolute;font-size:9px;font-weight:800;pointer-events:none;}
    .chz-crank{top:2px;left:3px;}
    .chz-cfile{bottom:1px;right:3px;}
    .chz-light .chz-coord{color:#769656;}
    .chz-dark .chz-coord{color:#eeeed2;}
    .chz-result{text-align:center;padding:28px 16px;}
    .chz-resemoji{font-size:3rem;margin-bottom:12px;}
    .chz-restext{font-size:1.6rem;font-weight:900;}
  `;
  document.head.appendChild(s);
}

// ---------- ЭКРАН (один контейнер, экраны меняются целиком) ----------
function chzScreen() {
  let el = document.getElementById('chessScreen');
  if (!el) {
    el = document.createElement('div');
    el.id = 'chessScreen';
    document.body.appendChild(el);
  }
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';
  return el;
}

// ---------- МЕНЮ ----------
function loadChessPanel() {
  const t = chzT();
  chzInjectCSS();
  chzScreen().innerHTML = `
    <div class="chz-wrap">
      <button class="chz-btn gold small" onclick="chessBackToMenu()" style="margin-bottom:18px;">${t.backBtn}</button>
      <div class="chz-title">♟️ ${t.title}</div>
      <div class="chz-sub">${t.subtitle}</div>
      <div class="chz-card" style="margin:18px 0;"><p class="chz-desc">${t.desc}</p></div>
      <div class="chz-stakes">
        <button class="chz-stake" onclick="chessCreate(100)"><span>СТАВКА</span><b>100</b><span>COGNIQ</span></button>
        <button class="chz-stake" onclick="chessCreate(500)"><div class="chz-hot">HOT</div><span>СТАВКА</span><b>500</b><span>COGNIQ</span></button>
        <button class="chz-stake" onclick="chessCreate(1000)"><span>СТАВКА</span><b>1000</b><span>COGNIQ</span></button>
      </div>
    </div>`;
}

function chessBackToMenu() {
  if (chessPollInterval) { clearInterval(chessPollInterval); chessPollInterval = null; }
  if (window._chessCountdownInterval) { clearInterval(window._chessCountdownInterval); window._chessCountdownInterval = null; }
  const el = document.getElementById('chessScreen');
  if (el) el.remove();
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = '';
  chessGameId = null; chessBoard = null; chessSelected = null; chessLegalMap = {};
  chessLastMove = null; chessFen = ''; chessMoving = false; chessActive = false;
  if (typeof switchTab === 'function') switchTab('game');
}

// ---------- СОЗДАНИЕ / ОЖИДАНИЕ ----------
async function chessCreate(stake) {
  const t = chzT();
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stake })
    });
    const data = await res.json();
    if (!data.success) { showToast(data.message || t.errCreate, 3000); return; }
    chessGameId = data.gameId;
    chessStake = stake;

    // Экран ожидания ПОЛНОСТЬЮ заменяет меню — ставки исчезают
    chzScreen().innerHTML = `
      <div class="chz-wrap">
        <div class="chz-card" style="text-align:center;">
          <div style="font-size:.95rem;font-weight:700;color:#00ffaa;margin-bottom:8px;">⏳ ${t.waiting}</div>
          <div style="font-size:.75rem;color:#8ba3c1;margin-bottom:14px;">ID: ${data.gameId}</div>
          <div class="chz-timerbox">
            <div style="font-size:.7rem;color:#8ba3c1;margin-bottom:4px;">${t.autoCancel}</div>
            <div id="chzCountdown" class="chz-timer">2:00</div>
          </div>
          <button class="chz-btn green" style="margin-bottom:10px;" onclick="chessShareInvite('${data.inviteLink}', ${stake})">📤 ${t.shareInvite}</button>
          <button class="chz-btn gold" style="margin-bottom:10px;" onclick="chessCopyLink('${data.inviteLink}')">🔗 ${t.copyLink}</button>
          <button class="chz-btn red" onclick="chessCancel(${data.gameId})">❌ ${t.cancelDuel}</button>
        </div>
      </div>`;

    let countdown = 120;
    window._chessCountdownInterval = setInterval(() => {
      countdown--;
      const el = document.getElementById('chzCountdown');
      if (el) {
        el.textContent = Math.floor(countdown / 60) + ':' + String(countdown % 60).padStart(2, '0');
        if (countdown <= 30) el.style.color = '#ff6464';
      }
      if (countdown <= 0) clearInterval(window._chessCountdownInterval);
    }, 1000);

    chessStartPolling(data.gameId);
  } catch (e) { showToast(t.errConnect, 3000); }
}

function chessShareInvite(link, stake) {
  const shareText = '♟️ Вызов на шахматную партию в NEURON!\nСтавка: ' + stake + ' COGNIQ\nПримешь вызов?';
  const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(shareText);
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) { window.Telegram.WebApp.openTelegramLink(shareUrl); return; }
  window.open(shareUrl, '_blank');
}

function chessCopyLink(link) {
  const t = chzT();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => showToast(t.copied, 2000)).catch(() => showToast(link, 4000));
  } else { showToast(link, 4000); }
}

async function chessCancel(gameIdParam) {
  const t = chzT();
  if (!confirm(t.cancelConfirm)) return;
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameIdParam })
    });
    const data = await res.json();
    if (data.success) { showToast(t.duelCancelled, 2000); chessBackToMenu(); }
    else showToast(data.message || t.errConnect, 3000);
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
        clearInterval(chessPollInterval); chessPollInterval = null;
        if (window._chessCountdownInterval) clearInterval(window._chessCountdownInterval);
        showToast('⏱️ ' + chzT().duelCancelled, 3000);
        setTimeout(chessBackToMenu, 1500);
        return;
      }
      if (data.game.status === 'active' && data.game.player2) {
        clearInterval(chessPollInterval); chessPollInterval = null;
        if (window._chessCountdownInterval) clearInterval(window._chessCountdownInterval);
        chessStartGame(data.game);
      }
    } catch (e) {}
  }, 2000);
}

// ---------- ПРИСОЕДИНЕНИЕ ----------
function loadChessJoinPanel(gameIdParam) {
  const t = chzT();
  chzInjectCSS();
  chzScreen().innerHTML = `
    <div class="chz-wrap">
      <div class="chz-title" style="margin-bottom:20px;">♟️ ${t.title}</div>
      <div class="chz-card" id="chzJoinLoader" style="text-align:center;color:#8ba3c1;">⏳ ...</div>
      <div id="chzJoinActions" style="display:none;flex-direction:column;gap:12px;margin-top:12px;">
        <button class="chz-btn green" onclick="chessAcceptInvite(${gameIdParam})">⚔️ Принять вызов</button>
        <button class="chz-btn red" onclick="chessBackToMenu()">${t.backBtn}</button>
      </div>
    </div>`;

  authFetch(`${BASE_URL}/api/chess/state?game_id=${gameIdParam}`)
    .then(r => r.json())
    .then(data => {
      const loader = document.getElementById('chzJoinLoader');
      if (!loader) return;
      if (data.success && data.game.status === 'waiting') {
        loader.innerHTML = '⚔️ <b style="color:#ffcc44">' + escapeHtml(data.game.player1.nick) + '</b><br><span style="font-size:.8rem;color:#8ba3c1;">' + data.game.stake + ' COGNIQ</span>';
        document.getElementById('chzJoinActions').style.display = 'flex';
      } else {
        loader.innerHTML = '<span style="color:#ff6464;">' + t.opponentNotFound + '</span>';
      }
    })
    .catch(() => {
      const loader = document.getElementById('chzJoinLoader');
      if (loader) loader.innerHTML = '<span style="color:#ff6464;">' + t.errConnect + '</span>';
    });
}

async function chessAcceptInvite(gameIdParam) {
  const t = chzT();
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/join`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameIdParam })
    });
    const data = await res.json();
    if (!data.success) { showToast(data.message || t.errConnect, 3000); return; }
    const stateRes = await authFetch(`${BASE_URL}/api/chess/state?game_id=${gameIdParam}`);
    const stateData = await stateRes.json();
    if (stateData.success) chessStartGame(stateData.game);
  } catch (e) { showToast(t.errConnect, 3000); }
}

// ---------- ИГРА ----------
function chessStartGame(game) {
  chessGameId = game.id;
  chessStake = game.stake;
  chessP1 = game.player1; chessP2 = game.player2;
  chessMyColor = String(game.player1.id) === String(userId) ? 'w' : 'b';
  chessFen = game.fen;
  chessLastMove = null;
  chessActive = true;

  const t = chzT();
  chzScreen().innerHTML = `
    <div class="chz-wrap">
      <div class="chz-topbar">
        <button class="chz-btn gold small" onclick="chessBackToMenu()">←</button>
        <div class="chz-chip">🏆 ${game.stake} COGNIQ</div>
      </div>
      <div class="chz-card chz-players">
        <div style="text-align:left;max-width:38%;">
          <div class="chz-pname" style="color:#00ffaa;">${escapeHtml(chessP1.nick)}</div>
          <div class="chz-pside">${t.whiteLabel}</div>
        </div>
        <div id="chzTurn" class="chz-turn my">...</div>
        <div style="text-align:right;max-width:38%;">
          <div class="chz-pname" style="color:#ff6464;">${escapeHtml(chessP2 ? chessP2.nick : '—')}</div>
          <div class="chz-pside">${t.blackLabel}</div>
        </div>
      </div>
      <div id="chzBoard" class="chz-board"></div>
      <button class="chz-btn red" onclick="chessResign()">🏳️ ${t.resign}</button>
    </div>`;

  document.getElementById('chzBoard').addEventListener('click', e => {
    const cell = e.target.closest('.chz-cell');
    if (cell) chessCellClick(cell.dataset.square);
  });

  renderBoard();
  chessStartGamePolling();
}

function parseFen(fen) {
  const board = [];
  for (const row of fen.split(' ')[0].split('/')) {
    const r = [];
    for (const ch of row) {
      if (isNaN(ch)) r.push((ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase());
      else for (let i = 0; i < parseInt(ch); i++) r.push(null);
    }
    board.push(r);
  }
  return board;
}

function pieceAt(sq) {
  if (!chessBoard) return null;
  const c = sq.charCodeAt(0) - 97, r = 8 - parseInt(sq[1]);
  return chessBoard[r] ? chessBoard[r][c] : null;
}

function clientChess(fen) {
  if (!window.Chess) return null;
  try { return new window.Chess(fen); } catch (e) { return null; }
}

function legalTargets(sq) {
  const c = clientChess(chessFen);
  if (!c) return {};
  const map = {};
  try { c.moves({ square: sq, verbose: true }).forEach(m => { map[m.to] = !!m.captured; }); } catch (e) {}
  return map;
}

function checkSquare() {
  const c = clientChess(chessFen);
  if (!c) return null;
  const inChk = c.inCheck ? c.inCheck() : (c.in_check ? c.in_check() : false);
  if (!inChk) return null;
  const side = chessFen.split(' ')[1];
  for (let r = 0; r < 8; r++) for (let col = 0; col < 8; col++) {
    if (chessBoard[r][col] === side + 'K') return String.fromCharCode(97 + col) + (8 - r);
  }
  return null;
}

function diffLastMove(oldFen, newFen) {
  try {
    const ob = parseFen(oldFen), nb = parseFen(newFen);
    const mover = newFen.split(' ')[1] === 'w' ? 'b' : 'w';
    let from = null, to = null, kF = null, kT = null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const o = ob[r][c], n = nb[r][c];
      if (o === n) continue;
      const sq = String.fromCharCode(97 + c) + (8 - r);
      if (o && o[0] === mover && !n) { if (o[1] === 'K') kF = sq; if (!from) from = sq; }
      if (n && n[0] === mover && (!o || o[0] !== mover)) { if (n[1] === 'K') kT = sq; to = sq; }
    }
    if (kF && kT) return { from: kF, to: kT };
    if (from && to) return { from, to };
    return null;
  } catch (e) { return null; }
}

function renderBoard() {
  const t = chzT();
  chessBoard = parseFen(chessFen);
  const flipped = chessMyColor === 'b';
  const chkSq = checkSquare();

  let html = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const row = flipped ? 7 - i : i;
      const col = flipped ? 7 - j : j;
      const sq = String.fromCharCode(97 + col) + (8 - row);
      const piece = chessBoard[row][col];
      const isLight = (row + col) % 2 === 0;
      let cls = 'chz-cell ' + (isLight ? 'chz-light' : 'chz-dark');
      if (chessLastMove && (chessLastMove.from === sq || chessLastMove.to === sq)) cls += ' chz-last';
      if (chessSelected === sq) cls += ' chz-sel';
      if (chkSq === sq) cls += ' chz-check';
      if (chessSelected && chessLegalMap[sq] !== undefined) cls += chessLegalMap[sq] ? ' chz-cap' : ' chz-dot';

      let inner = '';
      if (j === 0) inner += '<span class="chz-coord chz-crank">' + (8 - row) + '</span>';
      if (i === 7) inner += '<span class="chz-coord chz-cfile">' + String.fromCharCode(97 + col) + '</span>';
      if (piece) inner += '<span class="chz-piece ' + (piece[0] === 'w' ? 'chz-w' : 'chz-b') + '">' + GLYPH[piece[1]] + '</span>';
      html += '<div class="' + cls + '" data-square="' + sq + '">' + inner + '</div>';
    }
  }
  document.getElementById('chzBoard').innerHTML = html;

  const turn = chessFen.split(' ')[1];
  const myTurn = turn === chessMyColor;
  const turnEl = document.getElementById('chzTurn');
  if (turnEl) {
    turnEl.textContent = myTurn ? t.yourTurn : t.opponentTurn;
    turnEl.className = 'chz-turn ' + (myTurn ? 'my' : 'op');
  }
}

function chessCellClick(sq) {
  if (chessMoving || !chessActive) return;
  if (chessFen.split(' ')[1] !== chessMyColor) return;
  const p = pieceAt(sq);

  if (chessSelected) {
    if (sq === chessSelected) { chessSelected = null; chessLegalMap = {}; renderBoard(); return; }
    if (chessLegalMap[sq] !== undefined) {
      const from = chessSelected;
      chessSelected = null; chessLegalMap = {};
      doMove(from, sq);
      return;
    }
    if (p && p[0] === chessMyColor) { chessSelected = sq; chessLegalMap = legalTargets(sq); renderBoard(); return; }
    chessSelected = null; chessLegalMap = {}; renderBoard(); return;
  }
  if (p && p[0] === chessMyColor) { chessSelected = sq; chessLegalMap = legalTargets(sq); renderBoard(); }
}

async function doMove(from, to) {
  if (chessMoving) return;
  chessMoving = true;
  try {
    const res = await authFetch(`${BASE_URL}/api/chess/move`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: chessGameId, from, to, promotion: 'q' })
    });
    const data = await res.json();
    if (!data.success) { showToast(data.message || '❌', 2500); renderBoard(); return; }

    chessLastMove = { from, to };
    chessFen = data.fen;
    renderBoard();

    if (data.finished) {
      const st = await authFetch(`${BASE_URL}/api/chess/state?game_id=${chessGameId}`);
      const sd = await st.json();
      if (sd.success) chessShowResult(sd.game);
    }
  } catch (e) { showToast(chzT().errConnect, 3000); }
  finally { chessMoving = false; }
}

function chessStartGamePolling() {
  if (chessPollInterval) clearInterval(chessPollInterval);
  chessPollInterval = setInterval(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/chess/state?game_id=${chessGameId}`);
      const data = await res.json();
      if (!data.success) return;
      if (data.game.status === 'finished') {
        clearInterval(chessPollInterval); chessPollInterval = null;
        chessShowResult(data.game);
        return;
      }
      if (data.game.fen !== chessFen) {
        chessLastMove = diffLastMove(chessFen, data.game.fen);
        chessFen = data.game.fen;
        renderBoard();
      }
    } catch (e) {}
  }, 2000);
}

async function chessResign() {
  const t = chzT();
  if (!confirm(t.resign + '?')) return;
  try {
    await authFetch(`${BASE_URL}/api/chess/resign`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: chessGameId })
    });
    const st = await authFetch(`${BASE_URL}/api/chess/state?game_id=${chessGameId}`);
    const sd = await st.json();
    if (sd.success) chessShowResult(sd.game); else chessBackToMenu();
  } catch (e) { chessBackToMenu(); }
}

function chessShowResult(game) {
  chessActive = false;
  if (chessPollInterval) { clearInterval(chessPollInterval); chessPollInterval = null; }
  const t = chzT();
  const winnerId = game.winnerId ? String(game.winnerId) : null;
  let text, color, emoji;
  if (!winnerId) { text = t.draw; color = '#ffcc44'; emoji = '🤝'; }
  else if (winnerId === String(userId)) {
    text = t.youWin; color = '#00ffaa'; emoji = '🏆';
    if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 150]);
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    setTimeout(() => { if (typeof launchConfettiTop === 'function') launchConfettiTop(); }, 300);
  } else {
    text = t.youLose; color = '#ff6464'; emoji = '😢';
    if (navigator.vibrate) navigator.vibrate(300);
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
  }

  chzScreen().innerHTML = `
    <div class="chz-wrap">
      <div class="chz-card chz-result">
        <div class="chz-resemoji">${emoji}</div>
        <div class="chz-restext" style="color:${color};">${text}</div>
        <div style="font-size:.8rem;color:#8ba3c1;margin-top:8px;">🏆 ${game.stake} COGNIQ</div>
      </div>
      <button class="chz-btn gold" style="margin-top:14px;" onclick="chessBackToMenu()">${t.returnToMenu}</button>
    </div>`;
}

// ==================== ЭКСПОРТЫ ====================
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
