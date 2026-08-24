// ==================== ВИКТОРИНА ====================
function showWelcome(totalScore, gamesPlayed) {
  const oldAnsweredBtn = document.getElementById('dailyQAnsweredBtn');
  if(oldAnsweredBtn) oldAnsweredBtn.remove();
  const phrase = t.phrases[Math.floor(Math.random() * t.phrases.length)];
  const freeGamesLeft = currentState.freeGamesLeft;
  const SVG = (p) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#cfd8e6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I_GAMEPAD = SVG('<path d="M7 6h10a5 5 0 0 1 5 5v2a2 2 0 0 1-4 0v-1H6v1a2 2 0 0 1-4 0v-2a5 5 0 0 1 5-5z"/><path d="M7 9v4M5 11h4"/><circle cx="16" cy="10" r="0.6"/><circle cx="18" cy="12" r="0.6"/>');
  const I_USERS = SVG('<circle cx="9" cy="8" r="3"/><path d="M4 19c0-3 2.2-5 5-5s5 2 5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c2.3.2 4 2 4 4.5"/>');
  const I_GIFT = SVG('<rect x="4" y="10" width="16" height="9" rx="1.5"/><path d="M4 10h16M12 7v12"/><path d="M12 7c-2 0-4.5-.8-4.5-2.5S10 2.5 12 7zM12 7c2 0 4.5-.8 4.5-2.5S14 2.5 12 7z"/>');
  const I_BOOK = SVG('<path d="M12 6c-2-1.8-6-1.8-8-.8v13c2-1 6-1 8 .8 2-1.8 6-1.8 8-.8v-13c-2-1-6-1-8 .8z"/><path d="M12 6v13"/>');
  const I_STAR = SVG('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8-5.3-2.9-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.8z"/>');
  const I_GEM = SVG('<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4l2.5 5 2.5-5"/>');
  const I_HEX = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#cfd8e6" stroke-width="1.5"><path d="M12 2.5l8 4.75v9.5l-8 4.75-8-4.75v-9.5z"/><text x="12" y="15.5" text-anchor="middle" font-size="9" fill="#cfd8e6" stroke="none" font-family="serif">N</text></svg>`;

  const menuBtn = (id, icon, label, attrs = '', extraStyle = '') => `
    <button ${id ? `id="${id}"` : ''} ${attrs} style="display:flex;align-items:center;gap:12px;width:100%;padding:13px 16px;margin-top:10px;background:rgba(4,8,20,0.35);border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 12px rgba(175,200,245,0.25);cursor:pointer;color:#00ffaa;font-size:0.88rem;font-weight:600;${extraStyle}">
      <span style="flex-shrink:0;">${icon}</span>
      <span style="flex:1;text-align:center;">${label}</span>
      <span style="flex-shrink:0;">${I_HEX}</span>
    </button>`;

  const METAL = 'background:linear-gradient(rgba(4,8,20,0.55),rgba(4,8,20,0.55)) padding-box,linear-gradient(120deg,#f8fbff,#9fb4d8 30%,#e6ecf7 50%,#7d92b8 70%,#f8fbff) border-box;border:2px solid transparent;';

  const webpBtn = (id, img, label, attrs = '', extra = '') => `
    <button ${id ? `id="${id}"` : ''} ${attrs} style="position:relative;display:block;width:100%;height:56px;margin-top:10px;background:none;border:none;padding:0;cursor:pointer;${extra}">
      <img src="${img}" style="width:100%;height:100%;object-fit:fill;border-radius:14px;display:block;">
      <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:600;font-size:0.88rem;color:#00ffaa;white-space:nowrap;">${label}</span>
    </button>`;

  const superTitle = { ru: 'СУПЕР ИГРА X-15', en: 'SUPER GAME X-15', fr: 'SUPER JEU X-15', es: 'SUPER JUEGO X-15' }[currentLang] || 'SUPER GAME X-15';

  const superGameCard = `
    <div style="position:relative;margin:14px 0 14px;border-radius:18px;box-shadow:0 0 14px rgba(175,200,245,0.35);padding:32px 16px 16px;text-align:center;">
      <div style="position:absolute;inset:0;border:2px solid transparent;background:linear-gradient(120deg,#f8fbff,#9fb4d8 30%,#e6ecf7 50%,#7d92b8 70%,#f8fbff) border-box;border-radius:18px;-webkit-mask:linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;"></div>
      <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#8a744a,#e8d9a0,#8a744a);color:#1a1408;font-weight:800;font-size:0.95rem;letter-spacing:2px;padding:6px 22px;border-radius:10px;white-space:nowrap;">${superTitle}</div>
      <div style="position:relative;display:flex;gap:8px;justify-content:center;align-items:center;">
        <img src="main/btn_super_stars.webp" id="buyStarsBtn" style="cursor:pointer;height:44px;width:auto;display:block;">
        <img src="main/btn_super_usdt.webp" id="buyUsdtBtn" style="cursor:pointer;height:44px;width:auto;display:block;" onclick="openTonModal()">
      </div>
    </div>`;

  let startBtnText = currentState.superGamePending ? t.startSuperBtn : (freeGamesLeft > 0 ? t.startBtn(freeGamesLeft) : t.limitBtn);
  let startBtnDisabled = (!currentState.superGamePending && freeGamesLeft <= 0) ? 'disabled' : '';
  const duelsBtnHtml = webpBtn('duelsBtn', '/main/btn_frame_whitepaper.webp', '⚔️ ' + (DUEL_LANG?.[currentLang]?.title || 'Duels'));
  const startBtnHtml = webpBtn('startNewBtn', 'main/btn_frame_start.webp', startBtnText, startBtnDisabled, startBtnDisabled ? 'opacity:0.5;pointer-events:none;' : '');

  const replayBtnHtml = currentState.lastGameWasSuper && !currentState.superGameReplayUsed
    ? `<button class="replay-btn" id="replayBtn">${t.replayBtn}</button>`
    : '';

  const phraseIndex = Math.floor(Math.random() * 6) + 1;
  const phraseImg = `/main/quiz_phrase_${currentLang}_${phraseIndex}.webp`;

root.innerHTML = `
  <div class="welcome-card">
    <img src="${phraseImg}" alt="NEURON" style="width:100%;max-width:400px;height:auto;display:block;margin:0 auto 12px;opacity:0.9;">
      ${superGameCard}
      ${duelsBtnHtml}
      ${startBtnHtml}
      ${replayBtnHtml}
      <div id="dailyQuestionCard" style="display:none; background: linear-gradient(135deg, rgba(0,200,255,0.1), rgba(122,46,255,0.1)); border: 1px solid rgba(0,255,255,0.3); border-radius: 24px; padding: 20px; margin-bottom: 16px; text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="font-size: 1.5rem;">🧠</span>
          <span style="font-size: 1.1rem; font-weight: 700; color: #00ffff;" id="dailyQTitle"></span>
        </div>
        <div style="color: #ffcc44; font-size: 0.85rem; margin-bottom: 12px;" id="dailyQBonus"></div>
        <div id="dailyQStatus" style="color: #88aacc; font-size: 0.9rem; margin-bottom: 12px;"></div>
        <div id="dailyQText" style="color: #f2f6ff; font-size: 1rem; font-weight: 500; margin-bottom: 16px;"></div>
        <div id="dailyQOptions" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;"></div>
        <div id="dailyQResult" style="color: #00ffaa; font-size: 0.9rem; margin-bottom: 12px;"></div>
        <button id="dailyQAnswerBtn" style="display:none; background: linear-gradient(90deg, #00aa88, #00ddaa); border: none; border-radius: 40px; padding: 12px 20px; font-size: 0.9rem; font-weight: 700; color: white; cursor: pointer; width: 100%;">${t.dailyQAnswerBtn}</button>
      </div>
      ${webpBtn('miniRefBtn', '/main/btn_frame_invite.webp', t.referralMiniBtn)}
      ${localStorage.getItem('channelBonusClaimed') === '1' ? '' : `
        ${webpBtn('', '/main/btn_frame_channel.webp', `📢 ${t.channelBonusBtn}`, `onclick="window.open('https://t.me/NeuronGame_bot?start=channel','_blank')"`)}
        ${webpBtn('channelBonusBtn', '/main/btn_frame_channel.webp', t.channelClaimBtn || '🎁 Забрать бонус')}
      `}
      ${webpBtn('whitepaperBtn', '/main/btn_frame_whitepaper.webp', 'Whitepaper')}
    </div>`;

  const wpBtn = document.getElementById('whitepaperBtn');
  if (wpBtn) wpBtn.addEventListener('click', () => {
    if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(window.location.origin + '/whitepaper.html');
    else window.open('/whitepaper.html', '_blank');
  });


  const miniRefBtn = document.getElementById('miniRefBtn');
  if (miniRefBtn) miniRefBtn.addEventListener('click', () => {
    switchTab('leaderboard');
    setTimeout(() => {
      const refCard = document.querySelector('.referral-card');
      if (refCard) refCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  });

  const replayBtn = document.getElementById('replayBtn');
  if (replayBtn) {
    replayBtn.addEventListener('click', async () => {
      if (currentState.superGameReplayUsed) { showToast(t.replayAlreadyUsed, 3000); return; }
      if (currentState.totalScore < 50) { showToast(t.replayNotEnough, 3000); return; }
      replayBtn.disabled = true;
      replayBtn.textContent = '⏳ ...';
      try {
        const res = await authFetch(`${BASE_URL}/api/replay-super`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();
        if (data.error) {
          showToast(`⚠️ ${data.error}`, 3000);
          replayBtn.disabled = false;
          replayBtn.textContent = t.replayBtn;
          return;
        }
        currentState.superGameReplayUsed = true;
        currentState.superGamePending = true;
        currentState.lastGameWasSuper = false;
        if (data.newBalance !== undefined) {
          currentState.totalScore = data.newBalance;
          updateScoresUI(data.newBalance);
        }
        loadFirstQuestion();
      } catch(e) {
        showToast(t.errConnBtn, 3000);
        replayBtn.disabled = false;
        replayBtn.textContent = t.replayBtn;
      }
    });
  }

  const starsBtn = document.getElementById('buyStarsBtn');
  if (starsBtn) {
    let starsLoading = false;
    starsBtn.addEventListener('click', async () => {
      if (starsLoading) return;
      starsLoading = true;
      try {
        const res = await authFetch(`${BASE_URL}/api/create-stars-invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();
        if (data.error) {
          if (data.superGameLimit) showToast(t.superLimitToast, 4000);
          else showToast(`⚠️ ${data.error}`, 3000);
          starsLoading = false; return;
        }
        tg.openInvoice(data.link, (status) => {
          if (status === 'paid') {
            showToast(t.paidToast, 4000);
            currentState.superGamePending = true;
            currentState.superGamesTotal += 1;
            currentState.lastGameWasSuper = false;
            currentState.superGameReplayUsed = false;
            setTimeout(() => loadWelcome(), 500);
          }
          else if (status === 'cancelled') showToast(t.cancelledToast, 2000);
          else if (status === 'failed') showToast(t.failedToast, 3000);
          starsLoading = false;
        });
      } catch(e) {
        showToast(t.errConnBtn, 3000);
        starsLoading = false;
      }
    });
  }

  loadDailyQuestion();

  const channelBtn = document.getElementById('channelBonusBtn');
  if (channelBtn) {
    channelBtn.addEventListener('click', async () => {
      const span = channelBtn.querySelector('span');
      if(span) span.textContent = '⏳ Проверяем...';
      channelBtn.disabled = true;
      try {
        const res = await authFetch(`${BASE_URL}/api/claim-channel-bonus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
          currentState.totalScore += data.bonus;
          localStorage.setItem('channelBonusClaimed', '1');
          updateScoresUI(currentState.totalScore);
          showToast(data.message, 4000);
          loadWelcome();
        } else {
          showToast(data.message || 'Подпишитесь на канал!', 3000);
          channelBtn.disabled = false;
          if(span) span.textContent = '🎁 Забрать бонус';
        }
      } catch(e) {
        showToast(t.errConnBtn, 3000);
        channelBtn.disabled = false;
        if(span) span.textContent = '🎁 Забрать бонус';
      }
    });
  }

  const duelsBtn = document.getElementById('duelsBtn');
  if (duelsBtn) duelsBtn.addEventListener('click', () => switchTab('duels'));
  const startBtn = document.getElementById('startNewBtn');
  if (startBtn && !startBtn.disabled) {
    startBtn.addEventListener('click', () => {
      const wasSuper = currentState.superGamePending;
      if (!wasSuper) {
        currentState.lastGameWasSuper = false;
        currentState.superGameReplayUsed = false;
      }
      authFetch(`${BASE_URL}/api/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, answer: 'reset', name: userName, lang: currentLang })
      }).then(r => r.json()).then(data => {
        if (data.noGamesLeft) showToast(t.limitToast, 3000);
        else loadFirstQuestion();
      }).catch(() => loadFirstQuestion());
    });
  }
}

function renderQuestion(question, index, total, currentGameScore, startTime = 15) {
  currentState.currentQuestion = question;
  currentState.currentOptions = question.options;
  currentState.timeLeft = startTime;
  gamesLeftSpan.innerText = currentState.currentIsSuper ? `🔥 ${currentGameScore}` : t.scoreBadge(currentGameScore);
  root.innerHTML = `
    <div class="question-panel">
      <div class="question-text">${escapeHtml(question.text)}</div>
      <div class="hints">
        <button class="hint-btn" id="hint5050">${t.hint5050}</button>
        <button class="hint-btn" id="hintReplace">${t.hintReplace}</button>
      </div>
      <div class="answers-grid">
        ${question.options.map((opt, i) => `<button class="answer-btn" data-idx="${i}">${escapeHtml(opt)}</button>`).join('')}
      </div>
    </div>
    <div class="action-area">
      <div id="resultMessage" class="message-box" style="display:none;"></div>
      <button id="submitAnswerBtn" class="next-btn" style="display:none;">${t.submitBtn}</button>
    </div>`;

  const btns = document.querySelectorAll('.answer-btn');
  const submitBtn = document.getElementById('submitAnswerBtn');
  const messageDiv = document.getElementById('resultMessage');
  const hint5050 = document.getElementById('hint5050');
  const hintReplace = document.getElementById('hintReplace');
  hint5050.onclick = () => useHint('5050');
  hintReplace.onclick = () => useHint('replace');
  if (currentState.hintsUsed.includes('5050')) { hint5050.classList.add('disabled'); hint5050.disabled = true; }
  if (currentState.hintsUsed.includes('replace')) { hintReplace.classList.add('disabled'); hintReplace.disabled = true; }

  let timeLeft = startTime;
  const timerDiv = document.createElement('div');
  timerDiv.className = 'timer';
  timerDiv.innerText = t.timerSec(timeLeft);
  document.querySelector('.action-area').prepend(timerDiv);
  const timerInterval = setInterval(() => {
    timeLeft--; currentState.timeLeft = timeLeft;
    timerDiv.innerText = t.timerSec(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerDiv.innerText = t.timerSec(0);
      if (!currentState.answered) sendAnswer(null);
    }
  }, 1000);
  currentState.timer = timerInterval;

  btns.forEach(btn => btn.addEventListener('click', () => {
    if (currentState.answered) return;
    btns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentState.selectedAnswer = parseInt(btn.dataset.idx);
    submitBtn.style.display = 'block'; messageDiv.style.display = 'none';
  }));
  submitBtn.onclick = () => {
    if (currentState.selectedAnswer === null || currentState.answered) return;
    sendAnswer(currentState.selectedAnswer);
  };
}

function sendAnswer(selectedIndex) {
  if (currentState.answered) return;
  currentState.answered = true;
  if (currentState.timer) { clearInterval(currentState.timer); currentState.timer = null; }
  const btns = document.querySelectorAll('.answer-btn');
  btns.forEach(btn => btn.disabled = true);
  const selectedBtn = (selectedIndex !== null && btns[selectedIndex]) ? btns[selectedIndex] : null;
  const submitBtn = document.getElementById('submitAnswerBtn');
  const messageDiv = document.getElementById('resultMessage');
  if (submitBtn) submitBtn.style.display = 'none';
  if (messageDiv) { messageDiv.style.display = 'block'; messageDiv.className = 'message-box'; messageDiv.innerText = t.checking; }

  authFetch(`${BASE_URL}/api/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, name: userName, answer: selectedIndex !== null ? selectedIndex : '', lang: currentLang })
  }).then(r => r.json()).then(data => {
    if (data.error) {
      if (messageDiv) { messageDiv.innerText = `⚠️ ${data.error}`; messageDiv.classList.add('wrong'); }
      if (btns[data.correctIndex]) btns[data.correctIndex].classList.add('correct');
      return;
    }
    if (messageDiv) { messageDiv.innerText = data.message; messageDiv.classList.add(data.correct ? 'correct' : 'wrong'); }
    if (selectedBtn) {
      selectedBtn.classList.add(data.correct ? 'correct' : 'wrong');
      if (!data.correct && btns[data.correctIndex]) btns[data.correctIndex].classList.add('correct');
    } else if (btns[data.correctIndex]) { btns[data.correctIndex].classList.add('correct'); }
    if (data.correct) { triggerCorrectEffect(); } else { triggerWrongEffect(); }
    if (data.freeGamesLeft !== undefined) { currentState.freeGamesLeft = data.freeGamesLeft; if (data.finished) updateGamesLeftUI(data.freeGamesLeft); }
    if (data.totalScore !== undefined) { currentState.totalScore = data.totalScore; updateScoresUI(data.totalScore); }
    if (data.score !== undefined) { currentState.gameScore = data.score; if (!data.finished) gamesLeftSpan.innerText = currentState.currentIsSuper ? `🔥 ${data.score}` : t.scoreBadge(data.score); }
    if (data.superGamePending !== undefined) currentState.superGamePending = data.superGamePending;
    if (data.superGamesTotal !== undefined) currentState.superGamesTotal = data.superGamesTotal;
    if (data.withdrawTickets !== undefined) currentState.withdrawTickets = data.withdrawTickets;
    if (data.finished) {
      if (currentState.timer) { clearInterval(currentState.timer); currentState.timer = null; }
      currentState.answered = true;
      if (data.gamesPlayed !== undefined) { currentState.gamesPlayed = data.gamesPlayed; }
      if (data.streakCount !== undefined) { currentState.streakCount = data.streakCount; }
      if (data.wasSuper) { currentState.lastGameWasSuper = true; }
      if (currentState.gameScore >= 10) { setTimeout(() => launchConfettiTop(), 300); }
      if (data.streakBonus > 0) { setTimeout(() => showToast(t.streakToast(data.streakCount, data.streakBonus), 4000), 2600); }
      currentState.pendingTimeout = setTimeout(() => {
        currentState.pendingTimeout = null;
        updateScoresUI(data.totalScore || 0);
        updateGamesLeftUI(data.freeGamesLeft !== undefined ? data.freeGamesLeft : currentState.freeGamesLeft);
        showWelcome(data.totalScore || 0, currentState.gamesPlayed || 0);
      }, 2500);
    } else if (data.nextQuestion) {
      currentState.currentQuestion = data.nextQuestion; currentState.selectedAnswer = null; currentState.answered = false;
      currentState.pendingTimeout = setTimeout(() => {
        currentState.pendingTimeout = null;
        renderQuestion(data.nextQuestion, data.nextIndex || 0, data.total || 10, data.score);
      }, 2500);
    }
  }).catch(() => {
    if (messageDiv) { messageDiv.innerText = t.errConn; messageDiv.classList.add('wrong'); }
    btns.forEach(btn => btn.disabled = false); currentState.answered = false;
  });
}

function loadFirstQuestion() {
  root.innerHTML = `<div class="loader">${t.loadingQ}</div>`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const safeName = userName || 'Player';
  authFetch(`${BASE_URL}/api/question?user_id=${userId}&name=${encodeURIComponent(safeName)}&lang=${currentLang}`, {
    signal: controller.signal
  }).then(r => { clearTimeout(timeout); return r.json(); }).then(data => {
    if (data.error) { if(window._hideSplash) window._hideSplash(); root.innerHTML = `<div class="loader">${t.errAuth}</div>`; return; }
    if (data.finished) {
      if(window._hideSplash) window._hideSplash();
      updateScoresUI(data.totalScore || 0);
      if (data.noGamesLeft) showToast(t.limitToast, 3000);
      if (data.freeGamesLeft !== undefined) { currentState.freeGamesLeft = data.freeGamesLeft; updateGamesLeftUI(data.freeGamesLeft); }
      showWelcome(data.totalScore || 0, data.gamesPlayed || 0);
    } else {
      if(window._hideSplash) window._hideSplash();
      currentState.currentQuestion = { text: data.text, options: data.options };
      currentState.totalScore = data.totalScore || 0; currentState.gameScore = data.score || 0;
      currentState.answered = false; currentState.selectedAnswer = null;
      currentState.hintsUsed = data.hintsUsed || []; currentState.gamesPlayed = data.gamesPlayed || 0;
      currentState.freeGamesLeft = data.freeGamesLeft || 10;
      currentState.currentIsSuper = data.currentIsSuper || false;
      if (!currentState.superGamePending) currentState.lastGameWasSuper = false;
      currentState.superGamePending = false;
      updateScoresUI(currentState.totalScore); updateGamesLeftUI(currentState.freeGamesLeft);
      renderQuestion(currentState.currentQuestion, data.index, data.total, currentState.gameScore);
    }
  }).catch(() => { if(window._hideSplash) window._hideSplash(); root.innerHTML = `<div class="loader">${t.errConn}</div>`; });
}

async function useHint(hintType) {
  if (currentState.answered) return;
  const response = await authFetch(`${BASE_URL}/api/use-hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, hint: hintType })
  });
  const data = await response.json();
  if (data.error) { tg.showAlert(data.error); return; }
  currentState.hintsUsed.push(hintType);
  if (hintType === '5050') {
    document.querySelectorAll('.answer-btn').forEach((btn, idx) => { if (data.removedIndices.includes(idx)) btn.style.display = 'none'; });
    const btn = document.getElementById('hint5050');
    if (btn) { btn.classList.add('disabled'); btn.disabled = true; }
  } else if (hintType === 'replace') {
    if (currentState.timer) { clearInterval(currentState.timer); currentState.timer = null; }
    currentState.answered = false; currentState.selectedAnswer = null; currentState.currentQuestion = data.newQuestion;
    renderQuestion(data.newQuestion, 0, 0, currentState.gameScore);
    const btn = document.getElementById('hintReplace');
    if (btn) { btn.classList.add('disabled'); btn.disabled = true; }
  }
  updateScoresUI(data.newScore); currentState.totalScore = data.newScore;
}

// ==================== ВОПРОС ДНЯ ====================
async function loadDailyQuestion() {
  const oldAnsweredBtn = document.getElementById('dailyQAnsweredBtn');
  if(oldAnsweredBtn) oldAnsweredBtn.remove();
  const sessionId = ++currentState.dailyQSessionId;
  try {
    const res = await authFetch(`${BASE_URL}/api/daily-question`);
    const data = await res.json();
    if (sessionId !== currentState.dailyQSessionId) return;
    const card = document.getElementById('dailyQuestionCard');
    if (!data.available) {
      if (card) card.style.display = 'none';
      return;
    }
    if (card) card.style.display = 'block';
    document.getElementById('dailyQTitle').textContent = t.dailyQTitle;
    document.getElementById('dailyQBonus').textContent = t.dailyQBonus;
    const answerBtn = document.getElementById('dailyQAnswerBtn');
    if (data.answered) {
      if (card) card.style.display = 'none';
      return;
    } else {
      document.getElementById('dailyQStatus').textContent = '';
      document.getElementById('dailyQText').style.display = 'block';
      document.getElementById('dailyQText').textContent = data.text;
      document.getElementById('dailyQOptions').style.display = 'flex';
      answerBtn.style.display = 'block';
      const optionsDiv = document.getElementById('dailyQOptions');
      optionsDiv.innerHTML = '';
      const letterLabels = ['A', 'B', 'C', 'D'];
      data.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.style.textAlign = 'left';
        btn.style.padding = '10px 16px';
        btn.style.fontSize = '0.9rem';
        btn.innerHTML = `<span style="color: #00ffff; margin-right: 12px;">${letterLabels[idx]}</span>${escapeHtml(opt)}`;
        btn.dataset.idx = idx;
        btn.onclick = () => selectDailyOption(idx);
        optionsDiv.appendChild(btn);
      });
      currentState.currentDailyOptions = data.options;
      currentState.selectedDailyOption = null;
      document.getElementById('dailyQResult').textContent = '';
      answerBtn.disabled = true;
      answerBtn.style.opacity = '0.5';
      answerBtn.onclick = submitDailyAnswer;
    }
  } catch (e) {
    console.error('loadDailyQuestion error:', e);
  }
}

function selectDailyOption(idx) {
  const btns = document.querySelectorAll('#dailyQOptions .answer-btn');
  btns.forEach((btn, i) => { btn.classList.toggle('selected', i === idx); });
  currentState.selectedDailyOption = idx;
  const answerBtn = document.getElementById('dailyQAnswerBtn');
  answerBtn.disabled = false;
  answerBtn.style.opacity = '1';
}

async function submitDailyAnswer() {
  if (currentState.selectedDailyOption === null) return;
  const answerBtn = document.getElementById('dailyQAnswerBtn');
  answerBtn.disabled = true;
  answerBtn.textContent = '⏳ ...';
  try {
    const res = await authFetch(`${BASE_URL}/api/daily-question/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerIndex: currentState.selectedDailyOption })
    });
    const data = await res.json();
    const resultDiv = document.getElementById('dailyQResult');
    const btns = document.querySelectorAll('#dailyQOptions .answer-btn');
    if (data.correct) {
      resultDiv.style.color = '#00ffaa';
      resultDiv.textContent = t.dailyQCorrect;
      btns[currentState.selectedDailyOption]?.classList.add('correct');
      currentState.totalScore += (data.bonus || 0);
      updateScoresUI(currentState.totalScore);
    } else {
      resultDiv.style.color = '#ff8888';
      resultDiv.textContent = t.dailyQWrong + (data.message?.split(': ')[1] || '');
      btns[currentState.selectedDailyOption]?.classList.add('wrong');
      if (data.correctIndex !== undefined) { btns[data.correctIndex]?.classList.add('correct'); }
    }
    btns.forEach(btn => btn.disabled = true);
    answerBtn.style.display = 'none';
    const card = document.getElementById('dailyQuestionCard');
    if (card) card.style.display = 'none';
  } catch (e) {
    console.error('submitDailyAnswer error:', e);
    answerBtn.disabled = false;
    answerBtn.textContent = t.dailyQAnswerBtn;
  }
}

// ==================== ЛИДЕРБОРД ====================
function loadLeaderboard() {
  root.innerHTML = `<div class="loader">${t.loadingLb}</div>`;
  authFetch(`${BASE_URL}/api/leaderboard?user_id=${userId}`)
    .then(r => r.json()).then(data => {
      if (data.myRank) currentState.myRank = data.myRank;
      renderLeaderboard(data);
    }).catch(() => { root.innerHTML = `<div class="loader">${t.errConn}</div>`; });
}

function renderLeaderboard(data) {
  const me = data.me, myRank = data.myRank || '—', top5 = (data.top10 || []).slice(0, 5);
  const myPhotoUrl = me?.id ? `${BASE_URL}/api/tg-photo/${me.id}` : '';
  
  const myCardHtml = me ? `
    <div class="my-card-wrap">
      <img src="leaderboard/my_card_frame.webp" style="opacity:0.65;">
      <div class="my-card-inner">
        <div class="my-card-name">${me.subscriptionType === 'premium' ? '💎 ' : me.subscriptionType === 'vip' ? '👑 ' : ''}${escapeHtml(me.name)}</div>
        <div class="my-card-row">
          <div class="my-card-avatar-wrap">
            ${myPhotoUrl ? `
            <div class="my-card-avatar">
              <img src="${myPhotoUrl}">
              <img src="leaderboard/avatar_ring_wood.webp">
            </div>
            ` : ''}
          </div>
          <div class="my-card-stats">
            <span style="color:#00ffaa;">📍 ${myRank}</span>
            <span style="color:#fff;">🏆 ${me.totalScore.toLocaleString()}</span>
          </div>
          <div class="my-card-stats">
            <span style="color:#8899bb;">🎮 ${me.gamesPlayed || 0}</span>
            ${me.rankEmoji ? `<span style="color:#ffcc44;">${me.rankEmoji} ${me.rankTitle || ''}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  ` : `<div style="text-align:center;color:#5599bb;padding:20px;">${t.noRank}</div>`;
  
  root.innerHTML = `
    <div class="leaderboard-panel">
      ${myCardHtml}
      ${top5.map((p, i) => {
        const isMe = me && String(p.id) === String(userId);
        const frameNum = i + 1;
        const photoUrl = p.photo_url ? `${BASE_URL}${p.photo_url}` : '';
        const displayName = escapeHtml(p.name);
        const score = p.totalScore.toLocaleString();
        const subBadge = p.subscriptionType === 'premium' ? '💎' : p.subscriptionType === 'vip' ? '👑' : '';
        const subColor = p.subscriptionType === 'premium' ? '#aa66ff' : p.subscriptionType === 'vip' ? '#ffcc44' : '#cceeff';
        
        return `
        <div class="lb-row-wrap">
          <img src="leaderboard/leaderboard_frame_${frameNum}.webp" style="opacity:0.65;">
          <div class="lb-row-inner">
            ${photoUrl ? `
            <div class="lb-avatar">
              <img src="${photoUrl}">
              <img src="leaderboard/${i === 0 ? 'shop_neon_gold_frame.webp' : 'avatar_frame_' + ['silver','bronze','emerald','emerald'][i-1] + '.webp'}">
            </div>
            ` : ''}
            <span class="lb-name" style="color:${subColor};">${subBadge} ${displayName}${isMe ? ` <span style="color:#00ffff;font-size:0.72rem;">${t.you}</span>` : ''}</span>
            <span class="lb-score" style="color:#00ffaa;">${score}</span>
          </div>
        </div>`;
      }).join('') || `<div style="color:#5599bb;text-align:center;padding:20px 0;">${t.noRank}</div>`}
      
      <div class="ref-wrap">
        <img src="leaderboard/referral_frame.webp" style="opacity:0.65;">
        <div class="ref-inner">
          <div style="color:#fff;font-size:0.85rem;text-align:center;" id="refCount">${t.referralCount(0)}</div>
          <div style="display:flex;gap:8px;width:100%;">
            <button id="refCopyBtn" style="position:relative;background:none;border:none;padding:0;cursor:pointer;flex:1;">
              <img src="leaderboard/btn_referral_frame.webp" style="width:100%;display:block;">
              <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:600;font-size:0.75rem;color:#00ffaa;"> ${t.referralBtn}</span>
            </button>
            <button id="refShareBtn" style="position:relative;background:none;border:none;padding:0;cursor:pointer;flex:1;">
              <img src="leaderboard/btn_referral_frame.webp" style="width:100%;display:block;">
              <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:600;font-size:0.75rem;color:#00ffaa;"> ${t.referralShare}</span>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  
  loadReferralStats();
}

async function loadReferralStats() {
  try {
    const res = await authFetch(`${BASE_URL}/api/referral-stats?user_id=${userId}`);
    const data = await res.json();
    const refCountEl = document.getElementById('refCount');
    const refCopyBtn = document.getElementById('refCopyBtn');
    const refShareBtn = document.getElementById('refShareBtn');
    if (refCountEl) refCountEl.textContent = t.referralCount(data.referralCount || 0);
    if (refCopyBtn && data.referralLink) {
      refCopyBtn.onclick = () => {
        navigator.clipboard.writeText(data.referralLink)
          .then(() => showToast(t.referralCopied, 2000))
          .catch(() => showToast(t.referralCopied, 2000));
      };
    }
    if (refShareBtn && data.referralLink) {
      refShareBtn.onclick = () => {
        const shareText = encodeURIComponent(t.referralShareText || 'Play NEURON and earn COGNIQ!');
        const shareUrl = `tg://msg?text=${shareText}%20${encodeURIComponent(data.referralLink)}`;
        if (window.Telegram?.WebApp?.openTelegramLink) {
          window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(shareUrl);
        } else {
          window.location.href = shareUrl;
        }
      };
    }
  } catch(e) { console.error('loadReferralStats:', e.message); }
}

// ==================== ДУЭЛИ ====================

const DUEL_LANG = {
  ru: { 
    title: 'Дуэли', 
    subtitle: '1 на 1 • 10 вопросов • ставка', 
    desc: 'Брось вызов другу или найди соперника. Ставки: 100 / 500 / 1000 COGNIQ. Победитель забирает банк, 5% сжигается навсегда.', 
    waiting: 'Ожидание соперника...', 
    shareInvite: 'Отправить приглашение', 
    copyLink: 'Скопировать ссылку', 
    copied: '✅ Скопировано!', 
    backBtn: '← Назад', 
    errBalance: 'Недостаточно COGNIQ', 
    errCreate: 'Не удалось создать дуэль', 
    errConnect: 'Ошибка связи',
    cancelDuel: 'Отменить дуэль',
    cancelConfirm: 'Отменить дуэль и вернуть ставку?',
    roundLabel: 'Раунд',
    of: 'из',
    timeToAnswer: '⏱️ Время на ответ',
    yourAnswer: 'Ваш ответ',
    opponentAnswer: 'Ответ соперника',
    waitingOpponent: 'Ждём соперника...',
    youWin: '🏆 Вы победили!',
    youLose: '😢 Вы проиграли',
    draw: '🤝 Ничья! Ставки возвращены',
    duelFinished: '⚔️ Дуэль завершена!',
    returnToMenu: '← Вернуться в меню',
    opponentNotFound: 'Соперник не найден',
    duelCancelled: 'Дуэль отменена'
  },
  en: { 
    title: 'Duels', 
    subtitle: '1 vs 1 • 10 questions • stake', 
    desc: 'Challenge a friend or find an opponent. Stakes: 100 / 500 / 1000 COGNIQ. Winner takes the pot, 5% burned forever.', 
    waiting: 'Waiting for opponent...', 
    shareInvite: 'Send invite', 
    copyLink: 'Copy link', 
    copied: '✅ Copied!', 
    backBtn: '← Back', 
    errBalance: 'Not enough COGNIQ', 
    errCreate: 'Could not create duel', 
    errConnect: 'Connection error',
    cancelDuel: 'Cancel duel',
    cancelConfirm: 'Cancel duel and refund stake?',
    roundLabel: 'Round',
    of: 'of',
    timeToAnswer: '⏱️ Time to answer',
    yourAnswer: 'Your answer',
    opponentAnswer: 'Opponent answer',
    waitingOpponent: 'Waiting for opponent...',
    youWin: '🏆 You win!',
    youLose: '😢 You lose',
    draw: '🤝 Draw! Stakes refunded',
    duelFinished: '⚔️ Duel finished!',
    returnToMenu: '← Return to menu',
    opponentNotFound: 'Opponent not found',
    duelCancelled: 'Duel cancelled'
  },
  fr: { 
    title: 'Duels', 
    subtitle: '1 contre 1 • 10 questions • mise', 
    desc: 'Défiez un ami ou trouvez un adversaire. Mises: 100 / 500 / 1000 COGNIQ. Le gagnant prend le pot, 5% brûlés.', 
    waiting: 'Attente adversaire...', 
    shareInvite: 'Envoyer invitation', 
    copyLink: 'Copier lien', 
    copied: '✅ Copié !', 
    backBtn: '← Retour', 
    errBalance: 'COGNIQ insuffisants', 
    errCreate: 'Impossible de créer le duel', 
    errConnect: 'Erreur de connexion',
    cancelDuel: 'Annuler le duel',
    cancelConfirm: 'Annuler le duel et rembourser la mise ?',
    roundLabel: 'Manche',
    of: 'de',
    timeToAnswer: '⏱️ Temps de réponse',
    yourAnswer: 'Votre réponse',
    opponentAnswer: 'Réponse adversaire',
    waitingOpponent: 'Attente de l\'adversaire...',
    youWin: '🏆 Vous gagnez !',
    youLose: '😢 Vous perdez',
    draw: '🤝 Égalité ! Mises remboursées',
    duelFinished: '⚔️ Duel terminé !',
    returnToMenu: '← Retour au menu',
    opponentNotFound: 'Adversaire introuvable',
    duelCancelled: 'Duel annulé'
  },
  es: { 
    title: 'Duelos', 
    subtitle: '1 vs 1 • 10 preguntas • apuesta', 
    desc: 'Reta a un amigo o encuentra un oponente. Apuestas: 100 / 500 / 1000 COGNIQ. El ganador se lleva el bote, 5% quemado.', 
    waiting: 'Esperando oponente...', 
    shareInvite: 'Enviar invitación', 
    copyLink: 'Copiar enlace', 
    copied: '✅ ¡Copiado!', 
    backBtn: '← Volver', 
    errBalance: 'COGNIQ insuficientes', 
    errCreate: 'No se pudo crear el duelo', 
    errConnect: 'Error de conexión',
    cancelDuel: 'Cancelar duelo',
    cancelConfirm: '¿Cancelar duelo y devolver apuesta?',
    roundLabel: 'Ronda',
    of: 'de',
    timeToAnswer: '⏱️ Tiempo de respuesta',
    yourAnswer: 'Tu respuesta',
    opponentAnswer: 'Respuesta del oponente',
    waitingOpponent: 'Esperando oponente...',
    youWin: '🏆 ¡Ganas!',
    youLose: '😢 Pierdes',
    draw: '🤝 ¡Empate! Apuestas devueltas',
    duelFinished: '⚔️ ¡Duelo terminado!',
    returnToMenu: '← Volver al menú',
    opponentNotFound: 'Oponente no encontrado',
    duelCancelled: 'Duelo cancelado'
  }
};

let duelPollInterval = null;
let duelTimerInterval = null;
let duelCurrentRound = 0;
let duelTimeLeft = 15;
let duelAnswered = false;
let duelId = null;
let duelData = null;
let duelQuestions = [];
let duelTotalRounds = 10;
let duelScores = { score1: 0, score2: 0 };
let duelWaitingForOpponent = false;


function loadDuelPanel() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  // Очищаем root
  root.innerHTML = '';
  
  // Скрываем хедер и футер
  const header = document.querySelector('.header');
  const footer = document.querySelector('footer');
  if (header) header.style.display = 'none';
  if (footer) footer.style.display = 'none';
  
  // Создаём контейнер дуэлей
  const duelContainer = document.createElement('div');
  duelContainer.id = 'duelContainer';
  duelContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;';
  
  duelContainer.innerHTML = `
    <div class="duel-panel" style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      <button onclick="duelBackToMenu()" style="background:none;border:none;color:#ffcc44;font-size:0.9rem;font-weight:700;padding:6px 0;margin-bottom:12px;cursor:pointer;">${t.backBtn}</button>

      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:1.6rem;font-weight:900;background:linear-gradient(90deg,#ffcc44,#e8d9a0,#ffcc44);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;">⚔️ ${t.title}</div>
        <div style="font-size:0.78rem;color:#7799bb;margin-top:4px;">${t.subtitle}</div>
      </div>

      <div style="background:rgba(10,20,38,0.6);border:1px solid rgba(255,204,68,0.25);border-radius:18px;padding:16px;margin-bottom:20px;">
        <p style="font-size:0.85rem;color:#c8c8dc;line-height:1.5;">${t.desc}</p>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button onclick="duelCreate(100)" style="flex:1;padding:14px 8px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(255,204,68,0.35);border-radius:14px;color:#ffcc44;font-size:0.85rem;font-weight:800;cursor:pointer;">100 COGNIQ</button>
        <button onclick="duelCreate(500)" style="flex:1;padding:14px 8px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(255,204,68,0.55);border-radius:14px;color:#ffcc44;font-size:0.85rem;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(255,204,68,0.2);">500 COGNIQ</button>
        <button onclick="duelCreate(1000)" style="flex:1;padding:14px 8px;background:rgba(10,20,38,0.7);border:1.5px solid rgba(255,150,50,0.55);border-radius:14px;color:#ffaa44;font-size:0.85rem;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(255,150,50,0.25);">1000 COGNIQ</button>
      </div>

      <div id="duelWaitingBlock" style="display:none;"></div>
    </div>
  `;
  
  // Добавляем контейнер в body
  document.body.appendChild(duelContainer);
}


function duelBackToMenu() {
  // Останавливаем все интервалы
  if (duelPollInterval) { clearInterval(duelPollInterval); duelPollInterval = null; }
  if (duelTimerInterval) { clearInterval(duelTimerInterval); duelTimerInterval = null; }
  
  // Удаляем контейнер дуэлей
  const container = document.getElementById('duelContainer');
  if (container) container.remove();
  
  // Показываем хедер и футер
  const header = document.querySelector('.header');
  const footer = document.querySelector('footer');
  if (header) header.style.display = '';
  if (footer) footer.style.display = '';
  
  // Сбрасываем состояние
  duelId = null;
  duelData = null;
  duelQuestions = [];
  duelAnswered = false;
  duelWaitingForOpponent = false;
  
  // Возвращаемся в меню
  switchTab('game');
}


async function duelCreate(stake) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  try {
    const res = await authFetch(`${BASE_URL}/api/duel/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, stake })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || t.errCreate, 3000);
      return;
    }
    
    duelId = data.duelId;
    
    document.getElementById('duelWaitingBlock').innerHTML = `
      <div style="background:rgba(10,20,38,0.8);border:2px solid rgba(0,255,170,0.4);border-radius:18px;padding:20px;text-align:center;box-shadow:0 0 20px rgba(0,255,170,0.15);">
        <div style="font-size:0.95rem;font-weight:700;color:#00ffaa;margin-bottom:12px;">⏳ ${t.waiting}</div>
        <div style="font-size:0.75rem;color:#7799bb;margin-bottom:14px;">ID: ${data.duelId}</div>
        <button onclick="duelShareInvite('${data.inviteLink}', ${stake})" style="width:100%;padding:12px;background:rgba(0,255,170,0.1);border:1px solid rgba(0,255,170,0.4);border-radius:12px;color:#00ffaa;font-weight:700;font-size:0.88rem;cursor:pointer;margin-bottom:8px;">📤 ${t.shareInvite}</button>
        <button onclick="duelCopyLink('${data.inviteLink}', this)" style="width:100%;padding:12px;background:rgba(255,204,68,0.1);border:1px solid rgba(255,204,68,0.4);border-radius:12px;color:#ffcc44;font-weight:700;font-size:0.88rem;cursor:pointer;margin-bottom:8px;">🔗 ${t.copyLink}</button>
        <button onclick="duelCancel(${data.duelId})" style="width:100%;padding:12px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:12px;color:#ff6464;font-weight:700;font-size:0.88rem;cursor:pointer;">❌ ${t.cancelDuel}</button>
      </div>
    `;
    document.getElementById('duelWaitingBlock').style.display = 'block';
    
    // Запускаем поллинг
    duelStartPolling(data.duelId);
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}


function duelShareInvite(link, stake) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  const shareText = `⚔️ Вызов на дуэль в NEURON!\nСтавка: ${stake} COGNIQ\nПримешь вызов?`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;
  
  // Способ 1: Telegram WebApp API
  if (tg && typeof tg.openTelegramLink === 'function') {
    tg.openTelegramLink(shareUrl);
    return;
  }
  
  // Способ 2: tg.openLink
  if (tg && typeof tg.openLink === 'function') {
    tg.openLink(shareUrl);
    return;
  }
  
  // Способ 3: Fallback
  window.open(shareUrl, '_blank');
}


function duelCopyLink(link, btn) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  const showSuccess = () => {
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = t.copied;
      btn.style.color = '#00ffaa';
      setTimeout(() => { btn.innerHTML = originalText; btn.style.color = '#ffcc44'; }, 2000);
    } else {
      showToast(t.copied, 2000);
    }
  };
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(showSuccess).catch(() => {
      prompt('Copy:', link);
      showSuccess();
    });
  } else {
    prompt('Copy:', link);
    showSuccess();
  }
}


async function duelCancel(duelId) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  if (!confirm(t.cancelConfirm)) return;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/duel/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, duel_id: duelId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(t.duelCancelled, 2000);
      if (duelPollInterval) { clearInterval(duelPollInterval); duelPollInterval = null; }
      duelBackToMenu();
      loadWelcome();
    } else {
      showToast(data.message || t.errConnect, 3000);
    }
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}


function duelStartPolling(duelId) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  if (duelPollInterval) clearInterval(duelPollInterval);
  
  duelPollInterval = setInterval(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelId}`);
      const data = await res.json();
      
      if (!data.success) {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        return;
      }
      
      if (data.duel.status === 'cancelled') {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        showToast(t.duelCancelled, 2000);
        duelBackToMenu();
        return;
      }
      
      if (data.duel.status === 'active' && data.duel.player2) {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        duelStartBattle(duelId, data.duel);
      }
    } catch (e) {
      // Молча игнорируем ошибки поллинга
    }
  }, 2000);
}


function duelStartBattle(duelIdParam, duelDataParam) {
  // Сохраняем глобально
  duelId = duelIdParam;
  duelData = duelDataParam;
  duelQuestions = duelDataParam.questions || [];
  duelTotalRounds = duelQuestions.length || 10;
  duelCurrentRound = 1;
  duelTimeLeft = 15;
  duelAnswered = false;
  duelScores = { 
    score1: duelDataParam.score1 || 0, 
    score2: duelDataParam.score2 || 0 
  };
  
  // Удаляем лобби
  const container = document.getElementById('duelContainer');
  if (container) container.remove();
  
  // Показываем хедер для боя
  const header = document.querySelector('.header');
  const footer = document.querySelector('footer');
  if (header) header.style.display = '';
  if (footer) footer.style.display = '';
  
  // Запускаем экран боя
  duelRenderBattleScreen();
}


function duelRenderBattleScreen() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  const p1Name = duelData?.player1?.nick || 'Игрок 1';
  const p2Name = duelData?.player2?.nick || 'Игрок 2';
  
  root.innerHTML = `
    <div class="duel-battle" style="max-width:480px;width:100%;margin:0 auto;padding:16px;">
      <!-- СТОЛ С ИГРОКАМИ -->
      <div style="background:rgba(10,20,38,0.7);border:2px solid rgba(255,204,68,0.3);border-radius:20px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <!-- Игрок 1 -->
          <div style="text-align:center;flex:1;">
            <div style="width:60px;height:60px;border-radius:50%;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;">👤</div>
            <div style="font-size:0.8rem;font-weight:700;color:#00ffaa;">${escapeHtml(p1Name)}</div>
            <div style="font-size:1.4rem;font-weight:900;color:#fff;margin-top:4px;" id="duelScore1">${duelScores.score1}</div>
          </div>
          
          <!-- VS -->
          <div style="text-align:center;padding:0 12px;">
            <div style="font-size:1.2rem;font-weight:900;color:#ffcc44;">VS</div>
            <div style="font-size:0.7rem;color:#7799bb;margin-top:4px;">${t.roundLabel} <span id="duelRoundNum">${duelCurrentRound}</span>/${duelTotalRounds}</div>
          </div>
          
          <!-- Игрок 2 -->
          <div style="text-align:center;flex:1;">
            <div style="width:60px;height:60px;border-radius:50%;background:rgba(255,100,100,0.2);border:2px solid #ff6464;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;">👤</div>
            <div style="font-size:0.8rem;font-weight:700;color:#ff6464;">${escapeHtml(p2Name)}</div>
            <div style="font-size:1.4rem;font-weight:900;color:#fff;margin-top:4px;" id="duelScore2">${duelScores.score2}</div>
          </div>
        </div>
        
        <!-- ТАЙМЕР -->
        <div style="text-align:center;padding:10px;background:rgba(0,0,0,0.4);border-radius:12px;">
          <div style="font-size:0.75rem;color:#7799bb;margin-bottom:4px;">${t.timeToAnswer}</div>
          <div id="duelTimer" style="font-size:2rem;font-weight:900;color:#ffcc44;">15</div>
        </div>
      </div>
      
      <!-- ВОПРОС -->
      <div id="duelQuestionBlock" style="background:rgba(10,20,38,0.7);border:2px solid rgba(255,204,68,0.3);border-radius:16px;padding:16px;margin-bottom:16px;min-height:100px;display:flex;align-items:center;justify-content:center;">
        <div style="font-size:1.1rem;font-weight:600;color:#fff;text-align:center;">${t.waitingOpponent}</div>
      </div>
      
      <!-- ВАРИАНТЫ ОТВЕТОВ -->
      <div id="duelAnswersBlock" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
        <!-- Кнопки будут здесь -->
      </div>
      
      <!-- РЕЗУЛЬТАТ РАУНДА -->
      <div id="duelRoundResult" style="display:none;text-align:center;padding:12px;background:rgba(0,255,170,0.1);border:1px solid rgba(0,255,170,0.3);border-radius:12px;margin-bottom:16px;">
        <div style="font-size:1.1rem;font-weight:700;color:#00ffaa;"></div>
      </div>
    </div>
  `;
  
  // Загружаем первый вопрос
  duelLoadQuestion();
}


async function duelLoadQuestion() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  // Синхронизируем раунд с сервером
  try {
    const stateRes = await authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelId}`);
    const stateData = await stateRes.json();
    if (stateData.success) {
      const serverRound = stateData.duel.currentRound || 0;
      duelCurrentRound = serverRound + 1;
      
      if (stateData.duel.score1 !== undefined) {
        duelScores.score1 = stateData.duel.score1;
        const el1 = document.getElementById('duelScore1');
        if (el1) el1.textContent = stateData.duel.score1;
      }
      if (stateData.duel.score2 !== undefined) {
        duelScores.score2 = stateData.duel.score2;
        const el2 = document.getElementById('duelScore2');
        if (el2) el2.textContent = stateData.duel.score2;
      }
      
      if (stateData.duel.questions && stateData.duel.questions.length > 0) {
        duelQuestions = stateData.duel.questions;
      }
      
      if (stateData.duel.status === 'finished') {
        duelFinishBattle();
        return;
      }
    }
  } catch (e) {
    console.error('[DUEL] sync round error:', e);
  }
  
  // Обновляем отображение раунда
  const roundEl = document.getElementById('duelRoundNum');
  if (roundEl) roundEl.textContent = duelCurrentRound;
  
  // Сбрасываем таймер
  duelTimeLeft = 15;
  duelAnswered = false;
  
  const timerEl = document.getElementById('duelTimer');
  if (timerEl) timerEl.textContent = '15';
  
  // Получаем вопрос
  if (duelQuestions.length >= duelCurrentRound) {
    const question = duelQuestions[duelCurrentRound - 1];
    if (question) {
      duelRenderQuestion(question);
      duelStartTimer();
      return;
    }
  }
  
  // Если вопросов нет
  console.error('[DUEL] Question not found for round:', duelCurrentRound);
}


function duelRenderQuestion(question) {
  const questionEl = document.getElementById('duelQuestionBlock');
  const answersEl = document.getElementById('duelAnswersBlock');
  
  if (questionEl) {
    questionEl.innerHTML = `<div style="font-size:1.1rem;font-weight:600;color:#fff;text-align:center;">${escapeHtml(question.text)}</div>`;
  }
  
  if (answersEl) {
    answersEl.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    question.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:14px;background:rgba(0,0,0,0.5);border:2px solid rgba(255,204,68,0.3);border-radius:12px;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;';
      btn.innerHTML = `<div style="color:#ffcc44;font-size:0.75rem;margin-bottom:4px;">${letters[idx]}</div><div>${escapeHtml(opt)}</div>`;
      btn.onclick = () => duelHandleAnswer(idx);
      answersEl.appendChild(btn);
    });
  }
}


function duelStartTimer() {
  if (duelTimerInterval) clearInterval(duelTimerInterval);
  
  duelTimerInterval = setInterval(() => {
    duelTimeLeft--;
    const timerEl = document.getElementById('duelTimer');
    if (timerEl) {
      timerEl.textContent = duelTimeLeft;
      if (duelTimeLeft <= 5) timerEl.style.color = '#ff6464';
      if (duelTimeLeft <= 0) {
        clearInterval(duelTimerInterval);
        duelTimerInterval = null;
        if (!duelAnswered) {
          duelHandleAnswer(-1); // Таймаут
        }
      }
    }
  }, 1000);
}


async function duelHandleAnswer(answerIdx) {
  if (duelAnswered) return;
  duelAnswered = true;
  
  // Останавливаем таймер
  if (duelTimerInterval) {
    clearInterval(duelTimerInterval);
    duelTimerInterval = null;
  }
  
  const timeMs = (15 - duelTimeLeft) * 1000;
  
  // Показываем, что ответ отправлен
  const resultEl = document.getElementById('duelRoundResult');
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.querySelector('div').textContent = '⏳ Отправка ответа...';
  }
  
  // Отправляем на сервер
  try {
    const res = await authFetch(`${BASE_URL}/api/duel/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        duel_id: duelId,
        round: duelCurrentRound,
        answer_idx: answerIdx,
        time_ms: timeMs
      })
    });
    const data = await res.json();
    
    if (!data.success) {
      if (resultEl) {
        resultEl.querySelector('div').textContent = data.message || 'Ошибка';
        resultEl.style.background = 'rgba(255,100,100,0.1)';
        resultEl.style.borderColor = 'rgba(255,100,100,0.3)';
      }
      return;
    }
    
    // Подсвечиваем кнопки
    const buttons = document.querySelectorAll('#duelAnswersBlock button');
    if (data.correctIndex !== undefined && buttons[data.correctIndex]) {
      buttons[data.correctIndex].style.background = 'rgba(0,255,170,0.3)';
      buttons[data.correctIndex].style.borderColor = '#00ffaa';
    }
    if (answerIdx >= 0 && !data.isCorrect && buttons[answerIdx]) {
      buttons[answerIdx].style.background = 'rgba(255,100,100,0.3)';
      buttons[answerIdx].style.borderColor = '#ff6464';
    }
    if (answerIdx >= 0 && data.isCorrect && buttons[answerIdx]) {
      buttons[answerIdx].style.background = 'rgba(0,255,170,0.3)';
      buttons[answerIdx].style.borderColor = '#00ffaa';
    }
    
    // Обновляем счёт
    if (data.newScore1 !== undefined) {
      duelScores.score1 = data.newScore1;
      const el1 = document.getElementById('duelScore1');
      if (el1) el1.textContent = data.newScore1;
    }
    if (data.newScore2 !== undefined) {
      duelScores.score2 = data.newScore2;
      const el2 = document.getElementById('duelScore2');
      if (el2) el2.textContent = data.newScore2;
    }
    
    // Показываем результат
    const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
    const resultText = data.isCorrect 
      ? `✅ Правильно! +${data.points} очков` 
      : answerIdx === -1 
        ? '⏱️ Время вышло!' 
        : '❌ Неправильно';
    
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.querySelector('div').textContent = resultText;
      resultEl.style.background = data.isCorrect ? 'rgba(0,255,170,0.1)' : 'rgba(255,100,100,0.1)';
      resultEl.style.borderColor = data.isCorrect ? 'rgba(0,255,170,0.3)' : 'rgba(255,100,100,0.3)';
    }
    
    // Если оба ответили — ждём и переходим к следующему раунду
    if (data.bothAnswered) {
  if (data.duelFinished) {
    setTimeout(() => duelFinishBattle(), 2000);
  } else {
    setTimeout(() => {
      if (resultEl) resultEl.style.display = 'none';
      // Сервер обновил current_round = round, следующий = round + 1
      duelCurrentRound = round + 1;
      duelLoadQuestion();
    }, 2500);
  }
} else {
      // Ждём соперника
      if (resultEl) {
        resultEl.querySelector('div').textContent = resultText + ' — ' + t.waitingOpponent;
      }
      duelWaitForOpponent();
    }
    
  } catch (e) {
    console.error('[DUEL] answer error:', e);
    if (resultEl) {
      resultEl.querySelector('div').textContent = t.errConnect;
      resultEl.style.background = 'rgba(255,100,100,0.1)';
      resultEl.style.borderColor = 'rgba(255,100,100,0.3)';
    }
  }
}


function duelWaitForOpponent() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  if (duelPollInterval) clearInterval(duelPollInterval);
  
  let pollCount = 0;
  const maxPolls = 90; // 90 * 2 сек = 180 сек максимум
  
  duelPollInterval = setInterval(async () => {
    pollCount++;
    if (pollCount > maxPolls) {
      clearInterval(duelPollInterval);
      duelPollInterval = null;
      return;
    }
    
    try {
      const res = await authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelId}`);
      const data = await res.json();
      
      if (!data.success) return;
      
      // Серверный current_round — последний ЗАВЕРШЁННЫЙ раунд
      const serverRound = data.duel.currentRound || 0;
      
      // Если сервер сдвинулся вперёд — оба ответили
      if (serverRound >= duelCurrentRound) {
        clearInterval(duelPollInterval);
        duelPollInterval = null;
        
        // Обновляем счёт
        if (data.duel.score1 !== undefined) {
          duelScores.score1 = data.duel.score1;
          const el1 = document.getElementById('duelScore1');
          if (el1) el1.textContent = data.duel.score1;
        }
        if (data.duel.score2 !== undefined) {
          duelScores.score2 = data.duel.score2;
          const el2 = document.getElementById('duelScore2');
          if (el2) el2.textContent = data.duel.score2;
        }
        
        // Проверяем, окончена ли дуэль
        if (data.duel.status === 'finished') {
          setTimeout(() => duelFinishBattle(), 1000);
        } else {
          // Переходим к следующему раунду
          const resultEl = document.getElementById('duelRoundResult');
          if (resultEl) resultEl.style.display = 'none';
          setTimeout(() => {
            duelCurrentRound = serverRound + 1; // Синхронизируем с сервером
            duelLoadQuestion();
          }, 1500);
        }
      }
    } catch (e) {
      // Молча игнорируем
    }
  }, 2000);
}


function duelFinishBattle() {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  // Останавливаем все интервалы
  if (duelPollInterval) { clearInterval(duelPollInterval); duelPollInterval = null; }
  if (duelTimerInterval) { clearInterval(duelTimerInterval); duelTimerInterval = null; }
  
  // Получаем финальное состояние
  authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelId}`)
    .then(r => r.json())
    .then(data => {
      let resultText;
      let resultColor;
      
      if (data.success) {
        duelScores.score1 = data.duel.score1 || duelScores.score1;
        duelScores.score2 = data.duel.score2 || duelScores.score2;
        
        const myId = String(userId);
        const winnerId = data.duel.winnerId ? String(data.duel.winnerId) : null;
        
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
      } else {
        resultText = t.duelFinished;
        resultColor = '#ffcc44';
      }
      
      const p1Name = duelData?.player1?.nick || 'Игрок 1';
      const p2Name = duelData?.player2?.nick || 'Игрок 2';
      
      root.innerHTML = `
        <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
          <div style="font-size:1.8rem;font-weight:900;color:${resultColor};margin-bottom:12px;">${resultText}</div>
          <div style="font-size:1rem;color:#7799bb;margin-bottom:20px;">${t.duelFinished}</div>
          <div style="background:rgba(10,20,38,0.7);border:2px solid rgba(255,204,68,0.3);border-radius:16px;padding:20px;margin-bottom:20px;">
            <div style="font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:12px;">${t.roundLabel} ${duelTotalRounds}/${duelTotalRounds}</div>
            <div style="display:flex;justify-content:space-around;align-items:center;">
              <div>
                <div style="color:#00ffaa;font-size:0.9rem;">${escapeHtml(p1Name)}</div>
                <div style="font-size:2rem;font-weight:900;color:#fff;">${duelScores.score1}</div>
              </div>
              <div style="font-size:1.5rem;color:#7799bb;">VS</div>
              <div>
                <div style="color:#ff6464;font-size:0.9rem;">${escapeHtml(p2Name)}</div>
                <div style="font-size:2rem;font-weight:900;color:#fff;">${duelScores.score2}</div>
              </div>
            </div>
          </div>
          <button onclick="duelBackToMenu()" style="width:100%;padding:16px;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;border-radius:14px;color:#00ffaa;font-size:1rem;font-weight:700;cursor:pointer;">${t.returnToMenu}</button>
        </div>
      `;
    })
    .catch(() => {
      root.innerHTML = `
        <div style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
          <div style="font-size:1.8rem;font-weight:900;color:#ffcc44;margin-bottom:12px;">${t.duelFinished}</div>
          <button onclick="duelBackToMenu()" style="width:100%;padding:16px;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;border-radius:14px;color:#00ffaa;font-size:1rem;font-weight:700;cursor:pointer;">${t.returnToMenu}</button>
        </div>
      `;
    });
}


// ==================== ПРИНЯТИЕ ПРИГЛАШЕНИЯ ====================

function loadDuelJoinPanel(duelIdParam) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  const header = document.querySelector('.header');
  const footer = document.querySelector('footer');
  if (header) header.style.display = 'none';
  if (footer) footer.style.display = 'none';

  root.innerHTML = `
    <div class="duel-join-panel" style="max-width:480px;width:100%;margin:0 auto;padding:16px;text-align:center;">
      <div style="font-size:3rem;margin-bottom:16px;">⚔️</div>
      <div style="font-size:1.5rem;font-weight:900;color:#ffcc44;margin-bottom:8px;">${t.title}</div>
      <div style="color:#7799bb;margin-bottom:24px;">ID: ${duelIdParam}</div>
      
      <div id="duelJoinLoader" style="padding:20px;color:#ffcc44;">⏳ ...</div>
      
      <div id="duelJoinActions" style="display:none;flex-direction:column;gap:12px;">
        <div style="background:rgba(10,20,38,0.7);border:1px solid rgba(255,204,68,0.3);border-radius:12px;padding:16px;margin-bottom:16px;">
          <div style="color:#7799bb;font-size:0.8rem;">${t.subtitle}</div>
          <div style="color:#fff;font-size:1.5rem;font-weight:800;" id="joinStakeAmount">0 COGNIQ</div>
        </div>
        <button onclick="duelAcceptInvite(${duelIdParam})" style="width:100%;padding:16px;background:rgba(0,255,170,0.2);border:2px solid #00ffaa;border-radius:14px;color:#00ffaa;font-size:1rem;font-weight:700;cursor:pointer;">⚔️ ${t.title}</button>
        <button onclick="switchTab('game')" style="width:100%;padding:14px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:14px;color:#ff6464;font-size:0.9rem;font-weight:600;cursor:pointer;">${t.backBtn}</button>
      </div>
    </div>
  `;

  // Проверяем дуэль
  authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelIdParam}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('duelJoinLoader').style.display = 'none';
      if (data.success && data.duel.status === 'waiting') {
        document.getElementById('joinStakeAmount').textContent = data.duel.stake + ' COGNIQ';
        document.getElementById('duelJoinActions').style.display = 'flex';
      } else {
        document.getElementById('duelJoinLoader').style.display = 'block';
        document.getElementById('duelJoinLoader').textContent = t.opponentNotFound;
        document.getElementById('duelJoinLoader').style.color = '#ff6464';
      }
    })
    .catch(() => {
      document.getElementById('duelJoinLoader').style.display = 'block';
      document.getElementById('duelJoinLoader').textContent = t.errConnect;
      document.getElementById('duelJoinLoader').style.color = '#ff6464';
    });
}


async function duelAcceptInvite(duelIdParam) {
  const t = DUEL_LANG[currentLang] || DUEL_LANG.en;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/duel/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, duel_id: duelIdParam })
    });
    const data = await res.json();
    
    if (data.success) {
      // Получаем состояние и начинаем бой
      const stateRes = await authFetch(`${BASE_URL}/api/duel/state?user_id=${userId}&duel_id=${duelIdParam}`);
      const stateData = await stateRes.json();
      if (stateData.success) {
        duelStartBattle(duelIdParam, stateData.duel);
      }
    } else {
      showToast(data.message || t.errConnect, 3000);
    }
  } catch (e) {
    showToast(t.errConnect, 3000);
  }
}
