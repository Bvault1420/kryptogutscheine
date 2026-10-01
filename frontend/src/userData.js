import { sortOrdersForDisplay } from './orderPayments.js';

const FAV_KEY = 'Kryptogutscheine_favorites';
const RECENT_KEY = 'Kryptogutscheine_recent';

const ORDERS_KEY = 'Kryptogutscheine_orders';

const LAST_ORDER_KEY = 'Kryptogutscheine_last_order_id';

const VAULT_KEY = 'Kryptogutscheine_voucher_vault';

const IDB_NAME = 'Kryptogutscheine';

const IDB_STORE = 'vouchers';

const MAX_RECENT = 12;

const MAX_ORDERS = 100;



function read(key) {

  try {

    const raw = localStorage.getItem(key);

    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];

  } catch {

    return [];

  }

}



function write(key, data) {

  try {

    localStorage.setItem(key, JSON.stringify(data));

    return true;

  } catch {

    return false;

  }

}



function readVaultMap() {

  try {

    const raw = localStorage.getItem(VAULT_KEY);

    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === 'object' ? parsed : {};

  } catch {

    return {};

  }

}



function writeVaultMap(map) {

  try {

    localStorage.setItem(VAULT_KEY, JSON.stringify(map));

    return true;

  } catch {

    return false;

  }

}



function redemptionHasCode(info) {

  if (!info) return false;

  if (typeof info === 'string') return info.trim().length > 0;

  return Boolean(info.code || info.link || info.pin);

}



export function hasStoredRedemptions(redemptions) {

  return Array.isArray(redemptions) && redemptions.some((r) => redemptionHasCode(r.info));

}



/** Codes niemals löschen – neue mit bestehenden zusammenführen. */

export function mergeRedemptions(existing = [], incoming = []) {

  const out = [...(existing || [])];

  for (const item of incoming || []) {

    if (!redemptionHasCode(item?.info)) continue;

    const idx = out.findIndex(

      (o) =>

        (item.orderId && o.orderId === item.orderId) ||

        (item.name && o.name === item.name && redemptionHasCode(o.info))

    );

    if (idx >= 0) {

      out[idx] = { ...out[idx], ...item, info: { ...out[idx].info, ...item.info } };

    } else {

      out.push(item);

    }

  }

  return out;

}



function openIdb() {

  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {

    try {

      const req = indexedDB.open(IDB_NAME, 1);

      req.onupgradeneeded = () => {

        if (!req.result.objectStoreNames.contains(IDB_STORE)) {

          req.result.createObjectStore(IDB_STORE, { keyPath: 'invoiceId' });

        }

      };

      req.onsuccess = () => resolve(req.result);

      req.onerror = () => resolve(null);

    } catch {

      resolve(null);

    }

  });

}



async function idbPutVoucher(invoiceId, redemptions) {

  const db = await openIdb();

  if (!db || !invoiceId || !hasStoredRedemptions(redemptions)) return;

  try {

    const tx = db.transaction(IDB_STORE, 'readwrite');

    tx.objectStore(IDB_STORE).put({

      invoiceId,

      redemptions,

      savedAt: new Date().toISOString(),

    });

  } catch {

    /* ignore */

  }

}



async function idbGetVoucher(invoiceId) {

  const db = await openIdb();

  if (!db || !invoiceId) return null;

  return new Promise((resolve) => {

    try {

      const tx = db.transaction(IDB_STORE, 'readonly');

      const req = tx.objectStore(IDB_STORE).get(invoiceId);

      req.onsuccess = () => resolve(req.result?.redemptions || null);

      req.onerror = () => resolve(null);

    } catch {

      resolve(null);

    }

  });

}



function persistVoucherVault(invoiceId, redemptions) {

  if (!invoiceId || !hasStoredRedemptions(redemptions)) return;

  const vault = readVaultMap();

  const prev = vault[invoiceId]?.redemptions || [];

  const merged = mergeRedemptions(prev, redemptions);

  vault[invoiceId] = { redemptions: merged, savedAt: new Date().toISOString() };

  writeVaultMap(vault);

  void idbPutVoucher(invoiceId, merged);

}



function restoreRedemptionsFromVault(invoiceId, redemptions) {

  if (hasStoredRedemptions(redemptions)) return redemptions;

  const vault = readVaultMap()[invoiceId];

  if (hasStoredRedemptions(vault?.redemptions)) return vault.redemptions;

  return redemptions || [];

}



async function restoreRedemptionsFromIdb(invoiceId, redemptions) {

  const current = restoreRedemptionsFromVault(invoiceId, redemptions);

  if (hasStoredRedemptions(current)) return current;

  const fromIdb = await idbGetVoucher(invoiceId);

  if (hasStoredRedemptions(fromIdb)) {

    persistVoucherVault(invoiceId, fromIdb);

    return fromIdb;

  }

  return current;

}



function touchOrder(entry) {

  const now = new Date().toISOString();

  return {

    ...entry,

    createdAt: entry.createdAt || now,

    updatedAt: now,

  };

}



function mergeOrderEntry(existing, entry) {

  const base = existing ? { ...existing, ...entry } : { ...entry };



  const existingRed = existing?.redemptions || [];

  const incomingRed = entry.redemptions;



  if (incomingRed === undefined) {

    base.redemptions = existingRed;

  } else if (hasStoredRedemptions(incomingRed)) {

    base.redemptions = mergeRedemptions(existingRed, incomingRed);

  } else if (hasStoredRedemptions(existingRed)) {

    base.redemptions = existingRed;

  } else {

    base.redemptions = incomingRed || [];

  }



  if (!entry.items?.length && existing?.items?.length) {

    base.items = existing.items;

  }

  if (!entry.total && existing?.total) {

    base.total = existing.total;

  }

  if (!entry.productName && existing?.productName) {

    base.productName = existing.productName;

  }



  base.redemptions = restoreRedemptionsFromVault(entry.invoiceId || existing?.invoiceId, base.redemptions);



  if (hasStoredRedemptions(base.redemptions)) {

    persistVoucherVault(base.invoiceId, base.redemptions);

    base.codesSecured = true;

  }



  return base;

}



// ── Favoriten ──



export function getFavorites() {

  return read(FAV_KEY);

}



export function isFavorite(productId) {

  return getFavorites().some((f) => f.id === productId);

}



export function toggleFavorite(product) {

  const list = getFavorites();

  const idx = list.findIndex((f) => f.id === product.id);

  if (idx >= 0) {

    list.splice(idx, 1);

    write(FAV_KEY, list);

    window.dispatchEvent(new CustomEvent('Kryptogutscheine:favorites-change'));

    return false;

  }

  list.unshift({

    id: product.id,

    name: product.name,

    image: product.image || '',

    currency: product.currency || 'USD',

    country_code: product.country_code,

  });

  write(FAV_KEY, list.slice(0, 50));

  window.dispatchEvent(new CustomEvent('Kryptogutscheine:favorites-change'));

  return true;

}



// ── Zuletzt angesehen ──



export function addRecentlyViewed(product) {

  const list = read(RECENT_KEY).filter((p) => p.id !== product.id);

  list.unshift({

    id: product.id,

    name: product.name,

    image: product.image || '',

    currency: product.currency || 'USD',

  });

  write(RECENT_KEY, list.slice(0, MAX_RECENT));

}



export function getRecentlyViewed() {

  return read(RECENT_KEY);

}



// ── Bestellhistorie (dauerhaft auf dem Gerät) ──



export function getOrderHistory() {

  return sortOrdersForDisplay(

    read(ORDERS_KEY).map((o) => ({

      ...o,

      redemptions: restoreRedemptionsFromVault(o.invoiceId, o.redemptions),

    }))

  );

}



export function getOrderByInvoiceId(invoiceId) {

  if (!invoiceId) return null;

  const order = getOrderHistory().find((o) => o.invoiceId === invoiceId) || null;

  if (!order) return null;

  return {

    ...order,

    redemptions: restoreRedemptionsFromVault(invoiceId, order.redemptions),

  };

}



/** Lädt fehlende Codes aus IndexedDB-Vault (async). */

export async function hydrateOrderFromVault(invoiceId) {

  const order = getOrderByInvoiceId(invoiceId);

  if (!order) return null;

  if (hasStoredRedemptions(order.redemptions)) return order;



  const restored = await restoreRedemptionsFromIdb(invoiceId, order.redemptions);

  if (!hasStoredRedemptions(restored)) return order;



  return upsertOrder({ ...order, redemptions: restored, codesSecured: true });

}



export function getLastOrderId() {

  try {

    return localStorage.getItem(LAST_ORDER_KEY) || getOrderHistory()[0]?.invoiceId || null;

  } catch {

    return getOrderHistory()[0]?.invoiceId || null;

  }

}



export function setLastOrderId(invoiceId) {

  try {

    if (invoiceId) localStorage.setItem(LAST_ORDER_KEY, invoiceId);

  } catch {

    /* ignore */

  }

}



/** Bestellung speichern – Gutschein-Codes werden nie versehentlich gelöscht. */

export function upsertOrder(entry) {

  if (!entry?.invoiceId) return;

  const list = read(ORDERS_KEY);

  const idx = list.findIndex((o) => o.invoiceId === entry.invoiceId);

  const existing = idx >= 0 ? list[idx] : null;

  const merged = touchOrder(mergeOrderEntry(existing, entry));

  if (idx >= 0) list[idx] = merged;

  else list.unshift(merged);

  write(ORDERS_KEY, list.slice(0, MAX_ORDERS));

  setLastOrderId(entry.invoiceId);

  window.dispatchEvent(new CustomEvent('Kryptogutscheine:orders-change', { detail: merged }));

  return merged;

}



export function addOrderHistory(entry) {

  return upsertOrder(entry);

}



export function updateOrderHistory(invoiceId, updates) {

  const existing = getOrderByInvoiceId(invoiceId);

  if (!existing) return upsertOrder({ invoiceId, ...updates });

  return upsertOrder({ ...existing, ...updates });

}



/** Vollständigen Status inkl. Gutschein-Codes lokal sichern. */

export function saveOrderSnapshot({

  invoice,

  orderResults = [],

  productName,

  total,

  items,

  paymentMethod,

}) {

  if (!invoice?.id) return null;



  const incomingRedemptions = orderResults

    .filter((o) => o.redemption_info)

    .map((o, i) => ({

      name: o.product?.name || `Gutschein ${i + 1}`,

      info: o.redemption_info,

      orderId: o.id,

    }));



  const existing = getOrderByInvoiceId(invoice.id);

  const redemptions = hasStoredRedemptions(incomingRedemptions)

    ? mergeRedemptions(existing?.redemptions, incomingRedemptions)

    : existing?.redemptions;



  const isDelivered =

    ['complete', 'all_delivered', 'delivered'].includes(invoice.status) ||

    orderResults.some((o) => o.status === 'delivered');



  return upsertOrder({

    invoiceId: invoice.id,

    orderId: orderResults[0]?.id || invoice.orders?.[0]?.id || existing?.orderId,

    orderIds: (invoice.orders || []).map((o) => o.id).filter(Boolean),

    productName:

      productName ||

      orderResults.map((o) => o.product?.name).filter(Boolean).join(', ') ||

      existing?.productName ||

      'Bestellung',

    status: invoice.status,

    total: total || existing?.total,

    paymentMethod: paymentMethod || invoice.payment?.method || existing?.paymentMethod,

    paymentAmount: invoice.payment?.price ?? existing?.paymentAmount,

    paymentCurrency: invoice.payment?.currency || existing?.paymentCurrency,

    items: items?.length ? items : existing?.items,

    redemptions: redemptions || [],

    codesSecured: hasStoredRedemptions(redemptions) || existing?.codesSecured,

    deliveredAt: isDelivered ? new Date().toISOString() : existing?.deliveredAt,

    cachedAt: new Date().toISOString(),

  });

}



export function syncOrderHistoryFromServer(orders) {

  if (!Array.isArray(orders) || !orders.length) return;

  for (const srv of orders) {

    if (!srv.invoiceId) continue;

    const local = getOrderByInvoiceId(srv.invoiceId);

    upsertOrder({

      ...srv,

      items: local?.items?.length ? local.items : srv.items,

      redemptions: mergeRedemptions(local?.redemptions, srv.redemptions),

      productName: local?.productName || srv.productName,

      total: local?.total || srv.total,

      codesSecured: local?.codesSecured || hasStoredRedemptions(srv.redemptions),

    });

  }

}



export function clearOrderHistory() {

  try {

    localStorage.removeItem(ORDERS_KEY);

    localStorage.removeItem(LAST_ORDER_KEY);

    localStorage.removeItem(VAULT_KEY);

    window.dispatchEvent(new CustomEvent('Kryptogutscheine:orders-change'));

  } catch {

    /* ignore */

  }

}



function downloadBlob(blob, filename) {

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;

  a.download = filename;

  a.click();

  URL.revokeObjectURL(url);

}



function exportFilename(ext) {

  const d = new Date().toISOString().slice(0, 10);

  return `Kryptogutscheine-orders-${d}.${ext}`;

}



function csvEscape(val) {

  const s = String(val ?? '').replace(/"/g, '""');

  return `"${s}"`;

}



export function exportOrderHistoryJSON() {

  const data = getOrderHistory();

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

  downloadBlob(blob, exportFilename('json'));

}



export function exportOrderHistoryCSV() {

  const orders = getOrderHistory();

  const headers = [

    'invoiceId',

    'orderId',

    'productName',

    'status',

    'total',

    'paymentMethod',

    'paymentAmount',

    'paymentCurrency',

    'createdAt',

    'updatedAt',

    'redemptionCodes',

  ];

  const rows = orders.map((o) => [

    o.invoiceId,

    o.orderId || '',

    o.productName || '',

    o.status || '',

    o.total || '',

    o.paymentMethod || '',

    o.paymentAmount || '',

    o.paymentCurrency || '',

    o.createdAt || '',

    o.updatedAt || '',

    (o.redemptions || [])

      .map((r) => r.info?.code || r.info?.link || r.info?.pin || '')

      .filter(Boolean)

      .join('; '),

  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

  downloadBlob(blob, exportFilename('csv'));

}


