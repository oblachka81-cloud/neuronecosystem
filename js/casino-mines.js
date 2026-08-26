// ==================== MINES (💣) ====================
function initCasinoMines() {
  const toast = window.casinoShowToast;
  const setBalance = window.casinoSetBalance;

  let mActive = false, mOpened = [], mBet = 0, mCount = 3;

  function mBuildField(disabled = true) {
    const field = document.getElementById('casinoMinesField');
    field.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('div');
      cell.className = 'mines-cell' + (disabled ? ' disabled' : '');
      cell.dataset.index = i;
      cell.innerHTML = '<img src="/games/mines/mines_cell_closed.webp" style="width:100%;height:auto;display:block;">';
      if (!disabled) {
        cell.addEventListener('click', () => mOpenCell(i));
      }
      field.appendChild(cell);
    }
  }
  mBuildField(true);

  document.getElementById('casinoMinesStartBtn').addEventListener('click', async () => {
    const bet = parseInt(document.getElementById('casinoMinesBet').value) || 0;
    const mines = parseInt(document.getElementById('casinoMinesCount').value) || 3;
    if (bet < 10 || bet > 100) { toast('Ставка: 10-100 IMPULSE'); return; }
    if (mines < 1 || mines > 24) { toast('Мины: 1-24'); return; }

    document.getElementById('casinoMinesStartBtn').disabled = true;
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/mines/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bet, mines })
      });
      const data = await r.json();
      if (!data.ok) { toast(data.error || 'Ошибка'); document.getElementById('casinoMinesStartBtn').disabled = false; return; }

      if (data.balance !== undefined) {
        setBalance(data.balance);
        const balEl = document.getElementById('casinoBalanceAmount');
        if (balEl) balEl.textContent = data.balance.toLocaleString();
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
    } catch (e) {
      toast('Ошибка сервера');
      document.getElementById('casinoMinesStartBtn').disabled = false;
    }
  });

  async function mOpenCell(index) {
    if (!mActive) return;
    const cells = document.querySelectorAll('#casinoMinesField .mines-cell');
    if (cells[index].classList.contains('opened') || cells[index].classList.contains('mine')) return;

    cells.forEach(c => c.classList.add('disabled'));
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/mines/open`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cell: index })
      });
      const data = await r.json();
      if (!data.ok) { toast(data.error || 'Ошибка'); cells.forEach(c => c.classList.remove('disabled')); return; }

      if (data.result === 'mine') {
        mActive = false;
        cells[index].classList.add('mine');
        cells[index].innerHTML = '<img src="/games/mines/mines_cell_bang.webp" style="width:100%;height:auto;">';
        if (data.grid) {
          data.grid.forEach((isMine, i) => {
            if (isMine && i !== index) { cells[i].classList.add('mine'); cells[i].innerHTML = '<img src="/games/mines/mines_cell_bang.webp" style="width:100%;height:auto;">'; }
          });
        }
        document.getElementById('casinoMinesMult').textContent = '💥 ВЗРЫВ!';
        document.getElementById('casinoMinesMult').style.color = '#ef4444';
        document.getElementById('casinoMinesCashoutBtn').style.display = 'none';
        document.getElementById('casinoMinesStartBtn').style.display = 'block';
        document.getElementById('casinoMinesStartBtn').disabled = false;
        document.getElementById('casinoMinesBet').disabled = false;
        document.getElementById('casinoMinesCount').disabled = false;
        document.getElementById('casinoMinesRange').disabled = false;

        if (data.balance !== undefined) {
          setBalance(data.balance);
          const balEl = document.getElementById('casinoBalanceAmount');
          if (balEl) balEl.textContent = data.balance.toLocaleString();
        }

        toast(`-${mBet} IMPULSE — Взрыв!`, 3000);
        if (navigator.vibrate) navigator.vibrate(150);
        if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');

        const list = document.getElementById('casinoMinesHistory');
        const item = document.createElement('div'); item.className = 'history-item';
        item.innerHTML = `<span>💣 Mines ${mCount}</span><span class="lose">-${mBet} IMPULSE</span>`;
        list.insertBefore(item, list.firstChild); if (list.children.length > 15) list.removeChild(list.lastChild);
        return;
      }

      cells[index].classList.add('opened');
      cells[index].classList.remove('disabled');
      cells[index].innerHTML = '<img src="/games/mines/mines_cell_cogniq.webp" style="width:100%;height:auto;">';
      mOpened.push(index);
      document.getElementById('casinoMinesMult').textContent = 'x' + data.multiplier.toFixed(2);
      document.getElementById('casinoMinesMult').style.color = '#ffaa00';
      document.getElementById('casinoMinesCashoutBtn').disabled = false;

      cells.forEach((c, i) => {
        if (!c.classList.contains('opened') && !c.classList.contains('mine')) c.classList.remove('disabled');
      });

      if (data.result === 'autowin') {
        mActive = false;
        if (data.balance !== undefined) { setBalance(data.balance); }
        const balEl = document.getElementById('casinoBalanceAmount');
        if (balEl && data.balance !== undefined) balEl.textContent = data.balance.toLocaleString();
        document.getElementById('casinoMinesMult').textContent = '🏆 x' + data.multiplier.toFixed(2);
        document.getElementById('casinoMinesMult').style.color = '#00ffaa';
        document.getElementById('casinoMinesCashoutBtn').style.display = 'none';
        document.getElementById('casinoMinesStartBtn').style.display = 'block';
        document.getElementById('casinoMinesStartBtn').disabled = false;
        document.getElementById('casinoMinesBet').disabled = false;
        document.getElementById('casinoMinesCount').disabled = false;
        document.getElementById('casinoMinesRange').disabled = false;
        
        toast(`+${data.payout} IMPULSE — Все открыто!`, 4000);
        if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 150]);
        if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');

        const list = document.getElementById('casinoMinesHistory');
        const item = document.createElement('div'); item.className = 'history-item';
        item.innerHTML = `<span>💣 Mines ${mCount}</span><span class="win">+${data.payout} IMPULSE</span>`;
        list.insertBefore(item, list.firstChild); if (list.children.length > 15) list.removeChild(list.lastChild);
      }
    } catch (e) {
      toast('Ошибка сервера');
      cells.forEach(c => { if (!c.classList.contains('opened') && !c.classList.contains('mine')) c.classList.remove('disabled'); });
    }
  }

  document.getElementById('casinoMinesCashoutBtn').addEventListener('click', async () => {
    if (!mActive) return;
    document.getElementById('casinoMinesCashoutBtn').disabled = true;
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/mines/cashout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      });
      const data = await r.json();
      if (!data.ok) { toast(data.error || 'Ошибка'); document.getElementById('casinoMinesCashoutBtn').disabled = false; return; }

      mActive = false;
      if (data.balance !== undefined) { setBalance(data.balance); }

      const balEl = document.getElementById('casinoBalanceAmount');
      if (balEl && data.balance !== undefined) balEl.textContent = data.balance.toLocaleString();
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
      list.insertBefore(item, list.firstChild); if (list.children.length > 15) list.removeChild(list.lastChild);

      toast(`+${data.payout} IMPULSE — x${data.multiplier.toFixed(2)}!`, 4000);
      if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 150]);
      if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (e) {
      toast('Ошибка сервера');
      document.getElementById('casinoMinesCashoutBtn').disabled = false;
    }
  });
}
