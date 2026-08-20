// ==================== БИРЖА ====================
const LISTING_TEXTS = {
  ru: 'Листинг COGNIQ запланирован на III-IV квартал 2026 года. Точная дата будет объявлена дополнительно. Следите за новостями в нашем Telegram-канале.',
  en: 'COGNIQ listing is scheduled for Q3-Q4 2026. Exact date to be announced. Follow our Telegram channel for updates.',
  fr: 'Le listing COGNIQ est prévu pour Q3-Q4 2026. La date exacte sera annoncée. Suivez notre canal Telegram.',
  es: 'El listing de COGNIQ está previsto para Q3-Q4 2026. La fecha exacta será anunciada. Sigue nuestro canal de Telegram.'
};

const EXCHANGE_INFO_TEXTS = {
  ru: `
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">1. NEURON EXCHANGE — часть экосистемы</p>
    <p style="margin-bottom:12px;">NEURON Exchange — неотъемлемая часть блокчейн-экосистемы NEURON. Платформа в реальном времени мониторит ведущие децентрализованные биржи экосистемы TON и автоматически выбирает для Вас наилучший курс в момент совершения свопа.</p>
    <p style="text-align:center;color:#fbbf24;font-weight:700;margin-bottom:16px;">STON.fi · DeDust · Megaton Finance</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">2. Безопасность и конфиденциальность</p>
    <p style="margin-bottom:8px;">✅ NEURON Exchange <strong>не хранит Ваши активы</strong>. Все средства находятся на Вашем TON-кошельке.</p>
    <p style="margin-bottom:8px;">🔒 Мы не передаём данные третьим лицам и не собираем личную информацию.</p>
    <p style="color:#fbbf24;margin-bottom:16px;">💛 <strong>Без торговой комиссии.</strong> Только газ платформы (5 COGNIQ) + газ сети TON.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">3. xStocks — токенизированные акции</p>
    <p style="margin-bottom:8px;">xStocks — токенизированные акции мировых компаний на блокчейне TON. Каждый токен обеспечен реальной акцией 1:1.</p>
    <p style="margin-bottom:8px;"><strong>Доступные активы:</strong> AAPLx (Apple), NVDAx (NVIDIA), TSLAx (Tesla), AMZNx (Amazon), SPYx (S&P 500 ETF).</p>
    <p style="margin-bottom:8px;"><strong>Как работает обеспечение:</strong></p>
    <p style="margin-bottom:4px;">🏦 <strong>Обеспечение 1:1.</strong> На каждый токен приобретается реальная акция на NYSE/NASDAQ.</p>
    <p style="margin-bottom:4px;">🏛️ <strong>Кастодиальное хранение.</strong> Ценные бумаги хранятся в регулируемых швейцарских и европейских банках-кастодианах.</p>
    <p style="margin-bottom:4px;">🛡️ <strong>Защита от банкротства (SPV).</strong> Акции изолированы от финансовых рисков эмитента.</p>
    <p style="margin-bottom:8px;">🔍 <strong>Публичный аудит.</strong> Proof-of-Reserves доступен публично. Каждому продукту присвоен ISIN.</p>
    <p style="margin-bottom:8px;">Выпуск токенов осуществляется швейцарской регулируемой компанией <strong>Backed Finance</strong> (Backed Assets Limited).</p>
    <p style="color:#fbbf24;margin-bottom:16px;">💡 При выплате дивидендов или сплитах акций баланс токенов автоматически корректируется через ончейн-ребейзинг.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">4. Как начать торговать</p>
    <p style="margin-bottom:4px;">1. Подключите TON-кошелёк (Tonkeeper, Tonhub, MyTonWallet)</p>
    <p style="margin-bottom:4px;">2. Выберите торговую пару в разделе «Crypto» или «xStocks»</p>
    <p style="margin-bottom:4px;">3. Введите сумму и нажмите «Exchange»</p>
    <p style="margin-bottom:4px;">4. Подтвердите транзакцию в кошельке</p>
    <p style="margin-bottom:16px;">5. Актив автоматически зачисляется на Ваш TON-кошелёк</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">5. NEURON FIAT — Прямой доступ к ликвидности</p>
    <p style="margin-bottom:8px;">NEURON Exchange интегрирован с ведущими агрегаторами рынка: <strong>BestChange, Exchanger и MonitorEC</strong>. Это обеспечивает мгновенный доступ к пулу из <strong>500+ проверенных обменников</strong> и <strong>43 000+ торговых пар</strong> в реальном времени.</p>
    <p style="margin-bottom:4px;"><strong>Верифицированные резервы.</strong> Строгий скоринг партнеров. Мошенники исключаются автоматически.</p>
    <p style="margin-bottom:4px;"><strong>Умный маршрутизатор.</strong> Алгоритм сравнивает курсы с учетом скрытых комиссий.</p>
    <p style="margin-bottom:4px;"><strong>Глобальный охват.</strong> Поддержка фиата десятков стран (USD, EUR, AED и др.).</p>
    <p style="margin-bottom:8px;"><strong>Колоссальные объемы.</strong> Суммарные резервы партнеров превышают $80 млрд.</p>
    <p style="color:#fbbf24;margin-bottom:16px;"><strong>0% скрытых комиссий NEURON.</strong> Вы видите точную сумму к получению до подтверждения сделки.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">6. Дисклеймер</p>
    <p style="color:#667788;font-size:0.85rem;">Торговля токенизированными акциями (xStocks) может быть ограничена или запрещена в некоторых юрисдикциях. Перед использованием убедитесь что это разрешено законодательством Вашей страны. NEURON Exchange предоставляет доступ к децентрализованным протоколам и не несёт ответственности за соблюдение Вами местных законов.</p>
  `,
  en: `
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">1. NEURON EXCHANGE — Part of the Ecosystem</p>
    <p style="margin-bottom:12px;">NEURON Exchange is an integral part of the NEURON blockchain ecosystem. The platform monitors leading decentralized exchanges in the TON ecosystem in real time and automatically selects the best rate for your swap.</p>
    <p style="text-align:center;color:#fbbf24;font-weight:700;margin-bottom:16px;">STON.fi · DeDust · Megaton Finance</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">2. Security & Privacy</p>
    <p style="margin-bottom:8px;">✅ NEURON Exchange <strong>does not store your assets</strong>. All funds remain on your TON wallet.</p>
    <p style="margin-bottom:8px;">🔒 We do not share data with third parties and do not collect personal information.</p>
    <p style="color:#fbbf24;margin-bottom:16px;">💛 <strong>No trading fees.</strong> Only platform gas (5 COGNIQ) + TON network gas.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">3. xStocks — Tokenized Stocks</p>
    <p style="margin-bottom:8px;">xStocks are tokenized shares of global companies on the TON blockchain. Each token is backed 1:1 by a real share.</p>
    <p style="margin-bottom:8px;"><strong>Available assets:</strong> AAPLx (Apple), NVDAx (NVIDIA), TSLAx (Tesla), AMZNx (Amazon), SPYx (S&P 500 ETF).</p>
    <p style="margin-bottom:8px;"><strong>How backing works:</strong></p>
    <p style="margin-bottom:4px;">🏦 <strong>1:1 Backing.</strong> For every token, a real share is purchased on NYSE/NASDAQ.</p>
    <p style="margin-bottom:4px;">🏛️ <strong>Custodial Storage.</strong> Securities are held in regulated Swiss and European custodian banks.</p>
    <p style="margin-bottom:4px;">🛡️ <strong>Bankruptcy Protection (SPV).</strong> Shares are isolated from issuer's financial risks.</p>
    <p style="margin-bottom:8px;">🔍 <strong>Public Audit.</strong> Proof-of-Reserves is publicly available. Each product has an ISIN.</p>
    <p style="margin-bottom:8px;">Token issuance is handled by the Swiss regulated company <strong>Backed Finance</strong> (Backed Assets Limited).</p>
    <p style="color:#fbbf24;margin-bottom:16px;">💡 When dividends are paid or stock splits occur, token balances are automatically adjusted via on-chain rebasing.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">4. How to Start Trading</p>
    <p style="margin-bottom:4px;">1. Connect your TON wallet (Tonkeeper, Tonhub, MyTonWallet)</p>
    <p style="margin-bottom:4px;">2. Choose a trading pair in the "Crypto" or "xStocks" section</p>
    <p style="margin-bottom:4px;">3. Enter the amount and press "Exchange"</p>
    <p style="margin-bottom:4px;">4. Confirm the transaction in your wallet</p>
    <p style="margin-bottom:16px;">5. The asset is automatically credited to your TON wallet</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">5. NEURON FIAT — Direct Access to Global Liquidity</p>
    <p style="margin-bottom:8px;">NEURON Exchange is integrated with leading market aggregators: <strong>BestChange, Exchanger, and MonitorEC</strong>. This provides instant access to a pool of <strong>500+ verified exchangers</strong> and <strong>43,000+ trading pairs</strong> in real time.</p>
    <p style="margin-bottom:4px;"><strong>Verified reserves.</strong> Strict partner scoring. Scammers are automatically excluded.</p>
    <p style="margin-bottom:4px;"><strong>Smart routing.</strong> The algorithm compares rates accounting for hidden payment fees.</p>
    <p style="margin-bottom:4px;"><strong>Global coverage.</strong> Support for fiat from dozens of countries (USD, EUR, AED, etc.).</p>
    <p style="margin-bottom:8px;"><strong>Massive volumes.</strong> Total partner reserves exceed $80 billion.</p>
    <p style="color:#fbbf24;margin-bottom:16px;"><strong>0% hidden NEURON fees.</strong> You see the exact amount to receive before confirming.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">6. Disclaimer</p>
    <p style="color:#667788;font-size:0.85rem;">Trading tokenized stocks (xStocks) may be restricted or prohibited in certain jurisdictions. Before using, ensure it is permitted by your local laws. NEURON Exchange provides access to decentralized protocols and is not responsible for your compliance with local regulations.</p>
  `,
  fr: `
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">1. NEURON EXCHANGE — Partie de l'écosystème</p>
    <p style="margin-bottom:12px;">NEURON Exchange fait partie intégrante de l'écosystème blockchain NEURON. La plateforme surveille les principales bourses décentralisées de l'écosystème TON en temps réel et sélectionne automatiquement le meilleur taux pour votre échange.</p>
    <p style="text-align:center;color:#fbbf24;font-weight:700;margin-bottom:16px;">STON.fi · DeDust · Megaton Finance</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">2. Sécurité et confidentialité</p>
    <p style="margin-bottom:8px;">✅ NEURON Exchange <strong>ne stocke pas vos actifs</strong>. Tous les fonds restent sur votre portefeuille TON.</p>
    <p style="margin-bottom:8px;">🔒 Nous ne partageons pas les données avec des tiers et ne collectons pas d'informations personnelles.</p>
    <p style="color:#fbbf24;margin-bottom:16px;">💛 <strong>Sans frais de trading.</strong> Uniquement le gaz de la plateforme (5 COGNIQ) + gaz du réseau TON.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">3. xStocks — Actions tokenisées</p>
    <p style="margin-bottom:8px;">Les xStocks sont des actions tokenisées de grandes entreprises mondiales sur la blockchain TON. Chaque token est adossé 1:1 à une action réelle.</p>
    <p style="margin-bottom:8px;"><strong>Actifs disponibles :</strong> AAPLx (Apple), NVDAx (NVIDIA), TSLAx (Tesla), AMZNx (Amazon), SPYx (S&P 500 ETF).</p>
    <p style="margin-bottom:4px;">🏦 <strong>Adossement 1:1.</strong> Pour chaque token, une action réelle est achetée sur NYSE/NASDAQ.</p>
    <p style="margin-bottom:4px;">🏛️ <strong>Stockage custodial.</strong> Les titres sont conservés dans des banques dépositaires réglementées suisses et européennes.</p>
    <p style="margin-bottom:4px;">🛡️ <strong>Protection contre la faillite (SPV).</strong> Les actions sont isolées des risques financiers de l'émetteur.</p>
    <p style="margin-bottom:8px;">🔍 <strong>Audit public.</strong> La preuve de réserves est disponible publiquement. Chaque produit a un ISIN.</p>
    <p style="margin-bottom:8px;">L'émission de tokens est gérée par la société suisse réglementée <strong>Backed Finance</strong> (Backed Assets Limited).</p>
    <p style="color:#fbbf24;margin-bottom:16px;">💡 Lors du versement de dividendes ou de fractionnements d'actions, les soldes de tokens sont automatiquement ajustés.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">4. Comment commencer à trader</p>
    <p style="margin-bottom:4px;">1. Connectez votre portefeuille TON (Tonkeeper, Tonhub, MyTonWallet)</p>
    <p style="margin-bottom:4px;">2. Choisissez une paire de trading dans la section «Crypto» ou «xStocks»</p>
    <p style="margin-bottom:4px;">3. Entrez le montant et appuyez sur «Exchange»</p>
    <p style="margin-bottom:4px;">4. Confirmez la transaction dans votre portefeuille</p>
    <p style="margin-bottom:16px;">5. L'actif est automatiquement crédité sur votre portefeuille TON</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">5. NEURON FIAT — Accès direct à la liquidité mondiale</p>
    <p style="margin-bottom:8px;">NEURON Exchange est intégré aux principaux agrégateurs du marché : <strong>BestChange, Exchanger et MonitorEC</strong>. Cela offre un accès instantané à un pool de <strong>plus de 500 échangeurs vérifiés</strong> et <strong>plus de 43 000 paires</strong>.</p>
    <p style="margin-bottom:4px;"><strong>Réserves vérifiées.</strong> Évaluation stricte des partenaires.</p>
    <p style="margin-bottom:4px;"><strong>Routage intelligent.</strong> L'algorithme compare les taux en tenant compte des frais cachés.</p>
    <p style="margin-bottom:4px;"><strong>Couverture mondiale.</strong> Prise en charge des devises de dizaines de pays.</p>
    <p style="margin-bottom:8px;"><strong>Volumes massifs.</strong> Les réserves totales dépassent 80 milliards de dollars.</p>
    <p style="color:#fbbf24;margin-bottom:16px;"><strong>0% de frais cachés NEURON.</strong> Vous voyez le montant exact à recevoir avant de confirmer.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">6. Avertissement</p>
    <p style="color:#667788;font-size:0.85rem;">Le trading d'actions tokenisées (xStocks) peut être restreint ou interdit dans certaines juridictions. Avant utilisation, assurez-vous que cela est autorisé par votre législation locale.</p>
  `,
  es: `
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">1. NEURON EXCHANGE — Parte del ecosistema</p>
    <p style="margin-bottom:12px;">NEURON Exchange es parte integral del ecosistema blockchain NEURON. La plataforma monitorea los principales exchanges descentralizados del ecosistema TON en tiempo real y selecciona automáticamente la mejor tasa.</p>
    <p style="text-align:center;color:#fbbf24;font-weight:700;margin-bottom:16px;">STON.fi · DeDust · Megaton Finance</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">2. Seguridad y Privacidad</p>
    <p style="margin-bottom:8px;">✅ NEURON Exchange <strong>no almacena sus activos</strong>. Todos los fondos permanecen en su billetera TON.</p>
    <p style="margin-bottom:8px;">🔒 No compartimos datos con terceros y no recopilamos información personal.</p>
    <p style="color:#fbbf24;margin-bottom:16px;">💛 <strong>Sin comisiones de trading.</strong> Solo gas de plataforma (5 COGNIQ) + gas de red TON.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">3. xStocks — Acciones Tokenizadas</p>
    <p style="margin-bottom:8px;">xStocks son acciones tokenizadas de empresas globales en la blockchain TON. Cada token está respaldado 1:1 por una acción real.</p>
    <p style="margin-bottom:8px;"><strong>Activos disponibles:</strong> AAPLx (Apple), NVDAx (NVIDIA), TSLAx (Tesla), AMZNx (Amazon), SPYx (S&P 500 ETF).</p>
    <p style="margin-bottom:4px;">🏦 <strong>Respaldo 1:1.</strong> Por cada token, se compra una acción real en NYSE/NASDAQ.</p>
    <p style="margin-bottom:4px;">🏛️ <strong>Custodia.</strong> Los valores se guardan en bancos custodios regulados suizos y europeos.</p>
    <p style="margin-bottom:4px;">🛡️ <strong>Protección de quiebra (SPV).</strong> Las acciones están aisladas de los riesgos financieros del emisor.</p>
    <p style="margin-bottom:8px;">🔍 <strong>Auditoría pública.</strong> Proof-of-Reserves disponible públicamente. Cada producto tiene ISIN.</p>
    <p style="margin-bottom:8px;">La emisión de tokens está a cargo de la empresa regulada suiza <strong>Backed Finance</strong>.</p>
    <p style="color:#fbbf24;margin-bottom:16px;">💡 Cuando se pagan dividendos o se producen divisiones de acciones, los saldos se ajustan automáticamente.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">4. Cómo empezar a operar</p>
    <p style="margin-bottom:4px;">1. Conecte su billetera TON (Tonkeeper, Tonhub, MyTonWallet)</p>
    <p style="margin-bottom:4px;">2. Elija un par en la sección "Crypto" o "xStocks"</p>
    <p style="margin-bottom:4px;">3. Ingrese el monto y presione "Exchange"</p>
    <p style="margin-bottom:4px;">4. Confirme la transacción en su billetera</p>
    <p style="margin-bottom:16px;">5. El activo se acredita automáticamente en su billetera TON</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">5. NEURON FIAT — Acceso directo a la liquidez global</p>
    <p style="margin-bottom:8px;">NEURON Exchange está integrado con los principales agregadores: <strong>BestChange, Exchanger y MonitorEC</strong>. Acceso a <strong>500+ cambiadores verificados</strong> y <strong>43,000+ pares</strong>.</p>
    <p style="margin-bottom:4px;"><strong>Reservas verificadas.</strong> Evaluación estricta de socios.</p>
    <p style="margin-bottom:4px;"><strong>Enrutamiento inteligente.</strong> El algoritmo compara tasas considerando comisiones ocultas.</p>
    <p style="margin-bottom:4px;"><strong>Cobertura global.</strong> Soporte para fiat de decenas de países.</p>
    <p style="margin-bottom:8px;"><strong>Volúmenes masivos.</strong> Las reservas totales superan los $80 mil millones.</p>
    <p style="color:#fbbf24;margin-bottom:16px;"><strong>0% de comisiones ocultas de NEURON.</strong> Ves el monto exacto antes de confirmar.</p>
    <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
    
    <p style="font-size:1.1rem;font-weight:800;color:#fbbf24;margin-bottom:12px;">6. Aviso Legal</p>
    <p style="color:#667788;font-size:0.85rem;">El trading de acciones tokenizadas (xStocks) puede estar restringido en ciertas jurisdicciones. Verifique las leyes locales antes de usar.</p>
  `
};

const EXCHANGE_LANG = {
  ru: {
    walletLabel: 'Подключённый кошелёк',
    notConnected: 'Не подключён',
    connectBtn: 'Подключить',
    fromLabel: 'Отдаю',
    toLabel: 'Получу',
    rateLabel: 'Курс:',
    gasFeeLabel: 'Gas fee=5 COGNIQ',
    historyTitle: '📋 История сделок',
    noHistory: 'Пока нет сделок',
    completed: '✓ Готово',
    pending: '⏳ Ожидание',
    toastConnected: 'Кошелёк подключён!',
    toastNotLoaded: 'TON Connect не загружен',
    toastSwapOk: '✅ Обмен выполнен!',
    toastNeedWallet: 'Сначала подключите кошелёк',
    toastEnterAmount: 'Введите сумму',
    fiatBtn: '💳 Купить / Продать crypto',
    tapeNote: 'NEURON Blockchain Systems — глобальный мониторинг биржевых курсов CEX 24/7. Ваш своп на платформе NEURON исполняется по лучшему ончейн-курсу DEX: мгновенно, без посредников. Дополнительная информация — в разделе «Информация».',
  },
  en: {
    walletLabel: 'Connected Wallet',
    notConnected: 'Not connected',
    connectBtn: 'Connect',
    fromLabel: 'From',
    toLabel: 'To',
    rateLabel: 'Rate:',
    gasFeeLabel: 'Gas fee=5 COGNIQ',
    historyTitle: '📋 Transaction History',
    noHistory: 'No transactions yet',
    completed: '✓ Completed',
    pending: '⏳ Pending',
    toastConnected: 'Wallet connected!',
    toastNotLoaded: 'TON Connect not loaded',
    toastSwapOk: '✅ Exchange completed!',
    toastNeedWallet: 'Connect wallet first',
    toastEnterAmount: 'Enter amount',
    fiatBtn: '💳 Buy / Sell crypto',
    tapeNote: 'NEURON Blockchain Systems — global monitoring of CEX exchange rates 24/7. Your swap on the NEURON platform is executed at the best on-chain DEX rate: instantly, with no intermediaries. Additional information is available in the "Information" section.',
  },
  fr: {
    walletLabel: 'Portefeuille connecté',
    notConnected: 'Non connecté',
    connectBtn: 'Connecter',
    fromLabel: 'Donner',
    toLabel: 'Recevoir',
    rateLabel: 'Taux :',
    gasFeeLabel: 'Gas fee=5 COGNIQ',
    historyTitle: '📋 Historique',
    noHistory: 'Aucune transaction',
    completed: '✓ Terminé',
    pending: '⏳ En attente',
    toastConnected: 'Portefeuille connecté !',
    toastNotLoaded: 'TON Connect non chargé',
    toastSwapOk: '✅ Échange terminé !',
    toastNeedWallet: 'Connectez d\'abord le portefeuille',
    toastEnterAmount: 'Entrez le montant',
    fiatBtn: '💳 Acheter / Vendre crypto',
    tapeNote: 'NEURON Blockchain Systems — surveillance mondiale des cours CEX 24h/24, 7j/7. Votre swap sur la plateforme NEURON est exécuté au meilleur cours on-chain DEX : instantanément, sans intermédiaire. Informations complémentaires dans la section « Information ».',
  },
  es: {
    walletLabel: 'Cartera conectada',
    notConnected: 'No conectada',
    connectBtn: 'Conectar',
    fromLabel: 'Dar',
    toLabel: 'Recibir',
    rateLabel: 'Tasa:',
    gasFeeLabel: 'Gas fee=5 COGNIQ',
    historyTitle: '📋 Historial',
    noHistory: 'Sin transacciones',
    completed: '✓ Completado',
    pending: '⏳ Pendiente',
    toastConnected: '¡Cartera conectada!',
    toastNotLoaded: 'TON Connect no cargado',
    toastSwapOk: '✅ ¡Intercambio completado!',
    toastNeedWallet: 'Conecta la cartera primero',
    toastEnterAmount: 'Ingresa el monto',
    fiatBtn: '💳 Comprar / Vender crypto',
    tapeNote: 'NEURON Blockchain Systems — monitoreo global de tasas CEX 24/7. Tu swap en la plataforma NEURON se ejecuta al mejor tipo on-chain DEX: al instante y sin intermediarios. Información adicional en la sección "Información".',
  }
};

let exchangeRates = {};
let marketTickers = {};
let exchangeWalletConnected = false;
let exchangeWalletAddress = '';

function showListingInfo() {
  const modal = document.getElementById('listingModal');
  const textEl = document.getElementById('listingInfoText');
  textEl.textContent = LISTING_TEXTS[currentLang] || LISTING_TEXTS['en'];
  modal.style.display = 'flex';
}

async function exchangeLoadRates() {
  try {
    const res = await fetch(`${BASE_URL}/api/exchange/rates`);
    const data = await res.json();
    if (data.success) {
      exchangeRates = data.rates;
      exchangeRenderPairs();
      exchangeCalcSwap();
    }
  } catch (e) {
    console.error('Rates error:', e);
  }
}

function exchangeCalcSwap() {
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;
  const amount = parseFloat(document.getElementById('fromAmount').value) || 0;
  const pair = `${from}/${to}`;
  const rate = exchangeRates[pair];
  if (rate && amount > 0) {
    const raw = amount * rate;
    const fee = raw * 0.003;
    const result = raw - fee;
    document.getElementById('toAmount').value = result.toFixed(6);
    document.getElementById('rateInfo').textContent = `1 ${from} = ${rate.toFixed(6)} ${to}`;
    document.getElementById('swapBtn').disabled = !exchangeWalletConnected;
  } else {
    document.getElementById('toAmount').value = '';
    document.getElementById('rateInfo').textContent = '—';
    document.getElementById('swapBtn').disabled = true;
  }
}

function exchangeSwapCurrencies() {
  const from = document.getElementById('fromCurrency');
  const to = document.getElementById('toCurrency');
  const tmp = from.value;
  from.value = to.value;
  to.value = tmp;
  exchangeCalcSwap();
}

async function exchangeConnectWallet() {
  if (!tonConnectUI) initTonConnect();
  if (!tonConnectUI) { showToast(EXCHANGE_LANG[currentLang].toastNotLoaded); return; }
  
  const wallet = tonConnectUI.wallet;
  if (wallet) {
    exchangeWalletConnected = true;
    exchangeWalletAddress = wallet.account.address;
    localStorage.setItem('walletAddress', exchangeWalletAddress);
    localStorage.setItem('walletConnected', 'true');
    document.getElementById('walletAddr').textContent = exchangeWalletAddress.slice(0,6) + '...' + exchangeWalletAddress.slice(-4);
    document.getElementById('swapBtn').disabled = false;
    showToast(EXCHANGE_LANG[currentLang].toastConnected);
  } else {
    try {
      await tonConnectUI.openModal();
    } catch(e) {
      showToast('Не удалось подключить кошелёк');
    }
  }
}

function hexToBase64(hex) {
  if (!hex) return '';
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length === 0 || clean.length % 2 !== 0) return '';
  let binary = '';
  for (let i = 0; i < clean.length; i += 2) {
    binary += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
  }
  return btoa(binary);
}

async function exchangeDoSwap() {
  if (!exchangeWalletConnected) { showToast(EXCHANGE_LANG[currentLang].toastNeedWallet); return; }
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;
  const amount = parseFloat(document.getElementById('fromAmount').value);
  if (!amount || amount <= 0) { showToast(EXCHANGE_LANG[currentLang].toastEnterAmount); return; }
  
  const btn = document.getElementById('swapBtn');
  btn.disabled = true;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/exchange/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromCurrency: from, toCurrency: to, fromAmount: amount })
    });
    const data = await res.json();
    
    if (data.success) {
      showToast(`Сделка создана. Комиссия: ${data.fee.toFixed(6)} ${to} + 5 COGNIQ (gas).`);
      
      const swapDataRes = await authFetch(`${BASE_URL}/api/exchange/swap-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCurrency: from, toCurrency: to, fromAmount: amount, walletAddress: exchangeWalletAddress })
      });
      const swapData = await swapDataRes.json();

      if (!swapData.success) {
        if (swapData.error && swapData.error.includes('COGNIQ')) {
          showToast('Недостаточно COGNIQ! Нужно ' + (swapData.required || 5) + '. Баланс: ' + (swapData.balance || 0));
        } else {
          showToast('Ошибка свопа');
        }
        return;
      }
      if (!swapData.messages?.length) {
        showToast('Ошибка свопа');
        return;
      }

      const validMessages = swapData.messages.map(m => {
        const msg = { address: m.address, amount: String(m.amount) };
        if (m.payload && m.payload.length > 0) {
          const isHex = /^[0-9a-fA-F]+$/.test(m.payload);
          msg.payload = isHex ? hexToBase64(m.payload) : m.payload;
        }
        if (m.stateInit && m.stateInit.length > 0) {
          const isHex = /^[0-9a-fA-F]+$/.test(m.stateInit);
          msg.stateInit = isHex ? hexToBase64(m.stateInit) : m.stateInit;
        }
        return msg;
      });

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: validMessages
      };

      await tonConnectUI.sendTransaction(transaction);
      
      try {
        await authFetch(`${BASE_URL}/api/exchange/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ swapId: data.swapId })
        });
      } catch (e) {
        console.error('Confirm failed:', e);
      }
      
      showToast(EXCHANGE_LANG[currentLang].toastSwapOk);
      exchangeLoadHistory();
    }
  } catch (err) {
    console.error('Swap error:', err);
    showToast('❌ Ошибка: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

const EXCHANGE_CRYPTO_PAIRS = [
  { name: 'TON/USDT', from: 'TON', to: 'USDT' },
  { name: 'USDT/TON', from: 'USDT', to: 'TON' },
  { name: 'BTC/USDT', from: 'BTC', to: 'USDT' },
  { name: 'USDT/BTC', from: 'USDT', to: 'BTC' },
  { name: 'XAUt0/USDT', from: 'XAUt0', to: 'USDT' },
  { name: 'USDT/XAUt0', from: 'USDT', to: 'XAUt0' }
];

const EXCHANGE_XSTOCKS_PAIRS = [
  { name: 'AAPLx/USDT', from: 'AAPLx', to: 'USDT' },
  { name: 'USDT/AAPLx', from: 'USDT', to: 'AAPLx' },
  { name: 'NVDAx/USDT', from: 'NVDAx', to: 'USDT' },
  { name: 'USDT/NVDAx', from: 'USDT', to: 'NVDAx' },
  { name: 'TSLAx/USDT', from: 'TSLAx', to: 'USDT' },
  { name: 'USDT/TSLAx', from: 'USDT', to: 'TSLAx' },
  { name: 'AMZNx/USDT', from: 'AMZNx', to: 'USDT' },
  { name: 'USDT/AMZNx', from: 'USDT', to: 'AMZNx' },
  { name: 'SPYx/USDT', from: 'SPYx', to: 'USDT' },
  { name: 'USDT/SPYx', from: 'USDT', to: 'SPYx' }
];

function exchangeRenderPairs() {
  exchangeRenderPairGrid('pairsCrypto', EXCHANGE_CRYPTO_PAIRS);
  exchangeRenderPairGrid('pairsXstocks', EXCHANGE_XSTOCKS_PAIRS);
}

function exchangeRenderPairGrid(id, pairsList) {
  const grid = document.getElementById(id);
  grid.innerHTML = pairsList.map(p => {
    const rate = exchangeRates[`${p.from}/${p.to}`];
    const asset = p.from !== 'USDT' ? p.from : p.to;
    const mkt = marketTickers[asset];
    let pct = '', spark = '';
    if (mkt && isFinite(mkt.change24h)) {
      const pc = mkt.change24h * 100;
      const up = pc >= 0;
      pct = `<span style="font-size:0.68rem;font-weight:700;color:${up ? '#00ffaa' : '#ff5566'};">${up ? '▲' : '▼'}${Math.abs(pc).toFixed(1)}%</span>`;
      spark = sparkSvg(mkt.spark, up);
    }
    return `<div class="pair-card" onclick="exchangeSelectPair('${p.from}','${p.to}')" style="position:relative;background:none;border:none;padding:0;">
      <img src="/public/images/cogniq/exchange_pair_card.webp" style="width:100%;display:block;">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:0 36px 0 12px;">
        <div style="font-size:0.8rem;font-weight:600;color:#ffcc44;margin-bottom:2px;">${p.name}</div>
        <div style="display:flex;align-items:baseline;gap:6px;justify-content:center;font-size:0.75rem;color:#ffcc44;">${rate ? fmtRate(rate) : '—'} ${pct}</div>
        ${spark}
      </div>
    </div>`;
  }).join('');
}

// ==================== NEURON LIVE ЛЕНТА ====================
let tapeCategory = 'crypto';
const TAPE_ICONS = { TON: '💎', BTC: '₿', XAUt0: '🥇', AAPLx: '', NVDAx: '🟩', TSLAx: '🚗', AMZNx: '📦', SPYx: '📈' };

function tapeFmt(p) {
  if (!isFinite(p)) return '—';
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 10) return p.toFixed(2);
  return p.toFixed(4);
}

function sparkSvg(spark, up) {
  if (!spark || spark.length < 2) return '';
  const min = Math.min(...spark), max = Math.max(...spark);
  const range = max - min || 1;
  const pts = spark.map((v, i) => {
    const x = (i / (spark.length - 1)) * 100;
    const y = 12 - ((v - min) / range) * 10 + 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = up ? '#00ffaa' : '#ff5566';
  return `<svg viewBox="0 0 100 14" preserveAspectRatio="none" style="width:68%;height:14px;display:block;opacity:0.75;margin-top:2px;"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}

async function loadMarketExtras() {
  try {
    const [c, x] = await Promise.allSettled([
      fetch(`${BASE_URL}/api/market/tickers?category=crypto`).then(r => r.json()),
      fetch(`${BASE_URL}/api/market/tickers?category=xstocks`).then(r => r.json())
    ]);
    for (const r of [c, x]) {
      if (r.status === 'fulfilled' && r.value.success) Object.assign(marketTickers, r.value.tickers);
    }
    exchangeRenderPairs();
  } catch (e) { console.error('[MARKET]', e); }
}

function fmtRate(r) {
  if (!isFinite(r)) return '—';
  if (r >= 10000) return r.toFixed(2);
  if (r >= 1) return r.toFixed(4);
  return parseFloat(r.toPrecision(4)).toString();
}
// ==================== NEURON LIVE ГРАФИК ====================
function candlesSvg(candles) {
  if (!candles || !candles.length) return '<div style="color:#5577aa;text-align:center;padding:20px;">—</div>';
  const W = 320, H = 160;
  const min = Math.min(...candles.map(c => c.l));
  const max = Math.max(...candles.map(c => c.h));
  const range = max - min || 1;
  const cw = (W - 12) / candles.length;
  let s = '';
  candles.forEach((c, i) => {
    const x = 6 + i * cw + cw / 2;
    const y = v => ((max - v) / range) * (H - 20) + 10;
    const up = c.c >= c.o;
    const col = up ? '#00ffaa' : '#ff5566';
    s += `<line x1="${x}" y1="${y(c.h)}" x2="${x}" y2="${y(c.l)}" stroke="${col}" stroke-width="1"/>`;
    s += `<rect x="${x - cw * 0.3}" y="${Math.min(y(c.o), y(c.c))}" width="${cw * 0.6}" height="${Math.max(2, Math.abs(y(c.o) - y(c.c)))}" fill="${col}"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">${s}</svg>`;
}

let liveChartSymbol = 'TON';
let liveChartCategory = 'crypto';
let liveInterval = '60m';
const liveChartCache = {};
const LIVE_ASSETS = { crypto: ['TON', 'BTC', 'XAUt0'], xstocks: ['AAPLx', 'NVDAx', 'TSLAx', 'AMZNx', 'SPYx'] };
const LIVE_INTERVALS = [['60m', '1H'], ['4h', '4H'], ['1d', '1D'], ['1w', '1W']];

function renderLiveChips() {
  const wrap = document.getElementById('liveChartChips');
  if (!wrap) return;
  let html = LIVE_ASSETS[liveChartCategory].map(a =>
    `<button onclick="liveSelectAsset('${a}')" style="padding:3px 7px;border-radius:8px;border:1px solid rgba(255,170,0,0.25);background:${a === liveChartSymbol ? 'rgba(255,170,0,0.3)' : 'rgba(0,0,0,0.4)'};color:#ffcc44;font-size:0.58rem;font-weight:700;cursor:pointer;">${a}</button>`
  ).join('');
  html += LIVE_INTERVALS.map(([iv, lb]) =>
    `<button onclick="liveSetInterval('${iv}')" style="padding:3px 7px;border-radius:8px;border:1px solid rgba(85,119,170,0.4);background:${iv === liveInterval ? 'rgba(85,119,170,0.35)' : 'rgba(0,0,0,0.4)'};color:#88aadd;font-size:0.58rem;font-weight:700;cursor:pointer;${iv === '60m' ? 'margin-left:auto;' : ''}">${lb}</button>`
  ).join('');
  wrap.innerHTML = html;
}

function liveSelectAsset(sym) {
  liveChartSymbol = sym;
  liveChartCategory = LIVE_ASSETS.crypto.includes(sym) ? 'crypto' : 'xstocks';
  renderLiveChips();
  loadLiveChart();
}

function liveSetInterval(iv) {
  liveInterval = iv;
  renderLiveChips();
  loadLiveChart();
}

function setLiveScale(scale) {
  const et = document.getElementById('liveScaleTop');
  const em = document.getElementById('liveScaleMid');
  const eb = document.getElementById('liveScaleBot');
  if (et) et.textContent = tapeFmt(scale[0]);
  if (em) em.textContent = tapeFmt(scale[1]);
  if (eb) eb.textContent = tapeFmt(scale[2]);
}

async function loadLiveChart() {
  const body = document.getElementById('liveChartBody');
  if (!body) return;
  const title = document.getElementById('liveChartTitle');
  const lb = (LIVE_INTERVALS.find(([iv]) => iv === liveInterval) || ['', '1H'])[1];
  if (title) title.textContent = `${TAPE_ICONS[liveChartSymbol] || ''} ${liveChartSymbol}/USDT · ${lb}`;
  const key = `${liveChartSymbol}_${liveInterval}`;
  if (liveChartCache[key]) {
    body.innerHTML = liveChartCache[key].html;
    setLiveScale(liveChartCache[key].scale);
    return;
  }
  try {
    const res = await fetch(`${BASE_URL}/api/market/klines?symbol=${liveChartSymbol}&interval=${liveInterval}&limit=48`);
    const data = await res.json();
    if (data.success && data.candles.length) {
      const html = candlesSvg(data.candles);
      const max = Math.max(...data.candles.map(c => c.h));
      const min = Math.min(...data.candles.map(c => c.l));
      const scale = [max, (max + min) / 2, min];
      liveChartCache[key] = { html, scale };
      const b = document.getElementById('liveChartBody');
      if (b) b.innerHTML = html;
      setLiveScale(scale);
    }
  } catch (e) {}
}

async function loadMarketTape(category) {
  const switched = category && category !== tapeCategory;
  tapeCategory = category || tapeCategory;
  const inner = document.getElementById('tapeInner');
  if (!inner) return;
  try {
    const res = await fetch(`${BASE_URL}/api/market/tickers?category=${tapeCategory}`);
    const data = await res.json();
    if (!data.success || !Object.keys(data.tickers).length) return;
    const entries = Object.entries(data.tickers);
    
    if (switched || !inner.dataset.animated) {
      // Первый рендер или переключение чипа — полный рендер + запуск анимации
      const items = entries.map(([sym, t]) => {
        let chg = '';
        if (isFinite(t.change24h)) {
          const pct = t.change24h * 100;
          const up = pct >= 0;
          chg = `<span class="tape-chg" style="color:${up ? '#00ffaa' : '#ff5566'}">${up ? '▲' : '▼'}${Math.abs(pct).toFixed(1)}%</span>`;
        }
        return `<span class="tape-item" style="padding:0 16px;font-size:0.8rem;font-weight:600;color:#ffcc44;">${TAPE_ICONS[sym] || '•'} ${sym} <span class="tape-price">${tapeFmt(t.price)}</span> ${chg}</span>`;
      }).join('');
      inner.innerHTML = items + items;
      inner.style.animation = 'none';
      void inner.offsetWidth;
      inner.style.animation = `tapeScroll ${Math.max(8, inner.scrollWidth / 200)}s linear infinite`;
      inner.dataset.animated = '1';
    } else {
      // Обновление — меняем только цифры, анимация продолжается
      const spans = inner.querySelectorAll('.tape-item');
      entries.forEach(([sym, t], idx) => {
        const el = spans[idx];
        if (!el) return;
        const priceEl = el.querySelector('.tape-price');
        const chgEl = el.querySelector('.tape-chg');
        if (priceEl) priceEl.textContent = tapeFmt(t.price);
        if (chgEl && isFinite(t.change24h)) {
          const pct = t.change24h * 100;
          const up = pct >= 0;
          chgEl.textContent = `${up ? '▲' : '▼'}${Math.abs(pct).toFixed(1)}%`;
          chgEl.style.color = up ? '#00ffaa' : '#ff5566';
        }
      });
    }
  } catch (e) { console.error('[TAPE]', e); }
}


function exchangeSwitchPairTab(tab) {
  const crypto = document.getElementById('pairsCrypto');
  const xstocks = document.getElementById('pairsXstocks');
  const tabCryptoImg = document.querySelector('#tabCrypto img');
  const tabXstocksImg = document.querySelector('#tabXstocks img');
  
  if (tab === 'crypto') {
    crypto.style.display = 'grid';
    xstocks.style.display = 'none';
    tabCryptoImg.style.filter = 'brightness(1.2)';
    tabXstocksImg.style.filter = 'brightness(0.6)';
  } else {
    crypto.style.display = 'none';
    xstocks.style.display = 'grid';
    tabXstocksImg.style.filter = 'brightness(1.2)';
    tabCryptoImg.style.filter = 'brightness(0.6)';
  }
  loadMarketTape(tab === 'crypto' ? 'crypto' : 'xstocks');
  liveChartCategory = tab === 'crypto' ? 'crypto' : 'xstocks';
  liveChartSymbol = tab === 'crypto' ? 'TON' : 'AAPLx';
  renderLiveChips();
  loadLiveChart();
}

function exchangeSelectPair(from, to) {
  document.getElementById('fromCurrency').value = from;
  document.getElementById('toCurrency').value = to;
  exchangeCalcSwap();
}

async function exchangeLoadHistory() {
  try {
    const res = await authFetch(`${BASE_URL}/api/exchange/history`);
    const data = await res.json();
    if (data.success && data.swaps && data.swaps.length) {
      document.getElementById('historyList').innerHTML = data.swaps.map(s => `
        <div class="history-item">
          <div>
            <div style="color:#cceeff;font-weight:600;">${s.from_currency} → ${s.to_currency}</div>
            <div style="color:#fff;">${s.from_amount} → ${s.to_amount}</div>
            <div style="color:#ffaa00;font-size:0.72rem;margin-top:2px;">⛽ Gas: ${s.cogniq_fee || 5} COGNIQ</div>
          </div>
          <div class="status-${s.status}">${s.status === 'completed' ? EXCHANGE_LANG[currentLang].completed : EXCHANGE_LANG[currentLang].pending}</div>
        </div>`).join('');
    } else {
      document.getElementById('historyList').innerHTML = `<div class="loader">${EXCHANGE_LANG[currentLang].noHistory}</div>`;
    }
  } catch (e) {
    console.error('History error:', e);
  }
}

// ==================== РЕНДЕР БИРЖИ В SPA ====================
function loadExchangePanel() {
  const ex = EXCHANGE_LANG[currentLang] || EXCHANGE_LANG['en'];
  
  root.innerHTML = `
    <div class="exchange-card" style="max-width:480px;width:100%;margin:0 auto;padding:24px 16px;position:relative;z-index:3;">
      <button onclick="loadFiatPanel()" id="fiatBtn" style="position:relative;background:none;border:none;padding:0;cursor:pointer;width:100%;margin:0 0 16px 0;">
        <img src="/exchange/fiat_btn.webp" style="width:100%;height:auto;display:block;">
        <span id="fiatBtnText" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:700;font-size:0.9rem;color:#ffcc44;white-space:nowrap;">${ex.fiatBtn}</span>
      </button>

      <div style="position:relative;margin-bottom:16px;">
        <img src="/public/images/cogniq/exchange_wallet_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
        <div style="position:relative;z-index:1;padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:0.75rem;color:#5577aa;" id="walletLabel">${ex.walletLabel}</div>
              <div style="font-size:0.9rem;font-weight:700;color:#fff;" id="walletAddr">${ex.notConnected}</div>
            </div>
            <button onclick="exchangeConnectWallet()" style="background:none;border:none;padding:8px 16px;font-size:0.8rem;font-weight:700;color:#00ffff;cursor:pointer;" id="connectWalletBtn">${ex.connectBtn}</button>
          </div>
        </div>
      </div>

      <div style="position:relative;margin-bottom:16px;">
        <img src="/public/images/cogniq/exchange_coming_soon_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
        <div style="position:relative;z-index:1;padding:16px;display:flex;align-items:center;justify-content:center;gap:12px;">
          <div>
            <div style="font-size:0.95rem;font-weight:700;color:#ffcc44;">COGNIQ / USDT</div>
            <div style="font-size:0.78rem;color:#aa9955;">Premium Trading Pair</div>
          </div>
          <button onclick="showListingInfo()" style="background:none;border:none;padding:0;cursor:pointer;">
            <img src="/public/images/cogniq/exchange_lock_btn.webp" style="height:44px;width:auto;display:block;">
          </button>
        </div>
      </div>

      <div style="position:relative;margin-bottom:16px;">
        <img src="/public/images/cogniq/exchange_swap_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
        <div style="position:relative;z-index:1;padding:18px;">
          <div style="margin-bottom:12px;">
            <div style="font-size:0.75rem;color:#5577aa;margin-bottom:4px;" id="fromLabel">${ex.fromLabel}</div>
            <div style="display:flex;gap:8px;">
              <input type="number" id="fromAmount" placeholder="0.00" oninput="exchangeCalcSwap()" style="flex:1;padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:1rem;outline:none;">
              <select id="fromCurrency" onchange="exchangeCalcSwap()" style="padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.9rem;outline:none;">
                <option value="TON">TON</option>
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="XAUt0">XAUt0 (Gold)</option>
                <option value="AAPLx">AAPLx</option>
                <option value="NVDAx">NVDAx</option>
                <option value="TSLAx">TSLAx</option>
                <option value="AMZNx">AMZNx</option>
                <option value="SPYx">SPYx</option>
              </select>
            </div>
          </div>

          <div style="display:flex;justify-content:center;margin:8px 0;">
            <button onclick="exchangeSwapCurrencies()" style="background:none;border:none;padding:0;cursor:pointer;">
              <img src="/public/images/cogniq/exchange_swap_arrows.webp" style="width:36px;height:36px;display:block;">
            </button>
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-size:0.75rem;color:#5577aa;margin-bottom:4px;" id="toLabel">${ex.toLabel}</div>
            <div style="display:flex;gap:8px;">
              <input type="number" id="toAmount" placeholder="0.00" readonly style="flex:1;padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:1rem;outline:none;">
              <select id="toCurrency" onchange="exchangeCalcSwap()" style="padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.9rem;outline:none;">
                <option value="USDT">USDT</option>
                <option value="TON">TON</option>
                <option value="BTC">BTC</option>
                <option value="XAUt0">XAUt0 (Gold)</option>
                <option value="AAPLx">AAPLx</option>
                <option value="NVDAx">NVDAx</option>
                <option value="TSLAx">TSLAx</option>
                <option value="AMZNx">AMZNx</option>
                <option value="SPYx">SPYx</option>
              </select>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#5577aa;margin-bottom:12px;">
            <span><span id="rateLabel">${ex.rateLabel}</span> <span id="rateInfo">—</span></span>
            <span id="gasFeeLabel">${ex.gasFeeLabel}</span>
          </div>

          <button id="swapBtn" onclick="exchangeDoSwap()" disabled style="background:none;border:none;padding:0;cursor:pointer;width:100%;">
            <img src="/public/images/cogniq/exchange_swap_btn.webp" style="width:100%;height:auto;display:block;">
          </button>
        </div>
      </div>

      <div id="liveMarketWrap" style="position:relative;margin:0 0 16px 0;border:1px solid rgba(255,170,0,0.25);border-radius:14px;background:rgba(10,16,32,0.75);padding:10px 10px 6px 10px;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span id="liveChartTitle" style="font-size:0.72rem;font-weight:700;color:#ffcc44;">💎 TON/USDT · 1H</span>
          <span style="font-size:0.6rem;color:#5577aa;">NEURON Live Market</span>
        </div>
        <div id="liveChartChips" style="display:flex;gap:4px;margin-bottom:6px;"></div>
        <div style="position:relative;height:110px;margin-bottom:8px;">
          <div id="liveChartBody" style="height:100%;overflow:hidden;"></div>
          <span id="liveScaleTop" style="position:absolute;top:2px;right:4px;font-size:0.55rem;color:#7799bb;z-index:2;"></span>
          <span id="liveScaleMid" style="position:absolute;top:50%;right:4px;transform:translateY(-50%);font-size:0.55rem;color:#7799bb;z-index:2;"></span>
          <span id="liveScaleBot" style="position:absolute;bottom:2px;right:4px;font-size:0.55rem;color:#7799bb;z-index:2;"></span>
        </div>
        <div id="tickerTapeWrap" style="overflow:hidden;position:relative;height:30px;border-top:1px solid rgba(255,170,0,0.15);">
          <div id="tapeInner" style="display:flex;align-items:center;height:100%;white-space:nowrap;will-change:transform;width:max-content;"></div>
        </div>
        <div id="tapeNoteWrap" style="overflow:hidden;position:relative;height:20px;">
          <div id="tapeNoteInner" style="display:flex;align-items:center;height:100%;white-space:nowrap;will-change:transform;width:max-content;">
            <span style="padding:0 24px;font-size:0.6rem;color:#5577aa;">${ex.tapeNote}</span>
            <span style="padding:0 24px;font-size:0.6rem;color:#5577aa;">${ex.tapeNote}</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <button onclick="openExchangeInfoModal()" style="background:none;border:none;padding:0;cursor:pointer;display:block;margin-bottom:10px;width:100%;">
         <img id="exchangeInfoImg" src="/public/images/cogniq/exchange_info_${currentLang}.webp" style="width:100%;height:auto;display:block;">
        </button>
        <div style="display:flex;gap:6px;margin-bottom:10px;">
          <button id="tabCrypto" onclick="exchangeSwitchPairTab('crypto')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
            <img src="/public/images/cogniq/exchange_tab_crypto.webp" style="width:100%;height:auto;display:block;">
          </button>
          <button id="tabXstocks" onclick="exchangeSwitchPairTab('xstocks')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
            <img src="/public/images/cogniq/exchange_tab_xstocks.webp" style="width:100%;height:auto;display:block;">
          </button>
        </div>
        <div id="pairsCrypto" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"></div>
        <div id="pairsXstocks" style="display:none;grid-template-columns:1fr 1fr;gap:10px;"></div>
      </div>

      <div>
        <div style="font-size:0.78rem;font-weight:700;color:#5577aa;margin-bottom:8px;" id="historyTitle">${ex.historyTitle}</div>
        <div id="historyList"><div class="loader">${ex.noHistory}</div></div>
      </div>
    </div>

    <div id="listingModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(6px);" onclick="if(event.target===this)this.style.display='none'">
      <div style="background:rgba(10,18,38,0.98);border:1px solid rgba(255,200,50,0.3);border-radius:20px;padding:24px 20px;max-width:400px;width:90%;text-align:center;">
        <div style="font-size:1.2rem;font-weight:800;color:#ffcc44;margin-bottom:16px;">🔒 COGNIQ / USDT</div>
        <div id="listingInfoText" style="font-size:0.9rem;color:#aabbcc;line-height:1.6;margin-bottom:20px;"></div>
        <button onclick="document.getElementById('listingModal').style.display='none'" style="background:rgba(255,200,50,0.1);border:1px solid rgba(255,200,50,0.3);border-radius:28px;padding:10px 24px;font-size:0.9rem;font-weight:700;color:#ffcc44;cursor:pointer;">OK</button>
      </div>
    </div>
  `;

  // Проверяем сохранённый кошелёк
  const savedAddress = localStorage.getItem('walletAddress');
  if (savedAddress) {
    exchangeWalletAddress = savedAddress;
    document.getElementById('walletAddr').textContent = savedAddress.slice(0,6) + '...' + savedAddress.slice(-4);
  }
  if (tonConnectUI?.wallet) {
    exchangeWalletConnected = true;
    exchangeWalletAddress = tonConnectUI.wallet.account.address;
    document.getElementById('walletAddr').textContent = exchangeWalletAddress.slice(0,6) + '...' + exchangeWalletAddress.slice(-4);
    document.getElementById('swapBtn').disabled = false;
  }

    exchangeLoadRates();
  exchangeLoadHistory();
  setInterval(exchangeLoadRates, 60000);
  if (!document.getElementById('tapeStyle')) {
    const st = document.createElement('style');
    st.id = 'tapeStyle';
    st.textContent = '@keyframes tapeScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}';
    document.head.appendChild(st);
  }
  renderLiveChips();
  loadLiveChart();
  loadMarketTape('crypto');
  if (!window._tapeInterval) window._tapeInterval = setInterval(() => loadMarketTape(), 30000);
  const noteInner = document.getElementById('tapeNoteInner');
  if (noteInner) {
    noteInner.style.animation = `tapeScroll ${Math.max(20, noteInner.scrollWidth / 40)}s linear infinite`;
  }
  loadMarketExtras();
  if (!window._mktInterval) window._mktInterval = setInterval(loadMarketExtras, 60000);

  // Модалка информации
  const infoModal = document.createElement('div');
  infoModal.id = 'exchangeInfoModal';
  infoModal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:1000;overflow-y:auto;';
  infoModal.innerHTML = `
    <div style="background:rgba(10,10,20,0.98);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:20px;max-width:500px;width:92%;margin:40px auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="font-size:1.1rem;font-weight:800;color:#fbbf24;">💛 EXCHANGE INFO</span>
        <button onclick="closeExchangeInfoModal()" style="background:none;border:none;color:#8899aa;font-size:1.5rem;cursor:pointer;">✕</button>
      </div>
      <div id="exchangeInfoContent" style="color:#c0c8d8;font-size:0.9rem;line-height:1.7;"></div>
    </div>
  `;
  document.body.appendChild(infoModal);
}

function openExchangeInfoModal() {
  const modal = document.getElementById('exchangeInfoModal');
  const content = document.getElementById('exchangeInfoContent');
  const info = EXCHANGE_INFO_TEXTS[currentLang] || EXCHANGE_INFO_TEXTS['ru'];
  content.innerHTML = info;
  modal.style.display = 'block';
}

function closeExchangeInfoModal() {
  document.getElementById('exchangeInfoModal').style.display = 'none';
}

