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
  casinoContainer.innerHTML = `
    <div class="casino-card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
    <button id="casinoBackBtn" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img id="casinoBackBtnImg" src="/public/images/cogniq/back_btn_${currentLang}.png" style="height:44px;width:auto;display:block;">
    </button>
    <button id="casinoDailyImpulseBtn" onclick="window.casinoClaimDailyImpulse()" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img id="casinoDailyImpulseBtnImg" src="/public/images/cogniq/btn_daily_impulse.png" style="height:44px;width:auto;display:block;">
    </button>
  </div>
  <div class="neuron-logo">
    <img src="/public/images/cogniq/neuron_logo.png" alt="NEURON" style="height:128px;width:auto;display:block;">
  </div>
  <div class="casino-tabs" style="display:flex;gap:4px;background:transparent;border:none;padding:0;">
    <button class="casino-tab active" data-tab="roulette" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/public/images/cogniq/tab_btn_fortuna.png" style="width:100%;height:auto;display:block;">
    </button>
    <button class="casino-tab" data-tab="slots" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/public/images/cogniq/tab_btn_spark.png" style="width:100%;height:auto;display:block;">
    </button>
    <button class="casino-tab" data-tab="crash" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/public/images/cogniq/tab_btn_crash.png" style="width:100%;height:auto;display:block;">
    </button>
    <button class="casino-tab" data-tab="blackjack" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/public/images/cogniq/tab_btn_xxi.png" style="width:100%;height:auto;display:block;">
    </button>
    <button class="casino-tab" data-tab="mines" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/public/images/cogniq/tab_btn_mines.png" style="width:100%;height:auto;display:block;">
    </button>
  </div>
  <div class="balance-row" style="margin-bottom:2px;">
    <div class="balance-label" id="casinoBalanceLabel">Available IMPULSE</div>
    <div class="balance-amount" id="casinoBalanceAmount">—</div>
  </div>

       <!-- ROULETTE -->
      <div id="casinoSectionRoulette" class="casino-game-section">
        <div class="wheel-panel" style="padding:80px 20px 14px;margin-bottom:2px;">
          <div class="wheel-wrap" style="position:relative;width:min(330px,65vw,50vh);height:min(330px,65vw,50vh);margin:0 auto 16px;filter:drop-shadow(0 0 24px rgba(255,140,0,0.5));">
            <div class="wheel-pointer" style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:1.4rem;color:#ffd700;filter:drop-shadow(0 0 10px #ffaa00);z-index:2;">▼</div>
            <canvas id="casinoWheelCanvas" class="wheel-svg" width="220" height="220" style="width:100%;height:100%;border-radius:50%;box-shadow:0 0 50px rgba(255,170,0,0.4),0 0 100px rgba(255,80,0,0.2);"></canvas>
            <div class="wheel-center" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:58px;height:58px;background:radial-gradient(circle,#1e2e48,#07111f);border:3px solid #ffaa00;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:0 0 24px rgba(255,170,0,0.7),inset 0 0 16px rgba(0,0,0,0.5);">
              <span class="wheel-center-num" id="casinoWheelResult" style="font-size:1.4rem;font-weight:900;color:#ffaa00;">?</span>
            </div>
          </div>
        </div>
        <button id="casinoSpinBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;margin-bottom:14px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
          <img id="casinoSpinBtnImg" src="/public/images/cogniq/fortuna_btn_spin_${currentLang}.png" style="width:100%;height:auto;display:block;">
        </button>
        <div class="result-color" id="casinoRouletteResultColor" style="font-size:1rem;font-weight:700;margin-top:6px;text-align:center;min-height:24px;margin-bottom:4px;"></div>
        <div class="result-message" id="casinoRouletteResultMsg" style="font-size:0.88rem;margin-top:4px;color:#aabbcc;text-align:center;min-height:20px;margin-bottom:12px;"></div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/public/images/cogniq/fortuna_bets_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
          <div class="bet-form" style="position:relative;z-index:1;background:none;border:none;padding:24px 18px 18px 18px;">
            <div class="input-row" style="display:flex;gap:10px;margin-bottom:12px;"><input type="number" id="casinoRouletteBet" placeholder="Amount (10-100 IMPULSE)" min="10" max="100" style="flex:1;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;transition:border-color 0.2s,box-shadow 0.2s;"></div>
            <div class="bet-types" id="casinoRouletteBetTypes" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
              <button class="wheel-bet-btn" data-type="red" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_red.png" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="black" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_black.png" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="even" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_even.png" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="odd" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_odd.png" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="low" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_low.png" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="high" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_high.png" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen1" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_dozen1.png" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen2" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_dozen2.png" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen3" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/public/images/cogniq/fortuna_btn_dozen3.png" style="width:100%;height:auto;display:block;"></button>
            </div>
          </div>
        </div>
        <div class="section-title" id="casinoRouletteHistoryTitle" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoRouletteHistory"></div>
      </div>

      <!-- SLOTS -->
      <div id="casinoSectionSlots" class="casino-game-section" style="display:none;">
        <div class="slot-machine" style="position:relative;margin-bottom:20px;padding:28px 32px 22px;">
          <img src="/public/images/cogniq/spark_machine_bg.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:2;">
            <div id="casinoSlotReels" style="display:flex;gap:3px;justify-content:center;margin-bottom:20px;padding-top:40px;"></div>
            <div style="text-align:center;min-height:54px;margin-bottom:6px;">
              <div id="casinoSlotResultCombo" style="font-size:1.6rem;font-weight:900;letter-spacing:8px;min-height:32px;"></div>
              <div id="casinoSlotResultMsg" style="font-size:0.9rem;margin-top:6px;font-weight:700;"></div>
            </div>
          </div>
        </div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/public/images/cogniq/spark_bets_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoSlotBet" placeholder="${ct.bet} (10-100)" min="10" max="100" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:flex;gap:6px;margin-bottom:14px;">
              <button onclick="window.casinoSetSlotBet(10)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/btn_bet_10.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(25)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/btn_bet_25.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(50)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/btn_bet_50.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(100)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/btn_bet_100.png" style="width:100%;height:auto;display:block;"></button>
            </div>
            <button id="casinoSlotSpinBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;"><img src="/public/images/cogniq/btn_spin.png" style="width:100%;height:auto;display:block;"></button>
          </div>
        </div>
        <div class="section-title" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoSlotHistory"></div>
      </div>

      <!-- CRASH -->
      <div id="casinoSectionCrash" class="casino-game-section" style="display:none;">
        <div style="position:relative;margin-bottom:14px;border-radius:18px;overflow:hidden;">
          <img src="/public/images/cogniq/crash_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:8px;">
            <div style="position:relative;margin-bottom:12px;">
              <img id="casinoCrashBg" src="/public/images/cogniq/krash_display_bg_active.png" style="width:100%;height:auto;display:block;">
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                <div style="text-align:center;pointer-events:none;">
                  <div id="casinoCrashMult" style="font-size:3.2em;font-weight:900;color:#10b981;text-shadow:0 0 30px currentColor;">---</div>
                  <div id="casinoCrashLabel" style="font-size:0.72em;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-top:4px;color:#556677;">ОЖИДАНИЕ</div>
                </div>
              </div>
              <canvas id="casinoCrashCanvas" style="position:absolute;bottom:0;left:0;width:100%;height:220px;z-index:2;"></canvas>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;background:rgba(5,5,20,0.9);border:1px solid rgba(255,170,0,0.15);border-radius:12px;padding:10px 16px;font-size:0.83em;">
              <div style="display:flex;align-items:center;gap:8px;"><div id="casinoCrashDot" style="width:10px;height:10px;border-radius:50%;background:#334;"></div><span id="casinoCrashStatus" style="color:#aaa;">${ct.bet}...</span></div>
              <div id="casinoCrashTimer" style="color:#556;"></div>
            </div>
            <div id="casinoCrashMyBet" style="display:none;justify-content:space-between;align-items:center;margin-bottom:12px;background:linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.06));border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:10px 16px;">
              <div><div style="font-size:0.78em;color:#556;">${ct.bet}</div><div id="casinoCrashBetAmount" style="font-weight:800;color:#a855f7;">0</div></div>
              <div style="text-align:right;"><div style="font-size:0.78em;color:#556;">${ct.cashout}</div><div id="casinoCrashPotential" style="font-weight:700;color:#10b981;">0</div></div>
            </div>
          </div>
        </div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/public/images/cogniq/crash_bet_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoCrashBetInput" value="50" min="10" max="100" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">
              <button onclick="window.casinoSetCrashBet(10)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/krash_btn_10.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetCrashBet(25)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/krash_btn_25.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetCrashBet(50)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/krash_btn_50.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetCrashBet(100)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/krash_btn_100.png" style="width:100%;height:auto;display:block;"></button>
            </div>
            <button id="casinoCrashMainBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;"><img id="casinoCrashMainBtnImg" src="/public/images/cogniq/krash_btn_main_bet_${currentLang}.png" style="width:100%;height:auto;display:block;"></button>
          </div>
        </div>
        <div class="section-title" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoCrashHistory" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
      </div>

      <!-- BLACKJACK -->
      <div id="casinoSectionBlackjack" class="casino-game-section" style="display:none;">
        <div style="position:relative;min-height:300px;margin-bottom:14px;">
          <img src="/public/images/cogniq/xxi_table.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;border-radius:24px;opacity:0.8;" alt="">
          <div style="position:relative;z-index:1;border-radius:24px;min-height:300px;display:flex;flex-direction:column;justify-content:space-between;padding:12px 16px;">
            <div style="flex:1;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;">
              <div id="casinoBjDealerCards" style="display:flex;flex-wrap:wrap;gap:10px;min-height:88px;align-items:center;justify-content:center;"></div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:4px;">
              <div id="casinoBjPlayerCards" style="display:flex;flex-wrap:wrap;gap:10px;min-height:88px;align-items:center;justify-content:center;"></div>
              <div id="casinoBjResultBanner" style="text-align:center;font-size:1.2em;font-weight:900;padding:12px;border-radius:14px;margin:8px 0;display:none;"></div>
            </div>
          </div>
        </div>
        
        <div id="casinoBjInsuranceBar" style="display:none;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.35);border-radius:12px;padding:10px 14px;margin-bottom:10px;font-size:0.83em;color:#c084fc;text-align:center;cursor:pointer;"></div>
        
        <div style="position:relative;margin-bottom:14px;">
          <img src="/public/images/cogniq/xxi_bet_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoBjBet" value="50" min="10" max="500" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:14px;">
              <button onclick="window.casinoSetBjBet(10)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/xxi_btn_10.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetBjBet(25)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/xxi_btn_25.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetBjBet(50)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/xxi_btn_50.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetBjBet(100)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/xxi_btn_100.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetBjBet(250)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/xxi_btn_250.png" style="width:100%;height:auto;display:block;"></button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <button id="casinoBjDealBtn" style="grid-column:span 2;background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/bj_deal_${currentLang}.png" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoBjHitBtn" disabled style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/bj_hit_${currentLang}.png" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoBjStandBtn" disabled style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/bj_stand_${currentLang}.png" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoBjDoubleBtn" disabled style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/bj_double_${currentLang}.png" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoBjSplitBtn" disabled style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/bj_split_${currentLang}.png" style="width:100%;height:auto;display:block;"></button>
            </div>
          </div>
        </div>
        <div class="section-title" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoBjHistory"></div>
      </div>

      <!-- MINES -->
      <div id="casinoSectionMines" class="casino-game-section" style="display:none;">
        <div style="position:relative;margin-bottom:16px;border-radius:0;">
          <img src="/public/images/cogniq/mines_field_bg.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:22px 23px 10px 8px;text-align:center;">
            <div style="font-size:0.85rem;color:#ffaa00;margin-bottom:8px;">💣 MINES</div>
            <div id="casinoMinesMult" style="font-size:1.8rem;font-weight:900;color:#ffaa00;text-shadow:0 0 20px rgba(255,170,0,0.7);margin-bottom:8px;min-height:44px;">x1.00</div>
            <div id="casinoMinesField" style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;margin-bottom:16px;"></div>
          </div>
        </div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/public/images/cogniq/mines_bets_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoMinesBet" value="50" min="10" max="100" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px;">
              <button onclick="window.casinoSetMinesBet(10)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/mines_btn_10.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(25)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/mines_btn_25.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(50)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/mines_btn_50.png" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(100)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/mines_btn_100.png" style="width:100%;height:auto;display:block;"></button>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
              <label style="font-size:0.8rem;color:#5577aa;white-space:nowrap;">💣 Мин:</label>
              <input type="number" id="casinoMinesCount" min="1" max="24" value="3" style="width:60px;padding:8px 10px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:10px;color:#fff;font-size:0.95rem;outline:none;text-align:center;">
              <input type="range" id="casinoMinesRange" min="1" max="24" value="3" style="flex:1;accent-color:#ffaa00;">
            </div>
            <div style="display:flex;gap:12px;">
              <button id="casinoMinesCashoutBtn" style="flex:1;background:none;border:none;padding:0;cursor:pointer;display:none;"><img src="/public/images/cogniq/mines_btn_cashout.png" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoMinesStartBtn" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/public/images/cogniq/mines_btn_start.png" style="width:100%;height:auto;display:block;"></button>
            </div>
          </div>
        </div>
        <div class="section-title" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoMinesHistory"></div>
      </div>

    </div>
    
    <!-- Jackpot Overlay -->
    <div id="casinoJackpotOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:1000;align-items:center;justify-content:center;flex-direction:column;gap:14px;">
      <div style="font-size:5rem;animation:brainPop 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both;filter:drop-shadow(0 0 30px #ff00ff);">🧠</div>
      <div style="font-size:3rem;font-weight:900;background:linear-gradient(90deg, #ff00ff, #ffaa00, #00ffff, #ff00ff);background-size:300% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:gradientShift 1.5s linear infinite;">JACKPOT!</div>
      <div id="casinoJackpotAmount" style="font-size:2rem;font-weight:900;color:#ffaa00;text-shadow:0 0 30px rgba(255,170,0,0.8);"></div>
      <button onclick="window.casinoCloseJackpot()" style="padding:14px 44px;background:linear-gradient(90deg, #ff00ff, #9900ff);border:none;border-radius:14px;color:#fff;font-size:1rem;font-weight:800;cursor:pointer;box-shadow:0 0 30px rgba(255,0,255,0.5);">COLLECT 🎉</button>
    </div>
  `;

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
    cPoint = data.crash_point || 100;
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
