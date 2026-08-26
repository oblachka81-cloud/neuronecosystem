// ==================== FORTUNA (🎡) ====================
function updateFortunaSpinBtn() {
  const img = document.getElementById('casinoSpinBtnImg');
  if (img) img.src = `/games/fortuna/fortuna_btn_spin_${currentLang}.webp`;
}
window.updateFortunaSpinBtn = updateFortunaSpinBtn;

function initCasinoFortuna() {
  const toast = window.casinoShowToast;

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

  updateFortunaSpinBtn();

  document.querySelectorAll('#casinoRouletteBetTypes .wheel-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#casinoRouletteBetTypes .wheel-bet-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  document.getElementById('casinoSpinBtn').addEventListener('click', async () => {
    if(wSpinning) return;
    const amount = parseInt(document.getElementById('casinoRouletteBet').value);
    if(!amount || amount < 10 || amount > 100) { toast('Ставка: 10-100 IMPULSE'); return; }
    const selected = document.querySelector('#casinoRouletteBetTypes .wheel-bet-btn.selected');
    if(!selected) { toast('Выберите тип ставки'); return; }

    wSpinning = true; document.getElementById('casinoSpinBtn').disabled = true;
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/spin`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bet_amount: amount, bet_type: selected.dataset.type})
      });
      const data = await r.json();
      if(data.error) { toast(data.error); wSpinning = false; document.getElementById('casinoSpinBtn').disabled = false; return; }


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

        if (data.win > 0 && navigator.vibrate) navigator.vibrate(100);
        if (data.win === 0 && navigator.vibrate) navigator.vibrate(120);

        const list = document.getElementById('casinoRouletteHistory');
        const item = document.createElement('div'); item.className = 'history-item';
        item.innerHTML = `<span>${data.result} — ${colorText}</span><span class="${data.win>0?'win':'lose'}">${data.win>0?'+':''}${data.win} IMPULSE</span>`;
        list.insertBefore(item, list.firstChild); if(list.children.length > 15) list.removeChild(list.lastChild);
      });
    } catch(e) { toast('Ошибка соединения'); wSpinning = false; document.getElementById('casinoSpinBtn').disabled = false; }
  });
}
