import crypto from 'crypto';

/** Zeitkonstante String-Vergleichung (API-Keys, Webhooks, Order-Tokens). */
export function timingSafeEqualString(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Zufälliges Order-Zugriffstoken (64 Hex-Zeichen). */
export function generateAccessToken() {
  return crypto.randomBytes(32).toString('hex');
}
