// ==================== TON CONNECT ====================
let tonConnectUI = null;

function initTonConnect() {
  if (tonConnectUI) return;
  try {
    if (typeof TON_CONNECT_UI === 'undefined') return;
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: window.location.origin + '/tonconnect-manifest.json' });
    tonConnectUI.onStatusChange(wallet => {
      if (currentTab === 'wallet') showWalletPanel();
      else if (document.querySelector('.welcome-card')) showWelcome(currentState.totalScore, currentState.gamesPlayed || 0);
    });
  } catch(e) { console.warn('TON Connect не загружен:', e); }
}

// ==================== МОДАЛКА TON PAY ====================
function openTonModal(context = 'super_game') {
  tonPaymentContext = context;
  const check = document.getElementById('tonModalCheck');
  const confirmBtn = document.getElementById('tonModalConfirmBtn');
  if (check) check.checked = false;
  if (confirmBtn) confirmBtn.disabled = true;
  document.getElementById('tonPayModal').classList.add('open');
}

function closeTonModal() { document.getElementById('tonPayModal').classList.remove('open'); }

// ==================== TON PAY USDT ====================
async function proceedTonPayment(context = 'super_game') {
  closeTonModal();

  if (!tonConnectUI || !tonConnectUI.connected) {
    showToast('Сначала подключи кошелёк Tonkeeper', 3000);
    return;
  }

  if (!userId) {
    showToast('Ошибка: не удалось определить ID пользователя', 3000);
    return;
  }

  if (typeof TonWeb === 'undefined') {
    showToast('TonWeb не загружен. Обнови страницу.', 3000);
    return;
  }

  const amountMap = {
    'super_game': '1000000',
    'pack_20':    '1000000',
    'sub_vip':    '3000000',
    'sub_premium':'8000000',
    'frame_frame_neon_pulse': '2000000',
    'impulse_small':  '1000000',
    'impulse_big':    '5000000',
  };
  const AMOUNT_NANO = amountMap[context] || '1000000';

  const JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
  const DESTINATION = 'UQBniD_M-MTeVqUbWshZrXdQcz0m8lPstG3mQg1AL5KKCGSv';
  const FORWARD_TON = '100000000';
  const comment = context + '_' + userId;

  try {
    showToast('Получаем адреса Jetton-кошельков...', 4000);

    const senderAddress = tonConnectUI.wallet?.account?.address;
    if (!senderAddress) {
      showToast('Адрес кошелька недоступен', 3000);
      return;
    }

    let senderFormatted;
    try {
      senderFormatted = new TonWeb.utils.Address(senderAddress).toString(true, true, false);
    } catch (e) {
      senderFormatted = senderAddress;
    }

    let senderJettonWalletRaw;
    try {
      const resp = await fetch(
        `https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(senderFormatted)}&jetton_address=${encodeURIComponent(JETTON_MASTER)}&limit=1`
      );
      const data = await resp.json();
      senderJettonWalletRaw = data?.jetton_wallets?.[0]?.address;
    } catch (e) {
      console.error('[TON] sender jetton wallet fetch error:', e);
    }

    if (!senderJettonWalletRaw) {
      showToast('USDT-кошелёк не найден. Убедись, что на балансе есть USDT TON.', 4000);
      return;
    }

    let senderJettonWallet;
    try {
      senderJettonWallet = new TonWeb.utils.Address(senderJettonWalletRaw).toString(true, true, false);
    } catch (e) {
      senderJettonWallet = senderJettonWalletRaw;
    }

    const forwardPayload = new TonWeb.boc.Cell();
    forwardPayload.bits.writeUint(0, 32);
    for (let i = 0; i < comment.length; i++) {
      forwardPayload.bits.writeUint(comment.charCodeAt(i), 8);
    }

    const body = new TonWeb.boc.Cell();
    body.bits.writeUint(0x0f8a7ea5, 32);
    body.bits.writeUint(0, 64);
    body.bits.writeCoins(new TonWeb.utils.BN(AMOUNT_NANO));
    body.bits.writeAddress(new TonWeb.utils.Address(DESTINATION));
    body.bits.writeAddress(new TonWeb.utils.Address(senderFormatted));
    body.bits.writeBit(0);
    body.bits.writeCoins(new TonWeb.utils.BN('1'));
    body.bits.writeBit(1);
    body.refs.push(forwardPayload);

    const bocBytes = await body.toBoc(false);
    const payloadBase64 = btoa(String.fromCharCode(...new Uint8Array(bocBytes)));

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: senderJettonWallet,
        amount: FORWARD_TON,
        payload: payloadBase64
      }]
    };

    showToast('Подтверди транзакцию в Tonkeeper...', 5000);
    await tonConnectUI.sendTransaction(transaction);

    const successMessages = {
      'super_game': t.paidToast || '✅ Оплата прошла!',
      'pack_20':    t.shopToastStarsPaid || '✅ Оплата прошла!',
      'sub_vip':    t.shopToastSubPaid || '✅ Оплата прошла!',
      'sub_premium':t.shopToastSubPaid || '✅ Оплата прошла!',
      'frame_frame_neon_pulse': t.frameToastBought || '✅ Рамка куплена!',
    };
    showToast(successMessages[context] || '✅ Отправлено!', 5000);

    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(poll);
        showToast('Платёж обрабатывается. Проверь позже в игре.', 4000);
        return;
      }
      try {
        const r = await authFetch(`${BASE_URL}/api/user`);
        const data = await r.json();

        const isSub = context.startsWith('sub_');
        const isPack = context.startsWith('pack_');
        const isFrame = context.startsWith('frame_');

        if (isSub && data.subscriptionType) {
          clearInterval(poll);
          showToast(t.shopToastSubPaid || '🔥 Подписка активирована!', 4000);
          setTimeout(() => loadWelcome(), 500);
        } else if (isPack && data.extraGames > (currentState.extraGames || 0)) {
          clearInterval(poll);
          currentState.extraGames = data.extraGames;
          showToast(t.shopToastStarsPaid || '🔥 Пакет игр зачислен!', 4000);
          setTimeout(() => loadWelcome(), 500);
        } else if (isFrame) {
          const frameKey = context.replace('frame_', '');
          try {
            const invRes = await authFetch(`${BASE_URL}/api/user/inventory`);
            const invData = await invRes.json();
            if ((invData.inventory || []).includes(frameKey)) {
              clearInterval(poll);
              showToast(t.frameToastBought, 4000);
              setTimeout(() => loadShopPanel(), 500);
            }
          } catch(e) {}
        } else if (!isSub && !isPack && data.superGamePending) {
          clearInterval(poll);
          currentState.superGamePending = true;
          showToast(t.paidToast || '🔥 Готово!', 4000);
          setTimeout(() => loadWelcome(), 500);
        }
      } catch (e) {}
    }, 3000);

  } catch (e) {
    if (e?.message?.includes('User rejects') || e?.message?.includes('Rejected') || e?.code === 300) {
      showToast(t.cancelledToast || 'Транзакция отменена', 2000);
    } else {
      console.error('[TON] Payment error:', e);
      showToast(t.failedToast || 'Ошибка транзакции', 4000);
    }
  }
}

// ==================== КОШЕЛЁК ====================
function showWalletPanel() {
  authFetch(`${BASE_URL}/api/user`).then(r => r.json()).then(data => {
    if (data.balance !== undefined) {
      currentState.totalScore = data.balance;
      currentState.gamesPlayed = data.gamesPlayed || 0;
      currentState.withdrawTickets = data.withdrawTickets || 0;
      updateScoresUI(data.balance);
      updateGamesLeftUI(data.freeGamesLeft);
    }
  }).catch(() => {});

  const MIN_WITHDRAW = 1000;
  const wallet = tonConnectUI ? tonConnectUI.wallet : null;
  const score = currentState.totalScore;
  const tickets = currentState.withdrawTickets || 0;
  const hasEnoughTokens = score >= MIN_WITHDRAW;
  const hasTickets = tickets >= 1;
  const canWithdraw = hasEnoughTokens && hasTickets;

  let withdrawHint = '';
  if (!hasTickets) withdrawHint = `<div class="wallet-withdraw-hint">${t.walletWithdrawHintNoSuper}</div>`;
  else if (!hasEnoughTokens) withdrawHint = `<div class="wallet-withdraw-hint">${t.walletWithdrawHintNoTokens(MIN_WITHDRAW - score)}</div>`;

  let walletAddrHtml = '';
  let walletActionBtn = '';
  let tonBalanceHtml = '';
  let usdtBalanceHtml = '';
  let depositBtn = '';

  if (wallet) {
    const addr = wallet.account.address;
    const shortAddr = `${addr.slice(0,6)}...${addr.slice(-4)}`;
    walletAddrHtml = `
      <div style="position:relative;margin-bottom:8px;">
  <img src="/wallet/wallet_connect_frame.webp" style="width:100%;display:block;opacity:0.65;">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:0 14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:0.78rem;color:#334466;">TON Кошелёк ✅</div>
        <div style="font-size:0.85rem;font-weight:700;color:#00ffff;word-break:break-all;" id="walletAddrDisplay">${shortAddr}</div>
      </div>
      <button id="copyWalletAddrBtn" style="background:rgba(0,255,255,0.08);border:1px solid rgba(0,255,255,0.25);border-radius:28px;padding:6px 13px;font-size:0.78rem;font-weight:700;color:#00ffff;cursor:pointer;">📋</button>
    </div>
    <button id="walletDisconnectBtn" style="margin-top:8px;background:rgba(200,40,40,0.15);border:1px solid rgba(255,80,80,0.35);border-radius:40px;padding:8px;font-size:0.8rem;font-weight:700;color:#ff8888;cursor:pointer;width:100%;">${t.walletBtnDisconnect}</button>
  </div>
</div>`;

    tonBalanceHtml = `
      <div style="position:relative;margin-bottom:8px;">
  <img src="/wallet/wallet_gram_frame.webp" style="width:100%;display:block;opacity:0.65;">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;gap:6px;">
    <span style="font-size:0.78rem;color:#334466;letter-spacing:1px;"></span>
    <span style="font-size:1.6rem;font-weight:900;color:#00ccff;" id="tonBalanceVal">⏳</span>
  </div>
</div>`;

    usdtBalanceHtml = `
      <div style="position:relative;margin-bottom:8px;">
  <img src="/wallet/wallet_usdt_frame.webp" style="width:100%;display:block;opacity:0.65;">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;gap:6px;">
    <span style="font-size:0.78rem;color:#334466;letter-spacing:1px;"></span>
    <span style="font-size:1.6rem;font-weight:900;color:#00ddaa;" id="usdtBalanceVal">⏳</span>
  </div>
</div>`;

    depositBtn = `
  <div style="display:flex;gap:8px;margin-bottom:8px;">
  <button id="walletDepositBtn" style="position:relative;background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="/wallet/wallet_deposit_frame.webp" style="width:100%;display:block;opacity:0.65;">
    <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:700;font-size:0.85rem;color:#00ffaa;">${t.walletDepositBtn}</span>
  </button>
  <button id="walletSendBtn" style="position:relative;background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="/wallet/wallet_send_frame.webp" style="width:100%;display:block;opacity:0.65;">
    <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:700;font-size:0.85rem;color:#00ffaa;">${t.walletSendBtn}</span>
  </button>
</div>`;

    walletActionBtn = canWithdraw
  ? `<button class="wallet-btn-big wallet-btn-withdraw" id="walletWithdrawBtn" style="position:relative;background:url('/wallet/btn_wallet_withdraw.webp') center/100% 100% no-repeat;border:none;padding:13px 22px;font-size:0.97rem;font-weight:800;color:white;cursor:pointer;width:100%;margin-bottom:8px;">${t.walletWithdrawBtn(score)}</button>`
  : `<button class="wallet-btn-big wallet-btn-withdraw wallet-btn-withdraw-disabled" disabled style="position:relative;background:url('/wallet/btn_wallet_withdraw.webp') center/100% 100% no-repeat;border:none;padding:13px 22px;font-size:0.97rem;font-weight:800;color:white;cursor:not-allowed;width:100%;margin-bottom:8px;opacity:0.5;">${t.walletWithdrawBtn(score)}</button>`;
  } else {
    walletAddrHtml = `<button class="wallet-btn-big wallet-btn-connect" id="walletConnectBtn">${t.walletBtnConnect}</button>`;
    walletActionBtn = `<button class="wallet-btn-big wallet-btn-withdraw wallet-btn-withdraw-disabled" disabled style="position:relative;background:url('/wallet/btn_wallet_withdraw.webp') center/100% 100% no-repeat;border:none;padding:13px 22px;font-size:0.97rem;font-weight:800;color:white;cursor:not-allowed;width:100%;margin-bottom:8px;opacity:0.5;">${t.walletWithdrawBtn(score)}</button>`;
    depositBtn = `
  <div style="display:flex;gap:8px;margin-bottom:8px;">
    <button class="wallet-btn-big" disabled
      style="background:rgba(255,255,255,0.05);color:#445566;cursor:not-allowed;margin-bottom:0;border-radius:60px;padding:13px 22px;font-size:0.97rem;font-weight:800;border:none;flex:1;">
      ${t.walletDepositBtn} (${t.walletNotConnected})
    </button>
    <button class="wallet-btn-big" disabled
      style="background:rgba(255,255,255,0.05);color:#445566;cursor:not-allowed;margin-bottom:0;border-radius:60px;padding:13px 22px;font-size:0.97rem;font-weight:800;border:none;flex:1;">
      ${t.walletSendBtn} (${t.walletNotConnected})
    </button>
  </div>`;
  }

  const txHtml = `
  <div class="wallet-info-card" id="walletTxList">
    <div style="padding:12px 0;text-align:center;color:#334466;font-size:0.85rem;">${t.walletProcessing}</div>
  </div>`;

  root.innerHTML = `
  <div class="wallet-panel">
    <div style="position:relative;margin-bottom:8px;">
  <img src="/wallet/wallet_balance_frame.webp" style="width:100%;display:block;opacity:0.65;">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <div style="font-size:2.6rem;font-weight:900;background:linear-gradient(135deg,#00ffff,#aa66ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${score.toLocaleString()}</div>
    <div style="font-size:0.82rem;color:#334466;margin-top:4px;">${t.walletBalanceLabel}</div>
  </div>
</div>
    ${tonBalanceHtml}
    ${usdtBalanceHtml}
    ${walletAddrHtml}
    ${depositBtn}
    ${withdrawHint}
    ${walletActionBtn}
    <button onclick="document.getElementById('dynamicContent').innerHTML = ''; switchTab('bank')" style="position:relative;background:none;border:none;padding:0;cursor:pointer;width:100%;margin-top:8px;">
      <img src="/wallet/wallet_to_bank_frame.webp" style="width:100%;display:block;opacity:0.65;">
      <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:700;font-size:0.9rem;color:#00ffaa;">${t.walletToBank}</span>
    </button>
    <div class="wallet-section-title" style="margin-top:16px;">${t.walletLastOps}</div>
    ${txHtml}
    <div class="wallet-section-title" id="onchain-title" style="margin-top:16px;">${t.onchainHistory || 'История TON / USDT'}</div>
    <div id="onchain-history"></div>
  </div>`;

  const connectBtn = document.getElementById('walletConnectBtn');
  if (connectBtn) connectBtn.onclick = async () => {
    if (!tonConnectUI) { initTonConnect(); await new Promise(r => setTimeout(r, 500)); }
    if (tonConnectUI) tonConnectUI.openModal();
    else showToast('Подождите, кошелёк загружается...', 3000);
  };

  const disconnectBtn = document.getElementById('walletDisconnectBtn');
  if (disconnectBtn) disconnectBtn.onclick = () => {
    if (confirm(t.walletDisconnectConfirm)) tonConnectUI.disconnect();
  };

  const withdrawBtn = document.getElementById('walletWithdrawBtn');
  if (withdrawBtn) {
    withdrawBtn.onclick = async () => {
      if (!canWithdraw) return;
      withdrawBtn.disabled = true;
      withdrawBtn.textContent = t.walletProcessing;
      try {
        const res = await authFetch(`${BASE_URL}/api/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, amount: score, wallet: wallet?.account?.address })
        });
        const data = await res.json();
        if (data.success) {
          showToast(t.walletWithdrawAccepted, 5000);
          if (data.newBalance !== undefined) { currentState.totalScore = data.newBalance; updateScoresUI(data.newBalance); }
          currentState.withdrawTickets = Math.max(0, currentState.withdrawTickets - 1);
          showWalletPanel();
        } else {
          showToast(`⚠️ ${data.message || t.errConn}`, 4000);
          withdrawBtn.disabled = false;
          withdrawBtn.textContent = t.walletWithdrawBtn(score);
        }
      } catch(e) {
        showToast(t.errConn, 3000);
        withdrawBtn.disabled = false;
        withdrawBtn.textContent = t.walletWithdrawBtn(score);
      }
    };
  }

  const depositBtnEl = document.getElementById('walletDepositBtn');
  if (depositBtnEl) depositBtnEl.onclick = () => openDepositModal(wallet?.account?.address);

  const sendBtnEl = document.getElementById('walletSendBtn');
  if (sendBtnEl) sendBtnEl.onclick = () => openSendModal();

  if (wallet) {
    setTimeout(() => loadWalletBalances(), 100);
  }

  authFetch(`${BASE_URL}/api/transactions?limit=5`)
    .then(r => r.json()).then(data => {
      const el = document.getElementById('walletTxList');
      if (!el) return;
      const txs = (data.transactions || data || []).filter(tx => tx.type === 'withdraw').slice(0, 5);
      if (!txs.length) {
        el.innerHTML = `<div style="padding:12px 0;text-align:center;color:#334466;font-size:0.85rem;">${t.walletLastOps} —</div>`;
        return;
      }
      el.innerHTML = txs.slice(0, 5).map(tx => {
        const isIn = tx.direction === 'in';
        const sign = isIn ? '+' : '-';
        const color = isIn ? '#00ffaa' : '#ff8888';
        const label = (typeof getTxLabel === 'function') ? getTxLabel(tx) : (tx.type || 'Операция');
        const date = tx.created_at ? formatTxDate(tx.created_at) : '';
        return `<div class="wallet-info-row">
          <span class="wallet-info-label">${escapeHtml(label)}</span>
          <span style="color:${color};font-weight:700;font-size:0.88rem;">${sign}${tx.amount} COGNIQ <span style="color:#334466;font-weight:400;font-size:0.75rem;">${date}</span></span>
        </div>`;
      }).join('');
    }).catch(() => {
      const el = document.getElementById('walletTxList');
      if (el) el.innerHTML = `<div style="padding:12px 0;text-align:center;color:#334466;font-size:0.85rem;">—</div>`;
    });

  if (window._walletRefresh) clearInterval(window._walletRefresh);
  window._walletRefresh = setInterval(() => {
    authFetch(`${BASE_URL}/api/user`).then(r => r.json()).then(data => {
      if (data.balance !== undefined) {
        currentState.totalScore = data.balance;
        currentState.withdrawTickets = data.withdrawTickets || 0;
        const balEl = document.querySelector('.wallet-balance-amount');
        if (balEl) balEl.textContent = data.balance.toLocaleString();
      }
    }).catch(() => {});
  }, 15000);
}

// ==================== ДЕПОЗИТ ====================
function openDepositModal(walletAddr) {
  const existing = document.getElementById('depositModal');
  if (existing) existing.remove();

  const addr = walletAddr || '';

  const modal = document.createElement('div');
  modal.id = 'depositModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:2000;
    display:flex;align-items:flex-end;justify-content:center;
    backdrop-filter:blur(8px);
  `;
  modal.innerHTML = `
    <div style="background:rgba(6,12,28,0.99);border:1px solid rgba(0,255,255,0.25);border-radius:28px 28px 0 0;
      padding:24px 20px 40px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;animation:fadeInUp 0.3s ease;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <span style="font-size:1.1rem;font-weight:800;color:#00ffff;">${t.walletDepositTitle}</span>
        <button id="depositCloseBtn" style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:32px;height:32px;color:#88aacc;font-size:1.1rem;cursor:pointer;">✕</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <button id="depTabTon" onclick="switchDepTab('ton')"
          style="flex:1;padding:10px;border-radius:30px;font-size:0.9rem;font-weight:700;cursor:pointer;
          background:linear-gradient(135deg,rgba(0,200,255,0.18),rgba(122,46,255,0.18));
          border:1px solid #00ccff;color:#00ffff;">
          ${t.walletDepositTonTab}
        </button>
        <button id="depTabUsdt" onclick="switchDepTab('usdt')"
          style="flex:1;padding:10px;border-radius:30px;font-size:0.9rem;font-weight:700;cursor:pointer;
          background:rgba(15,25,45,0.6);border:1px solid rgba(0,255,255,0.15);color:#5577aa;">
          ${t.walletDepositUsdtTab}
        </button>
      </div>
      <div id="depTabContent"></div>
    </div>`;

  document.body.appendChild(modal);
  document.getElementById('depositCloseBtn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  window._depWalletAddr = addr;
  switchDepTab('ton');
}

function switchDepTab(tab) {
  const addr = window._depWalletAddr || '';
  const tonActive = tab === 'ton';

  const tonTab = document.getElementById('depTabTon');
  const usdtTab = document.getElementById('depTabUsdt');
  if (tonTab) {
    tonTab.style.background = tonActive ? 'linear-gradient(135deg,rgba(0,200,255,0.18),rgba(122,46,255,0.18))' : 'rgba(15,25,45,0.6)';
    tonTab.style.borderColor = tonActive ? '#00ccff' : 'rgba(0,255,255,0.15)';
    tonTab.style.color = tonActive ? '#00ffff' : '#5577aa';
  }
  if (usdtTab) {
    usdtTab.style.background = !tonActive ? 'linear-gradient(135deg,rgba(0,200,130,0.18),rgba(0,100,80,0.18))' : 'rgba(15,25,45,0.6)';
    usdtTab.style.borderColor = !tonActive ? '#00ddaa' : 'rgba(0,255,255,0.15)';
    usdtTab.style.color = !tonActive ? '#00ddaa' : '#5577aa';
  }

  const color = tonActive ? '#00ccff' : '#00ddaa';
  const note = tonActive ? t.walletDepositHint : t.walletDepositUsdtHint;

  const content = document.getElementById('depTabContent');
  if (!content) return;

  content.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:0.85rem;color:#334466;margin-bottom:16px;">${note}</div>
      <div id="qrContainer_${tab}" style="display:flex;justify-content:center;margin-bottom:16px;">
        <div style="background:white;padding:12px;border-radius:16px;display:inline-block;"></div>
      </div>
      <div style="background:rgba(0,0,0,0.35);border:1px solid rgba(0,255,255,0.15);border-radius:14px;
        padding:10px 14px;font-size:0.78rem;color:${color};word-break:break-all;margin-bottom:12px;text-align:left;">
        ${escapeHtml(addr || t.walletNotConnected)}
      </div>
      <button id="depCopyAddrBtn"
        style="background:linear-gradient(135deg,#00ccff,#7a2eff);border:none;border-radius:40px;
        padding:12px 24px;font-size:0.9rem;font-weight:700;color:white;cursor:pointer;width:100%;">
        📋 Скопировать адрес
      </button>
    </div>`;

  document.getElementById('depCopyAddrBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(addr).then(() => showToast('✅ ' + t.walletCopyAddr, 2000));
  });

  if (addr) {
    const qrWrap = content.querySelector(`#qrContainer_${tab} div`);
    if (qrWrap && typeof QRCode !== 'undefined') {
      try {
        new QRCode(qrWrap, {
          text: addr,
          width: 180,
          height: 180,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch(e) {}
    }
  }
}

// ==================== БАЛАНСЫ ====================
async function loadWalletBalances() {
  let wallet = tonConnectUI.wallet;
  if (!wallet) {
    await new Promise(resolve => {
      const unsub = tonConnectUI.onStatusChange(w => {
        if (w) { unsub(); resolve(); }
      });
      setTimeout(() => { unsub(); resolve(); }, 3000);
    });
    wallet = tonConnectUI.wallet;
  }

  if (!wallet) return;

  const addr = wallet.account.address;

  let addrNonBounceable = addr;
  let addrBounceable = addr;

  if (typeof TonWeb !== 'undefined') {
    try { addrNonBounceable = new TonWeb.utils.Address(addr).toString(true, false, false); } catch(e) {}
    try { addrBounceable = new TonWeb.utils.Address(addr).toString(true, true, false); } catch(e) {}
  }

  loadOnchainHistory(addrNonBounceable);

  const copyAddrBtn = document.getElementById('copyWalletAddrBtn');
  if (copyAddrBtn) copyAddrBtn.onclick = () => {
    navigator.clipboard.writeText(addr).then(() => showToast('✅ ' + t.walletCopyAddr, 2000));
  };

  fetch(`/api/ton-balance?address=${encodeURIComponent(addrNonBounceable)}`)
    .then(r => r.json()).then(data => {
      const el = document.getElementById('tonBalanceVal');
      if (!el) return;
      const raw = data?.result ?? '0';
      const nano = parseInt(String(raw), 10);
      const ton = isNaN(nano) ? '0.00' : (nano / 1e9).toFixed(2);
      el.textContent = `${ton} TON`;
    }).catch(() => {
      const el = document.getElementById('tonBalanceVal');
      if (el) el.textContent = '—';
    });

  const JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
  fetch(`/api/usdt-balance?address=${encodeURIComponent(addrBounceable)}`)
    .then(r => r.json()).then(data => {
      const el = document.getElementById('usdtBalanceVal');
      if (!el) return;
      const raw = data?.jetton_wallets?.[0]?.balance ?? '0';
      const balance = parseInt(String(raw), 10);
      const usdt = isNaN(balance) ? '0.00' : (balance / 1e6).toFixed(2);
      el.textContent = `${usdt} USDT`;
    }).catch(() => {
      const el = document.getElementById('usdtBalanceVal');
      if (el) el.textContent = '—';
    });
}

// ==================== ОТПРАВКА ====================
function openSendModal() {
  if (!tonConnectUI || !tonConnectUI.wallet) {
    showToast(t.walletSendNoWallet, 3000);
    return;
  }

  const existing = document.getElementById('sendModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'sendModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:2000;
    display:flex;align-items:flex-end;justify-content:center;
    backdrop-filter:blur(8px);
  `;
  modal.innerHTML = `
    <div style="background:rgba(6,12,28,0.99);border:1px solid rgba(255,150,0,0.3);border-radius:28px 28px 0 0;
      padding:24px 20px 40px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;animation:fadeInUp 0.3s ease;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <span style="font-size:1.1rem;font-weight:800;color:#ffaa44;">${t.walletSendTitle}</span>
        <button id="sendCloseBtn" style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:32px;height:32px;color:#88aacc;font-size:1.1rem;cursor:pointer;">✕</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <button id="sendTabTon" onclick="switchSendTab('ton')"
          style="flex:1;padding:10px;border-radius:30px;font-size:0.9rem;font-weight:700;cursor:pointer;
          background:linear-gradient(135deg,rgba(0,200,255,0.18),rgba(122,46,255,0.18));
          border:1px solid #00ccff;color:#00ffff;">
          ${t.walletSendTonTab}
        </button>
        <button id="sendTabUsdt" onclick="switchSendTab('usdt')"
          style="flex:1;padding:10px;border-radius:30px;font-size:0.9rem;font-weight:700;cursor:pointer;
          background:rgba(15,25,45,0.6);border:1px solid rgba(0,255,255,0.15);color:#5577aa;">
          ${t.walletSendUsdtTab}
        </button>
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-size:0.78rem;color:#334466;margin-bottom:6px;">${t.walletSendAddress}</div>
        <input id="sendAddress" placeholder="${t.walletSendAddressPlaceholder}"
          style="width:100%;background:rgba(0,0,0,0.35);border:1px solid rgba(0,255,255,0.2);
          border-radius:14px;padding:12px 14px;font-size:0.88rem;color:#e0f0ff;outline:none;">
      </div>
      <div style="margin-bottom:20px;">
        <div style="font-size:0.78rem;color:#334466;margin-bottom:6px;">${t.walletSendAmount}</div>
        <input id="sendAmount" type="number" min="0" placeholder="${t.walletSendAmountPlaceholder}"
          style="width:100%;background:rgba(0,0,0,0.35);border:1px solid rgba(0,255,255,0.2);
          border-radius:14px;padding:12px 14px;font-size:0.88rem;color:#e0f0ff;outline:none;">
      </div>
      <button id="sendConfirmBtn"
        style="width:100%;background:linear-gradient(135deg,#ff6600,#ffaa00);border:none;border-radius:40px;
        padding:14px;font-size:1rem;font-weight:800;color:white;cursor:pointer;
        box-shadow:0 4px 14px rgba(255,100,0,0.3);">
        ${t.walletSendConfirm}
      </button>
    </div>`;

  document.body.appendChild(modal);
  document.getElementById('sendCloseBtn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  window._sendCurrentTab = 'ton';
  document.getElementById('sendConfirmBtn').addEventListener('click', () => executeSend());
}

function switchSendTab(tab) {
  window._sendCurrentTab = tab;
  const tonTab = document.getElementById('sendTabTon');
  const usdtTab = document.getElementById('sendTabUsdt');
  if (tonTab) {
    tonTab.style.background = tab === 'ton' ? 'linear-gradient(135deg,rgba(0,200,255,0.18),rgba(122,46,255,0.18))' : 'rgba(15,25,45,0.6)';
    tonTab.style.borderColor = tab === 'ton' ? '#00ccff' : 'rgba(0,255,255,0.15)';
    tonTab.style.color = tab === 'ton' ? '#00ffff' : '#5577aa';
  }
  if (usdtTab) {
    usdtTab.style.background = tab === 'usdt' ? 'linear-gradient(135deg,rgba(0,200,130,0.18),rgba(0,100,80,0.18))' : 'rgba(15,25,45,0.6)';
    usdtTab.style.borderColor = tab === 'usdt' ? '#00ddaa' : 'rgba(0,255,255,0.15)';
    usdtTab.style.color = tab === 'usdt' ? '#00ddaa' : '#5577aa';
  }
}

async function executeSend() {
  const toAddress = document.getElementById('sendAddress')?.value?.trim();
  const amountRaw = document.getElementById('sendAmount')?.value?.trim();
  const tab = window._sendCurrentTab || 'ton';

  if (!toAddress || toAddress.length < 20) { showToast(t.walletSendInvalidAddr, 3000); return; }
  const amount = parseFloat(amountRaw);
  if (!amount || amount <= 0) { showToast(t.walletSendInvalidAmount, 3000); return; }
  if (!tonConnectUI || !tonConnectUI.wallet) { showToast(t.walletSendNoWallet, 3000); return; }

  const confirmBtn = document.getElementById('sendConfirmBtn');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '⏳ ...'; }

  try {
    if (tab === 'ton') {
      const nanoAmount = Math.floor(amount * 1e9).toString();
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: toAddress, amount: nanoAmount }]
      };
      await tonConnectUI.sendTransaction(transaction);
    } else {
      if (typeof TonWeb === 'undefined') { showToast('TonWeb не загружен', 3000); return; }
      const JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
      const nanoAmount = Math.floor(amount * 1e6).toString();
      const senderAddress = tonConnectUI.wallet.account.address;

      let senderFormatted;
      try { senderFormatted = new TonWeb.utils.Address(senderAddress).toString(true, true, false); } catch(e) { senderFormatted = senderAddress; }

      const resp = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(senderFormatted)}&jetton_address=${encodeURIComponent(JETTON_MASTER)}&limit=1`);
      const data = await resp.json();
      const senderJettonWalletRaw = data?.jetton_wallets?.[0]?.address;
      if (!senderJettonWalletRaw) { showToast('USDT-кошелёк не найден', 3000); return; }

      let senderJettonWallet;
      try { senderJettonWallet = new TonWeb.utils.Address(senderJettonWalletRaw).toString(true, true, false); } catch(e) { senderJettonWallet = senderJettonWalletRaw; }

      const body = new TonWeb.boc.Cell();
      body.bits.writeUint(0x0f8a7ea5, 32);
      body.bits.writeUint(0, 64);
      body.bits.writeCoins(new TonWeb.utils.BN(nanoAmount));
      body.bits.writeAddress(new TonWeb.utils.Address(toAddress));
      body.bits.writeAddress(new TonWeb.utils.Address(senderFormatted));
      body.bits.writeBit(0);
      body.bits.writeCoins(new TonWeb.utils.BN('1'));
      body.bits.writeBit(0);

      const bocBytes = await body.toBoc(false);
      const payloadBase64 = btoa(String.fromCharCode(...new Uint8Array(bocBytes)));

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: senderJettonWallet, amount: '100000000', payload: payloadBase64 }]
      };
      await tonConnectUI.sendTransaction(transaction);
    }

    showToast(t.walletSendSuccess, 4000);
    document.getElementById('sendModal')?.remove();
  } catch(e) {
    if (e?.message?.includes('User rejects') || e?.message?.includes('Rejected') || e?.code === 300) {
      showToast(t.walletSendCancelled, 2000);
    } else {
      showToast(t.failedToast || '⚠️ Ошибка транзакции', 3000);
    }
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = t.walletSendConfirm; }
  }
}

// ==================== ИСТОРИЯ ONCHAIN ====================
async function loadOnchainHistory(walletAddress) {
  const container = document.getElementById('onchain-history');
  if (!walletAddress) {
    container.innerHTML = `<p class="wallet-empty">${t.walletConnectFirst || 'Подключи TON кошелёк'}</p>`;
    return;
  }
  try {
    const [tonRes, usdtRes] = await Promise.all([
      fetch(`https://toncenter.com/api/v3/transactions?account=${walletAddress}&limit=10`).then(r => r.json()),
      fetch(`https://toncenter.com/api/v3/jetton/transfers?owner_address=${walletAddress}&jetton_address=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&limit=10`).then(r => r.json())
    ]);

    const tonTxs = (tonRes.transactions || []).map(tx => ({
      date: new Date(tx.utime * 1000).toLocaleDateString(currentLang),
      type: 'TON',
      amount: (parseInt(String(tx.in_msg?.value || '0'), 10) / 1e9).toFixed(2),
      dir: tx.in_msg?.source ? 'in' : 'out'
    }));

    const usdtTxs = (usdtRes.jetton_transfers || []).map(tx => ({
      date: new Date(tx.utime * 1000).toLocaleDateString(currentLang),
      type: 'USDT',
      amount: (parseInt(String(tx.amount || '0'), 10) / 1e6).toFixed(2),
      dir: tx.direction
    }));

    const all = [...tonTxs, ...usdtTxs].slice(0, 10);

    if (!all.length) {
      container.innerHTML = `<p class="wallet-empty">${t.noOnchainTx || 'Транзакций пока нет'}</p>`;
      return;
    }

    container.innerHTML = all.map(tx => `
      <div class="tx-item">
        <span class="tx-type">${tx.type}</span>
        <span class="tx-dir ${tx.dir === 'in' ? 'tx-in' : 'tx-out'}">${tx.dir === 'in' ? '↓' : '↑'} ${tx.amount}</span>
        <span class="tx-date">${tx.date}</span>
      </div>
    `).join('');
  } catch(e) {
    container.innerHTML = `<p class="wallet-empty">${t.loadError || 'Ошибка загрузки'}</p>`;
  }
}

function formatTxDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' });
  } catch(e) { return ''; }
}

function getTxLabel(tx) {
  const labels = {
    deposit:           { ru:'Пополнение', en:'Deposit', fr:'Dépôt', es:'Depósito' },
    transfer_sent:     { ru:'Перевод отправлен', en:'Transfer sent', fr:'Transfert envoyé', es:'Transferencia enviada' },
    transfer_received: { ru:'Перевод получен', en:'Transfer received', fr:'Transfert reçu', es:'Transferencia recibida' },
    withdraw:          { ru:'Вывод COGNIQ', en:'COGNIQ withdrawal', fr:'Retrait COGNIQ', es:'Retiro COGNIQ' },
  };
  const entry = labels[tx.type];
  if (entry) return entry[currentLang] || entry.en;
  return tx.type || (currentLang === 'ru' ? 'Операция' : currentLang === 'fr' ? 'Opération' : currentLang === 'es' ? 'Operación' : 'Transaction');
}
