import { MAX_PENDING_PAYMENTS, PENDING_PAYMENT_TTL_MS } from '@shared/constants.js';

/** Max. gleichzeitig offene Zahlungen (Rechnung läuft nach ~15 Min. ab). */
export const MAX_ACTIVE_PENDING_PAYMENTS = MAX_PENDING_PAYMENTS;

/** Rechnungen gelten nach dieser Zeit als abgelaufen (Bitrefill: 15 Min.). */
export const INVOICE_TTL_MS = PENDING_PAYMENT_TTL_MS;

const COMPLETED_STATUSES = new Set([
  'complete',
  'all_delivered',
  'delivered',
  'payment_confirmed',
]);

const PENDING_STATUSES = new Set([
  'pending',
  'processing',
  'unpaid',
  'payment_detected',
]);

const FAILED_STATUSES = new Set(['failed', 'refunded', 'denied', 'blocked']);

export function normalizeOrderStatus(status) {
  return String(status || '').toLowerCase();
}

export function isOrderCompleted(status) {
  return COMPLETED_STATUSES.has(normalizeOrderStatus(status));
}

export function isOrderPending(status) {
  return PENDING_STATUSES.has(normalizeOrderStatus(status));
}

export function isOrderFailed(status) {
  return FAILED_STATUSES.has(normalizeOrderStatus(status));
}

export function getOrderTimestamp(order) {
  const raw = order?.updatedAt || order?.createdAt;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

/** Offene Rechnung, die noch nicht abgelaufen ist. */
export function isActivePendingOrder(order) {
  if (!isOrderPending(order?.status)) return false;
  const ts = getOrderTimestamp(order);
  if (!ts) return true;
  return Date.now() - ts < INVOICE_TTL_MS;
}

export function countActivePendingOrders(orders) {
  return (orders || []).filter(isActivePendingOrder).length;
}

export function canStartNewPayment(orders) {
  return countActivePendingOrders(orders) < MAX_ACTIVE_PENDING_PAYMENTS;
}

export function getPendingPaymentBlockReason(orders) {
  const count = countActivePendingOrders(orders);
  if (count < MAX_ACTIVE_PENDING_PAYMENTS) return null;
  return `Du hast bereits ${count} offene Zahlungen. Bitte schließe oder warte auf deren Ablauf (~15 Min.), bevor du eine neue startest.`;
}

/** Erfolgreiche oben, dann offene, dann fehlgeschlagene – jeweils neueste zuerst. */
export function sortOrdersForDisplay(orders) {
  const rank = (status) => {
    if (isOrderCompleted(status)) return 0;
    if (isOrderPending(status)) return 1;
    if (isOrderFailed(status)) return 3;
    return 2;
  };

  return [...(orders || [])].sort((a, b) => {
    const rankDiff = rank(a.status) - rank(b.status);
    if (rankDiff !== 0) return rankDiff;
    return getOrderTimestamp(b) - getOrderTimestamp(a);
  });
}

export function renderPendingPaymentWarning(orders) {
  const reason = getPendingPaymentBlockReason(orders);
  if (!reason) return '';

  const pending = countActivePendingOrders(orders);
  return `
    <div class="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <strong>Zahlung blockiert:</strong> ${reason}
      <a href="#/order-status" data-nav="/order-status" class="mt-2 block font-medium text-brand-700 underline dark:text-brand-300">
        Offene Zahlungen ansehen (${pending})
      </a>
    </div>`;
}
