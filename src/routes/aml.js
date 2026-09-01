const express = require('express');
const router = express.Router();
const { requireInitData } = require('../middleware/auth');
const { publicRateLimit } = require('../middleware/rateLimit');

// In-memory кэш (на 1 час)
const amlCache = new Map();
const CACHE_TTL = 3600000; // 1 час

router.get('/api/aml/check', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const addr = req.query.address?.trim();
    
    if (!addr) {
      return res.status(400).json({ error: 'Address required' });
    }
    
    // Валидация формата
    if (!/^(EQ|UQ|0:)[A-Za-z0-9_\-]{40,}/.test(addr)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    // Проверка кэша
    const cacheKey = addr.toLowerCase();
    const cached = amlCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[AML] cache hit: ${addr.slice(0, 10)}...`);
      return res.json(cached.data);
    }
    
    // Запрос к TonAPI
    const response = await fetch(`https://tonapi.io/v2/accounts/${encodeURIComponent(addr)}`, {
      headers: {
        'Authorization': process.env.TONAPI_KEY ? `Bearer ${process.env.TONAPI_KEY}` : '',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // Адрес не найден — считаем чистым (новый кошелёк)
        const result = { 
          status: 'clean', 
          is_scam: false,
          is_new: true,
          source: 'tonapi'
        };
        amlCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return res.json(result);
      }
      console.error(`[AML] TonAPI error: ${response.status}`);
      return res.status(502).json({ error: 'AML provider error' });
    }
    
    const data = await response.json();
    
    // Нормализация результата
    const result = {
      address: data.address,
      status: data.is_scam ? 'scam' : 'clean',
      is_scam: data.is_scam === true,
      name: data.name || null,
      interfaces: data.interfaces || [],
      balance: data.balance || '0',
      source: 'tonapi',
      checked_at: new Date().toISOString()
    };
    
    // Дополнительные сигналы опасности
    const riskSignals = [];
    
    // Миксеры и известные плохие интерфейсы
    const suspiciousInterfaces = ['jetton_master_tep87', 'nft_item_editable'];
    for (const iface of result.interfaces) {
      if (suspiciousInterfaces.includes(iface)) {
        riskSignals.push(`suspicious_interface: ${iface}`);
      }
    }
    
    // Если is_scam от TonAPI — это главный сигнал
    if (result.is_scam) {
      riskSignals.push('tonapi_scam_flag');
    }
    
    result.risk_signals = riskSignals;
    result.risk_level = riskSignals.length === 0 ? 'low' : riskSignals.length < 2 ? 'medium' : 'high';
    
    // Сохраняем в кэш
    amlCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    // Очистка старых записей (если кэш больше 1000)
    if (amlCache.size > 1000) {
      const oldest = [...amlCache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 100);
      for (const [key] of oldest) {
        amlCache.delete(key);
      }
    }
    
    console.log(`[AML] checked: ${addr.slice(0, 10)}... → ${result.status} (${result.risk_level})`);
    
    res.json(result);
  } catch (e) {
    console.error('[AML] check error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
