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
  const duelsBtnHtml = webpBtn('duelsBtn', 'main/btn_duel.webp', window.DUEL_LANG?.[currentLang]?.title || 'Duels');
  const chessBtnHtml = webpBtn('chessBtn', 'main/btn_duel.webp', '♟️ ' + (window.CHESS_LANG?.[currentLang]?.title || 'Chess'));
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
    if (data.correct) { 
  triggerCorrectEffect(); 
    if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 150]);
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } else { 
  triggerWrongEffect(); 
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
   }
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
    body: JSON.stringify({ user_id: userId, hint: hintType, lang: currentLang })
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
          .then(() => showToast(t.referralCopied || 'Скопировано!', 2000))
          .catch(() => showToast(t.referralCopied || 'Скопировано!', 2000));
      };
    }
    
    // 👇 ВОТ ЗДЕСЬ ИСПРАВЛЕНИЕ (используем надежный t.me/share/url)
    if (refShareBtn && data.referralLink) {
  refShareBtn.onclick = () => {
    const shareTexts = {
      ru: '🧠 NEURON — блокчейн-экосистема: викторина, биржа, банк, xStocks. Зарабатывай COGNIQ, торгуй без комиссий, участвуй в дуэлях. Присоединяйся!',
      en: ' NEURON — blockchain ecosystem: quiz, exchange, bank, xStocks. Earn COGNIQ, trade fee-free, join duels. Join now!',
      fr: '🧠 NEURON — écosystème blockchain : quiz, bourse, banque, xStocks. Gagnez des COGNIQ, tradez sans frais, participez aux duels. Rejoignez-nous !',
      es: '🧠 NEURON — ecosistema blockchain: quiz, exchange, banco, xStocks. Gana COGNIQ, opera sin comisiones, participa en duelos. ¡Únete!'
    };
    
    // 👇 Дефолтный язык теперь английский (en)
    const shareText = shareTexts[currentLang] || shareTexts.en;
    const shareLink = encodeURIComponent(data.referralLink);
    
    const url = `https://t.me/share/url?url=${shareLink}&text=${encodeURIComponent(shareText)}`;
    
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };
}
  } catch(e) { 
    console.error('loadReferralStats:', e.message); 
  }
}

