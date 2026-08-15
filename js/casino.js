// ==================== КАЗИНО ====================
function loadCasinoPanel() {
  let balance = 0;
  
  // 1. Очистка
  const old = document.getElementById('casinoContainer');
  if (old) old.remove();
  const oldP = document.getElementById('casinoParticlesContainer');
  if (oldP) oldP.remove();

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const casinoBtn = document.getElementById('tabCasino');
  if (casinoBtn) casinoBtn.classList.add('active');

  // 2. Переводы
  const ct = {
    ru: { balance: 'Доступно IMPULSE', back: 'На главную', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'История', spin: 'Крутить', bet: 'Ставка', cashout: 'Забрать', start: 'Начать', hit: 'Ещё', stand: 'Стоп', deal: 'Раздать' },
    en: { balance: 'Available IMPULSE', back: 'Back to Main', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'History', spin: 'Spin', bet: 'Bet', cashout: 'Cash Out', start: 'Start', hit: 'Hit', stand: 'Stand', deal: 'Deal' },
    fr: { balance: 'IMPULSE disponible', back: 'Retour', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'Historique', spin: 'Tourner', bet: 'Mise', cashout: 'Retirer', start: 'Commencer', hit: 'Tirer', stand: 'Rester', deal: 'Distribuer' },
    es: { balance: 'IMPULSE disponible', back: 'Volver', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'Historial', spin: 'Girar', bet: 'Apuesta', cashout: 'Retirar', start: 'Iniciar', hit: 'Pedir', stand: 'Plantarse', deal: 'Repartir' }
  }[currentLang] || { balance: 'Available IMPULSE', back: 'Back', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'History', spin: 'Spin', bet: 'Bet', cashout: 'Cash Out', start: 'Start', hit: 'Hit', stand: 'Stand', deal: 'Deal' };

  // 3. HTML Структура (ВСТАВЬ СЮДА ВЕСЬ casinoContainer.innerHTML БЛОК)
  const casinoContainer = document.createElement('div');
  casinoContainer.id = 'casinoContainer';
  casinoContainer.className = 'casino-wrapper';
  casinoContainer.innerHTML = `...`; // ← ВЕСЬ HTML КАЗИНО
  document.body.appendChild(casinoContainer);

// 4. Частицы
const pContainer = document.createElement('div');
pContainer.id = 'casinoParticlesContainer';
pContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;overflow:hidden;';
document.body.appendChild(pContainer);
const cols = ['#ff6600','#ff3300','#ffaa00','#cc00ff','#00ccff','#ff0088'];
for(let i=0;i<80;i++){
  const p = document.createElement('div');
  const s = Math.random()*5+2;
  p.style.cssText = `position:absolute;border-radius:50%;animation:floatUp linear infinite;opacity:0;width:${s}px;height:${s}px;background:${cols[Math.floor(Math.random()*cols.length)]};left:${Math.random()*100}%;animation-duration:${Math.random()*18+10}s;animation-delay:${Math.random()*12}s;`;
  pContainer.appendChild(p);
}

// 5. Логика переключения вкладок
const sections = { roulette: 'casinoSectionRoulette', slots: 'casinoSectionSlots', crash: 'casinoSectionCrash', blackjack: 'casinoSectionBlackjack', mines: 'casinoSectionMines' };
const tabs = document.querySelectorAll('.casino-tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('active'); t.querySelector('img').style.filter = ''; t.querySelector('img').style.opacity = '0.55'; });
    tab.classList.add('active');
    tab.querySelector('img').style.filter = 'brightness(1.2) drop-shadow(0 0 6px #ffaa00)';
    tab.querySelector('img').style.opacity = '1';
    Object.values(sections).forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById(sections[tab.dataset.tab]).style.display = 'block';
    if(tab.dataset.tab === 'crash' && window.casinoResizeCrash) window.casinoResizeCrash();
  });
});
tabs[0].querySelector('img').style.filter = 'brightness(1.2) drop-shadow(0 0 6px #ffaa00)';
tabs[0].querySelector('img').style.opacity = '1';

// 6. Глобальные функции
window.casinoSetSlotBet = (v) => { document.getElementById('casinoSlotBet').value = v; };
window.casinoSetCrashBet = (v) => { document.getElementById('casinoCrashBetInput').value = v; };
window.casinoSetBjBet = (v) => { document.getElementById('casinoBjBet').value = v; };
window.casinoSetMinesBet = (v) => { document.getElementById('casinoMinesBet').value = v; };
window.casinoCloseJackpot = () => { document.getElementById('casinoJackpotOverlay').style.display = 'none'; };
window.casinoClaimDailyImpulse = async () => {
  try {
    const r = await authFetch(`${BASE_URL}/api/impulse/daily`, { method: 'POST' });
    const d = await r.json();
    if(d.received) {
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl) balEl.textContent = (parseInt(balEl.textContent.replace(/\D/g,'')) + d.received).toLocaleString();
      casinoShowToast(`+${d.received} IMPULSE!`, 3000);
      const btnImg = document.getElementById('casinoDailyImpulseBtnImg');
      if(btnImg) { btnImg.style.filter='grayscale(1)'; btnImg.style.opacity='0.4'; }
    } else if(d.error) {
      casinoShowToast(d.error, 3000);
    }
  } catch(e) { casinoShowToast('Ошибка', 3000); }
};

// Синхронизация мин
const mRange = document.getElementById('casinoMinesRange');
const mInput = document.getElementById('casinoMinesCount');
mRange.addEventListener('input', () => { mInput.value = mRange.value; });
mInput.addEventListener('input', () => { mRange.value = Math.max(1, Math.min(24, parseInt(mInput.value)||1)); });

// 7. Загрузка баланса
async function loadCasinoBalance() {
  try {
    const r = await authFetch(`${BASE_URL}/api/impulse/balance`);
    const d = await r.json();
    balance = d.balance || 0;
    const balEl = document.getElementById('casinoBalanceAmount');
    if(balEl) balEl.textContent = balance.toLocaleString();
  } catch(e) {}
}
loadCasinoBalance();

// Утилита для уведомлений
function casinoShowToast(msg, dur = 3000) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, dur);
}

// === 1. РУЛЕТКА ===
const WHEEL_NUMBERS = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const wCanvas = document.getElementById('casinoWheelCanvas');
const wCtx = wCanvas.getContext('2d');
const TOTAL = WHEEL_NUMBERS.length, SLICE = (2*Math.PI)/TOTAL;
let wAngle = 0, wTarget = 0, wSpinning = false, wOnDone = null;

function drawWheel(angle) {
  const cx=110, cy=110, r=108;
  wCtx.clearRect(0,0,220,220);
  for(let i=0;i<TOTAL;i++){
    const start = angle + i*SLICE - Math.PI/2, end = start + SLICE;
    wCtx.beginPath(); wCtx.moveTo(cx,cy); wCtx.arc(cx,cy,r,start,end); wCtx.closePath();
    wCtx.fillStyle = WHEEL_NUMBERS[i]===0 ? '#00aa44' : RED_NUMBERS.includes(WHEEL_NUMBERS[i]) ? '#cc2200' : '#111111';
    wCtx.fill(); wCtx.strokeStyle = 'rgba(255,170,0,0.2)'; wCtx.lineWidth = 0.8; wCtx.stroke();
    wCtx.save(); wCtx.translate(cx,cy); wCtx.rotate(start+SLICE/2); wCtx.textAlign = 'right'; wCtx.fillStyle = '#ffffff'; wCtx.font = 'bold 9px Inter,sans-serif'; wCtx.fillText(WHEEL_NUMBERS[i], r-4, 3); wCtx.restore();
  }
  wCtx.beginPath(); wCtx.arc(cx,cy,r,0,2*Math.PI); wCtx.strokeStyle = '#ffaa00'; wCtx.lineWidth = 3; wCtx.stroke();
}

function spinWheelTo(num, callback) {
  const idx = WHEEL_NUMBERS.indexOf(num);
  const base = -(idx*SLICE + SLICE/2);
  const fullSpins = (5 + Math.floor(Math.random()*4)) * 2*Math.PI;
  const cur = ((wAngle % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
  const tgt = ((base % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
  let delta = tgt - cur; if(delta <= 0) delta += 2*Math.PI;
  wTarget = wAngle + fullSpins + delta; wSpinning = true; wOnDone = callback; animateWheel();
}

function animateWheel() {
  const rem = wTarget - wAngle;
  if(rem <= 0.01) { wAngle = wTarget; drawWheel(wAngle); wSpinning = false; if(wOnDone){wOnDone(); wOnDone=null;} return; }
  wAngle += Math.max(0.01, Math.min(0.18, rem * 0.045));
  drawWheel(wAngle); requestAnimationFrame(animateWheel);
}

requestAnimationFrame(function loop(){ if(!wSpinning){wAngle+=0.003; drawWheel(wAngle);} requestAnimationFrame(loop); });
drawWheel(wAngle);

document.querySelectorAll('#casinoRouletteBetTypes .wheel-bet-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#casinoRouletteBetTypes .wheel-bet-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

document.getElementById('casinoSpinBtn').addEventListener('click', async () => {
  if(wSpinning) return;
  const amount = parseInt(document.getElementById('casinoRouletteBet').value);
  if(!amount || amount < 10 || amount > 100) { casinoShowToast('Ставка: 10-100 IMPULSE'); return; }
  const selected = document.querySelector('#casinoRouletteBetTypes .wheel-bet-btn.selected');
  if(!selected) { casinoShowToast('Выберите тип ставки'); return; }
  
  wSpinning = true; document.getElementById('casinoSpinBtn').disabled = true;
  try {
    const r = await authFetch(`${BASE_URL}/api/casino/spin`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({bet_amount: amount, bet_type: selected.dataset.type})
    });
    const data = await r.json();
    if(data.error) { casinoShowToast(data.error); wSpinning = false; document.getElementById('casinoSpinBtn').disabled = false; return; }
    
    spinWheelTo(data.result, () => {
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl) balEl.textContent = (data.new_balance || 0).toLocaleString();
      document.getElementById('casinoWheelResult').textContent = data.result;
      const isRed = RED_NUMBERS.includes(data.result);
      const colorText = data.result === 0 ? '🟢 Зеро' : (isRed ? '🔴 Красное' : '⚫ Чёрное');
      document.getElementById('casinoRouletteResultColor').textContent = colorText;
      document.getElementById('casinoRouletteResultMsg').textContent = data.win > 0 ? `+${data.win} IMPULSE` : 'Проигрыш';
      document.getElementById('casinoRouletteResultMsg').style.color = data.win > 0 ? '#00ffaa' : '#ff4455';
      wSpinning = false; document.getElementById('casinoSpinBtn').disabled = false;
      
      const list = document.getElementById('casinoRouletteHistory');
      const item = document.createElement('div'); item.className = 'history-item';
      item.innerHTML = `<span>${data.result} — ${colorText}</span><span class="${data.win>0?'win':'lose'}">${data.win>0?'+':''}${data.win} IMPULSE</span>`;
      list.insertBefore(item, list.firstChild); if(list.children.length > 15) list.removeChild(list.lastChild);
    });
  } catch(e) { casinoShowToast('Ошибка соединения'); wSpinning = false; document.getElementById('casinoSpinBtn').disabled = false; }
});

// === 2. СЛОТЫ ===
const SLOT_SYMBOLS = [
  '/public/images/cogniq/spark_sym_btc.png', '/public/images/cogniq/spark_sym_eth.png',
  '/public/images/cogniq/spark_sym_sol.png', '/public/images/cogniq/spark_sym_trx.png',
  '/public/images/cogniq/spark_sym_ton.png', '/public/images/cogniq/spark_sym_xrp.png',
  '/public/images/cogniq/spark_sym_cogniq.png'
];
const SYM_HEIGHT = 68, STRIP_BEFORE = 20;
let slotSpinning = false;

function buildCasinoReels() {
  const container = document.getElementById('casinoSlotReels'); container.innerHTML = '';
  for(let i=0; i<5; i++) {
    if(i>0) { const div = document.createElement('div'); div.className = 'reel-divider'; container.appendChild(div); }
    const outer = document.createElement('div'); outer.className = 'reel-outer'; outer.id = 'casino-reel-outer-'+i;
    const inner = document.createElement('div'); inner.className = 'reel-inner'; inner.id = 'casino-reel-inner-'+i;
    for(let j=0; j<3; j++) {
      const sym = document.createElement('div'); sym.className = 'reel-symbol';
      sym.innerHTML = `<img src="${SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)]}" style="width:52px;height:52px;object-fit:contain;">`;
      inner.appendChild(sym);
    }
    outer.appendChild(inner); container.appendChild(outer);
  }
}
buildCasinoReels();

function animateCasinoReel(reelIndex, targetSymbol) {
  return new Promise(resolve => {
    const inner = document.getElementById('casino-reel-inner-'+reelIndex);
    inner.style.transition = 'none'; inner.style.transform = 'translateY(0)'; inner.innerHTML = '';
    for(let i=0; i<STRIP_BEFORE; i++) {
      const el = document.createElement('div'); el.className = 'reel-symbol';
      el.innerHTML = `<img src="${SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)]}" style="width:52px;height:52px;object-fit:contain;">`;
      inner.appendChild(el);
    }
    const targetEl = document.createElement('div'); targetEl.className = 'reel-symbol';
    targetEl.innerHTML = `<img src="${targetSymbol}" style="width:52px;height:52px;object-fit:contain;">`;
    inner.appendChild(targetEl);
    for(let i=0; i<2; i++) {
      const el = document.createElement('div'); el.className = 'reel-symbol';
      el.innerHTML = `<img src="${SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)]}" style="width:52px;height:52px;object-fit:contain;">`;
      inner.appendChild(el);
    }
    const finalY = -(STRIP_BEFORE-1)*SYM_HEIGHT;
    void inner.offsetHeight;
    inner.style.transition = `transform ${800+reelIndex*180}ms cubic-bezier(0.17,0.67,0.12,0.99)`;
    inner.style.transform = `translateY(${finalY}px)`;
    setTimeout(() => {
      const prevSym = inner.children[STRIP_BEFORE-1]?.querySelector('img')?.getAttribute('src') || SLOT_SYMBOLS[0];
      const nextSym = inner.children[STRIP_BEFORE+1]?.querySelector('img')?.getAttribute('src') || SLOT_SYMBOLS[0];
      inner.style.transition = 'none'; inner.innerHTML = '';
      [prevSym, targetSymbol, nextSym].forEach(s => {
        const el = document.createElement('div'); el.className = 'reel-symbol';
        el.innerHTML = `<img src="${s}" style="width:52px;height:52px;object-fit:contain;">`;
        inner.appendChild(el);
      });
      void inner.offsetHeight; inner.style.transform = 'translateY(0)';
      resolve();
    }, 800+reelIndex*180+50);
  });
}

document.getElementById('casinoSlotSpinBtn').addEventListener('click', async () => {
  if(slotSpinning) return;
  const amount = parseInt(document.getElementById('casinoSlotBet').value);
  if(!amount || amount < 10 || amount > 100) { casinoShowToast('Ставка: 10-100 IMPULSE'); return; }
  
  slotSpinning = true; 
  document.getElementById('casinoSlotSpinBtn').disabled = true;
  document.getElementById('casinoSlotResultCombo').textContent = '';
  document.getElementById('casinoSlotResultMsg').textContent = '';
  for(let i=0; i<5; i++) document.getElementById('casino-reel-outer-'+i).classList.remove('winning','winning-4','winning-5');

  const oldBalance = balance; 

  try {
    const r = await authFetch(`${BASE_URL}/api/casino/slot`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({bet_amount: amount})
    });
    const data = await r.json();
    if(data.error) { casinoShowToast(data.error); slotSpinning = false; document.getElementById('casinoSlotSpinBtn').disabled = false; return; }

    const promises = data.reels.map((sym, i) => new Promise(res => setTimeout(() => animateCasinoReel(i, sym).then(res), i*150)));
    await Promise.all(promises);

    if(data.new_balance !== undefined) {
      balance = data.new_balance;
    }
    const balEl = document.getElementById('casinoBalanceAmount');
    if(balEl) balEl.textContent = balance.toLocaleString();

    const netChange = balance - oldBalance;
    const isWin = netChange > 0;

    const combo = data.reels.map(s => `<img src="${s}" style="width:36px;height:36px;object-fit:contain;vertical-align:middle;">`).join('');
    document.getElementById('casinoSlotResultCombo').innerHTML = combo;
    document.getElementById('casinoSlotResultMsg').textContent = isWin ? `+${netChange} IMPULSE` : 'Не повезло';
    document.getElementById('casinoSlotResultMsg').style.color = isWin ? '#00ffaa' : '#ff4455';

    if(isWin) {
      const counts = {}; data.reels.forEach(s => counts[s] = (counts[s]||0)+1);
      const maxCount = Math.max(...Object.values(counts));
      const topSymbol = Object.keys(counts).find(k => counts[k] === maxCount);
      let winClass = maxCount===3 ? 'winning' : (maxCount===4 ? 'winning-4' : (maxCount===5 ? 'winning-5' : ''));
      data.reels.forEach((sym, i) => { if(sym === topSymbol && winClass) document.getElementById('casino-reel-outer-'+i).classList.add(winClass); });
    }

    if(data.jackpot) {
      document.getElementById('casinoJackpotAmount').textContent = `+${data.win} IMPULSE`;
      setTimeout(() => document.getElementById('casinoJackpotOverlay').style.display = 'flex', 300);
    }

    const list = document.getElementById('casinoSlotHistory');
    const item = document.createElement('div'); item.className = 'history-item';
    item.innerHTML = `<span>${combo}</span><span class="${isWin?'win':'lose'}">${isWin?'+':''}${netChange} IMPULSE</span>`;
    list.insertBefore(item, list.firstChild); if(list.children.length > 15) list.removeChild(list.lastChild);
    
    slotSpinning = false; document.getElementById('casinoSlotSpinBtn').disabled = false;
  } catch(e) { 
    casinoShowToast('Ошибка соединения'); 
    slotSpinning = false; document.getElementById('casinoSlotSpinBtn').disabled = false; 
  }
});

// === 3. CRASH ===
let cState = 'waiting', cMult = 1.0, cPoint = 100, cBet = 0, cHasBet = false, cCashedOut = false;
let cTimer = null, cGraphTimer = null, cStartTime = 0, cPoints = [];
const cCanvas = document.getElementById('casinoCrashCanvas');
const cCtx = cCanvas.getContext('2d');

function crashMultiplierAt(elapsedMs) {
  const t = Math.max(0, elapsedMs) / 1000;
  return Math.min(Math.floor(Math.pow(1.06, t * 8) * 100) / 100, 100);
}

window.casinoResizeCrash = () => {
  if (cCanvas && cCanvas.parentElement) {
    cCanvas.width = cCanvas.parentElement.offsetWidth;
    cCanvas.height = 220;
  }
};
window.addEventListener('resize', window.casinoResizeCrash);
setTimeout(window.casinoResizeCrash, 100);

function drawCrashGraph() {
  if (!cCanvas) return;
  const w = cCanvas.width, h = 220;
  cCtx.clearRect(0, 0, w, h);
  if (cPoints.length < 2) return;
  const maxY = Math.max(cMult * 1.2, 2);
  const toX = i => (i / Math.max(cPoints.length, 30)) * w * 0.95 + w * 0.02;
  const toY = v => h - (v / maxY) * h * 0.88 - h * 0.06;
  const color = cState === 'crashed' ? '#ef4444' : '#10b981';
  const grad = cCtx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, cState === 'crashed' ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  cCtx.beginPath();
  cCtx.moveTo(toX(0), toY(1.0));
  cPoints.forEach((v, i) => cCtx.lineTo(toX(i), toY(v)));
  cCtx.lineTo(toX(cPoints.length - 1), h);
  cCtx.lineTo(toX(0), h);
  cCtx.closePath();
  cCtx.fillStyle = grad;
  cCtx.fill();

  cCtx.beginPath();
  cCtx.strokeStyle = color;
  cCtx.lineWidth = 4;
  cCtx.shadowBlur = 12;
  cCtx.shadowColor = color;
  cCtx.lineJoin = 'round';
  cPoints.forEach((v, i) => (i === 0 ? cCtx.moveTo(toX(0), toY(1.0)) : cCtx.lineTo(toX(i), toY(v))));
  cCtx.stroke();
  cCtx.shadowBlur = 0;
}

function cStartWaiting() {
  if (cTimer) clearInterval(cTimer);
  if (cGraphTimer) clearInterval(cGraphTimer);
  cState = 'waiting';
  cMult = 1.0;
  cPoint = 100;
  cPoints = [];
  cHasBet = false;
  cCashedOut = false;
  cBet = 0;

  document.getElementById('casinoCrashBg').src = '/public/images/cogniq/krash_display_bg_active.png';
  document.getElementById('casinoCrashMult').textContent = '---';
  document.getElementById('casinoCrashMult').className = '';
  document.getElementById('casinoCrashMult').style.color = '#334455';
  document.getElementById('casinoCrashLabel').textContent = 'ОЖИДАНИЕ';
  document.getElementById('casinoCrashStatus').textContent = 'Сделайте ставку';
  document.getElementById('casinoCrashDot').style.background = '#334';
  document.getElementById('casinoCrashDot').style.boxShadow = 'none';
  document.getElementById('casinoCrashTimer').textContent = '';
  document.getElementById('casinoCrashMainBtnImg').src = `/public/images/cogniq/krash_btn_main_bet_${currentLang}.png`;
  document.getElementById('casinoCrashMainBtn').disabled = false;
  document.getElementById('casinoCrashMyBet').style.display = 'none';
  drawCrashGraph();
}

function cStartRound() {
  if (cGraphTimer) clearInterval(cGraphTimer);
  cState = 'running';
  cPoint = 100;
  cMult = 1.0;
  cPoints = [1.0];
  cStartTime = Date.now();
  cCashedOut = false;

  document.getElementById('casinoCrashBg').src = '/public/images/cogniq/krash_display_bg_active.png';
  document.getElementById('casinoCrashStatus').textContent = 'Раунд идёт!';
  document.getElementById('casinoCrashDot').style.background = '#10b981';
  document.getElementById('casinoCrashDot').style.boxShadow = '0 0 12px #10b981';
  document.getElementById('casinoCrashMult').style.color = '#10b981';
  document.getElementById('casinoCrashLabel').textContent = 'ЛЕТИМ';
  document.getElementById('casinoCrashTimer').textContent = '';

  if (cHasBet) {
    document.getElementById('casinoCrashMainBtnImg').src = `/public/images/cogniq/krash_btn_main_cashout_${currentLang}.png`;
    document.getElementById('casinoCrashMainBtn').disabled = false;
  } else {
    document.getElementById('casinoCrashMainBtnImg').src = `/public/images/cogniq/krash_btn_main_disabled_${currentLang}.png`;
    document.getElementById('casinoCrashMainBtn').disabled = true;
  }

  cGraphTimer = setInterval(() => {
    const elapsedMs = Date.now() - cStartTime;
    cMult = crashMultiplierAt(elapsedMs);

    if (cMult >= 100) {
      cMult = 100;
      cPoints.push(cMult);
      clearInterval(cGraphTimer);
      cTriggerCrash(100, false);
      return;
    }

    cPoints.push(cMult);
    document.getElementById('casinoCrashMult').textContent = cMult.toFixed(2) + 'x';
    if (cHasBet && !cCashedOut) {
      document.getElementById('casinoCrashPotential').textContent = Math.floor(cBet * cMult) + ' IMPULSE';
    }
    drawCrashGraph();
  }, 100);
}

function cTriggerCrash(point, alreadySettled) {
  if (cGraphTimer) clearInterval(cGraphTimer);
  cPoint = typeof point === 'number' && point > 0 ? point : cMult;
  cState = 'crashed';

  document.getElementById('casinoCrashBg').src = '/public/images/cogniq/krash_display_bg_crashed.png';
  document.getElementById('casinoCrashMult').textContent = cPoint.toFixed(2) + 'x';
  document.getElementById('casinoCrashMult').style.color = '#ef4444';
  document.getElementById('casinoCrashLabel').textContent = 'КРАШ!';
  document.getElementById('casinoCrashStatus').textContent = `Краш на x${cPoint.toFixed(2)}`;
  document.getElementById('casinoCrashDot').style.background = '#ef4444';
  document.getElementById('casinoCrashDot').style.boxShadow = '0 0 12px #ef4444';
  document.getElementById('casinoCrashMainBtnImg').src = `/public/images/cogniq/krash_btn_main_disabled_${currentLang}.png`;
  document.getElementById('casinoCrashMainBtn').disabled = true;

  if (cHasBet && !cCashedOut && !alreadySettled) {
    cCashedOut = true;
    authFetch(`${BASE_URL}/api/casino/crash/lose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then(r => r.json())
      .then(data => {
        const balEl = document.getElementById('casinoBalanceAmount');
        if (balEl && data.new_balance !== undefined) {
          balance = data.new_balance;
          balEl.textContent = balance.toLocaleString();
        }
        if (data.crash_point) {
          cPoint = parseFloat(data.crash_point);
          document.getElementById('casinoCrashMult').textContent = cPoint.toFixed(2) + 'x';
          document.getElementById('casinoCrashStatus').textContent = `Краш на x${cPoint.toFixed(2)}`;
        }
        casinoShowToast(`-${cBet} IMPULSE`, 3000);
      })
      .catch(() => {});
  }

  const row = document.getElementById('casinoCrashHistory');
  let clsColor = 'rgba(239,68,68,0.15)';
  let border = 'rgba(239,68,68,0.35)';
  let color = '#ef4444';
  if (cPoint >= 10) {
    clsColor = 'rgba(168,85,247,0.2)';
    border = 'rgba(168,85,247,0.5)';
    color = '#c084fc';
  } else if (cPoint >= 3) {
    clsColor = 'rgba(16,185,129,0.15)';
    border = 'rgba(16,185,129,0.35)';
    color = '#10b981';
  } else if (cPoint >= 1.5) {
    clsColor = 'rgba(255,170,0,0.15)';
    border = 'rgba(255,170,0,0.35)';
    color = '#ffaa00';
  }
  row.insertAdjacentHTML(
    'afterbegin',
    `<span style="border-radius:20px;padding:5px 13px;font-size:0.76em;font-weight:800;border:1px solid ${border};background:${clsColor};color:${color};">x${cPoint.toFixed(2)}</span>`
  );
  if (row.children.length > 15) row.removeChild(row.lastChild);

  drawCrashGraph();
  setTimeout(cStartWaiting, 3000);
}

async function cPlaceBet() {
  if (cState !== 'waiting' || cHasBet) return;
  const amount = parseInt(document.getElementById('casinoCrashBetInput').value, 10) || 0;
  if (amount < 10 || amount > 100) {
    casinoShowToast('Ставка: 10-100 IMPULSE');
    return;
  }

  document.getElementById('casinoCrashMainBtn').disabled = true;

  try {
    const r = await authFetch(`${BASE_URL}/api/casino/crash/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_amount: amount }),
    });
    const data = await r.json();
    if (!data.success) {
      casinoShowToast(data.error || 'Ошибка');
      document.getElementById('casinoCrashMainBtn').disabled = false;
      return;
    }

    cBet = amount;
    cHasBet = true;
    const balEl = document.getElementById('casinoBalanceAmount');
    if (balEl && data.new_balance !== undefined) {
      balance = data.new_balance;
      balEl.textContent = balance.toLocaleString();
    }

    document.getElementById('casinoCrashMyBet').style.display = 'flex';
    document.getElementById('casinoCrashBetAmount').textContent = amount + ' IMPULSE';
    document.getElementById('casinoCrashPotential').textContent = amount + ' IMPULSE';

    cStartRound();
  } catch (e) {
    casinoShowToast('Ошибка соединения');
    document.getElementById('casinoCrashMainBtn').disabled = false;
  }
}

async function cDoCashout() {
  if (!cHasBet || cCashedOut || cState !== 'running') return;
  cCashedOut = true;
  document.getElementById('casinoCrashMainBtn').disabled = true;

  try {
    const r = await authFetch(`${BASE_URL}/api/casino/crash/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await r.json();

    const balEl = document.getElementById('casinoBalanceAmount');
    if (balEl && data.new_balance !== undefined) {
      balance = data.new_balance;
      balEl.textContent = balance.toLocaleString();
    }

    if (data.crashed || data.success === false) {
      const cp = parseFloat(data.crash_point) || cMult;
      cTriggerCrash(cp, true);
      casinoShowToast('Краш! Не успели', 3000);
      return;
    }

    if (cGraphTimer) clearInterval(cGraphTimer);
    const won = data.won_amount || 0;
    const mult = data.actual_multiplier || cMult;
    casinoShowToast(`+${won} IMPULSE — x${Number(mult).toFixed(2)}!`, 4000);
    document.getElementById('casinoCrashMyBet').style.display = 'none';
    document.getElementById('casinoCrashMainBtnImg').src = `/public/images/cogniq/krash_btn_main_disabled_${currentLang}.png`;
    document.getElementById('casinoCrashStatus').textContent = `Забрано на x${Number(mult).toFixed(2)}`;
    document.getElementById('casinoCrashLabel').textContent = 'ЗАБРАЛИ';

    const row = document.getElementById('casinoCrashHistory');
    row.insertAdjacentHTML(
      'afterbegin',
      `<span style="border-radius:20px;padding:5px 13px;font-size:0.76em;font-weight:800;border:1px solid rgba(16,185,129,0.35);background:rgba(16,185,129,0.15);color:#10b981;">x${Number(mult).toFixed(2)}</span>`
    );
    if (row.children.length > 15) row.removeChild(row.lastChild);

    setTimeout(cStartWaiting, 2500);
  } catch (e) {
    cCashedOut = false;
    document.getElementById('casinoCrashMainBtn').disabled = false;
    casinoShowToast('Ошибка соединения');
  }
}

document.getElementById('casinoCrashMainBtn').addEventListener('click', () => {
  if (cState === 'waiting') cPlaceBet();
  else if (cState === 'running' && cHasBet && !cCashedOut) cDoCashout();
});

cStartWaiting();

  // === 4. BLACKJACK ===
  const SUITS = ['♠','♥','♦','♣']; 
  const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']; 
  const RED_SUITS = ['♥','♦'];
  let bjDeck = [], bjPlayer = [], bjDealer = [], bjBet = 0, bjOriginalBet = 0; 
  let bjGameActive = false, bjInsuranceTaken = false, bjInsuranceBet = 0; 
  let bjSplitHands = null, bjActiveSplit = 0;

  function bjCardValue(card) { 
    if(card.hidden) return 0; 
    if(['J','Q','K'].includes(card.v)) return 10; 
    if(card.v === 'A') return 11; 
    return parseInt(card.v); 
  }

  function bjHandScore(hand) { 
    let score = 0, aces = 0; 
    for(const c of hand) { 
      if(c.hidden) continue; 
      score += bjCardValue(c); 
      if(c.v === 'A') aces++; 
    } 
    while(score > 21 && aces > 0) { score -= 10; aces--; } 
    return score; 
  }

  function bjRenderCard(card, delay = 0) { 
    const el = document.createElement('div'); 
    el.className = 'bj-card' + (card.hidden ? ' hidden' : (RED_SUITS.includes(card.s) ? ' red' : ' black')); 
    el.style.animationDelay = delay + 'ms'; 
    if(card.hidden) { 
      el.innerHTML = '<img src="/public/images/cogniq/xxi_card_back.png" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">'; 
    } else { 
      el.innerHTML = `<div class="corner">${card.v}<br>${card.s}</div><div class="suit-center">${card.s}</div><div class="corner bot">${card.v}<br>${card.s}</div>`; 
    } 
    return el; 
  }

  function bjRenderHands(reveal = false) {
    document.getElementById('casinoBjDealerCards').innerHTML = ''; 
    document.getElementById('casinoBjPlayerCards').innerHTML = ''; 
    (reveal ? bjDealer : bjDealer.map(c => ({...c, hidden: c.hidden}))).forEach((c, i) => { 
      document.getElementById('casinoBjDealerCards').appendChild(bjRenderCard(c, i * 120)); 
    }); 
    (bjSplitHands ? bjSplitHands[bjActiveSplit] : bjPlayer).forEach((c, i) => { 
      document.getElementById('casinoBjPlayerCards').appendChild(bjRenderCard(c, i * 120)); 
    }); 
  }

  function bjUpdateButtons(state) { 
    const hand = bjSplitHands ? bjSplitHands[bjActiveSplit] : bjPlayer; 
    const canSplit = !bjSplitHands && hand.length === 2 && bjCardValue(hand[0]) === bjCardValue(hand[1]) && balance >= bjBet; 
    const canDouble = hand.length === 2 && balance >= bjBet; 
    const isDeal = state === 'idle'; 
    
    document.getElementById('casinoBjDealBtn').disabled = !isDeal; 
    document.getElementById('casinoBjHitBtn').disabled = isDeal; 
    document.getElementById('casinoBjStandBtn').disabled = isDeal; 
    document.getElementById('casinoBjDoubleBtn').disabled = isDeal || !canDouble; 
    document.getElementById('casinoBjSplitBtn').disabled = isDeal || !canSplit; 
  }

  function bjShowResult(text, type) { 
    const el = document.getElementById('casinoBjResultBanner'); 
    el.textContent = text; 
    el.className = 'bj-result-banner ' + type; 
    el.style.display = 'block'; 
  }

  function bjAddHistory(result, bet, pScore, dScore) { 
    const list = document.getElementById('casinoBjHistory'); 
    const isWin = result.includes('+'); 
    const item = document.createElement('div'); 
    item.className = 'history-item'; 
    item.innerHTML = `<span>${parseInt(pScore)} vs ${parseInt(dScore)}</span><span class="${isWin ? 'win' : (result.includes('🤝') ? '' : 'lose')}">${result}</span>`; 
    list.insertBefore(item, list.firstChild); 
    if(list.children.length > 15) list.removeChild(list.lastChild); 
  }

  async function bjDeal() { 
    const bet = parseInt(document.getElementById('casinoBjBet').value) || 0; 
    if(bet < 10 || bet > 500) { casinoShowToast('Ставка: 10-500 IMPULSE'); return; } 
    if(bet > balance) { casinoShowToast('Недостаточно IMPULSE'); return; } 
    
    bjBet = bet; 
    bjOriginalBet = bet; 
    bjSplitHands = null; 
    bjActiveSplit = 0; 
    bjInsuranceTaken = false; 
    bjInsuranceBet = 0; 
    bjGameActive = true; 
    
    try { 
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/deal`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({bet}) 
      }); 
      const data = await r.json(); 
      if(!data.success) { casinoShowToast(data.error || 'Ошибка'); bjGameActive = false; return; } 
      
      balance = data.new_balance; 
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl) balEl.textContent = balance.toLocaleString();
      
      bjPlayer = data.player_hands[0]; 
      bjDealer = [data.dealer_up, {v: '?', s: '?', hidden: true}]; 
      
      document.getElementById('casinoBjResultBanner').style.display = 'none'; 
      document.getElementById('casinoBjInsuranceBar').classList.remove('visible'); 
      
      bjRenderHands(); 
      bjUpdateButtons('playing'); 
      
      if(data.is_blackjack) { 
        await new Promise(r => setTimeout(r, 600)); 
        bjEndRound('bj'); 
        return; 
      } 
      
      if(data.can_insurance) { 
        document.getElementById('casinoBjInsuranceBar').textContent = 'Страховка? (пол-ставки)'; 
        document.getElementById('casinoBjInsuranceBar').classList.add('visible'); 
      } 
    } catch(e) { 
      casinoShowToast('Ошибка сервера'); 
      bjGameActive = false; 
    } 
  }

  function bjDelay(ms) { 
    return new Promise(r => setTimeout(r, ms)); 
  }

  async function bjHit() { 
    const hi = bjSplitHands ? bjActiveSplit : 0; 
    try { 
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/action`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({action: 'hit', hand_index: hi}) 
      }); 
      const data = await r.json(); 
      if(!data.success) { casinoShowToast(data.error || 'Ошибка'); return; } 
      
      if(bjSplitHands) { bjSplitHands = data.player_hands; } 
      else { bjPlayer = data.player_hands[0]; } 
      
      bjRenderHands(); 
      
      if(data.bust) { 
        if(bjSplitHands && bjActiveSplit === 0) { 
          bjActiveSplit = 1; 
          bjRenderHands(); 
          bjUpdateButtons('playing'); 
          return; 
        } 
        await bjDelay(400); 
        bjEndRound('bust'); 
      } else { 
        bjUpdateButtons('playing'); 
      } 
    } catch(e) { 
      casinoShowToast('Ошибка сервера'); 
    } 
  }

  async function bjStand() { 
    if(bjSplitHands && bjActiveSplit === 0) { 
      try { 
        await authFetch(`${BASE_URL}/api/casino/blackjack/action`, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({action: 'stand', hand_index: 0}) 
        }); 
      } catch(e) {} 
      bjActiveSplit = 1; 
      bjRenderHands(); 
      bjUpdateButtons('playing'); 
      return; 
    } 
    try { 
      await authFetch(`${BASE_URL}/api/casino/blackjack/action`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({action: 'stand', hand_index: bjSplitHands ? bjActiveSplit : 0}) 
      }); 
    } catch(e) {} 
    await bjDelay(300); 
    await bjEndRound('normal'); 
  }

  async function bjDouble() { 
    const hi = bjSplitHands ? bjActiveSplit : 0; 
    try { 
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/action`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({action: 'double', hand_index: hi}) 
      }); 
      const data = await r.json(); 
      if(!data.success) { casinoShowToast(data.error || 'Недостаточно IMPULSE'); return; } 
      
      balance = data.new_balance; 
      bjBet = data.bets[hi]; 
      if(bjSplitHands) { bjSplitHands = data.player_hands; } 
      else { bjPlayer = data.player_hands[0]; } 
      
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl) balEl.textContent = balance.toLocaleString();
      
      bjRenderHands(); 
      await bjDelay(400); 
      if(data.bust) { bjEndRound('bust'); return; } 
      await bjEndRound('normal'); 
    } catch(e) { 
      casinoShowToast('Ошибка сервера'); 
    } 
  }

  async function bjSplit() { 
    try { 
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/action`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({action: 'split', hand_index: 0}) 
      }); 
      const data = await r.json(); 
      if(!data.success) { casinoShowToast(data.error || 'Недостаточно IMPULSE'); return; } 
      
      balance = data.new_balance; 
      bjSplitHands = data.player_hands; 
      bjActiveSplit = 0; 
      
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl) balEl.textContent = balance.toLocaleString();
      
      bjRenderHands(); 
      bjUpdateButtons('playing'); 
    } catch(e) { 
      casinoShowToast('Ошибка сервера'); 
    } 
  }

  async function bjTakeInsurance() { 
    if(bjInsuranceTaken) return; 
    try { 
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/action`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({action: 'insurance'}) 
      }); 
      const data = await r.json(); 
      if(!data.success) { casinoShowToast(data.error || 'Недостаточно IMPULSE'); return; } 
      
      balance = data.new_balance; 
      bjInsuranceBet = data.insurance_bet; 
      bjInsuranceTaken = true; 
      
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl) balEl.textContent = balance.toLocaleString();
      
      document.getElementById('casinoBjInsuranceBar').classList.remove('visible'); 
    } catch(e) { 
      casinoShowToast('Ошибка сервера'); 
    } 
  }

  async function bjEndRound(reason) {
    bjGameActive = false; 
    
    if(reason === 'bust' && bjSplitHands && bjActiveSplit === 0) { 
      bjActiveSplit = 1; 
      bjRenderHands(); 
      bjUpdateButtons('playing'); 
      bjGameActive = true; 
      return; 
    } 
    
    const skipDealer = (reason === 'bust' && !bjSplitHands); 
    if(!skipDealer) { 
      try { 
        await authFetch(`${BASE_URL}/api/casino/blackjack/action`, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({action: 'stand', hand_index: bjSplitHands ? bjActiveSplit : 0}) 
        }); 
      } catch(e) {} 
    } 
    
    try { 
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/result`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({}) 
      }); 
      const data = await r.json(); 
      if(!data.success) { casinoShowToast('Ошибка сервера'); bjUpdateButtons('idle'); return; } 
      
      balance = data.new_balance; 
      bjDealer = data.dealer_hand; 
      
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl) balEl.textContent = balance.toLocaleString();
      
      bjRenderHands(true); 
      
      const r0 = data.results[0]; 
      const dScore = data.dealer_score; 
      const pScore = r0.score; 
      
      let resultText = '', rType = 'lose'; 
      if(r0.result === 'blackjack') { 
        resultText = '🎉 XXI! +' + Math.floor(r0.bet * 1.5) + ' IMPULSE'; 
        rType = 'win'; 
      } else if(r0.result === 'win') { 
        resultText = '✅ ВЫИГРЫШ! +' + r0.bet + ' IMPULSE'; 
        rType = 'win'; 
      } else if(r0.result === 'push') { 
        resultText = ' НИЧЬЯ'; 
        rType = 'push'; 
      } else if(r0.result === 'dealer_bust') { 
        resultText = '💥 Перебор у дилера! +' + r0.bet + ' IMPULSE'; 
        rType = 'win'; 
      } else if(reason === 'bust' || pScore > 21) { 
        resultText = '💥 ПЕРЕБОР! -' + r0.bet + ' IMPULSE'; 
        rType = 'lose'; 
      } else { 
        resultText = '❌ ПРОИГРЫШ -' + r0.bet + ' IMPULSE'; 
        rType = 'lose'; 
      } 
      
      bjShowResult(resultText, rType); 
      bjAddHistory(resultText, r0.bet, pScore, dScore); 
    } catch(e) { 
      casinoShowToast('Ошибка сервера'); 
    } 
    
    bjUpdateButtons('idle'); 
    bjGameActive = false; 
    document.getElementById('casinoBjInsuranceBar').classList.remove('visible'); 
    
    setTimeout(() => { 
      document.getElementById('casinoBjDealerCards').innerHTML = ''; 
      document.getElementById('casinoBjPlayerCards').innerHTML = ''; 
      document.getElementById('casinoBjResultBanner').style.display = 'none'; 
    }, 4000); 
  }

  document.getElementById('casinoBjDealBtn').addEventListener('click', bjDeal); 
  document.getElementById('casinoBjHitBtn').addEventListener('click', bjHit); 
  document.getElementById('casinoBjStandBtn').addEventListener('click', bjStand); 
  document.getElementById('casinoBjDoubleBtn').addEventListener('click', bjDouble); 
  document.getElementById('casinoBjSplitBtn').addEventListener('click', bjSplit); 
  document.getElementById('casinoBjInsuranceBar').addEventListener('click', bjTakeInsurance); 
  bjUpdateButtons('idle');

  // === 5. MINES ===
  let mActive = false, mOpened = [], mBet = 0, mCount = 3;

  function mBuildField(disabled = true) {
    const field = document.getElementById('casinoMinesField');
    field.innerHTML = '';
    for(let i=0; i<25; i++) {
      const cell = document.createElement('div');
      cell.className = 'mines-cell' + (disabled ? ' disabled' : '');
      cell.dataset.index = i;
      cell.innerHTML = '<img src="/public/images/cogniq/mines_cell_closed.png" style="width:100%;height:auto;display:block;">';
      if(!disabled) {
        cell.addEventListener('click', () => mOpenCell(i));
      }
      field.appendChild(cell);
    }
  }
  mBuildField(true);

  document.getElementById('casinoMinesStartBtn').addEventListener('click', async () => {
    const bet = parseInt(document.getElementById('casinoMinesBet').value) || 0;
    const mines = parseInt(document.getElementById('casinoMinesCount').value) || 3;
    if(bet < 10 || bet > 100) { casinoShowToast('Ставка: 10-100 IMPULSE'); return; }
    if(mines < 1 || mines > 24) { casinoShowToast('Мины: 1-24'); return; }

    document.getElementById('casinoMinesStartBtn').disabled = true;
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/mines/start`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({bet, mines})
      });
      const data = await r.json();
      if(!data.ok) { casinoShowToast(data.error || 'Ошибка'); document.getElementById('casinoMinesStartBtn').disabled = false; return; }

      if(data.balance !== undefined) {
        balance = data.balance;
        const balEl = document.getElementById('casinoBalanceAmount');
        if(balEl) balEl.textContent = balance.toLocaleString();
      }

      mActive = true; mOpened = []; mBet = bet; mCount = mines;
      document.getElementById('casinoMinesMult').textContent = 'x' + (data.multiplier || '1.00');
      document.getElementById('casinoMinesMult').style.color = '#ffaa00';
      document.getElementById('casinoMinesStartBtn').style.display = 'none';
      document.getElementById('casinoMinesCashoutBtn').style.display = 'block';
      document.getElementById('casinoMinesCashoutBtn').disabled = true;
      document.getElementById('casinoMinesBet').disabled = true;
      document.getElementById('casinoMinesCount').disabled = true;
      document.getElementById('casinoMinesRange').disabled = true;
      mBuildField(false);
    } catch(e) {
      casinoShowToast('Ошибка сервера');
      document.getElementById('casinoMinesStartBtn').disabled = false;
    }
  });

  async function mOpenCell(index) {
    if(!mActive) return;
    const cells = document.querySelectorAll('#casinoMinesField .mines-cell');
    if(cells[index].classList.contains('opened') || cells[index].classList.contains('mine')) return;

    cells.forEach(c => c.classList.add('disabled'));
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/mines/open`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({cell: index})
      });
      const data = await r.json();
      if(!data.ok) { casinoShowToast(data.error || 'Ошибка'); cells.forEach(c => c.classList.remove('disabled')); return; }

      if(data.result === 'mine') {
        mActive = false;
        cells[index].classList.add('mine');
        cells[index].innerHTML = '<img src="/public/images/cogniq/mines_cell_bang.png" style="width:100%;height:auto;">';
        if(data.grid) {
          data.grid.forEach((isMine, i) => {
            if(isMine && i !== index) { cells[i].classList.add('mine'); cells[i].innerHTML = '<img src="/public/images/cogniq/mines_cell_bang.png" style="width:100%;height:auto;">'; }
          });
        }
        document.getElementById('casinoMinesMult').textContent = ' ВЗРЫВ!';
        document.getElementById('casinoMinesMult').style.color = '#ef4444';
        document.getElementById('casinoMinesCashoutBtn').style.display = 'none';
        document.getElementById('casinoMinesStartBtn').style.display = 'block';
        document.getElementById('casinoMinesStartBtn').disabled = false;
        document.getElementById('casinoMinesBet').disabled = false;
        document.getElementById('casinoMinesCount').disabled = false;
        document.getElementById('casinoMinesRange').disabled = false;
        
        if(data.balance !== undefined) {
          balance = data.balance;
          const balEl = document.getElementById('casinoBalanceAmount');
          if(balEl) balEl.textContent = balance.toLocaleString();
        }
        
        casinoShowToast(`-${mBet} IMPULSE — Взрыв!`, 3000);
        
        const list = document.getElementById('casinoMinesHistory');
        const item = document.createElement('div'); item.className = 'history-item';
        item.innerHTML = `<span>💣 Mines ${mCount}</span><span class="lose">-${mBet} IMPULSE</span>`;
        list.insertBefore(item, list.firstChild); if(list.children.length > 15) list.removeChild(list.lastChild);
        return;
      }

      cells[index].classList.add('opened');
      cells[index].classList.remove('disabled');
      cells[index].innerHTML = '<img src="/public/images/cogniq/mines_cell_cogniq.png" style="width:100%;height:auto;">';
      mOpened.push(index);
      document.getElementById('casinoMinesMult').textContent = 'x' + data.multiplier.toFixed(2);
      document.getElementById('casinoMinesMult').style.color = '#ffaa00';
      document.getElementById('casinoMinesCashoutBtn').disabled = false;

      cells.forEach((c, i) => {
        if(!c.classList.contains('opened') && !c.classList.contains('mine')) c.classList.remove('disabled');
      });

      if(data.result === 'autowin') {
        mActive = false;
        if(data.balance !== undefined) { balance = data.balance; }
        const balEl = document.getElementById('casinoBalanceAmount');
        if(balEl && data.balance !== undefined) balEl.textContent = data.balance.toLocaleString();
        document.getElementById('casinoMinesMult').textContent = '🏆 x' + data.multiplier.toFixed(2);
        document.getElementById('casinoMinesMult').style.color = '#00ffaa';
        document.getElementById('casinoMinesCashoutBtn').style.display = 'none';
        document.getElementById('casinoMinesStartBtn').style.display = 'block';
        document.getElementById('casinoMinesStartBtn').disabled = false;
        document.getElementById('casinoMinesBet').disabled = false;
        document.getElementById('casinoMinesCount').disabled = false;
        document.getElementById('casinoMinesRange').disabled = false;
        casinoShowToast(`+${data.payout} IMPULSE — Все открыто!`, 4000);
        
        const list = document.getElementById('casinoMinesHistory');
        const item = document.createElement('div'); item.className = 'history-item';
        item.innerHTML = `<span>💣 Mines ${mCount}</span><span class="win">+${data.payout} IMPULSE</span>`;
        list.insertBefore(item, list.firstChild); if(list.children.length > 15) list.removeChild(list.lastChild);
      }
    } catch(e) {
      casinoShowToast('Ошибка сервера');
      cells.forEach(c => { if(!c.classList.contains('opened') && !c.classList.contains('mine')) c.classList.remove('disabled'); });
    }
  }

  document.getElementById('casinoMinesCashoutBtn').addEventListener('click', async () => {
    if(!mActive) return;
    document.getElementById('casinoMinesCashoutBtn').disabled = true;
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/mines/cashout`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}
      });
      const data = await r.json();
      if(!data.ok) { casinoShowToast(data.error || 'Ошибка'); document.getElementById('casinoMinesCashoutBtn').disabled = false; return; }

      mActive = false;
      
      if(data.balance !== undefined) { balance = data.balance; }
      
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl && data.balance !== undefined) balEl.textContent = data.balance.toLocaleString();
      document.getElementById('casinoMinesMult').textContent = '✅ x' + data.multiplier.toFixed(2);
      document.getElementById('casinoMinesMult').style.color = '#00ffaa';
      document.getElementById('casinoMinesCashoutBtn').style.display = 'none';
      document.getElementById('casinoMinesStartBtn').style.display = 'block';
      document.getElementById('casinoMinesStartBtn').disabled = false;
      document.getElementById('casinoMinesBet').disabled = false;
      document.getElementById('casinoMinesCount').disabled = false;
      document.getElementById('casinoMinesRange').disabled = false;

      const cells = document.querySelectorAll('#casinoMinesField .mines-cell');
      cells.forEach(c => c.classList.add('disabled'));

      const list = document.getElementById('casinoMinesHistory');
      const item = document.createElement('div'); item.className = 'history-item';
      item.innerHTML = `<span>💣 Mines ${mCount}</span><span class="win">+${data.payout} IMPULSE</span>`;
      list.insertBefore(item, list.firstChild); if(list.children.length > 15) list.removeChild(list.lastChild);
      
      casinoShowToast(`+${data.payout} IMPULSE — x${data.multiplier.toFixed(2)}!`, 4000);
    } catch(e) {
      casinoShowToast('Ошибка сервера');
      document.getElementById('casinoMinesCashoutBtn').disabled = false;
    }
  });

  // Кнопка назад
  document.getElementById('casinoBackBtn').addEventListener('click', () => {
    casinoContainer.remove();
    pContainer.remove();
    switchTab('game');
  });
}
// ==================== КОНЕЦ КАЗИНО ====================
