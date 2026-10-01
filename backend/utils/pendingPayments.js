import { BitrefillError } from './errors.js';
import { MAX_PENDING_PAYMENTS, PENDING_PAYMENT_TTL_MS } from '../../shared/constants.js';

export const MAX_ACTIVE_PENDING_PAYMENTS = MAX_PENDING_PAYMENTS;
export const INVOICE_TTL_MS = PENDING_PAYMENT_TTL_MS;

const PENDING_STATUSES = new Set(['pending', 'processing', 'unpaid', 'payment_detected']);

function orderTimestamp(order) {
  const raw = order?.updatedAt || order?.createdAt;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

export function isActivePendingOrder(order) {
  const status = String(order?.status || '').toLowerCase();
  if (!PENDING_STATUSES.has(status)) return false;
  const ts = orderTimestamp(order);
  if (!ts) return true;
  return Date.now() - ts < INVOICE_TTL_MS;
}

export function countActivePendingOrders(orders, clientIp = null) {
  const list = orders || [];
  const filtered = clientIp ? list.filter((o) => o.clientIp === clientIp) : list;
  return filtered.filter(isActivePendingOrder).length;
}

export function assertCanCreateInvoice(orders, clientIp = null) {
  const count = countActivePendingOrders(orders, clientIp);
  if (count >= MAX_ACTIVE_PENDING_PAYMENTS) {
    throw new BitrefillError(
      `Es laufen bereits ${count} offene Zahlungen von deiner Verbindung. Bitte warte auf deren Abschluss oder Ablauf (~20 Min.), bevor du eine neue startest.`,
      429,
      'TOO_MANY_PENDING_PAYMENTS'
    );
  }
}
