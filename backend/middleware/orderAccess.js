import { AppError } from '../utils/errors.js';
import { timingSafeEqualString } from '../utils/crypto.js';
import { getOrderByInvoiceId, getOrderByOrderId } from '../storage/store.js';

const HEADER = 'x-order-token';

/** Liest Order-Token nur aus Header (kein Query-Param – kein Leak in Logs/Referrer). */
export function readOrderToken(req) {
  return req.get(HEADER)?.trim() || '';
}

/**
 * Prüft Zugriff auf eine Invoice per geheimem Token.
 * Alle Bestellungen benötigen ein gültiges Token (kein Legacy-Bypass mehr).
 */
export function assertInvoiceAccess(invoiceId, token) {
  const stored = getOrderByInvoiceId(invoiceId);
  if (!stored) {
    throw new AppError('Bestellung nicht gefunden.', 404, 'ORDER_NOT_FOUND');
  }
  if (!stored.accessToken) {
    throw new AppError('Bestellung nicht abrufbar – fehlendes Zugangstoken.', 403, 'ORDER_ACCESS_DENIED');
  }
  if (!token || !timingSafeEqualString(token, stored.accessToken)) {
    throw new AppError('Kein Zugriff auf diese Bestellung.', 403, 'ORDER_ACCESS_DENIED');
  }
  return stored;
}

/** Prüft Zugriff auf Order-Details (gleiche Token-Logik). */
export function assertOrderAccess(orderId, token) {
  const stored = getOrderByOrderId(orderId);
  if (!stored) {
    throw new AppError('Bestellung nicht gefunden.', 404, 'ORDER_NOT_FOUND');
  }
  if (!stored.accessToken) {
    throw new AppError('Bestellung nicht abrufbar – fehlendes Zugangstoken.', 403, 'ORDER_ACCESS_DENIED');
  }
  if (!token || !timingSafeEqualString(token, stored.accessToken)) {
    throw new AppError('Kein Zugriff auf diese Bestellung.', 403, 'ORDER_ACCESS_DENIED');
  }
  return stored;
}

export { HEADER as ORDER_TOKEN_HEADER };
