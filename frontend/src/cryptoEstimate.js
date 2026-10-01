/** Grobe Fiat→Krypto-Schätzung (nur Vorschau, kein garantierter Kurs). */

const RATES_EUR = {

  lightning: 0.000015,

  bitcoin: 0.000015,

  ethereum: 0.00035,

  solana: 0.0065,

  usdc_erc20: 1.08,

  usdc_polygon: 1.08,

  usdc_base: 1.08,

  usdc_arbitrum: 1.08,

  usdc_solana: 1.08,

  usdt_trc20: 1.08,

  usdt_erc20: 1.08,

  usdt_polygon: 1.08,

};



const SYMBOLS = {

  lightning: 'BTC',

  bitcoin: 'BTC',

  ethereum: 'ETH',

  solana: 'SOL',

  usdc_erc20: 'USDC',

  usdc_polygon: 'USDC',

  usdc_base: 'USDC',

  usdc_arbitrum: 'USDC',

  usdc_solana: 'USDC',

  usdt_trc20: 'USDT',

  usdt_erc20: 'USDT',

  usdt_polygon: 'USDT',

};



function toEur(amount, currency) {

  const c = (currency || 'EUR').toUpperCase();

  if (c === 'EUR') return amount;

  if (c === 'USD') return amount * 0.92;

  if (c === 'GBP') return amount * 1.17;

  return amount;

}



export function estimateCryptoAmount(fiatTotal, currency, paymentMethod) {

  const rate = RATES_EUR[paymentMethod];

  if (!rate || !Number.isFinite(fiatTotal) || fiatTotal <= 0) return null;

  const eur = toEur(fiatTotal, currency);

  const amount = eur * rate;

  const symbol = SYMBOLS[paymentMethod] || '';

  const decimals = symbol === 'BTC' ? 8 : symbol === 'USDC' || symbol === 'USDT' ? 2 : 6;

  return { amount: amount.toFixed(decimals), symbol };

}



export function renderCryptoEstimateLine(fiatTotal, currency, paymentMethod) {

  const est = estimateCryptoAmount(fiatTotal, currency, paymentMethod);

  if (!est) return '';

  return `<p class="mt-2 text-xs text-content-muted">≈ ${est.amount} ${est.symbol} (Schätzung, exakter Betrag nach Rechnungserstellung)</p>`;

}


