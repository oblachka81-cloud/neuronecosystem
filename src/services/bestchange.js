const config = require('../config');

const bestchangeCache = {
  currencies: {},
  rates: {},
  changers: {}
};

const CACHE_TTL_MS = 60000;

async function bestchangeFetch(path) {
  let lastError;
  for (const host of config.BESTCHANGE_API_HOSTS) {
    try {
      const url = `https://${host}/v2/${config.BESTCHANGE_API_KEY}${path}`;
      const resp = await fetch(url, {
        headers: { 'Accept-Encoding': 'gzip', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      lastError = e;
      console.warn(`[BestChange] ${host} failed: ${e.message}, trying next mirror...`);
    }
  }
  throw lastError || new Error('All BestChange mirrors failed');
}

module.exports = { bestchangeCache, bestchangeFetch, CACHE_TTL_MS };
