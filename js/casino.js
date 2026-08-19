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
  ru: { 
    balance: 'Доступно IMPULSE', back: 'На главную', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'История', spin: 'Крутить', bet: 'Ставка', cashout: 'Забрать', start: 'Начать', hit: 'Ещё', stand: 'Стоп', deal: 'Раздать',
    waiting: '⏳ СЛЕДУЮЩИЙ РАУНД...', betting: '🔥 ДЕЛАЙ СТАВКУ!', flying: '🚀 ЛЕТИМ! ЖМИ ЗАБРАТЬ!', crashed: '💥 КРАШ!',
    waitingStatus: 'Подождите...', bettingStatus: 'Успей за 3 секунды!', flyingStatus: 'Забирай до краша!'
  },
  en: { 
    balance: 'Available IMPULSE', back: 'Back to Main', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'History', spin: 'Spin', bet: 'Bet', cashout: 'Cash Out', start: 'Start', hit: 'Hit', stand: 'Stand', deal: 'Deal',
    waiting: '⏳ NEXT ROUND...', betting: '🔥 PLACE YOUR BET!', flying: '🚀 FLYING! CASH OUT!', crashed: '💥 CRASHED!',
    waitingStatus: 'Wait...', bettingStatus: 'Bet within 3 seconds!', flyingStatus: 'Cash out before crash!'
  },
  fr: { 
    balance: 'IMPULSE disponible', back: 'Retour', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'Historique', spin: 'Tourner', bet: 'Mise', cashout: 'Retirer', start: 'Commencer', hit: 'Tirer', stand: 'Rester', deal: 'Distribuer',
    waiting: '⏳ PROCHAIN TOUR...', betting: '🔥 PLACEZ VOTRE MISE!', flying: '🚀 ÇA VOLE ! RETIREZ !', crashed: '💥 CRASH !',
    waitingStatus: 'Attendez...', bettingStatus: 'Pariez dans 3 secondes !', flyingStatus: 'Retirez avant le crash !'
  },
  es: { 
    balance: 'IMPULSE disponible', back: 'Volver', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'Historial', spin: 'Girar', bet: 'Apuesta', cashout: 'Retirar', start: 'Iniciar', hit: 'Pedir', stand: 'Plantarse', deal: 'Repartir',
    waiting: '⏳ PRÓXIMA RONDA...', betting: '🔥 ¡HAZ TU APUESTA!', flying: '🚀 ¡VOLANDO! ¡RETIRA!', crashed: '💥 ¡CRASH!',
    waitingStatus: 'Espera...', bettingStatus: '¡Apuesta en 3 segundos!', flyingStatus: '¡Retira antes del crash!'
  }
}[currentLang] || { 
  balance: 'Available IMPULSE', back: 'Back', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'History', spin: 'Spin', bet: 'Bet', cashout: 'Cash Out', start: 'Start', hit: 'Hit', stand: 'Stand', deal: 'Deal',
  waiting: '⏳ NEXT ROUND...', betting: '🔥 PLACE YOUR BET!', flying: '🚀 FLYING! CASH OUT!', crashed: '💥 CRASHED!',
  waitingStatus: 'Wait...', bettingStatus: 'Bet within 3 seconds!', flyingStatus: 'Cash out before crash!'
};

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
            <canvas id="casinoWheelCanvas" class="wheel-svg" width="220" height="220" style="width:100%;height:100%;border-radius:50%;box-shadow:0 0 50px rgba(255,170,0,0.4), 0 0 100px rgba(255,80,0,0.2);"></canvas>
            <div class="wheel-center" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:58px;height:58px;background:radial-gradient(circle,#1e2e48,#07111f);border:3px solid #ffaa00;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:0 0 24px rgba(255,170,0,0.7),inset 0 0 16px rgba(0,0,0,0.5);">
              <span class="wheel-center-num" id="casinoWheelResult" style="font-size:1.4rem;font-weight:900;color:#ffaa00;">?</span>
            </div>
          </div>
        </div>
        <button id="casinoSpinBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;margin-bottom:14px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
          <img id="casinoSpinBtnImg" src="/games/fortuna/fortuna_btn_spin_${currentLang}.webp" style="width:100%;height:auto;display:block;">
        </button>
        <div class="result-color" id="casinoRouletteResultColor" style="font-size:1rem;font-weight:700;margin-top:6px;text-align:center;min-height:24px;margin-bottom:4px;"></div>
        <div class="result-message" id="casinoRouletteResultMsg" style="font-size:0.88rem;margin-top:4px;color:#aabbcc;text-align:center;min-height:20px;margin-bottom:12px;"></div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/games/fortuna/fortuna_bets_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
          <div class="bet-form" style="position:relative;z-index:1;background:none;border:none;padding:24px 18px 18px 18px;">
            <div class="input-row" style="display:flex;gap:10px;margin-bottom:12px;"><input type="number" id="casinoRouletteBet" placeholder="Amount (10-100 IMPULSE)" min="10" max="100" style="flex:1;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;transition:border-color 0.2s,box-shadow 0.2s;"></div>
            <div class="bet-types" id="casinoRouletteBetTypes" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
              <button class="wheel-bet-btn" data-type="red" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_red.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="black" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_black.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="even" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_even.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="odd" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_odd.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="low" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_low.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="high" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_high.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen1" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_dozen1.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen2" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_dozen2.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen3" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_dozen3.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
          </div>
        </div>
        <div class="section-title" id="casinoRouletteHistoryTitle" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoRouletteHistory"></div>
      </div>

      <!-- SLOTS -->
      <div id="casinoSectionSlots" class="casino-game-section" style="display:none;">
        <div class="slot-machine" style="position:relative;margin-bottom:20px;padding:28px 32px 22px;">
          <img src="/games/spark/spark_machine_bg.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:2;">
            <div id="casinoSlotReels" style="display:flex;gap:3px;justify-content:center;margin-bottom:20px;padding-top:40px;"></div>
            <div style="text-align:center;min-height:54px;margin-bottom:6px;">
              <div id="casinoSlotResultCombo" style="font-size:1.6rem;font-weight:900;letter-spacing:8px;min-height:32px;"></div>
              <div id="casinoSlotResultMsg" style="font-size:0.9rem;margin-top:6px;font-weight:700;"></div>
            </div>
          </div>
        </div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/games/spark/spark_bets_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoSlotBet" placeholder="${ct.bet} (10-100)" min="10" max="100" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:flex;gap:6px;margin-bottom:14px;">
              <button onclick="window.casinoSetSlotBet(10)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/spark/btn_bet_10.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(25)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/spark/btn_bet_25.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(50)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/spark/btn_bet_50.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(100)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/spark/btn_bet_100.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
            <button id="casinoSlotSpinBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;"><img src="/games/spark/btn_spin.webp" style="width:100%;height:auto;display:block;"></button>
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
          <img src="/games/mines/mines_field_bg.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:22px 23px 10px 8px;text-align:center;">
            <div style="font-size:0.85rem;color:#ffaa00;margin-bottom:8px;">💣 MINES</div>
            <div id="casinoMinesMult" style="font-size:1.8rem;font-weight:900;color:#ffaa00;text-shadow:0 0 20px rgba(255,170,0,0.7);margin-bottom:8px;min-height:44px;">x1.00</div>
            <div id="casinoMinesField" style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;margin-bottom:16px;"></div>
          </div>
        </div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/games/mines/mines_bets_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoMinesBet" value="50" min="10" max="100" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px;">
              <button onclick="window.casinoSetMinesBet(10)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_10.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(25)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_25.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(50)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_50.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(100)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_100.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
              <label style="font-size:0.8rem;color:#5577aa;white-space:nowrap;">💣 Мин:</label>
              <input type="number" id="casinoMinesCount" min="1" max="24" value="3" style="width:60px;padding:8px 10px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:10px;color:#fff;font-size:0.95rem;outline:none;text-align:center;">
              <input type="range" id="casinoMinesRange" min="1" max="24" value="3" style="flex:1;accent-color:#ffaa00;">
            </div>
            <div style="display:flex;gap:12px;">
              <button id="casinoMinesCashoutBtn" style="flex:1;background:none;border:none;padding:0;cursor:pointer;display:none;"><img src="/games/mines/mines_btn_cashout.webp" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoMinesStartBtn" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_start.webp" style="width:100%;height:auto;display:block;"></button>
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
  window.casinoShowToast = casinoShowToast;
  window.casinoGetBalance = () => balance;
  window.casinoSetBalance = (v) => { balance = v; };
  if (window.initCasinoMines) window.initCasinoMines();
  if (window.initCasinoFortuna) window.initCasinoFortuna();
  if (window.initCasinoSpark) window.initCasinoSpark();

// === 1. РУЛЕТКА ===
// === 2. СЛОТЫ ===
// === 3. CRASH ===
 // === 3. CRASH (MULTIPLAYER) ===
let crashPollTimer = null;
let crashState = { phase: 'idle' };
let crashLastMult = 1.0;
let crashGraphPoints = [];

const cCanvas = document.getElementById('casinoCrashCanvas');
const cCtx = cCanvas.getContext('2d');

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
    
    // Добавляем точку на график при полёте
if (data.phase === 'flying') {
  crashGraphPoints.push(data.multiplier);
  if (crashGraphPoints.length > 300) crashGraphPoints.shift();
  document.getElementById('casinoCrashMult').textContent = data.multiplier.toFixed(2) + 'x';
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
  // Очищаем canvas полностью
  if (cCtx) cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
  document.getElementById('casinoCrashMult').textContent = '---';
  document.getElementById('casinoCrashMult').style.color = '#334455';
  document.getElementById('casinoCrashLabel').textContent = ct.waiting || '⏳ NEXT ROUND...';
  document.getElementById('casinoCrashStatus').textContent = ct.waitingStatus || 'Wait...';
    document.getElementById('casinoCrashBg').src = '/public/images/cogniq/krash_display_bg_active.png';
    updateCrashMainButton('disabled');
  }
  
  if (phase === 'betting') {
  crashGraphPoints = [1.0];
  // Чистим canvas и рисуем стартовую линию
  if (cCtx) cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
  document.getElementById('casinoCrashMult').textContent = '1.00x';
  document.getElementById('casinoCrashMult').style.color = '#ffaa00';
  document.getElementById('casinoCrashLabel').textContent = ct.betting || '🔥 PLACE YOUR BET!';
  document.getElementById('casinoCrashStatus').textContent = ct.bettingStatus || 'Bet within 3 seconds!';
    document.getElementById('casinoCrashBg').src = '/public/images/cogniq/krash_display_bg_active.png';
    
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
    document.getElementById('casinoCrashBg').src = '/public/images/cogniq/krash_display_bg_active.png';
    
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
    document.getElementById('casinoCrashBg').src = '/public/images/cogniq/krash_display_bg_crashed.png';
    
    if (state.my_bet) {
      if (state.my_bet.status === 'cashed_out') {
        casinoShowToast(`+${state.my_bet.win_amount} IMPULSE (x${state.my_bet.cashed_out_at.toFixed(2)})`, 4000);
      } else if (state.my_bet.status === 'lost') {
        casinoShowToast(`-${state.my_bet.amount} IMPULSE — не успели!`, 3000);
      }
    }
    
    addCrashHistoryItem(state.crash_point);
    updateCrashMainButton('disabled');
    loadCasinoBalance();
    crashGraphPoints.push(state.crash_point);
    drawCrashGraph(true);
  }
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
    img.src = `/public/images/cogniq/krash_btn_main_bet_${currentLang}.png`;
    btn.disabled = false;
    btn.dataset.action = 'bet';
  } else if (type === 'cashout') {
    img.src = `/public/images/cogniq/krash_btn_main_cashout_${currentLang}.png`;
    btn.disabled = false;
    btn.dataset.action = 'cashout';
  } else if (type === 'watching') {
    img.src = `/public/images/cogniq/krash_btn_main_disabled_${currentLang}.png`;
    btn.disabled = true;
    btn.dataset.action = 'none';
  } else {
    img.src = `/public/images/cogniq/krash_btn_main_disabled_${currentLang}.png`;
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
    
    if (data.error) {
      casinoShowToast(data.error);
      updateCrashMainButton('bet');
      return;
    }
    
    balance = data.new_balance;
    const balEl = document.getElementById('casinoBalanceAmount');
    if (balEl) balEl.textContent = balance.toLocaleString();
    
    casinoShowToast(`Ставка ${amount} IMPULSE принята!`, 2000);
    updateCrashMainButton('watching');
  } catch (e) {
    casinoShowToast('Ошибка соединения');
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
      casinoShowToast(data.error);
      updateCrashMainButton('cashout');
      return;
    }
    
    balance = data.new_balance;
    const balEl = document.getElementById('casinoBalanceAmount');
    if (balEl) balEl.textContent = balance.toLocaleString();
    
    casinoShowToast(`+${data.won_amount} IMPULSE на x${data.multiplier.toFixed(2)}!`, 4000);
    updateCrashMainButton('watching');
  } catch (e) {
    casinoShowToast('Ошибка соединения');
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

  // Кнопка назад
  document.getElementById('casinoBackBtn').addEventListener('click', () => {
    casinoContainer.remove();
    pContainer.remove();
    switchTab('game');
  });
}
// ==================== КОНЕЦ КАЗИНО ====================
