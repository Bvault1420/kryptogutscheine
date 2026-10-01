const STORAGE_KEY = 'Kryptogutscheine_cart';
const MAX_QTY = 5;

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('Kryptogutscheine:cart-change'));
}

/** Eindeutiger Schlüssel pro Produkt + Stückelung. */
export function cartKey(item) {
  return `${item.productId}|${item.packageId || ''}|${item.value ?? ''}`;
}

export function getCart() {
  return read();
}

export function getItemCount() {
  return read().reduce((sum, it) => sum + (it.qty || 0), 0);
}

/** Summen gruppiert nach Währung: { EUR: 30, USD: 25 }. */
export function getTotalsByCurrency() {
  const totals = {};
  for (const it of read()) {
    const cur = it.currency || 'USD';
    const value = Number(it.value) || 0;
    totals[cur] = (totals[cur] || 0) + value * (it.qty || 1);
  }
  return totals;
}

export function addToCart(item) {
  const items = read();
  const key = cartKey(item);
  const existing = items.find((it) => cartKey(it) === key);

  if (existing) {
    existing.qty = Math.min(MAX_QTY, (existing.qty || 1) + (item.qty || 1));
  } else {
    items.push({
      productId: item.productId,
      name: item.name,
      image: item.image || '',
      currency: item.currency || 'USD',
      value: item.value != null ? Number(item.value) : undefined,
      packageId: item.packageId || undefined,
      qty: Math.min(MAX_QTY, item.qty || 1),
    });
  }

  write(items);
  return getItemCount();
}

export function updateQty(key, qty) {
  const items = read();
  const item = items.find((it) => cartKey(it) === key);
  if (!item) return;
  item.qty = Math.max(1, Math.min(MAX_QTY, qty));
  write(items);
}

export function removeFromCart(key) {
  const items = read().filter((it) => cartKey(it) !== key);
  write(items);
}

export function clearCart() {
  write([]);
}

export { MAX_QTY };
