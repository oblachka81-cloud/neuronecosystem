// ==================== БАНК ====================
function loadBankPanel() {
  const dynamicContent = document.getElementById('dynamicContent');
  if (!dynamicContent) return;
  dynamicContent.innerHTML = '';
  
  const old = document.getElementById('bankContainer');
  if (old) old.remove();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const bankBtn = document.getElementById('tabBank');
  if (bankBtn) bankBtn.classList.add('active');
  
  const bankT = {
    ru: { balanceLabel: 'Доступно COGNIQ', newDeposit: 'Новый депозит', amountPlaceholder: 'Сумма COGNIQ', depositInfo: (a,p,d) => a>0 ? `Вы получите: ${a+Math.floor(a*p/100)} COGNIQ (через ${d} дн)` : `Ставка: ${p}% на ${d} дней`, depositBtn: 'Застейкать', activeStakes: 'Активные депозиты', noStakes: 'Нет активных депозитов', until: 'До', claimBtn: t => `Забрать ${t} COGNIQ`, toastAmount: b => `Сумма от 100 до ${b} COGNIQ`, toastCreated: '✅ Депозит создан!', toastClaimed: a => `✅ Получено ${a} COGNIQ!`, toastError: 'Ошибка', termDays: 'дн', prevPage: '← Назад', nextPage: 'Вперёд →', exchangeTitle: '💱 Обменник', sellSoon: 'Скоро', exToast: 'Сумма: 1-100 USDT', exBtn: 'Купить', exPlaceholder: 'Сумма USDT', exRate: '1 USDT = 2000 COGNIQ', exGift: '🎁 +1 супер-игра x15 за каждый $1 · тикет на вывод 1000', exPool: '🔒 75% с покупки — в пул ликвидности', exCalc: (n,g) => `Получите: ${n} COGNIQ + ${g} 🎁`, exCalcEmpty: 'Получите: — COGNIQ', sellTitle: '💸 Продать COGNIQ', transferTitle: '💸 Перевод игроку', transferTo: 'Никнейм или Telegram ID', transferAmount: 'Сумма COGNIQ', transferCalc: 'Комиссия 1% · Минимум 100 COGNIQ', transferCalcDynamic: (c, r) => `Комиссия: ${c} COGNIQ · Получит: ${r} COGNIQ`, transferBtn: 'Отправить', transferToastOk: n => `✅ Отправлено ${n} COGNIQ!`, transferToastNoUser: 'Введи никнейм получателя', transferToastMin: 'Минимум 100 COGNIQ', transferToastErr: 'Ошибка перевода', transferToastConn: 'Ошибка соединения', impulseExchangeTitle: ' COGNIQ → IMPULSE', impulseRate: '1 COGNIQ = 5 IMPULSE', impulseBalance: n => `Баланс IMPULSE: ${n}`, impulseCalc: n => `Получите: ${n} IMPULSE`, impulseCalcEmpty: 'Получите: — IMPULSE', impulseToastOk: n => `+${n} IMPULSE!`, impulseToastAmount: '10-1000 COGNIQ', impulseToastNoFunds: 'Недостаточно COGNIQ', toastOpenTelegram: 'Открой через Telegram' },
    en: { balanceLabel: 'Available COGNIQ', newDeposit: 'New Deposit', amountPlaceholder: 'COGNIQ Amount', depositInfo: (a,p,d) => a>0 ? `You get: ${a+Math.floor(a*p/100)} COGNIQ (in ${d} days)` : `Rate: ${p}% for ${d} days`, depositBtn: 'Stake', activeStakes: 'Active Deposits', noStakes: 'No active deposits', until: 'Until', claimBtn: t => `Claim ${t} COGNIQ`, toastAmount: b => `Amount: 100 to ${b} COGNIQ`, toastCreated: '✅ Deposit created!', toastClaimed: a => `✅ Claimed ${a} COGNIQ!`, toastError: 'Error', termDays: 'days', prevPage: '← Prev', nextPage: 'Next →', exchangeTitle: '💱 Exchange', sellSoon: 'Coming Soon', exToast: 'Amount: 1-100 USDT', exBtn: 'Buy', exPlaceholder: 'USDT amount', exRate: '1 USDT = 2000 COGNIQ', exGift: '🎁 +1 Super Game x15 per $1 · ticket to withdraw 1000', exPool: '🔒 75% of purchase → liquidity pool', exCalc: (n,g) => `You get: ${n} COGNIQ + ${g} 🎁`, exCalcEmpty: 'You get: — COGNIQ', sellTitle: ' Sell COGNIQ', transferTitle: ' Transfer to Player', transferTo: 'Nickname or Telegram ID', transferAmount: 'COGNIQ Amount', transferCalc: 'Fee 1% · Minimum 100 COGNIQ', transferCalcDynamic: (c, r) => `Fee: ${c} COGNIQ · Receives: ${r} COGNIQ`, transferBtn: 'Send', transferToastOk: n => `✅ Sent ${n} COGNIQ!`, transferToastNoUser: 'Enter recipient nickname', transferToastMin: 'Minimum 100 COGNIQ', transferToastErr: 'Transfer error', transferToastConn: 'Connection error', impulseExchangeTitle: '💱 COGNIQ → IMPULSE', impulseRate: '1 COGNIQ = 5 IMPULSE', impulseBalance: n => `IMPULSE Balance: ${n}`, impulseCalc: n => `You get: ${n} IMPULSE`, impulseCalcEmpty: 'You get: — IMPULSE', impulseToastOk: n => `+${n} IMPULSE!`, impulseToastAmount: '10-1000 COGNIQ', impulseToastNoFunds: 'Not enough COGNIQ', toastOpenTelegram: 'Open via Telegram' },
    fr: { balanceLabel: 'COGNIQ disponible', newDeposit: 'Nouveau dépôt', amountPlaceholder: 'Montant COGNIQ', depositInfo: (a,p,d) => a>0 ? `Vous recevrez: ${a+Math.floor(a*p/100)} COGNIQ (dans ${d} j)` : `Taux: ${p}% pendant ${d} jours`, depositBtn: 'Staker', activeStakes: 'Dépôts actifs', noStakes: 'Aucun dépôt actif', until: "Jusqu'au", claimBtn: t => `Retirer ${t} COGNIQ`, toastAmount: b => `Montant: 100 à ${b} COGNIQ`, toastCreated: '✅ Dépôt créé!', toastClaimed: a => `✅ ${a} COGNIQ reçus!`, toastError: 'Erreur', termDays: 'j', prevPage: '← Préc', nextPage: 'Suiv →', exchangeTitle: '💱 Échange', sellSoon: 'Bientôt', exToast: 'Montant: 1-100 USDT', exBtn: 'Acheter', exPlaceholder: 'Montant USDT', exRate: '1 USDT = 2000 COGNIQ', exGift: '🎁 +1 Super Jeu x15 par 1$ · ticket pour retirer 1000', exPool: '🔒 75% de l\'achat → pool de liquidité', exCalc: (n,g) => `Vous recevez : ${n} COGNIQ + ${g} 🎁`, exCalcEmpty: 'Vous recevez : — COGNIQ', sellTitle: ' Vendre COGNIQ', transferTitle: '💸 Transfert au joueur', transferTo: 'Pseudo ou Telegram ID', transferAmount: 'Montant COGNIQ', transferCalc: 'Frais 1% · Minimum 100 COGNIQ', transferCalcDynamic: (c, r) => `Frais: ${c} COGNIQ · Reçoit: ${r} COGNIQ`, transferBtn: 'Envoyer', transferToastOk: n => `✅ Envoyé ${n} COGNIQ !`, transferToastNoUser: 'Entrez le pseudo du destinataire', transferToastMin: 'Minimum 100 COGNIQ', transferToastErr: 'Erreur de transfert', transferToastConn: 'Erreur de connexion', impulseExchangeTitle: '💱 COGNIQ → IMPULSE', impulseRate: '1 COGNIQ = 5 IMPULSE', impulseBalance: n => `Solde IMPULSE: ${n}`, impulseCalc: n => `Vous recevez: ${n} IMPULSE`, impulseCalcEmpty: 'Vous recevez: — IMPULSE', impulseToastOk: n => `+${n} IMPULSE !`, impulseToastAmount: '10-1000 COGNIQ', impulseToastNoFunds: 'COGNIQ insuffisant', toastOpenTelegram: 'Ouvrir via Telegram' },
    es: { balanceLabel: 'COGNIQ disponible', newDeposit: 'Nuevo depósito', amountPlaceholder: 'Cantidad COGNIQ', depositInfo: (a,p,d) => a>0 ? `Recibirás: ${a+Math.floor(a*p/100)} COGNIQ (en ${d} días)` : `Tasa: ${p}% por ${d} días`, depositBtn: 'Stakear', activeStakes: 'Depósitos activos', noStakes: 'Sin depósitos activos', until: 'Hasta', claimBtn: t => `Retirar ${t} COGNIQ`, toastAmount: b => `Cantidad: 100 a ${b} COGNIQ`, toastCreated: '✅ ¡Depósito creado!', toastClaimed: a => `✅ ¡Recibido ${a} COGNIQ!`, toastError: 'Error', termDays: 'días', prevPage: '← Ant', nextPage: 'Sig →', exchangeTitle: '💱 Intercambio', sellSoon: 'Próximamente', exToast: 'Cantidad: 1-100 USDT', exBtn: 'Comprar', exPlaceholder: 'Cantidad USDT', exRate: '1 USDT = 2000 COGNIQ', exGift: '🎁 +1 Súper Juego x15 por $1 · ticket para retirar 1000', exPool: '🔒 75% de la compra → pool de liquidez', exCalc: (n,g) => `Recibes: ${n} COGNIQ + ${g} 🎁`, exCalcEmpty: 'Recibes: — COGNIQ', sellTitle: '💸 Vender COGNIQ', transferTitle: '💸 Transferencia al jugador', transferTo: 'Apodo o Telegram ID', transferAmount: 'Cantidad COGNIQ', transferCalc: 'Comisión 1% · Mínimo 100 COGNIQ', transferCalcDynamic: (c, r) => `Comisión: ${c} COGNIQ · Recibe: ${r} COGNIQ`, transferBtn: 'Enviar', transferToastOk: n => `✅ Enviado ${n} COGNIQ!`, transferToastNoUser: 'Ingresa el apodo del destinatario', transferToastMin: 'Mínimo 100 COGNIQ', transferToastErr: 'Error de transferencia', transferToastConn: 'Error de conexión', impulseExchangeTitle: '💱 COGNIQ → IMPULSE', impulseRate: '1 COGNIQ = 5 IMPULSE', impulseBalance: n => `Saldo IMPULSE: ${n}`, impulseCalc: n => `Recibes: ${n} IMPULSE`, impulseCalcEmpty: 'Recibes: — IMPULSE', impulseToastOk: n => `+${n} IMPULSE!`, impulseToastAmount: '10-1000 COGNIQ', impulseToastNoFunds: 'COGNIQ insuficiente', toastOpenTelegram: 'Abrir via Telegram' }
  };
  const bt = bankT[currentLang] || bankT.ru;

  dynamicContent.innerHTML = `
  <div style="max-width:520px;margin:0 auto;">
    
    <div style="margin-bottom:20px;border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 16px rgba(168,85,247,0.25);padding:20px 18px;text-align:center;">
      <div style="font-size:0.74rem;color:#8888aa;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">${bt.balanceLabel}</div>
      <div id="bankBalanceAmount" style="font-size:2.2rem;font-weight:900;background:linear-gradient(90deg,#00ffff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">0</div>
    </div>
    
    <div style="margin-bottom:18px;border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 16px rgba(168,85,247,0.25);padding:20px;">
      <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${bt.newDeposit}</div>
      <div style="display:flex;gap:10px;margin-bottom:12px;"><input type="number" id="bankDepositAmount" placeholder="${bt.amountPlaceholder}" min="100" style="flex:1;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(168,85,247,0.25);border-radius:13px;color:#e0e0f0;font-size:0.95rem;outline:none;"></div>
      <div id="bankTermBtns" style="display:flex;gap:8px;margin-bottom:12px;">
        <button class="term-btn active" data-term="30" style="flex:1;padding:10px;border:none;border-radius:13px;background:rgba(18,18,42,0.6);color:#a855f7;font-size:0.8rem;font-weight:600;cursor:pointer;"><img src="/bank/bank_term_30.webp" style="width:100%;height:auto;display:block;pointer-events:none;"></button>
        <button class="term-btn" data-term="60" style="flex:1;padding:10px;border:none;border-radius:13px;background:rgba(18,18,42,0.6);color:#6677aa;font-size:0.8rem;font-weight:600;cursor:pointer;"><img src="/bank/bank_term_60.webp" style="width:100%;height:auto;display:block;pointer-events:none;"></button>
        <button class="term-btn" data-term="90" style="flex:1;padding:10px;border:none;border-radius:13px;background:rgba(18,18,42,0.6);color:#6677aa;font-size:0.8rem;font-weight:600;cursor:pointer;"><img src="/bank/bank_term_90.webp" style="width:100%;height:auto;display:block;pointer-events:none;"></button>
      </div>
      <div id="bankDepositInfo" style="background:rgba(0,0,0,0.35);border:1px solid rgba(168,85,247,0.1);border-radius:12px;padding:10px 14px;margin-bottom:14px;text-align:center;font-size:0.87rem;color:#8899bb;">${bt.depositInfo(0, 5, 30)}</div>
      <button id="bankDepositBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;"><img src="/bank/bank_deposit_btn_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
    </div>
    
    <div style="margin-bottom:18px;border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 16px rgba(168,85,247,0.25);padding:20px;">
      <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${bt.impulseExchangeTitle}</div>
      <div style="text-align:center;font-size:0.85rem;color:#5599bb;margin-bottom:4px;"><span id="bankImpulseRate">${bt.impulseRate}</span></div>
      <div style="text-align:center;font-size:0.85rem;color:#445577;margin-bottom:12px;" id="bankImpulseBalanceDisplay">${bt.impulseBalance(0)}</div>
      <div style="display:flex;gap:10px;margin-bottom:12px;align-items:stretch;">
        <input type="number" id="bankImpulseCogniqAmount" placeholder="COGNIQ (10-1000)" min="10" max="1000" style="flex:1;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(168,85,247,0.25);border-radius:13px;color:#e0e0f0;font-size:0.95rem;outline:none;">
        <button id="bankImpulseBuyBtn" style="background:none;border:none;padding:0;cursor:pointer;flex-shrink:0;"><img src="/bank/bank_buy_btn_${currentLang}.webp" style="height:44px;width:auto;display:block;"></button>
      </div>
      <div style="text-align:center;font-size:0.85rem;color:#00ffaa;" id="bankImpulseCalc">${bt.impulseCalcEmpty}</div>
    </div>
    
    <div style="margin-bottom:18px;border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 16px rgba(168,85,247,0.25);padding:20px;">
      <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">${bt.exchangeTitle}</div>
      <div style="text-align:center;margin-bottom:6px;">
        <span id="bankExchangeRate" style="font-size:1.15rem;font-weight:900;background:linear-gradient(90deg,#00ffff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${bt.exRate}</span>
      </div>
      <div style="text-align:center;font-size:0.75rem;color:#ffcc44;margin-bottom:12px;">${bt.exGift}</div>
      <div style="display:flex;gap:10px;margin-bottom:10px;align-items:stretch;">
        <input type="number" id="bankExchangeAmount" placeholder="${bt.exPlaceholder}" min="1" max="100" style="flex:1;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(168,85,247,0.25);border-radius:13px;color:#e0e0f0;font-size:0.95rem;outline:none;">
        <button id="bankExchangeBuyBtn" style="background:none;border:none;padding:0;cursor:pointer;flex-shrink:0;"><img src="/bank/bank_buy_btn_${currentLang}.webp" style="height:44px;width:auto;display:block;"></button>
      </div>
      <div style="text-align:center;font-size:0.8rem;color:#00ffaa;margin-bottom:8px;" id="bankExchangeCalc">${bt.exCalcEmpty}</div>
      <div style="text-align:center;font-size:0.68rem;color:#5577aa;">${bt.exPool}</div>
    </div>
    
    <div style="margin-bottom:18px;border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 16px rgba(168,85,247,0.25);padding:20px;">
      <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${bt.transferTitle}</div>
      <div style="display:flex;gap:10px;margin-bottom:12px;"><input type="text" id="bankTransferTo" placeholder="${bt.transferTo}" style="flex:1;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(168,85,247,0.25);border-radius:13px;color:#e0e0f0;font-size:0.95rem;outline:none;"></div>
      <div style="display:flex;gap:10px;margin-bottom:12px;"><input type="number" id="bankTransferAmount" placeholder="${bt.transferAmount}" min="100" style="flex:1;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(168,85,247,0.25);border-radius:13px;color:#e0e0f0;font-size:0.95rem;outline:none;"></div>
      <div style="text-align:center;font-size:0.85rem;color:#5566aa;margin-bottom:8px;"><span id="bankTransferCalc">${bt.transferCalc}</span></div>
      <button id="bankTransferBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;"><img src="/bank/bank_send_btn_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
    </div>
    
    <div style="margin-bottom:18px;border:2px solid rgba(233,238,247,0.4);border-radius:16px;padding:20px;opacity:0.4;pointer-events:none;">
      <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${bt.sellTitle}</div>
      <div style="text-align:center;color:#445566;padding:14px;font-size:0.85rem;">${bt.sellSoon}</div>
    </div>
    
    <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;margin-top:4px;">${bt.activeStakes}</div>
    <div id="bankStakesList"></div>
    
    <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#a855f7,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;margin-top:18px;">📋 История операций</div>
    <div id="bankTxList" style="display:flex;flex-direction:column;gap:6px;margin-top:8px;"></div>
    <div style="text-align:center;margin-top:10px;margin-bottom:4px;">
      <button id="bankTxLoadMoreBtn" style="display:none;background:linear-gradient(135deg,rgba(0,255,255,0.08),rgba(0,100,200,0.08));border:1px solid #1a4a7a;border-radius:10px;color:#00ccff;font-size:0.85rem;padding:8px 24px;cursor:pointer;">Показать ещё</button>
    </div>
    <div id="bankTxEmpty" style="display:none;color:#5599bb;text-align:center;padding:18px 0;font-size:0.9rem;">Операций пока нет</div>
  </div>
`;
    
  let bankSelectedTerm = 30, bankBalance = 0, bankCurrentPage = 1;
  let bankExchangeRate = 2000;
  let bankTxPage = 1, bankTxLoading = false;
  const claimingIds = new Set();

  function bankShowToast(msg, dur=3000) { showToast(msg, dur); }
  
  async function bankLoadData(page=1) {
    bankCurrentPage = page;
    try {
      const [uRes, sRes, iRes] = await Promise.all([
        authFetch(`${BASE_URL}/api/user`),
        authFetch(`${BASE_URL}/api/staking/list?page=${page}&limit=5`),
        authFetch(`${BASE_URL}/api/impulse/balance`)
      ]);
      const u = await uRes.json();
      bankBalance = u.balance || 0;
      const balEl = document.getElementById('bankBalanceAmount');
      if(balEl) balEl.textContent = bankBalance.toLocaleString();
      
      const s = await sRes.json();
      bankRenderStakes(s.stakes || [], s.total || 0, s.pages || 1);
      
      const i = await iRes.json();
      const impulseBal = i.balance || 0;
      const impDisplay = document.getElementById('bankImpulseBalanceDisplay');
      if(impDisplay) impDisplay.textContent = bt.impulseBalance(impulseBal);
    } catch(e) {
      bankBalance = 0;
      const balEl = document.getElementById('bankBalanceAmount');
      if(balEl) balEl.textContent = '—';
      const impDisplay = document.getElementById('bankImpulseBalanceDisplay');
      if(impDisplay) impDisplay.textContent = bt.impulseBalance(0);
    }
  }

  function bankRenderStakes(stakes, total, pages) {
    const el = document.getElementById('bankStakesList');
    if(!el) return;
    if(!stakes.length) {
      el.innerHTML = `<div style="color:#5599bb;padding:12px 0;">${bt.noStakes}</div>`;
      return;
    }
    let html = stakes.map(s => {
      const now = Date.now();
      const end = new Date(s.end_date).getTime();
      const start = new Date(s.start_date).getTime();
      const pct = Math.min(100, Math.round(((now - start) / (end - start)) * 100));
      const done = now >= end && !s.claimed;
      const totalReturn = s.amount + Math.floor(s.amount * s.percent / 100);
      return `<div style="background:rgba(18,18,42,0.8);border:1px solid rgba(168,85,247,0.12);border-radius:18px;padding:16px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:1.05rem;font-weight:800;color:#f0f0ff;">${s.amount.toLocaleString()} COGNIQ</span>
          <span style="font-size:0.82rem;font-weight:700;color:#00ffaa;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);border-radius:20px;padding:2px 10px;">+${s.percent}%</span>
        </div>
        <div style="font-size:0.73rem;color:#5566aa;margin-top:4px;">${bt.until} ${new Date(s.end_date).toLocaleDateString()}</div>
        <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:4px;margin-top:10px;overflow:hidden;">
          <div style="height:100%;border-radius:4px;background:linear-gradient(90deg,#ff6600,#a855f7,#00ffff);width:${pct}%;"></div>
        </div>
        ${done ? `<button class="claim-btn" data-id="${s.id}" style="padding:10px 16px;background:linear-gradient(90deg,rgba(0,255,136,0.12),rgba(0,200,100,0.08));border:1px solid rgba(0,255,136,0.3);border-radius:11px;color:#00ffaa;font-size:0.82rem;font-weight:700;cursor:pointer;margin-top:10px;width:100%;">${bt.claimBtn(totalReturn)}</button>` : ''}
      </div>`;
    }).join('');
    
    if(pages > 1) {
      html += `<div style="display:flex;gap:8px;margin-top:10px;justify-content:center;align-items:center;">
        <button class="page-btn" data-page="${bankCurrentPage-1}" ${bankCurrentPage<=1?'disabled':''} style="padding:6px 14px;background:rgba(0,200,255,0.08);border:1px solid rgba(0,255,255,0.2);border-radius:9px;color:#00ffff;cursor:pointer;font-size:0.8rem;">${bt.prevPage}</button>
        <span style="color:#5599bb;font-size:0.8rem;">${bankCurrentPage}/${pages}</span>
        <button class="page-btn" data-page="${bankCurrentPage+1}" ${bankCurrentPage>=pages?'disabled':''} style="padding:6px 14px;background:rgba(0,200,255,0.08);border:1px solid rgba(0,255,255,0.2);border-radius:9px;color:#00ffff;cursor:pointer;font-size:0.8rem;">${bt.nextPage}</button>
      </div>`;
    }
    el.innerHTML = html;
  }

  async function bankDeposit() {
    const amount = parseInt(document.getElementById('bankDepositAmount').value);
    if(!amount || amount < 100 || amount > bankBalance) {
      bankShowToast(bt.toastAmount(bankBalance), 2000);
      return;
    }
    try {
      const r = await authFetch(`${BASE_URL}/api/staking/create`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({amount, term: bankSelectedTerm})
      });
      const d = await r.json();
      if(d.ok) {
        bankShowToast(bt.toastCreated, 3000);
        document.getElementById('bankDepositAmount').value = '';
        bankUpdateDepositInfo();
        bankLoadData(bankCurrentPage);
      } else bankShowToast(d.error || bt.toastError, 2000);
    } catch(e) { bankShowToast(bt.toastError, 2000); }
  }

  async function bankClaim(id) {
    if(claimingIds.has(id)) return;
    claimingIds.add(id);
    try {
      const r = await authFetch(`${BASE_URL}/api/staking/claim`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id})
      });
      const d = await r.json();
      if(d.ok) {
        bankShowToast(bt.toastClaimed(d.amount), 3000);
        bankLoadData(bankCurrentPage);
      } else bankShowToast(d.error || bt.toastError, 2000);
    } catch(e) { bankShowToast(bt.toastError, 2000); }
    finally { claimingIds.delete(id); }
  }

  function bankUpdateDepositInfo() {
    const pct = bankSelectedTerm === 30 ? 5 : bankSelectedTerm === 60 ? 12 : 20;
    const amt = parseInt(document.getElementById('bankDepositAmount').value) || 0;
    const el = document.getElementById('bankDepositInfo');
    if(el) el.textContent = bt.depositInfo(amt, pct, bankSelectedTerm);
  }

  async function bankLoadExchangeRate() {
    try {
      const r = await authFetch(`${BASE_URL}/api/exchange/rate`);
      const d = await r.json();
      bankExchangeRate = d.rate || 2000;
      const el = document.getElementById('bankExchangeRate');
      if(el) el.textContent = `1 USDT = ${bankExchangeRate} COGNIQ`;
    } catch(e) {}
  }

  async function bankExchangeBuy() {
    const amt = parseFloat(document.getElementById('bankExchangeAmount').value);
    if(!amt || amt < 1 || amt > 100) { bankShowToast(bt.exToast); return; }
    const userIdStr = String(tg.initDataUnsafe?.user?.id || '');
    if(!userIdStr) { bankShowToast(bt.toastOpenTelegram, 4000); return; }
    if(typeof TonWeb === 'undefined') { bankShowToast('TonWeb не загружен', 3000); return; }
    
    const btn = document.getElementById('bankExchangeBuyBtn');
    btn.disabled = true;
    
    try {
      if(!window.tonConnectUI) { bankShowToast('TonConnect не инициализирован', 3000); btn.disabled = false; return; }
      let wallet = window.tonConnectUI.wallet;
      if(!wallet) {
        for(let i=0; i<6; i++) {
          await new Promise(r => setTimeout(r, 500));
          wallet = window.tonConnectUI.wallet;
          if(wallet) break;
        }
      }
      if(!wallet) { bankShowToast('Подключи TON кошелёк', 3000); btn.disabled = false; return; }
      
      const walletAddress = wallet.account.address;
      const usdtAmount = String(Math.round(amt * 1_000_000));
      const JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
      const DESTINATION = 'UQBniD_M-MTeVqUbWshZrXdQcz0m8lPstG3mQg1AL5KKCGSv';
      const FORWARD_TON = '100000000';
      const comment = 'exchange_' + userIdStr;
      
      let senderFormatted;
      try { senderFormatted = new TonWeb.utils.Address(walletAddress).toString(true, true, false); } catch(e) { senderFormatted = walletAddress; }
      
      let jdata = null;
      for(const addr of [senderFormatted, walletAddress]) {
        const resp = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(addr)}&jetton_address=${encodeURIComponent(JETTON_MASTER)}&limit=1`);
        const d = await resp.json();
        if(d?.jetton_wallets?.[0]?.address) { jdata = d; break; }
      }
      const senderJettonWallet = jdata?.jetton_wallets?.[0]?.address;
      if(!senderJettonWallet) { bankShowToast('USDT-кошелёк не найден', 3000); btn.disabled = false; return; }
      
      let jettonWalletFormatted;
      try { jettonWalletFormatted = new TonWeb.utils.Address(senderJettonWallet).toString(true, true, false); } catch(e) { jettonWalletFormatted = senderJettonWallet; }
      
      const forwardPayload = new TonWeb.boc.Cell();
      forwardPayload.bits.writeUint(0, 32);
      for(let i=0; i<comment.length; i++) forwardPayload.bits.writeUint(comment.charCodeAt(i), 8);
      
      const body = new TonWeb.boc.Cell();
      body.bits.writeUint(0x0f8a7ea5, 32);
      body.bits.writeUint(0, 64);
      body.bits.writeCoins(new TonWeb.utils.BN(usdtAmount));
      body.bits.writeAddress(new TonWeb.utils.Address(DESTINATION));
      body.bits.writeAddress(new TonWeb.utils.Address(senderFormatted));
      body.bits.writeBit(0);
      body.bits.writeCoins(new TonWeb.utils.BN('1'));
      body.bits.writeBit(1);
      body.refs.push(forwardPayload);
      
      const bocBytes = await body.toBoc(false);
      const payloadBase64 = btoa(String.fromCharCode(...new Uint8Array(bocBytes)));
      
      const transaction = {
        validUntil: Math.floor(Date.now()/1000) + 600,
        messages: [{ address: jettonWalletFormatted, amount: FORWARD_TON, payload: payloadBase64 }]
      };
      
      bankShowToast('Подтверди в Tonkeeper...', 5000);
      await window.tonConnectUI.sendTransaction(transaction);
      bankShowToast('✅ Отправлено! COGNIQ зачислятся автоматически.', 5000);
      btn.disabled = false;
      setTimeout(() => bankLoadData(), 4000);
    } catch(e) {
      const msg = e?.message || '';
      if(msg.includes('reject') || e?.code === 300) bankShowToast('Отменено', 2000);
      else bankShowToast('Ошибка: ' + msg, 3000);
      btn.disabled = false;
    }
  }

  async function bankLoadTransactions(reset = false) {
    if(bankTxLoading) return;
    bankTxLoading = true;
    if(reset) { bankTxPage = 1; const l = document.getElementById('bankTxList'); if(l) l.innerHTML = ''; }
    try {
      const res = await authFetch(`${BASE_URL}/api/transactions?page=${bankTxPage}&limit=20`);
      const data = await res.json();
      const list = document.getElementById('bankTxList');
      const empty = document.getElementById('bankTxEmpty');
      const btn = document.getElementById('bankTxLoadMoreBtn');
      
      if(data.transactions && data.transactions.length > 0) {
        if(empty) empty.style.display = 'none';
        data.transactions.forEach(tx => {
          const isIn = tx.direction === 'in';
          const sign = isIn ? '+' : tx.direction === 'transfer' ? '→' : '-';
          const color = isIn ? '#00dd88' : tx.direction === 'transfer' ? '#00ccff' : '#ff4466';
          const label = (typeof getTxLabel === 'function') ? getTxLabel(tx) : (tx.type || 'Операция');
          const date = (typeof formatTxDate === 'function') ? formatTxDate(tx.created_at) : new Date(tx.created_at).toLocaleDateString();
          
          const el = document.createElement('div');
          el.style.cssText = `display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(10,20,50,0.7),rgba(5,15,40,0.7));border:1px solid #1a3a6a;border-radius:10px;padding:9px 13px;`;
          el.innerHTML = `
            <div style="min-width:32px;height:32px;border-radius:50%;background:${color}18;border:1.5px solid ${color}55;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:700;color:${color};flex-shrink:0;">${sign}</div>
            <div style="flex:1;min-width:0;"><div style="color:#cceeff;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(label)}</div></div>
            <div style="text-align:right;flex-shrink:0;"><div style="color:${color};font-weight:700;font-size:0.95rem;">${isIn ? '+' : tx.direction === 'out' ? '-' : '→'}${parseInt(tx.amount)} 🪙</div><div style="color:#4466aa;font-size:0.72rem;">${escapeHtml(date)}</div></div>
          `;
          list.appendChild(el);
        });
        if(btn) btn.style.display = data.hasMore ? 'inline-block' : 'none';
        bankTxPage++;
      } else if(bankTxPage === 1) {
        if(empty) empty.style.display = 'block';
        if(btn) btn.style.display = 'none';
      } else {
        if(btn) btn.style.display = 'none';
      }
    } catch(e) { console.error('tx load error:', e); }
    finally { bankTxLoading = false; }
  }
  
  const firstTermBtn = document.querySelector('#bankTermBtns .term-btn.active');
  if(firstTermBtn) {
    firstTermBtn.style.color = '#a855f7';
    firstTermBtn.style.background = 'rgba(168,85,247,0.08)';
    const img = firstTermBtn.querySelector('img');
    if(img) {
      img.style.filter = 'brightness(1.3) drop-shadow(0 0 8px #a855f7)';
      img.style.opacity = '1';
    }
  }

  document.getElementById('bankTermBtns').addEventListener('click', e => {
    if(e.target.closest('.term-btn')) {
      const btn = e.target.closest('.term-btn');
      document.querySelectorAll('#bankTermBtns .term-btn').forEach(b => {
        b.classList.remove('active');
        b.style.color = '#6677aa';
        b.style.borderColor = 'rgba(168,85,247,0.2)';
        b.style.background = 'rgba(18,18,42,0.6)';
        const img = b.querySelector('img');
        if(img) {
          img.style.filter = 'brightness(1)';
          img.style.opacity = '0.55';
        }
      });
      btn.classList.add('active');
      btn.style.color = '#a855f7';
      btn.style.borderColor = 'rgba(168,85,247,0.4)';
      btn.style.background = 'rgba(168,85,247,0.08)';
      const img = btn.querySelector('img');
      if(img) {
        img.style.filter = 'brightness(1.3) drop-shadow(0 0 8px #a855f7)';
        img.style.opacity = '1';
      }
      bankSelectedTerm = parseInt(btn.dataset.term);
      bankUpdateDepositInfo();
    }
  });
  
  document.getElementById('bankDepositAmount').addEventListener('input', bankUpdateDepositInfo);
  document.getElementById('bankDepositBtn').addEventListener('click', bankDeposit);
  
  document.getElementById('bankExchangeAmount').addEventListener('input', function() {
    const amt = parseFloat(this.value) || 0;
    const el = document.getElementById('bankExchangeCalc');
    if(el) el.textContent = amt > 0 ? bt.exCalc(Math.floor(amt * bankExchangeRate)) : bt.exCalcEmpty;
  });
  document.getElementById('bankExchangeBuyBtn').addEventListener('click', bankExchangeBuy);
  
  document.getElementById('bankTransferAmount').addEventListener('input', function() {
    const amt = parseInt(this.value) || 0;
    const commission = Math.max(1, Math.floor(amt * 0.01));
    const receives = amt > 0 ? amt - commission : 0;
    const el = document.getElementById('bankTransferCalc');
    if(el) el.textContent = amt > 0 ? bt.transferCalcDynamic(commission, receives) : bt.transferCalc;
  });
  
  document.getElementById('bankTransferBtn').addEventListener('click', async () => {
    const toUsername = document.getElementById('bankTransferTo').value.trim();
    const amount = parseInt(document.getElementById('bankTransferAmount').value);
    if(!toUsername) return bankShowToast(bt.transferToastNoUser, 3000);
    if(!amount || amount < 100) return bankShowToast(bt.transferToastMin, 3000);
    
    const btn = document.getElementById('bankTransferBtn');
    btn.disabled = true;
    try {
      const res = await authFetch(`${BASE_URL}/api/transfer`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({toUsername, amount})
      });
      const data = await res.json();
      if(data.ok) {
        bankShowToast(bt.transferToastOk(data.received), 3000);
        document.getElementById('bankTransferTo').value = '';
        document.getElementById('bankTransferAmount').value = '';
        const el = document.getElementById('bankTransferCalc');
        if(el) el.textContent = bt.transferCalc;
        bankLoadData();
      } else { bankShowToast(data.error || bt.transferToastErr, 3000); }
    } catch(e) { bankShowToast(bt.transferToastConn, 3000); }
    finally { btn.disabled = false; }
  });
  
  document.getElementById('bankImpulseCogniqAmount').addEventListener('input', function() {
    const amt = parseInt(this.value) || 0;
    const el = document.getElementById('bankImpulseCalc');
    if(el) el.textContent = amt > 0 ? bt.impulseCalc(amt * 5) : bt.impulseCalcEmpty;
  });
  
  document.getElementById('bankImpulseBuyBtn').addEventListener('click', async () => {
    const amount = parseInt(document.getElementById('bankImpulseCogniqAmount').value);
    if(!amount || amount < 10 || amount > 1000) { bankShowToast(bt.impulseToastAmount, 3000); return; }
    const btn = document.getElementById('bankImpulseBuyBtn');
    btn.disabled = true;
    try {
      const r = await authFetch(`${BASE_URL}/api/impulse/buy`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({amount})
      });
      const d = await r.json();
      if(d.success) {
        bankShowToast(bt.impulseToastOk(d.received), 3000);
        document.getElementById('bankImpulseCogniqAmount').value = '';
        const el = document.getElementById('bankImpulseCalc');
        if(el) el.textContent = bt.impulseCalcEmpty;
        bankLoadData();
      } else bankShowToast(d.error || 'Ошибка', 3000);
    } catch(e) { bankShowToast('Ошибка', 3000); }
    btn.disabled = false;
  });

  document.getElementById('bankStakesList').addEventListener('click', e => {
    if(e.target.classList.contains('claim-btn')) {
      bankClaim(e.target.dataset.id);
    } else if(e.target.classList.contains('page-btn') && !e.target.disabled) {
      bankLoadData(parseInt(e.target.dataset.page));
    }
  });

  const loadMoreBtn = document.getElementById('bankTxLoadMoreBtn');
  if(loadMoreBtn) loadMoreBtn.addEventListener('click', () => bankLoadTransactions());

  Promise.all([bankLoadData(), bankLoadExchangeRate(), bankLoadTransactions(true)]).catch(() => {});
}
