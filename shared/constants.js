/** Plattformweite Limits und Whitelists (eine Quelle für Backend + Frontend). */



export const MAX_VOUCHER_AMOUNT = 500;



/** Bitrefill-API-kompatibel, etablierte Netzwerke (kein Meme-Coin / Exoten). */

export const ALLOWED_PAYMENT_METHODS = [

  'lightning',

  'bitcoin',

  'ethereum',

  'solana',

  'usdc_erc20',

  'usdc_polygon',

  'usdc_base',

  'usdc_arbitrum',

  'usdc_solana',

  'usdt_trc20',

  'usdt_erc20',

  'usdt_polygon',

];



export const MAX_PENDING_PAYMENTS = 3;

export const PENDING_PAYMENT_TTL_MS = 20 * 60 * 1000;


