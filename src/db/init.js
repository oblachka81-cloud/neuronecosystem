// src/db/init.js
module.exports = async function initDB(pool, loadQuestionsFromDB) {
    await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
      telegram_id BIGINT PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      balance INTEGER DEFAULT 0,
      games_today INTEGER DEFAULT 0,
      last_game_date DATE,
      last_super_game_date DATE,
      super_games_total INTEGER DEFAULT 0,
      super_game_pending BOOLEAN DEFAULT false,
      referrer_id BIGINT,
      referred_count INTEGER DEFAULT 0,
      current_game_index INTEGER DEFAULT 0,
      current_game_score INTEGER DEFAULT 0,
      current_question_order JSONB DEFAULT '[]',
      current_hints_used JSONB DEFAULT '[]',
      current_is_super BOOLEAN DEFAULT false,
      question_start_time BIGINT DEFAULT 0,
      withdraw_tickets INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // 2. Таблицы, на которые раньше был ALTER ДО их создания (фикс для новой БД)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      lang VARCHAR(5) DEFAULT 'ru',
      text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct TEXT NOT NULL,
      translations JSONB DEFAULT '{}'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      wallet TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      processed_at TIMESTAMP,
      tx_hash VARCHAR(200)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS processed_ton_payments (
      id SERIAL PRIMARY KEY,
      tx_hash TEXT UNIQUE NOT NULL,
      user_id TEXT,
      amount bigint DEFAULT 0,
      processed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // 3. Миграции (только users + CREATE для casino-таблиц)
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS super_game_pending BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_game_index INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_game_score INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_question_order JSONB DEFAULT '[]'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_hints_used JSONB DEFAULT '[]'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_is_super BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS question_start_time BIGINT DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS withdraw_tickets INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS super_replay_used BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_burned INTEGER DEFAULT 0`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date DATE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_question_answered BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_streak_bonus_level INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_eternal_weeks INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS recent_questions JSONB DEFAULT '[]'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS channel_bonus_claimed BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(32)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_emoji VARCHAR(8) DEFAULT '🧠'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_mode VARCHAR(16) DEFAULT 'nickname'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_photo_file_id VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_photo_updated_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS games_played_total INTEGER DEFAULT 0`,
    `ALTER TABLE processed_ton_payments ADD COLUMN IF NOT EXISTS amount bigint DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_hints_used INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_cogniq_pack_purchase TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS extra_games INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS stars_spent INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_deeplink_used BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_frame VARCHAR(50) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_purchased INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_registered_at TIMESTAMP`,
    `ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(200)`,

    `CREATE TABLE IF NOT EXISTS blackjack_sessions (
      telegram_id BIGINT PRIMARY KEY,
      deck JSONB NOT NULL,
      player_hands JSONB NOT NULL,
      dealer_hand JSONB NOT NULL,
      bets JSONB NOT NULL,
      insurance_bet INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS mines_sessions (
      telegram_id BIGINT PRIMARY KEY,
      grid JSONB NOT NULL,
      mines_count INTEGER NOT NULL,
      opened JSONB NOT NULL DEFAULT '[]',
      bet INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS crash_bets (
      telegram_id BIGINT PRIMARY KEY,
      bet_amount INT NOT NULL,
      round_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      crash_point NUMERIC(10,2),
      server_seed TEXT,
      status VARCHAR(20) DEFAULT 'active',
      expires_at TIMESTAMP
    )`,
  ];
  for (const m of migrations) await pool.query(m);

// Клинап зависших crash ставок при старте сервера
try {
  await pool.query(`
    UPDATE crash_bets SET status = 'crashed'
    WHERE status = 'active' AND round_start < NOW() - INTERVAL '10 minutes'
  `);
  await pool.query(`
    UPDATE crash_bets SET status = 'crashed'
    WHERE status = 'waiting' AND round_start < NOW() - INTERVAL '1 hour'
  `);
  console.log('[CRASH] Stale bets cleaned up on startup');
} catch (e) {
  console.log('[CRASH] Cleanup skipped (table not yet created)');
}

// Клинап зависших BJ сессий при старте сервера
try {
  await pool.query(`
    DELETE FROM blackjack_sessions
    WHERE created_at < NOW() - INTERVAL '30 minutes'
  `);
  console.log('[BJ] Stale sessions cleaned up on startup');
} catch (e) {
  console.log('[BJ] Cleanup skipped (table not yet created)');
}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      lang VARCHAR(5) DEFAULT 'ru',
      text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_questions (
      id SERIAL PRIMARY KEY,
      question_id INTEGER REFERENCES questions(id),
      posted_date DATE UNIQUE,
      posted_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS translations (
      original TEXT NOT NULL,
      lang VARCHAR(10) NOT NULL,
      translated TEXT NOT NULL,
      PRIMARY KEY (original, lang)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      wallet TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      processed_at TIMESTAMP
    )
  `);
  
   await pool.query(`
   CREATE TABLE IF NOT EXISTS processed_ton_payments (
     id SERIAL PRIMARY KEY,
     tx_hash TEXT UNIQUE NOT NULL,
     user_id TEXT,
     processed_at TIMESTAMP DEFAULT NOW()
   )
 `);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id),
    achievement_key VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_key)
  )
`);
 await pool.query(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('vip', 'premium')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS shop_items (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    emoji VARCHAR(10),
    title_ru VARCHAR(100),
    title_en VARCHAR(100),
    title_fr VARCHAR(100),
    title_es VARCHAR(100),
    price_stars INTEGER,
    price_usdt NUMERIC(10,2),
    price_cogniq INTEGER,
    type VARCHAR(20) DEFAULT 'consumable',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
  await pool.query(`
  INSERT INTO shop_items (key, emoji, title_ru, title_en, title_fr, title_es, price_cogniq, price_usdt, type, active)
  VALUES
    ('frame_neon_basic', '🟦', 'Неон базовый', 'Basic Neon', 'Néon basique', 'Neón básico', 300, NULL, 'avatar_frame', true),
    ('frame_neon_pulse', '🟣', 'Неон-пульс', 'Neon Pulse', 'Néon pulsé', 'Neón pulso', 500, 1.00, 'avatar_frame', true),
    ('frame_neon_gold', '👑', 'Золотой неон', 'Golden Neon', 'Néon doré', 'Neón dorado', NULL, NULL, 'avatar_frame', false)
  ON CONFLICT (key) DO NOTHING
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS shop_purchases (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES shop_items(id),
    item_key VARCHAR(50),
    price_amount NUMERIC(10,2),
    price_currency VARCHAR(10),
    purchased_at TIMESTAMP DEFAULT NOW()
  )
`);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS stakes (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    percent INTEGER NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS casino_spins (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    bet_amount INTEGER NOT NULL,
    bet_type VARCHAR(20) NOT NULL,
    bet_value VARCHAR(20),
    result_number INTEGER NOT NULL,
    win_amount INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_purchased INTEGER DEFAULT 0`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS exchange_orders (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    tx_hash TEXT NOT NULL,
    amount_usdt NUMERIC(10,2) NOT NULL,
    amount_cogniq INTEGER NOT NULL,
    rate INTEGER NOT NULL DEFAULT 200,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    from_user BIGINT NOT NULL,
    to_user BIGINT NOT NULL,
    amount INT NOT NULL,
    commission INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
  // Биржа
await pool.query(`
  CREATE TABLE IF NOT EXISTS exchange_swaps (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    from_currency VARCHAR(20) NOT NULL,
    to_currency VARCHAR(20) NOT NULL,
    from_amount DECIMAL(16,8) NOT NULL,
    to_amount DECIMAL(16,8) NOT NULL,
    rate DECIMAL(16,8) NOT NULL,
    fee DECIMAL(16,8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    tx_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
  await pool.query(`
    ALTER TABLE exchange_swaps 
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
`);
    await pool.query(`
    ALTER TABLE exchange_swaps 
    ADD COLUMN IF NOT EXISTS cogniq_fee INTEGER DEFAULT 0
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS exchange_rates (
    pair VARCHAR(20) PRIMARY KEY,
    rate DECIMAL(16,8) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
  )
`);
  // BURN POOL — история накоплений
await pool.query(`
  CREATE TABLE IF NOT EXISTS burn_pool (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL DEFAULT 'unknown',
    amount INTEGER NOT NULL DEFAULT 0,
    telegram_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);
await pool.query(`ALTER TABLE burn_pool ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'unknown'`);
  await pool.query(`ALTER TABLE burn_pool ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0`);
await pool.query(`ALTER TABLE burn_pool ADD COLUMN IF NOT EXISTS telegram_id BIGINT`);

// BURN HISTORY — история сжиганий
await pool.query(`
  CREATE TABLE IF NOT EXISTS burn_history (
    id SERIAL PRIMARY KEY,
    amount INTEGER NOT NULL,
    tx_hash VARCHAR(200),
    burned_at TIMESTAMPTZ DEFAULT NOW()
  )
`);
  // TRANSACTIONS — история операций
await pool.query(`
  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    direction VARCHAR(10) NOT NULL,
    description JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC)`);

await pool.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at)`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_balance ON users (balance DESC)`);

  const { rows } = await pool.query('SELECT COUNT(*) FROM questions');
  if (parseInt(rows[0].count) === 0) {
    const defaultQuestions = [
      { text: 'Какой язык используется для смарт-контрактов в Ethereum?', options: ['JavaScript', 'Solidity', 'Python', 'C++'], correct: 'Solidity' },
      { text: 'Что такое блокчейн?', options: ['Распределённая база данных', 'Централизованный сервер', 'Язык программирования', 'Криптовалюта'], correct: 'Распределённая база данных' },
      { text: 'Что означает аббревиатура TON?', options: ['Token Of Network', 'The Open Network', 'Transfer Of Nodes', 'Total Open Nodes'], correct: 'The Open Network' },
      { text: 'Кто создал Bitcoin?', options: ['Виталик Бутерин', 'Сатоши Накамото', 'Павел Дуров', 'Илон Маск'], correct: 'Сатоши Накамото' },
      { text: 'Что такое NFT?', options: ['Новый финансовый токен', 'Незаменимый токен', 'Сетевой токен функций', 'Цифровой сертификат'], correct: 'Незаменимый токен' },
      { text: 'Какой консенсус использует Ethereum после The Merge?', options: ['Proof of Work', 'Proof of Stake', 'Proof of Authority', 'Delegated PoS'], correct: 'Proof of Stake' },
      { text: 'Что такое газ в Ethereum?', options: ['Криптовалюта', 'Плата за выполнение транзакций', 'Тип токена', 'Алгоритм шифрования'], correct: 'Плата за выполнение транзакций' },
      { text: 'Как называется кошелёк для TON?', options: ['MetaMask', 'Tonkeeper', 'Trust Wallet', 'Phantom'], correct: 'Tonkeeper' },
      { text: 'Что такое DeFi?', options: ['Децентрализованные финансы', 'Цифровые финансы', 'Прямые инвестиции', 'Деривативы'], correct: 'Децентрализованные финансы' },
      { text: 'Сколько Bitcoin будет существовать всего?', options: ['100 миллионов', '21 миллион', '1 миллиард', 'Без ограничений'], correct: '21 миллион' },
    ];
    for (const q of defaultQuestions) {
      await pool.query(
        'INSERT INTO questions (lang, text, options, correct) VALUES ($1, $2, $3, $4)',
        ['ru', q.text, JSON.stringify(q.options), q.correct]
      );
    }
    console.log('Дефолтные вопросы загружены в БД (10 шт.)');
  }
  await pool.query(`
  CREATE TABLE IF NOT EXISTS impulse_balance (
    user_id BIGINT PRIMARY KEY REFERENCES users(telegram_id),
    balance INTEGER DEFAULT 0,
    last_claim_date DATE
  )
`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS simple_game_pending BOOLEAN DEFAULT false`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_simple_game_date DATE`);

  await loadQuestionsFromDB();
  console.log('БД инициализирована');
};
