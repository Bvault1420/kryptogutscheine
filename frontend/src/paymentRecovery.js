import { api } from './api.js';
import { saveOrderSnapshot, upsertOrder } from './userData.js';
import { t } from './i18n.js';
import {
  INVOICE_TTL_MS,
  isOrderCompleted,
  isOrderFailed,
  isOrderPending,
} from './orderPayments.js';

const ACTIVE_PAYMENT_KEY = 'Kryptogutscheine_active_payment';
const SESSION_MARKER_KEY = 'Kryptogutscheine_app_session';
const POLL_MS = 8000;

let pollTimer = null;
let pollRunning = false;

function readRaw() {
  try {
    const raw = localStorage.getItem(ACTIVE_PAYMENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRaw(data) {
  try {
    if (!data) {
      localStorage.removeItem(ACTIVE_PAYMENT_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_PAYMENT_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function isExpired(entry) {
  if (!entry) return true;
  const expiresAt = entry.expiresAt || 0;
  if (expiresAt && Date.now() > expiresAt) return true;
  const started = entry.startedAt ? new Date(entry.startedAt).getTime() : 0;
  if (started && Date.now() - started > INVOICE_TTL_MS) return true;
  return false;
}

/** Aktive Zahlung dauerhaft speichern – überlebt Browser-Absturz & Neustart. */
export function saveActivePayment(data) {
  if (!data?.invoiceId) return null;

  const prev = readRaw();
  const now = new Date().toISOString();
  const startedAt = prev?.invoiceId === data.invoiceId ? prev.startedAt || now : now;
  const ttlMs = (data.expiresIn || 900) * 1000;

  const entry = {
    ...prev,
    ...data,
    startedAt,
    updatedAt: now,
    expiresAt: data.expiresAt || new Date(new Date(startedAt).getTime() + ttlMs).toISOString(),
  };

  if (isOrderCompleted(entry.status) || isOrderFailed(entry.status)) {
    clearActivePayment(entry.invoiceId);
    return null;
  }

  writeRaw(entry);

  upsertOrder({
    invoiceId: entry.invoiceId,
    orderId: entry.orderId,
    productName: entry.productName,
    status: entry.status || 'pending',
    total: entry.total,
    items: entry.items,
    paymentMethod: entry.paymentMethod,
    accessToken: entry.accessToken,
  });

  window.dispatchEvent(new CustomEvent('Kryptogutscheine:active-payment-change', { detail: entry }));
  return entry;
}

export function getActivePayment() {
  const entry = readRaw();
  if (!entry?.invoiceId) return null;
  if (isExpired(entry)) {
    clearActivePayment(entry.invoiceId);
    return null;
  }
  if (isOrderCompleted(entry.status) || isOrderFailed(entry.status)) {
    clearActivePayment(entry.invoiceId);
    return null;
  }
  return entry;
}

export function clearActivePayment(invoiceId) {
  const entry = readRaw();
  if (entry && invoiceId && entry.invoiceId !== invoiceId) return;
  writeRaw(null);
  window.dispatchEvent(new CustomEvent('Kryptogutscheine:active-payment-change', { detail: null }));
}

export function getPaymentResumePath(payment) {
  if (!payment?.invoiceId) return '/order-status';
  const q = new URLSearchParams({ invoiceId: payment.invoiceId });
  if (payment.orderId) q.set('orderId', payment.orderId);
  return `/payment?${q}`;
}

function getHashPath() {
  const hash = window.location.hash.slice(1) || '/';
  const [path] = hash.split('?');
  return path || '/';
}

/** Nach Absturz/Neustart automatisch zur offenen Zahlung. */
export function shouldAutoResumePayment() {
  const active = getActivePayment();
  if (!active) return false;

  const path = getHashPath();
  if (path === '/payment' || path === '/order-status') return false;

  let navType = 'navigate';
  try {
    navType = performance.getEntriesByType('navigation')[0]?.type || 'navigate';
  } catch {
    /* ignore */
  }

  const freshSession = !sessionStorage.getItem(SESSION_MARKER_KEY);
  const reloaded = navType === 'reload';
  const defaultLanding = path === '/' || path === '/shop';

  return freshSession || reloaded || defaultLanding;
}

export function renderPaymentResumeBanner(currentPath) {
  if (currentPath === '/payment') return '';
  const active = getActivePayment();
  if (!active) return '';

  const label = active.productName || t('payment.openPayment');
  const href = getPaymentResumePath(active);

  return `
    <div id="payment-resume-banner" class="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p>
          ${t('payment.resume', { label: escapeBanner(label) })}
          <span class="hidden sm:inline"> ${t('payment.resumeHint')}</span>
        </p>
        <a href="#${href}" data-nav="${href}" class="btn-primary shrink-0 px-4 py-2 text-xs">
          ${t('payment.resumeBtn')}
        </a>
      </div>
    </div>`;
}

/** Banner aktualisieren ohne kompletten Seiten-Neulauf. */
export function updatePaymentResumeBanner() {
  const path = (window.location.hash.slice(1) || '/').split('?')[0] || '/';
  const html = renderPaymentResumeBanner(path);
  const existing = document.getElementById('payment-resume-banner');
  if (html) {
    if (existing) existing.outerHTML = html;
    else {
      const app = document.getElementById('app');
      const header = app?.querySelector('header');
      if (header) header.insertAdjacentHTML('beforebegin', html);
    }
  } else if (existing) {
    existing.remove();
  }
}

function escapeBanner(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function pollActivePaymentOnce(onComplete) {
  const active = getActivePayment();
  if (!active?.invoiceId) return null;

  try {
    const { data: invoice } = await api.getInvoice(active.invoiceId, active.accessToken);
    const orderId = invoice.orders?.[0]?.id || active.orderId;
    const pay = invoice.payment || {};

    saveActivePayment({
      invoiceId: invoice.id,
      orderId,
      productName: active.productName || invoice.orders?.[0]?.product?.name,
      status: invoice.status,
      total: active.total,
      items: active.items,
      paymentMethod: pay.method || active.paymentMethod,
      paymentAddress: pay.address || active.paymentAddress,
      paymentAmount: pay.price ?? active.paymentAmount,
      paymentCurrency: pay.currency || active.paymentCurrency,
      giftLabel: active.giftLabel,
      expiresIn: active.expiresIn || 900,
    });

    saveOrderSnapshot({
      invoice,
      orderResults: invoice.orders || [],
      productName: active.productName,
      total: active.total,
      items: active.items,
      paymentMethod: pay.method,
    });

    if (invoice.status === 'complete' || invoice.rawStatus === 'complete' || isOrderCompleted(invoice.status)) {
      clearActivePayment(invoice.id);
      onComplete?.({ invoice, orderId, completed: true });
      return { invoice, completed: true };
    }

    if (isOrderFailed(invoice.status)) {
      clearActivePayment(invoice.id);
      return { invoice, failed: true };
    }

    if (!isOrderPending(invoice.status) && !isOrderCompleted(invoice.status)) {
      clearActivePayment(invoice.id);
    }

    return { invoice, completed: false };
  } catch {
    return { offline: true, cached: active };
  }
}

export function startPaymentWatch(onComplete) {
  stopPaymentWatch();

  const tick = async () => {
    if (pollRunning) return;
    if (!getActivePayment()) {
      stopPaymentWatch();
      return;
    }
    pollRunning = true;
    try {
      await pollActivePaymentOnce(onComplete);
    } finally {
      pollRunning = false;
    }
  };

  void tick();
  pollTimer = setInterval(tick, POLL_MS);
}

export function stopPaymentWatch() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** App-weite Wiederaufnahme: Polling, Sichtbarkeit, Absturz-Schutz. */
export function initPaymentRecovery({ navigate }) {
  try {
    sessionStorage.setItem(SESSION_MARKER_KEY, '1');
  } catch {
    /* ignore */
  }

  const onComplete = ({ invoice, orderId }) => {
    const path = getHashPath();
    if (path === '/payment') {
      const q = new URLSearchParams({ invoiceId: invoice.id });
      if (orderId) q.set('orderId', orderId);
      navigate(`/order-status?${q}`);
    }
    window.dispatchEvent(
      new CustomEvent('Kryptogutscheine:payment-complete', { detail: { invoice, orderId } })
    );
  };

  startPaymentWatch(onComplete);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getActivePayment()) {
      void pollActivePaymentOnce(onComplete);
    }
  });

  window.addEventListener('pagehide', () => {
    const active = getActivePayment();
    if (active) saveActivePayment({ ...active, updatedAt: new Date().toISOString() });
  });

  window.addEventListener('beforeunload', () => {
    const active = getActivePayment();
    if (active) saveActivePayment({ ...active, updatedAt: new Date().toISOString() });
  });

  if (shouldAutoResumePayment()) {
    const active = getActivePayment();
    if (active) {
      navigate(getPaymentResumePath(active));
    }
  }
}

export function buildActivePaymentFromInvoice(invoice, extras = {}) {
  const pay = invoice.payment || {};
  const order = invoice.orders?.[0];
  return {
    invoiceId: invoice.id,
    orderId: order?.id || extras.orderId,
    productName: extras.productName || order?.product?.name || order?.productName,
    status: invoice.status,
    total: extras.total,
    items: extras.items,
    paymentMethod: pay.method || extras.paymentMethod,
    paymentAddress: pay.address,
    paymentAmount: pay.price,
    paymentCurrency: pay.currency,
    giftLabel: extras.productName || order?.product?.name,
    expiresIn: extras.expiresIn || invoice.expiresIn || 900,
  };
}
