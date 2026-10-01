import { MAX_VOUCHER_AMOUNT as SHARED_MAX } from '@shared/constants.js';

export const MAX_VOUCHER_AMOUNT = SHARED_MAX;

export function isAmountWithinLimit(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0 && n <= MAX_VOUCHER_AMOUNT;
}

export function clampMaxAmount(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return null;
  return Math.min(n, MAX_VOUCHER_AMOUNT);
}
