// ==================== XXI (🔮 BLACKJACK) ====================
function initCasinoXxi() {
  const toast = window.casinoShowToast;
  const getBalance = window.casinoGetBalance;
  const setBalance = window.casinoSetBalance;

  const SUITS = ['♠','♥','♦','♣'];
  const RED_SUITS = ['♥','♦'];
  let bjPlayer = [], bjDealer = [], bjBet = 0, bjOriginalBet = 0;
  let bjGameActive = false, bjInsuranceTaken = false, bjInsuranceBet = 0;
  let bjSplitHands = null, bjActiveSplit = 0;

  function bjCardValue(card) {
    if (card.hidden) return 0;
    if (['J','Q','K'].includes(card.v)) return 10;
    if (card.v === 'A') return 11;
    return parseInt(card.v);
  }

  function bjHandScore(hand) {
    let score = 0, aces = 0;
    for (const c of hand) {
      if (c.hidden) continue;
      score += bjCardValue(c);
      if (c.v === 'A') aces++;
    }
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
  }

  function bjRenderCard(card, delay = 0) {
    const el = document.createElement('div');
    el.className = 'bj-card' + (card.hidden ? ' hidden' : (RED_SUITS.includes(card.s) ? ' red' : ' black'));
    el.style.animationDelay = delay + 'ms';
    if (card.hidden) {
      el.innerHTML = '<img src="/games/xxi/xxi_card_back.webp" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">';
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
    const canSplit = !bjSplitHands && hand.length === 2 && bjCardValue(hand[0]) === bjCardValue(hand[1]) && getBalance() >= bjBet;
    const canDouble = hand.length === 2 && getBalance() >= bjBet;
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
    if (list.children.length > 15) list.removeChild(list.lastChild);
  }

  function bjDelay(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function bjDeal() {
    const bet = parseInt(document.getElementById('casinoBjBet').value) || 0;
    if (bet < 10 || bet > 500) { toast('Ставка: 10-500 IMPULSE'); return; }
    if (bet > getBalance()) { toast('Недостаточно IMPULSE'); return; }

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet })
      });
      const data = await r.json();
      if (!data.success) { toast(data.error || 'Ошибка'); bjGameActive = false; return; }

      setBalance(data.new_balance);
      const balEl = document.getElementById('casinoBalanceAmount');
      if (balEl) balEl.textContent = data.new_balance.toLocaleString();

      bjPlayer = data.player_hands[0];
      bjDealer = [data.dealer_up, { v: '?', s: '?', hidden: true }];

      document.getElementById('casinoBjResultBanner').style.display = 'none';
      document.getElementById('casinoBjInsuranceBar').classList.remove('visible');

      bjRenderHands();
      bjUpdateButtons('playing');

      if (data.is_blackjack) {
        await bjDelay(600);
        bjEndRound('bj');
        return;
      }

      if (data.can_insurance) {
        document.getElementById('casinoBjInsuranceBar').textContent = 'Страховка? (пол-ставки)';
        document.getElementById('casinoBjInsuranceBar').classList.add('visible');
      }
    } catch (e) {
      toast('Ошибка сервера');
      bjGameActive = false;
    }
  }

  async function bjHit() {
    const hi = bjSplitHands ? bjActiveSplit : 0;
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hit', hand_index: hi })
      });
      const data = await r.json();
      if (!data.success) { toast(data.error || 'Ошибка'); return; }

      if (bjSplitHands) { bjSplitHands = data.player_hands; }
      else { bjPlayer = data.player_hands[0]; }

      bjRenderHands();

      if (data.bust) {
        if (bjSplitHands && bjActiveSplit === 0) {
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
    } catch (e) {
      toast('Ошибка сервера');
    }
  }

  async function bjStand() {
    if (bjSplitHands && bjActiveSplit === 0) {
      try {
        await authFetch(`${BASE_URL}/api/casino/blackjack/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stand', hand_index: 0 })
        });
      } catch (e) {}
      bjActiveSplit = 1;
      bjRenderHands();
      bjUpdateButtons('playing');
      return;
    }
    try {
      await authFetch(`${BASE_URL}/api/casino/blackjack/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stand', hand_index: bjSplitHands ? bjActiveSplit : 0 })
      });
    } catch (e) {}
    await bjDelay(300);
    await bjEndRound('normal');
  }

  async function bjDouble() {
    const hi = bjSplitHands ? bjActiveSplit : 0;
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'double', hand_index: hi })
      });
      const data = await r.json();
      if (!data.success) { toast(data.error || 'Недостаточно IMPULSE'); return; }

      setBalance(data.new_balance);
      bjBet = data.bets[hi];
      if (bjSplitHands) { bjSplitHands = data.player_hands; }
      else { bjPlayer = data.player_hands[0]; }

      const balEl = document.getElementById('casinoBalanceAmount');
      if (balEl) balEl.textContent = data.new_balance.toLocaleString();

      bjRenderHands();
      await bjDelay(400);
      if (data.bust) { bjEndRound('bust'); return; }
      await bjEndRound('normal');
    } catch (e) {
      toast('Ошибка сервера');
    }
  }

  async function bjSplit() {
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'split', hand_index: 0 })
      });
      const data = await r.json();
      if (!data.success) { toast(data.error || 'Недостаточно IMPULSE'); return; }

      setBalance(data.new_balance);
      bjSplitHands = data.player_hands;
      bjActiveSplit = 0;

      const balEl = document.getElementById('casinoBalanceAmount');
      if (balEl) balEl.textContent = data.new_balance.toLocaleString();

      bjRenderHands();
      bjUpdateButtons('playing');
    } catch (e) {
      toast('Ошибка сервера');
    }
  }

  async function bjTakeInsurance() {
    if (bjInsuranceTaken) return;
    try {
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insurance' })
      });
      const data = await r.json();
      if (!data.success) { toast(data.error || 'Недостаточно IMPULSE'); return; }

      setBalance(data.new_balance);
      bjInsuranceBet = data.insurance_bet;
      bjInsuranceTaken = true;

      const balEl = document.getElementById('casinoBalanceAmount');
      if (balEl) balEl.textContent = data.new_balance.toLocaleString();

      document.getElementById('casinoBjInsuranceBar').classList.remove('visible');
    } catch (e) {
      toast('Ошибка сервера');
    }
  }

  async function bjEndRound(reason) {
    bjGameActive = false;

    if (reason === 'bust' && bjSplitHands && bjActiveSplit === 0) {
      bjActiveSplit = 1;
      bjRenderHands();
      bjUpdateButtons('playing');
      bjGameActive = true;
      return;
    }

    const skipDealer = (reason === 'bust' && !bjSplitHands);
    if (!skipDealer) {
      try {
        await authFetch(`${BASE_URL}/api/casino/blackjack/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stand', hand_index: bjSplitHands ? bjActiveSplit : 0 })
        });
      } catch (e) {}
    }

    try {
      const r = await authFetch(`${BASE_URL}/api/casino/blackjack/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await r.json();
      if (!data.success) { toast('Ошибка сервера'); bjUpdateButtons('idle'); return; }

      setBalance(data.new_balance);
      bjDealer = data.dealer_hand;

      const balEl = document.getElementById('casinoBalanceAmount');
      if (balEl) balEl.textContent = data.new_balance.toLocaleString();

      bjRenderHands(true);

      const r0 = data.results[0];
      const dScore = data.dealer_score;
      const pScore = r0.score;

      let resultText = '', rType = 'lose';
      if (r0.result === 'blackjack') { resultText = '🎉 XXI! +' + Math.floor(r0.bet * 1.5) + ' IMPULSE'; rType = 'win'; if (window.vibrate) window.vibrate('success'); }
      else if (r0.result === 'win') { resultText = '✅ ВЫИГРЫШ! +' + r0.bet + ' IMPULSE'; rType = 'win'; if (window.vibrate) window.vibrate('success'); }
      else if (r0.result === 'push') { resultText = '🤝 НИЧЬЯ'; rType = 'push'; }
      else if (r0.result === 'dealer_bust') { resultText = '💥 Перебор у дилера! +' + r0.bet + ' IMPULSE'; rType = 'win'; if (window.vibrate) window.vibrate('success'); }
      else if (reason === 'bust' || pScore > 21) { resultText = '💥 ПЕРЕБОР! -' + r0.bet + ' IMPULSE'; rType = 'lose'; if (window.vibrate) window.vibrate('error'); }
      else { resultText = '❌ ПРОИГРЫШ -' + r0.bet + ' IMPULSE'; rType = 'lose'; if (window.vibrate) window.vibrate('error'); }

      bjShowResult(resultText, rType);
      bjAddHistory(resultText, r0.bet, pScore, dScore);
    } catch (e) {
      toast('Ошибка сервера');
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
}
