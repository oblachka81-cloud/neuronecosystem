// ==================== KRASH (MULTIPLAYER) ====================
let crashPollTimer = null;
let crashState = { phase: 'idle' };
let crashLastMult = 1.0;
let crashGraphPoints = [];
let cCanvas = null, cCtx = null;

function initCasinoKrash() {
  const toast = window.casinoShowToast;
  const setBalance = window.casinoSetBalance;
  const ct = window.casinoCt || {};

  cCanvas = document.getElementById('casinoCrashCanvas');
  cCtx = cCanvas.getContext('2d');

  if (window.casinoResizeCrash) window.removeEventListener('resize', window.casinoResizeCrash);
  window.casinoResizeCrash = () => {
    if (cCanvas && cCanvas.parentElement) {
      cCanvas.width = cCanvas.parentElement.offsetWidth;
      cCanvas.height = 220;
    }
  };
  window.addEventListener('resize', window.casinoResizeCrash);
  setTimeout(window.casinoResizeCrash, 100);

  function drawCrashGraph(crashed = false) {
    if (!cCanvas) return;
    const w = cCanvas.width, h = 220;
    cCtx.clearRect(0, 0, w, h);
    if (crashGraphPoints.length < 2) return;

    const currentMult = crashGraphPoints[crashGraphPoints.length - 1];
    const maxY = Math.max(currentMult * 1.2, 2);
    const toX = (i) => (i / Math.max(crashGraphPoints.length, 30)) * w * 0.95 + w * 0.02;
    const toY = (v) => h - (v / maxY) * h * 0.88 - h * 0.06;
    const color = crashed ? '#ef4444' : '#10b981';

    const grad = cCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, crashed ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    cCtx.beginPath();
    cCtx.moveTo(toX(0), toY(1.0));
    crashGraphPoints.forEach((v, i) => cCtx.lineTo(toX(i), toY(v)));
    cCtx.lineTo(toX(crashGraphPoints.length - 1), h);
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
    crashGraphPoints.forEach((v, i) => {
      if (i === 0) cCtx.moveTo(toX(0), toY(1.0));
      else cCtx.lineTo(toX(i), toY(v));
    });
    cCtx.stroke();
    cCtx.shadowBlur = 0;
  }

  async function pollCrashState() {
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/crash/round`);
      const data = await r.json();
      if (data.error) return;

      const prevPhase = crashState.phase;
      crashState = data;

      if (prevPhase !== data.phase) {
        handlePhaseChange(data);
      }

      if (data.phase === 'flying') {
        crashGraphPoints.push(data.multiplier);
        if (crashGraphPoints.length > 300) crashGraphPoints.shift();
        const multEl = document.getElementById('casinoCrashMult');
        if (multEl) multEl.textContent = data.multiplier.toFixed(2) + 'x';
        drawCrashGraph(false);
      }

      updateCrashUI();
    } catch (e) {
      console.error('[CRASH] poll error:', e);
    }
  }

  function handlePhaseChange(state) {
    const phase = state.phase;

    if (phase === 'waiting') {
      crashGraphPoints = [];
      if (cCtx) cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      document.getElementById('casinoCrashMult').textContent = '---';
      document.getElementById('casinoCrashMult').style.color = '#334455';
      document.getElementById('casinoCrashLabel').textContent = ct.waiting || '⏳ NEXT ROUND...';
      document.getElementById('casinoCrashStatus').textContent = ct.waitingStatus || 'Wait...';
      document.getElementById('casinoCrashBg').src = '/games/krash/krash_display_bg_active.webp';
      updateCrashMainButton('disabled');
    }

    if (phase === 'betting') {
      crashGraphPoints = [1.0];
      if (cCtx) cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      document.getElementById('casinoCrashMult').textContent = '1.00x';
      document.getElementById('casinoCrashMult').style.color = '#ffaa00';
      document.getElementById('casinoCrashLabel').textContent = ct.betting || '🔥 PLACE YOUR BET!';
      document.getElementById('casinoCrashStatus').textContent = ct.bettingStatus || 'Bet within 3 seconds!';
      document.getElementById('casinoCrashBg').src = '/games/krash/krash_display_bg_active.webp';

      if (!state.my_bet) {
        updateCrashMainButton('bet');
      } else {
        updateCrashMainButton('disabled');
      }
    }

    if (phase === 'flying') {
      crashLastMult = state.multiplier || 1.0;
      document.getElementById('casinoCrashLabel').textContent = ct.flying || '🚀 FLYING! CASH OUT!';
      document.getElementById('casinoCrashStatus').textContent = ct.flyingStatus || 'Cash out before crash!';
      document.getElementById('casinoCrashBg').src = '/games/krash/krash_display_bg_active.webp';

      if (state.my_bet && state.my_bet.status === 'active') {
        updateCrashMainButton('cashout');
      } else {
        updateCrashMainButton('watching');
      }
    }

    if (phase === 'crashed') {
      document.getElementById('casinoCrashMult').textContent = state.crash_point.toFixed(2) + 'x';
      document.getElementById('casinoCrashMult').style.color = '#ef4444';
      document.getElementById('casinoCrashLabel').textContent = ct.crashed || '💥 CRASHED!';
      document.getElementById('casinoCrashStatus').textContent = `x${state.crash_point.toFixed(2)}`;
      document.getElementById('casinoCrashBg').src = '/games/krash/krash_display_bg_crashed.webp';

      if (state.my_bet) {
        if (state.my_bet.status === 'cashed_out') {
          toast(`+${state.my_bet.win_amount} IMPULSE (x${state.my_bet.cashed_out_at.toFixed(2)})`, 4000);
        } else if (state.my_bet.status === 'lost') {
          toast(`-${state.my_bet.amount} IMPULSE — не успели!`, 3000);
          if (navigator.vibrate) navigator.vibrate(150);
          if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
      }

      addCrashHistoryItem(state.crash_point);
      updateCrashMainButton('disabled');
      loadCasinoBalanceLocal();
      crashGraphPoints.push(state.crash_point);
      drawCrashGraph(true);
    }
  }

  function loadCasinoBalanceLocal() {
    authFetch(`${BASE_URL}/api/impulse/balance`).then(r => r.json()).then(d => {
      if (d.balance !== undefined) {
        setBalance(d.balance);
        const balEl = document.getElementById('casinoBalanceAmount');
        if (balEl) balEl.textContent = d.balance.toLocaleString();
      }
    }).catch(() => {});
  }

  function updateCrashUI() {
    const phase = crashState.phase;

    if (phase === 'waiting') {
      document.getElementById('casinoCrashTimer').textContent = `⏳ ${crashState.next_round_in || 0}с`;
    } else if (phase === 'betting') {
      document.getElementById('casinoCrashTimer').textContent = `🔥 ${crashState.betting_ends_in || 0}с`;
    } else {
      document.getElementById('casinoCrashTimer').textContent = '';
    }

    if (crashState.my_bet) {
      const myBetDiv = document.getElementById('casinoCrashMyBet');
      myBetDiv.style.display = 'flex';
      document.getElementById('casinoCrashBetAmount').textContent = crashState.my_bet.amount + ' IMPULSE';

      if (crashState.my_bet.status === 'active' && phase === 'flying') {
        const potential = Math.floor(crashState.my_bet.amount * crashState.multiplier);
        document.getElementById('casinoCrashPotential').textContent = potential + ' IMPULSE';
        document.getElementById('casinoCrashPotential').style.color = '#10b981';
      } else if (crashState.my_bet.status === 'cashed_out') {
        document.getElementById('casinoCrashPotential').textContent = `+${crashState.my_bet.win_amount} IMPULSE`;
        document.getElementById('casinoCrashPotential').style.color = '#00ffaa';
      } else if (crashState.my_bet.status === 'lost') {
        document.getElementById('casinoCrashPotential').textContent = `-${crashState.my_bet.amount} IMPULSE`;
        document.getElementById('casinoCrashPotential').style.color = '#ef4444';
      }
    } else {
      document.getElementById('casinoCrashMyBet').style.display = 'none';
    }

    const dot = document.getElementById('casinoCrashDot');
    if (phase === 'flying') {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 12px #10b981';
    } else if (phase === 'crashed') {
      dot.style.background = '#ef4444';
      dot.style.boxShadow = '0 0 12px #ef4444';
    } else {
      dot.style.background = '#334';
      dot.style.boxShadow = 'none';
    }
  }

  function updateCrashMainButton(type) {
    const btn = document.getElementById('casinoCrashMainBtn');
    const img = document.getElementById('casinoCrashMainBtnImg');

    if (type === 'bet') {
      img.src = `/games/krash/krash_btn_main_bet_${currentLang}.webp`;
      btn.disabled = false;
      btn.dataset.action = 'bet';
    } else if (type === 'cashout') {
      img.src = `/games/krash/krash_btn_main_cashout_${currentLang}.webp`;
      btn.disabled = false;
      btn.dataset.action = 'cashout';
    } else if (type === 'watching') {
      img.src = `/games/krash/krash_btn_main_disabled_${currentLang}.webp`;
      btn.disabled = true;
      btn.dataset.action = 'none';
    } else {
      img.src = `/games/krash/krash_btn_main_disabled_${currentLang}.webp`;
      btn.disabled = true;
      btn.dataset.action = 'none';
    }
  }

  document.getElementById('casinoCrashMainBtn').addEventListener('click', async () => {
    const action = document.getElementById('casinoCrashMainBtn').dataset.action;
    if (action === 'bet') await doCrashBet();
    else if (action === 'cashout') await doCrashCashout();
  });

  async function doCrashBet() {
    const amount = parseInt(document.getElementById('casinoCrashBetInput').value) || 0;
    if (amount < 10 || amount > 100) {
      toast('Ставка: 10-100 IMPULSE');
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

      if (data.error) {
        toast(data.error);
        updateCrashMainButton('bet');
        return;
      }

      setBalance(data.new_balance);
      const balEl = document.getElementById('casinoBalanceAmount');
      if (balEl) balEl.textContent = data.new_balance.toLocaleString();

      toast(`Ставка ${amount} IMPULSE принята!`, 2000);
      updateCrashMainButton('watching');
    } catch (e) {
      toast('Ошибка соединения');
      updateCrashMainButton('bet');
    }
  }

  async function doCrashCashout() {
    document.getElementById('casinoCrashMainBtn').disabled = true;

    try {
      const r = await authFetch(`${BASE_URL}/api/casino/crash/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await r.json();

      if (data.error) {
        toast(data.error);
        updateCrashMainButton('cashout');
        return;
      }

      setBalance(data.new_balance);
      const balEl = document.getElementById('casinoBalanceAmount');
      if (balEl) balEl.textContent = data.new_balance.toLocaleString();

      toast(`+${data.won_amount} IMPULSE на x${data.multiplier.toFixed(2)}!`, 4000);
      if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 150]);
      if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      updateCrashMainButton('watching');
    } catch (e) {
      toast('Ошибка соединения');
      updateCrashMainButton('cashout');
    }
  }

  function addCrashHistoryItem(point) {
    const row = document.getElementById('casinoCrashHistory');
    let clsColor, border, color;

    if (point >= 10) {
      clsColor = 'rgba(168,85,247,0.2)'; border = 'rgba(168,85,247,0.5)'; color = '#c084fc';
    } else if (point >= 3) {
      clsColor = 'rgba(16,185,129,0.15)'; border = 'rgba(16,185,129,0.35)'; color = '#10b981';
    } else if (point >= 1.5) {
      clsColor = 'rgba(255,170,0,0.15)'; border = 'rgba(255,170,0,0.35)'; color = '#ffaa00';
    } else {
      clsColor = 'rgba(239,68,68,0.15)'; border = 'rgba(239,68,68,0.35)'; color = '#ef4444';
    }

    row.insertAdjacentHTML(
      'afterbegin',
      `<span style="border-radius:20px;padding:5px 13px;font-size:0.76em;font-weight:800;border:1px solid ${border};background:${clsColor};color:${color};">x${point.toFixed(2)}</span>`
    );
    if (row.children.length > 15) row.removeChild(row.lastChild);
  }

  async function loadCrashHistory() {
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/crash/history`);
      const data = await r.json();
      const row = document.getElementById('casinoCrashHistory');
      row.innerHTML = '';
      data.rounds.forEach(rd => addCrashHistoryItem(parseFloat(rd.crash_point)));
    } catch (e) {
      console.error('[CRASH] load history error:', e);
    }
  }

  function startCrashPolling() {
    if (crashPollTimer) clearInterval(crashPollTimer);
    pollCrashState();
    crashPollTimer = setInterval(pollCrashState, 200);
  }

  loadCrashHistory();
  startCrashPolling();
  updateCrashMainButton('disabled');
}
