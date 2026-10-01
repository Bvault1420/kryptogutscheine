import { ALLOWED_PAYMENT_METHODS as SHARED_METHODS } from '../../shared/constants.js';

/** Erlaubte Zahlungsmethoden – nur etablierte, sichere Netzwerke. */
export const ALLOWED_PAYMENT_METHODS = SHARED_METHODS;

export function isAllowedPaymentMethod(method) {
  return ALLOWED_PAYMENT_METHODS.includes(method);
}

export function normalizePaymentMethod(method) {
  return isAllowedPaymentMethod(method) ? method : 'lightning';
}
