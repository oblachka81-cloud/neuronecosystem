const { Omniston, isSwapQuote } = require('@ston-fi/omniston-sdk');

const COGNIQ_FEE = 5;

const TOKEN_MAP = {
  'TON':  'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S',
  'GRAM': 'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S',
  'USDT': 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  'BTC':  'EQDhyPzbIjJT_WnY3gGprjSYUK9fiGMjWMezxO8MZiUdfb_B',
  'XAUt0': 'EQA1R_LuQCLHlMgOo1S4G7Y7W1cd0FrAkbA10Zq7rddKxi9k',
  'AAPLx': 'EQDsjAwfKo-6FVZv2EYt-1CaZTY_ZL-pfkSId6jeQchNwmdo',
  'NVDAx': 'EQCva-Of7acQdU_piADdlcbzsFtA-xJwZoctz8ZOXBdBoaB8',
  'TSLAx': 'EQB4IwqWZPUczntdry8vSN2tsJKt-9F7iIb7gEFREYYOB563',
  'AMZNx': 'EQCtD2-7qxHhQoNhxri2JSzH-dlmWqKYCDtlEZqRi3-56gd9',
  'SPYx':  'EQB1fyBAA9qQDP6LEGaF3cbU-Xbr-p6ESBZGnqlHkHIHAJZv',
  'COINx': 'EQCvk4Oq2l5Yts_S7Q4j08fB9Ftzx3IY-7UI1AqssyKGDt_I',
  'HOODx': 'EQAHz1jK27NO5IdHrht8146-EFz9p4kSZZx2H1xXuNQOYp_r',
  'MSTRx': 'EQBbsLYH5sD74gYO4DOoj0QsHaNL81NLD13AdhkmD0Up-46H',
  'QQQx':  'EQCe6utwqROmrO_cOUUvVNYkvyecUjfugtugvhUwlVYSEm7x'
};

const DECIMALS = {
  'TON': 9, 'GRAM': 9, 'USDT': 6, 'BTC': 8, 'XAUt0': 6,
  'AAPLx': 6, 'NVDAx': 6, 'TSLAx': 6, 'AMZNx': 6, 'SPYx': 6,
  'COINx': 8,
  'HOODx': 8,
  'MSTRx': 8,
  'QQQx':  8
};

const OPERATIONAL_WALLET = 'UQBniD_M-MTeVqUbWshZrXdQcz0m8lPstG3mQg1AL5KKCGSv';

const omniston = new Omniston({ apiUrl: 'wss://omni-ws.ston.fi' });

function toUnitsForSwap(amount, currency) {
  const decimals = DECIMALS[currency.toUpperCase()] || 9;
  return BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();
}

function toAssetId(symbolOrAddress) {
  const sym = symbolOrAddress.toUpperCase();
  if (sym === 'TON' || sym === 'GRAM') {
    return { chain: { $case: 'ton', value: { kind: { $case: 'native' } } } };
  }
  const addr = TOKEN_MAP[sym] || symbolOrAddress;
  return { chain: { $case: 'ton', value: { kind: { $case: 'jetton', value: addr } } } };
}

function safePayload(p) {
  if (!p) return '';
  if (/^[0-9a-fA-F]+$/.test(p) && p.length % 2 === 0) return p;
  try { return Buffer.from(p, 'base64').toString('hex'); } catch { return ''; }
}

async function requestQuoteWithFee(omniston, params) {
  const { inputAsset, outputAsset, units } = params;
  const opWallet = { chain: { $case: 'ton', value: OPERATIONAL_WALLET } };

  try {
    return await new Promise((resolve, reject) => {
      const sub = omniston.requestForQuote({
        inputAsset, outputAsset,
        amount: { $case: 'inputUnits', value: units.toString() },
        integratorAddress: opWallet,
        integratorFeePips: 3000,
        settlementParams: [{ 
          params: { $case: 'swap', value: { maxPriceSlippagePips: 10000, flexibleIntegratorFee: false } }
        }]
      }).subscribe({
        next(event) {
          if (event?.$case === 'quoteUpdated') { 
            sub.unsubscribe(); 
            console.log('RFQ FULL RESPONSE:', JSON.stringify(event.value, null, 2));
            resolve(event.value); 
          }
          else if (event?.$case === 'noQuote') { sub.unsubscribe(); reject(new Error('No quote')); }
        },
        error(err) { reject(err); }
      });
      setTimeout(() => { try { sub.unsubscribe(); } catch {} reject(new Error('RFQ timeout')); }, 15000);
    });
  } catch (err1) {
    console.log('⚠️ integrator_* failed, trying referrer_*:', err1.message);
    return await new Promise((resolve, reject) => {
      const sub = omniston.requestForQuote({
        inputAsset, outputAsset,
        amount: { $case: 'inputUnits', value: units.toString() },
        referrerAddress: opWallet,
        referrerFeeBps: 30,
        settlementParams: [{ 
          params: { $case: 'swap', value: { maxPriceSlippagePips: 10000, flexibleReferrerFee: false } }
        }]
      }).subscribe({
        next(event) {
          if (event?.$case === 'quoteUpdated') { 
            sub.unsubscribe(); 
            console.log('RFQ FULL RESPONSE:', JSON.stringify(event.value, null, 2));
            resolve(event.value); 
          }
          else if (event?.$case === 'noQuote') { sub.unsubscribe(); reject(new Error('No quote')); }
        },
        error(err) { reject(err); }
      });
      setTimeout(() => { try { sub.unsubscribe(); } catch {} reject(new Error('RFQ timeout')); }, 15000);
    });
  }
}

module.exports = {
  COGNIQ_FEE,
  TOKEN_MAP,
  DECIMALS,
  OPERATIONAL_WALLET,
  omniston,
  isSwapQuote,
  toUnitsForSwap,
  toAssetId,
  safePayload,
  requestQuoteWithFee,
};
