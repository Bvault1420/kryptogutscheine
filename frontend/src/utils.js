import { upsertOrder, getOrderByInvoiceId, getLastOrderId } from './userData.js';
import { getActivePayment, saveActivePayment } from './paymentRecovery.js';

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Nur http(s)-Links in href erlauben – schützt vor javascript:-XSS. */
export function safeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
  } catch {
    /* ignore */
  }
  return '';
}

export function formatCurrency(value, currency = 'USD') {
  const num = Number(value);
  if (Number.isNaN(num)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(num);
  } catch {
    return `${num} ${currency}`;
  }
}

/** Bitrefill liefert Krypto-Beträge in kleinsten Einheiten (Sats, Wei-Micro, Lamports …). */
const CRYPTO_DECIMALS = {
  BTC: 8,
  LTC: 8,
  DOGE: 8,
  DASH: 8,
  ETH: 6,
  SOL: 9,
  USDC: 6,
  USDT: 6,
};

export function formatCryptoAmount(price, currency = 'BTC') {
  if (price == null || price === '') return '';
  const num = Number(price);
  if (Number.isNaN(num)) return `${price} ${currency}`;

  const code = String(currency || 'BTC').toUpperCase();
  const decimals = CRYPTO_DECIMALS[code] ?? 8;
  const major = num / 10 ** decimals;

  const formatted = major.toLocaleString('de-DE', {
    minimumFractionDigits: decimals <= 6 ? 2 : 4,
    maximumFractionDigits: Math.min(decimals, 8),
  });

  if (code === 'BTC' && num < 1_000_000) {
    return `${formatted} BTC (${num} sats)`;
  }

  return `${formatted} ${code}`;
}

export function formatStatus(status) {
  const map = {
    complete: 'Abgeschlossen',
    all_delivered: 'Geliefert',
    pending: 'Zahlung ausstehend',
    processing: 'In Bearbeitung',
    failed: 'Fehlgeschlagen',
    refunded: 'Erstattet',
    unpaid: 'Zahlung ausstehend',
    delivered: 'Geliefert',
    payment_detected: 'Zahlung erkannt',
    payment_confirmed: 'Zahlung bestätigt',
  };
  return map[status?.toLowerCase()] || status;
}

export function statusColor(status) {
  const s = status?.toLowerCase();
  if (['complete', 'all_delivered', 'delivered', 'payment_confirmed'].includes(s)) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
  }
  if (['pending', 'processing', 'unpaid', 'payment_detected'].includes(s)) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  }
  if (['failed', 'refunded', 'denied', 'blocked'].includes(s)) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
}

let toastTimer = null;
export function showToast(message, type = 'success') {
  let el = document.getElementById('Kryptogutscheine-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'Kryptogutscheine-toast';
    el.className =
      'pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 translate-y-4 rounded-xl px-5 py-3 text-sm font-semibold text-white opacity-0 shadow-lg transition-all duration-300';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove('bg-emerald-600', 'bg-red-600');
  el.classList.add(type === 'error' ? 'bg-red-600' : 'bg-emerald-600');
  requestAnimationFrame(() => {
    el.classList.remove('opacity-0', 'translate-y-4');
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add('opacity-0', 'translate-y-4');
  }, 2200);
}

export function setSessionOrder(data) {
  try {
    sessionStorage.setItem('Kryptogutscheine_order', JSON.stringify(data));
  } catch {
    /* ignore */
  }
  if (data?.invoiceId) {
    upsertOrder({
      invoiceId: data.invoiceId,
      orderId: data.orderId,
      productName: data.productName,
      status: data.status,
      total: data.total,
      items: data.items,
      accessToken: data.accessToken,
    });
    saveActivePayment({
      invoiceId: data.invoiceId,
      orderId: data.orderId,
      productName: data.productName,
      status: data.status || 'pending',
      total: data.total,
      items: data.items,
      paymentMethod: data.paymentMethod,
      paymentAddress: data.paymentAddress,
      paymentAmount: data.paymentAmount,
      paymentCurrency: data.paymentCurrency,
      expiresIn: data.expiresIn || 900,
      accessToken: data.accessToken,
    });
  }
}

export function getSessionOrder() {
  try {
    const raw = sessionStorage.getItem('Kryptogutscheine_order');
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

/** Letzte Bestellung – aktive Zahlung, Session oder Geräte-Historie. */
export function getActiveOrder() {
  const persisted = getActivePayment();
  if (persisted?.invoiceId) return persisted;
  const session = getSessionOrder();
  if (session?.invoiceId) return session;
  const lastId = getLastOrderId();
  if (!lastId) return null;
  return getOrderByInvoiceId(lastId);
}
