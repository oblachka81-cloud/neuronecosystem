// ==================== ШАХМАТЫ (в стиле дуэлей) ====================

const CHESS_LANG = {
  ru: { title:'Шахматы', subtitle:'1 на 1 • классика • ставка', desc:'Брось вызов другу! Ставки: 100 / 500 / 1000 COGNIQ. Победитель забирает банк, 5% сжигается навсегда.', waiting:'Ожидание соперника...', shareInvite:'Отправить приглашение', copyLink:'Скопировать ссылку', copied:'✅ Скопировано!', backBtn:'← Назад', errCreate:'Не удалось создать партию', errConnect:'Ошибка связи', cancelDuel:'Отменить партию', cancelConfirm:'Отменить партию и вернуть ставку?', yourTurn:'Ваш ход', opponentTurn:'Ход соперника', draw:'Ничья! Ставки возвращены', youWin:'Вы победили!', youLose:'Вы проиграли', resign:'Сдаться', returnToMenu:'← Вернуться в меню', opponentNotFound:'Соперник не найден', duelCancelled:'Партия отменена', whiteLabel:'Белые', blackLabel:'Чёрные', autoCancel:'Автоотмена через:', stakeLabel:'СТАВКА', accept:'Принять вызов', checking:'⏳ Проверяем партию...' },
  en: { title:'Chess', subtitle:'1 vs 1 • classic • stake', desc:'Challenge a friend! Stakes: 100 / 500 / 1000 COGNIQ. Winner takes the pot, 5% burned forever.', waiting:'Waiting for opponent...', shareInvite:'Send invite', copyLink:'Copy link', copied:'✅ Copied!', backBtn:'← Back', errCreate:'Could not create game', errConnect:'Connection error', cancelDuel:'Cancel game', cancelConfirm:'Cancel game and refund stake?', yourTurn:'Your turn', opponentTurn:'Opponent turn', draw:'Draw! Stakes refunded', youWin:'You win!', youLose:'You lose', resign:'Resign', returnToMenu:'← Return to menu', opponentNotFound:'Opponent not found', duelCancelled:'Game cancelled', whiteLabel:'White', blackLabel:'Black', autoCancel:'Auto-cancel in:', stakeLabel:'STAKE', accept:'Accept challenge', checking:'⏳ Checking game...' },
  fr: { title:'Échecs', subtitle:'1 contre 1 • classique • mise', desc:'Défiez un ami ! Mises : 100 / 500 / 1000 COGNIQ. Le gagnant prend le pot, 5% brûlés.', waiting:'Attente adversaire...', shareInvite:'Envoyer invitation', copyLink:'Copier lien', copied:'✅ Copié !', backBtn:'← Retour', errCreate:'Impossible de créer la partie', errConnect:'Erreur de connexion', cancelDuel:'Annuler la partie', cancelConfirm:'Annuler la partie et rembourser la mise ?', yourTurn:'Votre tour', opponentTurn:'Tour adversaire', draw:'Nulle ! Mises remboursées', youWin:'Vous gagnez !', youLose:'Vous perdez', resign:'Abandonner', returnToMenu:'← Retour au menu', opponentNotFound:'Adversaire introuvable', duelCancelled:'Partie annulée', whiteLabel:'Blancs', blackLabel:'Noirs', autoCancel:'Annulation auto :', stakeLabel:'MISE', accept:'Accepter le défi', checking:'⏳ Vérification...' },
  es: { title:'Ajedrez', subtitle:'1 vs 1 • clásico • apuesta', desc:'¡Reta a un amigo! Apuestas: 100 / 500 / 1000 COGNIQ. El ganador se lleva el bote, 5% quemado.', waiting:'Esperando oponente...', shareInvite:'Enviar invitación', copyLink:'Copiar enlace', copied:'✅ ¡Copiado!', backBtn:'← Volver', errCreate:'No se pudo crear la partida', errConnect:'Error de conexión', cancelDuel:'Cancelar partida', cancelConfirm:'¿Cancelar partida y devolver apuesta?', yourTurn:'Tu turno', opponentTurn:'Turno del oponente', draw:'¡Empate! Apuestas devueltas', youWin:'¡Ganas!', youLose:'Pierdes', resign:'Rendirse', returnToMenu:'← Volver al menú', opponentNotFound:'Oponente no encontrado', duelCancelled:'Partida cancelada', whiteLabel:'Blancas', blackLabel:'Negras', autoCancel:'Auto-cancelación:', stakeLabel:'APUESTA', accept:'Aceptar desafío', checking:'⏳ Comprobando...' }
};

const GLYPH = { K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟' };

let chessGameId = null, chessBoard = null, chessSelected = null,
    chessPollInterval = null, chessMyColor = null, chessMoving = false,
    lastKnownFen = '', chessLegalMap = {}, chessLastMove = null,
    chessFen = '', chessActive = false, chessP1 = null, chessP2 = null, chessStake = 0;

function chzT() { return CHESS_LANG[currentLang] || CHESS_LANG.en; }

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function chzInjectCSS() {
  if (document.getElementById('chz-css')) return;
  const s = document.createElement('style');
  s.id = 'chz-css';
  s.textContent = `
    .chz-board{display:grid;grid-template-columns:repeat(8,1fr);border-radius:10px;overflow:hidden;border:3px solid rgba(255,204,68,.85);box-shadow:0 8px 30px rgba(0,0,0,.55),0 0 18px rgba(255,204,68,.22);margin-bottom:14px;}
    .chz-cell{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation;}
    .chz-light{background:#eeeed2;} .chz-dark{background:#769656;}
    .chz-last{box-shadow:inset 0 0 0 100px rgba(255,255,60,.35);}
    .chz-sel{box-shadow:inset 0 0 0 100px rgba(255,230,0,.5);}
    .chz-check{box-shadow:inset 0 0 14px 5px rgba(255,60,60,.8);}
    .chz-dot::after{content:'';position:absolute;width:27%;height:27%;border-radius:50%;background:rgba(20,60,20,.35);}
    .chz-cap::after{content:'';position:absolute;inset:5%;border-radius:50%;border:4px solid rgba(20,60,20,.35);}
    .chz-piece{position:relative;z-index:2;line-height:1;font-size:calc(min(100vw - 40px, 442px)/10);}
    .chz-w{color:#f8f8f8;text-shadow:0 0 3px #000,0 2px 3px rgba(0,0,0,.6);}
    .chz-b{color:#141414;text-shadow:0 0 3px rgba(255,255,255,.4),0 2px 3px rgba(0,0,0,.4);}
    .chz-coord{position:absolute;font-size:9px;font-weight:800;pointer-events:none;}
    .chz-crank{top:2px;left:3px;} .chz-cfile{bottom:1px;right:3px;}
    .chz-light .chz-coord{color:#769656;} .chz-dark .chz-coord{color:#eeeed2;}
    .chz-turn{font-size:.72rem;font-weight:800;padding:6px 10px;border-radius:10px;}
    .chz-turn.my{color:#00ffaa;background:rgba(0,255,170,.12);border:1px solid rgba(0,255,170,.4);}
    .chz-turn.op{color:#8ba3c1;background:rgba(139,163,193,.1);border:1px solid rgba(139,163,193,.3);}
    @keyframes chzHotPulse{0%,100%{box-shadow:0 0 20px rgba(0,255,170,.18),0 4px 15px rgba(0,0,0,.3);}50%{box-shadow:0 0 30px rgba(0,255,170,.3),0 4px 15px rgba(0,0,0,.3);}}
    @keyframes chzBadgePulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.8;transform:scale(1.05);}}
  `;
  document.head.appendChild(s);
}

// ---------- МЕНЮ (как в дуэлях) ----------
function loadChessPanel() {
  const t = chzT();
  chzInjectCSS();
  const rootEl = document.getElementById('dynamicContent');
  if (rootEl) rootEl.innerHTML = '';

  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'none';

  const chessContainer = document.createElement('div');
  chessContainer.id = 'chessContainer';
  chessContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:transparent;';

  chessContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      <button onclick="chessBackToMenu()" style="position:relative;width:100px;height:50px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;margin-bottom:20px;">
        <img src="/main/btn_duel_back.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
      </button>

      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:2.2rem;font-weight:900;background:linear-gradient(90deg,#ffcc44 0%,#fff3c4 45%,#ffcc44 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;">♟️ ${t.title}</div>
        <div style="font-size:0.82rem;color:#8ba3c1;letter-spacing:0.5px;font-weight:500;margin-top:4px;">${t.subtitle}</div>
      </div>

      <div style="background:rgba(10,15,30,0.35);border:1.5px solid rgba(220,220,225,0.5);border-radius:20px;padding:18px 16px;margin-bottom:24px;box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);backdrop-filter:blur(8px);">
        <p style="font-size:0.87rem;background:linear-gradient(90deg,#d4d4d8 0%,#ffffff 50%,#d4d4d8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.55;margin:0;text-align:center;font-weight:500;">${t.desc}</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
        <button onclick="chessCreate(100)" style="position:relative;width:100%;height:90px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;">
          <img src="/main/btn_duel_stake.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <span style="font-size:0.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;margin-bottom:2px;text-shadow:0 0 4px rgba(0,0,0,0.8);">${t.stakeLabel}</span>
            <span style="font-size:1.3rem;color:#ffcc44;font-weight:900;line-height:1;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.4);">100</span>
            <span style="font-size:0.65rem;color:#ffcc44;font-weight:700;letter-spacing:0.5px;margin-top:3px;text-shadow:0 0 4px rgba(0,0,0,0.8);">COGNIQ</span>
          </div>
        </button>
        <button onclick="chessCreate(500)" style="position:relative;width:100%;height:90px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;animation:chzHotPulse 2s ease-in-out infinite;">
          <img src="/main/btn_duel_stake.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
          <div style="position:absolute;top:4px;right:6px;background:rgba(0,255,170,0.25);color:#00ffaa;font-size:0.5rem;font-weight:800;padding:2px 5px;border-radius:6px;letter-spacing:0.5px;animation:chzBadgePulse 1.5s ease-in-out infinite;">HOT</div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <span style="font-size:0.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;margin-bottom:2px;text-shadow:0 0 4px rgba(0,0,0,0.8);">${t.stakeLabel}</span>
            <span style="font-size:1.3rem;color:#ffcc44;font-weight:900;line-height:1;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.4);">500</span>
            <span style="font-size:0.65rem;color:#ffcc44;font-weight:700;letter-spacing:0.5px;margin-top:3px;text-shadow:0 0 4px rgba(0,0,0,0.8);">COGNIQ</span>
          </div>
        </button>
        <button onclick="chessCreate(1000)" style="position:relative;width:100%;height:90px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;">
          <img src="/main/btn_duel_stake.webp" style="width:100%;height:100%;object-fit:fill;border-radius:16px;display:block;">
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <span style="font-size:0.6rem;color:#ffcc44;font-weight:700;letter-spacing:1px;margin-bottom:2px;text-shadow:0 0 4px rgba(0,0,0,0.8);">${t.stakeLabel}</span>
            <span style="font-size:1.3rem;color:#ffcc44;font-weight:900;line-height:1;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.4);">1000</span>
            <span style="font-size:0.65rem;color:#ffcc44;font-weight:700;letter-spacing:0.5px;margin-top:3px;text-shadow:0 0 4px rgba(0,0,0,0.8);">COGNIQ</span>
          </div>
        </button>
      </div>

      <div id="chessWaitingBlock" style="display:none;"></div>
    </div>
  `;
  document.body.appendChild(chessContainer);
}

function chessBackToMenu() {
  if (chessPollInterval) { clearInterval(chessPollInterval); chessPollInterval = null; }
  if (window._chessCountdownInterval) { clearInterval(window._chessCountdownInterval); window._chessCountdownInterval = null; }

  ['chessContainer','chessJoinContainer','chessGameContainer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

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

    document.getElementById('chessWaitingBlock').innerHTML = `
      <div style="background:rgba(10,15,30,0.8);border:1.5px solid rgba(220,220,225,0.5);border-radius:18px;padding:20px;text-align:center;box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);backdrop-filter:blur(8px);">
        <div style="font-size:0.95rem;font-weight:700;color:#00ffaa;margin-bottom:8px;">⏳ ${t.waiting}</div>
        <div style="font-size:0.75rem;color:#d4d4d8;margin-bottom:14px;letter-spacing:0.5px;">ID: ${data.gameId}</div>
        <div style="background:rgba(0,0,0,0.4);border-radius:12px;padding:10px;margin-bottom:16px;border:1px solid rgba(255,204,68,0.3);">
          <div style="font-size:0.7rem;color:#d4d4d8;margin-bottom:4px;">${t.autoCancel}</div>
          <div id="chessCountdown" style="font-size:1.8rem;font-weight:900;color:#ffcc44;text-shadow:0 0 10px rgba(255,204,68,0.4);">2:00</div>
        </div>
        <button onclick="chessShareInvite('${data.inviteLink}', ${stake})" style="position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;margin-bottom:10px;border-radius:12px;">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#00ffaa;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,255,170,0.4);">📤 ${t.shareInvite}</div>
        </button>
        <button onclick="chessCopyLink('${data.inviteLink}', this)" style="position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;margin-bottom:10px;border-radius:12px;">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#ffcc44;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,204,68,0.4);">🔗 ${t.copyLink}</div>
        </button>
        <button onclick="chessCancel(${data.gameId})" style="position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#ff6464;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,100,100,0.4);">❌ ${t.cancelDuel}</div>
        </button>
      </div>
    `;
    document.getElementById('chessWaitingBlock').style.display = 'block';

    let countdown = 120;
    window._chessCountdownInterval = setInterval(() => {
      countdown--;
      const el = document.getElementById('chessCountdown');
      if (el) {
        el.textContent = Math.floor(countdown / 60) + ':' + String(countdown % 60).padStart(2, '0');
        if (countdown <= 30) { el.style.color = '#ff6464'; el.style.textShadow = '0 0 10px rgba(255,100,100,0.6)'; }
      }
      if (countdown <= 0) clearInterval(window._chessCountdownInterval);
    }, 1000);

    chessStartPolling(data.gameId);
  } catch (e) { showToast(t.errConnect, 3000); }
}

function chessShareInvite(link, stake) {
  const shareText = '♟️ Вызов на шахматную партию в NEURON!\nСтавка: ' + stake + ' COGNIQ\nПримешь вызов?';
  const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(shareText);
  if (tg && typeof tg.openTelegramLink === 'function') { tg.openTelegramLink(shareUrl); return; }
  if (tg && typeof tg.openLink === 'function') { tg.openLink(shareUrl); return; }
  window.open(shareUrl, '_blank');
}

function chessCopyLink(link, btn) {
  const t = chzT();
  const ok = () => showToast(t.copied, 2000);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(ok).catch(() => ok());
  else ok();
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

// ---------- ИГРА (как duelStartBattle: отдельные контейнеры) ----------
function chessStartGame(game) {
  chessGameId = game.id;
  chessStake = game.stake;
  chessP1 = game.player1; chessP2 = game.player2;
  chessMyColor = String(game.player1.id) === String(userId) ? 'w' : 'b';
  chessFen = game.fen;
  chessLastMove = null;
  chessActive = true;

  // Убираем меню и экран присоединения — как в дуэлях
  const c1 = document.getElementById('chessContainer'); if (c1) c1.remove();
  const c2 = document.getElementById('chessJoinContainer'); if (c2) c2.remove();
  const appRoot = document.getElementById('appRoot'); if (appRoot) appRoot.style.display = 'none';

  chessRenderGameScreen();
}

function chzAvatar(photo, borderColor) {
  if (photo) {
    return `<div style="width:60px;height:60px;border-radius:50%;border:2px solid ${borderColor};margin:0 auto 6px;overflow:hidden;background:rgba(0,0,0,0.3);">
      <img src="${photo}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:1.6rem;">👤</div>
    </div>`;
  }
  return `<div style="width:60px;height:60px;border-radius:50%;border:2px solid ${borderColor};margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;background:rgba(0,0,0,0.3);">♟️</div>`;
}

function chessRenderGameScreen() {
  const t = chzT();
  const gameContainer = document.createElement('div');
  gameContainer.id = 'chessGameContainer';
  gameContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;background:transparent;';

  gameContainer.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      <div style="background:rgba(10,15,30,0.35);border:1.5px solid rgba(220,220,225,0.5);border-radius:20px;padding:16px;margin-bottom:16px;box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);backdrop-filter:blur(8px);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="text-align:center;flex:1;">
            ${chzAvatar(chessP1 ? chessP1.photo : null, '#00ffaa')}
            <div style="font-size:0.78rem;font-weight:700;color:#00ffaa;">${escapeHtml(chessP1 ? chessP1.nick : '—')}</div>
            <div style="font-size:0.62rem;color:#8ba3c1;">${t.whiteLabel}</div>
          </div>
          <div style="text-align:center;padding:0 8px;">
            <div style="font-size:0.9rem;font-weight:900;color:#ffcc44;margin-bottom:6px;">🏆 ${chessStake}</div>
            <div id="chzTurn" class="chz-turn my">...</div>
          </div>
          <div style="text-align:center;flex:1;">
            ${chzAvatar(chessP2 ? chessP2.photo : null, '#ff6464')}
            <div style="font-size:0.78rem;font-weight:700;color:#ff6464;">${escapeHtml(chessP2 ? chessP2.nick : '—')}</div>
            <div style="font-size:0.62rem;color:#8ba3c1;">${t.blackLabel}</div>
          </div>
        </div>
      </div>

      <div id="chzBoard" class="chz-board"></div>

      <button onclick="chessResign()" style="position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;">
        <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
        <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.85rem;font-weight:700;color:#ff6464;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,100,100,0.4);">🏳️ ${t.resign}</div>
      </button>
    </div>
  `;
  document.body.appendChild(gameContainer);

  document.getElementById('chzBoard').addEventListener('click', e => {
    const cell = e.target.closest('[data-square]');
    if (cell) chessCellClick(cell.dataset.square);
  });

  renderBoard();
  chessStartGamePolling();
}

// ---------- ДОСКА (плотная, с подсветкой) ----------
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
  for (let r = 0; r < 8; r++) for (let col = 0; col < 8; col++)
    if (chessBoard[r][col] === side + 'K') return String.fromCharCode(97 + col) + (8 - r);
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

      // КЛЕТКА: div принудительно квадратный (aspect-ratio:1),
      // webp через center/cover — неквадратность актива обрезается ровно
      const cellBg = isLight
        ? "url('/main/chess/cell_light.webp?v=1') center/cover no-repeat, linear-gradient(145deg,#1798a6,#0b3f4a)"
        : "url('/main/chess/cell_dark.webp?v=1') center/cover no-repeat, linear-gradient(145deg,#b01a45,#3f081c)";

      const shadows = [ isLight
        ? 'inset 0 1px 0 rgba(255,255,255,.25), inset 0 0 10px rgba(0,255,220,.18)'
        : 'inset 0 1px 0 rgba(255,255,255,.15), inset 0 0 10px rgba(255,80,110,.22)' ];
      if (chessLastMove && (chessLastMove.from === sq || chessLastMove.to === sq)) shadows.push('inset 0 0 0 100px rgba(255,230,0,.35)');
      if (chessSelected === sq) shadows.push('inset 0 0 0 100px rgba(255,230,0,.5)');
      if (chkSq === sq) shadows.push('inset 0 0 14px 5px rgba(255,60,60,.8)');

      let inner = '';
      const coordColor = isLight ? '#bffcf2' : '#ffd3dd';
      if (j === 0) inner += `<span style="position:absolute;top:2px;left:3px;font-size:9px;font-weight:800;pointer-events:none;color:${coordColor};text-shadow:0 1px 2px rgba(0,0,0,.7);">${8 - row}</span>`;
      if (i === 7) inner += `<span style="position:absolute;bottom:1px;right:3px;font-size:9px;font-weight:800;pointer-events:none;color:${coordColor};text-shadow:0 1px 2px rgba(0,0,0,.7);">${String.fromCharCode(97 + col)}</span>`;

      if (chessSelected && chessLegalMap[sq] !== undefined) {
        inner += chessLegalMap[sq]
          ? `<div style="position:absolute;inset:4%;border-radius:50%;border:4px solid rgba(255,230,0,.95);box-shadow:0 0 12px rgba(255,230,0,.8), inset 0 0 10px rgba(255,230,0,.5);pointer-events:none;"></div>`
          : `<div style="position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(255,230,0,.9);box-shadow:0 0 10px rgba(255,230,0,.9), 0 0 22px rgba(255,230,0,.55);pointer-events:none;"></div>`;
      }

      // ФИГУРА: webp из /main/chess/, если файла нет — глиф-фоллбэк
      if (piece) {
        const code = piece[0] + piece[1];
        const pStyle = piece[0] === 'w'
          ? 'color:#f8f8f8;text-shadow:0 0 3px #000,0 2px 3px rgba(0,0,0,.7);'
          : 'color:#141414;text-shadow:0 0 3px rgba(255,255,255,.45),0 2px 3px rgba(0,0,0,.5);';
        inner += `<img src="/main/chess/${code}.webp?v=1" alt="" style="position:relative;z-index:2;width:86%;height:86%;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55));" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"><span style="display:none;position:relative;z-index:2;line-height:1;font-size:calc(min(100vw - 40px, 442px)/10);${pStyle}">${GLYPH[piece[1]]}</span>`;
      }

      html += `<div data-square="${sq}" style="position:relative;aspect-ratio:1;width:100%;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation;background:${cellBg};box-shadow:${shadows.join(',')};">${inner}</div>`;
    }
  }
  const boardEl = document.getElementById('chzBoard');
  if (boardEl) boardEl.innerHTML = html;

  const myTurn = chessFen.split(' ')[1] === chessMyColor;
  const turnEl = document.getElementById('chzTurn');
  if (turnEl) {
    turnEl.textContent = myTurn ? t.yourTurn : t.opponentTurn;
    turnEl.style.cssText = 'font-size:.72rem;font-weight:800;padding:6px 10px;border-radius:10px;' + (myTurn
      ? 'color:#00ffaa;background:rgba(0,255,170,.12);border:1px solid rgba(0,255,170,.4);'
      : 'color:#8ba3c1;background:rgba(139,163,193,.1);border:1px solid rgba(139,163,193,.3);');
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

// ---------- РЕЗУЛЬТАТ (как duelFinishBattle) ----------
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

  const gc = document.getElementById('chessGameContainer');
  if (!gc) return;
  gc.innerHTML = `
    <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
      <div style="background:rgba(10,15,30,0.35);border:1.5px solid rgba(220,220,225,0.5);border-radius:20px;padding:24px 16px;margin-bottom:20px;box-shadow:0 0 30px rgba(220,220,225,0.1), inset 0 1px 0 rgba(255,255,255,0.1);backdrop-filter:blur(8px);">
        <div style="font-size:2rem;font-weight:900;color:${color};margin-bottom:16px;text-shadow:0 0 20px ${color}40;">${emoji} ${text}</div>
        <div style="display:flex;justify-content:space-around;align-items:center;padding:12px 0;">
          <div style="flex:1;">
            ${chzAvatar(game.player1 ? game.player1.photo : null, '#00ffaa')}
            <div style="color:#00ffaa;font-size:0.8rem;font-weight:700;">${escapeHtml(game.player1 ? game.player1.nick : '—')}</div>
          </div>
          <div style="font-size:1.2rem;color:#ffcc44;font-weight:900;padding:0 10px;">🏆 ${game.stake}</div>
          <div style="flex:1;">
            ${chzAvatar(game.player2 ? game.player2.photo : null, '#ff6464')}
            <div style="color:#ff6464;font-size:0.8rem;font-weight:700;">${escapeHtml(game.player2 ? game.player2.nick : '—')}</div>
          </div>
        </div>
      </div>
      <button onclick="chessBackToMenu()" style="position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;">
        <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
        <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#ffcc44;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,204,68,0.5);">${t.returnToMenu}</div>
      </button>
    </div>
  `;
}

// ---------- ПРИСОЕДИНЕНИЕ (как loadDuelJoinPanel) ----------
function loadChessJoinPanel(gameIdParam) {
  const t = chzT();
  chzInjectCSS();
  const rootEl = document.getElementById('dynamicContent');
  if (rootEl) rootEl.innerHTML = '';

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

      <div style="background:rgba(10,15,30,0.35);border:1.5px solid rgba(220,220,225,0.5);border-radius:20px;padding:20px 16px;margin-bottom:20px;box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.1);backdrop-filter:blur(8px);text-align:center;">
        <div style="font-size:0.82rem;color:#8ba3c1;letter-spacing:0.5px;margin-bottom:8px;">${t.subtitle}</div>
        <div id="chzJoinInfo" style="font-size:1.2rem;font-weight:900;color:#fff;">ID: ${gameIdParam}</div>
      </div>

      <div id="chessJoinLoader" style="background:rgba(10,15,30,0.35);border:1.5px solid rgba(220,220,225,0.5);border-radius:18px;padding:24px;text-align:center;box-shadow:0 0 20px rgba(220,220,225,0.08), inset 0 1px 0 rgba(255,255,255,0.05);backdrop-filter:blur(8px);font-size:0.95rem;color:#d4d4d8;margin-bottom:16px;">${t.checking}</div>

      <div id="chessJoinActions" style="display:none;flex-direction:column;gap:12px;">
        <button onclick="chessAcceptInvite(${gameIdParam})" style="position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#00ffaa;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,255,170,0.5);">⚔️ ${t.accept}</div>
        </button>
        <button onclick="chessBackToMenu()" style="position:relative;width:100%;height:54px;padding:0;background:none;border:none;cursor:pointer;transition:all 0.2s;overflow:hidden;border-radius:12px;">
          <img src="/main/btn_duel_action.webp" style="width:100%;height:100%;object-fit:fill;border-radius:12px;display:block;">
          <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.9rem;font-weight:800;color:#ff6464;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,100,100,0.4);">${t.backBtn}</div>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(joinContainer);

  authFetch(`${BASE_URL}/api/chess/state?game_id=${gameIdParam}`)
    .then(r => r.text().then(txt => {
      try { return JSON.parse(txt); }
      catch (e) { throw new Error('HTTP ' + r.status + ' → ' + txt.slice(0, 100)); }
    }))
    .then(data => {
      const loader = document.getElementById('chessJoinLoader');
      if (!loader) return;
      if (data.success && data.game.status === 'waiting') {
        const p1name = (data.game.player1 && data.game.player1.nick) || data.game.p1_nick || data.game.p1_first_name || 'Игрок 1';
        const info = document.getElementById('chzJoinInfo');
        if (info) info.innerHTML = '⚔️ <span style="color:#00ffaa;">' + escapeHtml(p1name) + '</span> • <span style="color:#ffcc44;">' + data.game.stake + ' COGNIQ</span>';
        loader.style.display = 'none';
        document.getElementById('chessJoinActions').style.display = 'flex';
      } else {
        loader.innerHTML = '<span style="color:#ff6464;">' + (data.message || t.opponentNotFound) + '</span>';
      }
    })
    .catch(err => {
      const loader = document.getElementById('chessJoinLoader');
      if (!loader) return;
      loader.innerHTML = '<span style="color:#ff6464;">' + t.errConnect + '</span>' +
        '<div style="font-size:.62rem;color:#8ba3c1;margin-top:8px;word-break:break-all;">' + escapeHtml(String((err && err.message) || err)) + '</div>' +
        '<button class="chz-btn gold" style="margin-top:12px;" onclick="loadChessJoinPanel(' + gameIdParam + ')">🔄</button>';
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

    const jc = document.getElementById('chessJoinContainer');
    if (jc) jc.remove();

    const stateRes = await authFetch(`${BASE_URL}/api/chess/state?game_id=${gameIdParam}`);
    const stateData = await stateRes.json();
    if (stateData.success) chessStartGame(stateData.game);
  } catch (e) { showToast(t.errConnect, 3000); }
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
