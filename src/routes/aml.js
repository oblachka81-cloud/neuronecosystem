const express = require('express');
const router = express.Router();
const { requireInitData } = require('../middleware/auth');
const { publicRateLimit } = require('../middleware/rateLimit');

router.get('/api/aml/check', requireInitData, publicRateLimit, async (req, res) => {
  try {
    const addr = req.query.address;
    
    if (!addr) {
      return res.status(400).json({ error: 'Address required' });
    }
    
    const response = await fetch(`https://tonapi.io/v2/address/${addr}/status`);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'TonAPI error' });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('[AML] check error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
