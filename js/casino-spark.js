// ==================== SPARK (⚡ СЛОТЫ) ====================
function initCasinoSpark() {
  const toast = window.casinoShowToast;
  const getBalance = window.casinoGetBalance;
  const setBalance = window.casinoSetBalance;

  const SLOT_SYMBOLS = [
    '/games/spark/spark_sym_btc.webp', '/games/spark/spark_sym_eth.webp',
    '/games/spark/spark_sym_sol.webp', '/games/spark/spark_sym_trx.webp',
    '/games/spark/spark_sym_ton.webp', '/games/spark/spark_sym_xrp.webp',
    '/games/spark/spark_sym_cogniq.webp'
  ];
  const SYM_HEIGHT = 68, STRIP_BEFORE = 20;
  let slotSpinning = false;

  function buildCasinoReels() {
    const container = document.getElementById('casinoSlotReels'); container.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      if (i > 0) { const div = document.createElement('div'); div.className = 'reel-divider'; container.appendChild(div); }
      const outer = document.createElement('div'); outer.className = 'reel-outer'; outer.id = 'casino-reel-outer-' + i;
      const inner = document.createElement('div'); inner.className = 'reel-inner'; inner.id = 'casino-reel-inner-' + i;
      for (let j = 0; j < 3; j++) {
        const sym = document.createElement('div'); sym.className = 'reel-symbol';
        sym.innerHTML = `<img src="${SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]}" style="width:52px;height:52px;object-fit:contain;">`;
        inner.appendChild(sym);
      }
      outer.appendChild(inner); container.appendChild(outer);
    }
  }
  buildCasinoReels();

  function animateCasinoReel(reelIndex, targetSymbol) {
    return new Promise(resolve => {
      const inner = document.getElementById('casino-reel-inner-' + reelIndex);
      inner.style.transition = 'none'; inner.style.transform = 'translateY(0)'; inner.innerHTML = '';
      for (let i = 0; i < STRIP_BEFORE; i++) {
        const el = document.createElement('div'); el.className = 'reel-symbol';
        el.innerHTML = `<img src="${SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]}" style="width:52px;height:52px;object-fit:contain;">`;
        inner.appendChild(el);
      }
      const targetEl = document.createElement('div'); targetEl.className = 'reel-symbol';
      targetEl.innerHTML = `<img src="${targetSymbol}" style="width:52px;height:52px;object-fit:contain;">`;
      inner.appendChild(targetEl);
      for (let i = 0; i < 2; i++) {
        const el = document.createElement('div'); el.className = 'reel-symbol';
        el.innerHTML = `<img src="${SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]}" style="width:52px;height:52px;object-fit:contain;">`;
        inner.appendChild(el);
      }
      const finalY = -(STRIP_BEFORE - 1) * SYM_HEIGHT;
      void inner.offsetHeight;
      inner.style.transition = `transform ${800 + reelIndex * 180}ms cubic-bezier(0.17,0.67,0.12,0.99)`;
      inner.style.transform = `translateY(${finalY}px)`;
      setTimeout(() => {
        const prevSym = inner.children[STRIP_BEFORE - 1]?.querySelector('img')?.getAttribute('src') || SLOT_SYMBOLS[0];
        const nextSym = inner.children[STRIP_BEFORE + 1]?.querySelector('img')?.getAttribute('src') || SLOT_SYMBOLS[0];
        inner.style.transition = 'none'; inner.innerHTML = '';
        [prevSym, targetSymbol, nextSym].forEach(s => {
          const el = document.createElement('div'); el.className = 'reel-symbol';
          el.innerHTML = `<img src="${s}" style="width:52px;height:52px;object-fit:contain;">`;
          inner.appendChild(el);
        });
        void inner.offsetHeight; inner.style.transform = 'translateY(0)';
        resolve();
      }, 800 + reelIndex * 180 + 50);
    });
  }

  document.getElementById('casinoSlotSpinBtn').addEventListener('click', async () => {
    if (slotSpinning) return;
    const amount = parseInt(document.getElementById('casinoSlotBet').value);
    if (!amount || amount < 10 || amount > 100) { toast('Ставка: 10-100 IMPULSE'); return; }

    slotSpinning = true;
    document.getElementById('casinoSlotSpinBtn').disabled = true;
    document.getElementById('casinoSlotResultCombo').textContent = '';
    document.getElementById('casinoSlotResultMsg').textContent = '';
    for (let i = 0; i < 5; i++) document.getElementById('casino-reel-outer-' + i).classList.remove('winning', 'winning-2', 'winning-4', 'winning-5');

    const oldBalance = getBalance();

    try {
      const r = await authFetch(`${BASE_URL}/api/casino/slot`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bet_amount: amount })
      });
      const data = await r.json();
      if (data.error) { toast(data.error); slotSpinning = false; document.getElementById('casinoSlotSpinBtn').disabled = false; return; }

      const promises = data.reels.map((sym, i) => new Promise(res => setTimeout(() => animateCasinoReel(i, sym).then(res), i * 150)));
      await Promise.all(promises);

      if (data.new_balance !== undefined) { setBalance(data.new_balance); }

// Перезапрашиваем баланс с сервера
try {
  const balRes = await authFetch(`${BASE_URL}/api/impulse/balance`);
  const balData = await balRes.json();
  if (balData.balance !== undefined) {
    setBalance(balData.balance);
  }
} catch(e) {}

const balance = getBalance();
const balEl = document.getElementById('casinoBalanceAmount');
if (balEl) balEl.textContent = balance.toLocaleString();

      const netChange = balance - oldBalance;
      const isWin = netChange > 0;

      if (isWin && navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
      if (!isWin && navigator.vibrate) navigator.vibrate(150);

      const combo = data.reels.map(s => `<img src="${s}" style="width:36px;height:36px;object-fit:contain;vertical-align:middle;">`).join('');
      document.getElementById('casinoSlotResultCombo').innerHTML = combo;
      document.getElementById('casinoSlotResultMsg').textContent = isWin ? `+${netChange} IMPULSE` : 'Не повезло';
      document.getElementById('casinoSlotResultMsg').style.color = isWin ? '#00ffaa' : '#ff4455';

      if (isWin) {
        const counts = {}; data.reels.forEach(s => counts[s] = (counts[s] || 0) + 1);
        const maxCount = Math.max(...Object.values(counts));
        const topSymbol = Object.keys(counts).find(k => counts[k] === maxCount);
        let winClass = maxCount === 2 ? 'winning-2' : maxCount === 3 ? 'winning' : (maxCount === 4 ? 'winning-4' : (maxCount === 5 ? 'winning-5' : ''));
        data.reels.forEach((sym, i) => { if (sym === topSymbol && winClass) document.getElementById('casino-reel-outer-' + i).classList.add(winClass); });
      }

      if (data.jackpot) {
        document.getElementById('casinoJackpotAmount').textContent = `+${data.win} IMPULSE`;
        setTimeout(() => document.getElementById('casinoJackpotOverlay').style.display = 'flex', 300);
      }

      const list = document.getElementById('casinoSlotHistory');
      const item = document.createElement('div'); item.className = 'history-item';
      item.innerHTML = `<span>${combo}</span><span class="${isWin ? 'win' : 'lose'}">${isWin ? '+' : ''}${netChange} IMPULSE</span>`;
      list.insertBefore(item, list.firstChild); if (list.children.length > 15) list.removeChild(list.lastChild);

      slotSpinning = false; document.getElementById('casinoSlotSpinBtn').disabled = false;
    } catch (e) {
      toast('Ошибка соединения');
      slotSpinning = false; document.getElementById('casinoSlotSpinBtn').disabled = false;
    }
  });
}
