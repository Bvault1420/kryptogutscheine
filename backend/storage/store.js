import { getDb } from './db.js';
import { generateAccessToken } from '../utils/crypto.js';

function parseOrder(row) {
  if (!row) return null;
  try {
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
}

// ── Orders ──

export function saveOrder(order) {
  const db = getDb();
  const existing = getOrderByInvoiceId(order.invoiceId);
  const entry = {
    ...(existing || {}),
    ...order,
    updatedAt: new Date().toISOString(),
  };
  if (!entry.createdAt) entry.createdAt = entry.updatedAt;

  db.prepare(`
    INSERT INTO orders (invoice_id, order_id, payload, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(invoice_id) DO UPDATE SET
      order_id = excluded.order_id,
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `).run(entry.invoiceId, entry.orderId || null, JSON.stringify(entry), entry.updatedAt);

  // Max. 500 Bestellungen behalten
  db.prepare(`
    DELETE FROM orders WHERE invoice_id NOT IN (
      SELECT invoice_id FROM orders ORDER BY updated_at DESC LIMIT 500
    )
  `).run();

  return entry;
}

export function getOrder(invoiceId) {
  return getOrderByInvoiceId(invoiceId);
}

export function getOrderByInvoiceId(invoiceId) {
  const row = getDb()
    .prepare('SELECT payload FROM orders WHERE invoice_id = ?')
    .get(invoiceId);
  return parseOrder(row);
}

export function getOrderByOrderId(orderId) {
  const row = getDb()
    .prepare('SELECT payload FROM orders WHERE order_id = ? ORDER BY updated_at DESC LIMIT 1')
    .get(orderId);
  return parseOrder(row);
}

export function getAllOrders() {
  const rows = getDb()
    .prepare('SELECT payload FROM orders ORDER BY updated_at DESC LIMIT 500')
    .all();
  return rows.map(parseOrder).filter(Boolean);
}

export function migrateOrderAccessTokens() {
  const orders = getAllOrders();
  let changed = 0;
  for (const order of orders) {
    if (!order.accessToken) {
      saveOrder({ ...order, accessToken: generateAccessToken() });
      changed += 1;
    }
  }
  return changed;
}

export function updateOrderStatus(invoiceId, status, extra = {}) {
  const item = getOrderByInvoiceId(invoiceId);
  if (!item) return null;
  const updated = {
    ...item,
    ...extra,
    status,
    updatedAt: new Date().toISOString(),
  };
  saveOrder(updated);
  return updated;
}

// ── Analytics ──

export function trackEvent(type, productId) {
  if (!productId) return;
  const bucket = type === 'view' ? 'views' : type === 'cart' ? 'cartAdds' : 'purchases';
  getDb()
    .prepare(`
      INSERT INTO analytics (bucket, product_id, count) VALUES (?, ?, 1)
      ON CONFLICT(bucket, product_id) DO UPDATE SET count = count + 1
    `)
    .run(bucket, productId);
}

export function getRankedProductIds(limit = 20) {
  const rows = getDb().prepare('SELECT bucket, product_id, count FROM analytics').all();
  const scores = {};
  for (const { bucket, product_id, count } of rows) {
    const weight = bucket === 'cartAdds' ? 3 : bucket === 'purchases' ? 10 : 1;
    scores[product_id] = (scores[product_id] || 0) + count * weight;
  }
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

export function getAnalyticsSummary() {
  const rows = getDb()
    .prepare('SELECT bucket, SUM(count) AS total FROM analytics GROUP BY bucket')
    .all();
  const totals = Object.fromEntries(rows.map((r) => [r.bucket, r.total]));
  return {
    totalViews: totals.views || 0,
    totalCartAdds: totals.cartAdds || 0,
    totalPurchases: totals.purchases || 0,
    topProducts: getRankedProductIds(10),
  };
}

// ── Newsletter (Double-Opt-In) ──

export function createNewsletterPending(email, confirmToken) {
  const normalized = String(email).toLowerCase().trim();
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO newsletter (email, status, confirm_token, subscribed_at)
      VALUES (?, 'pending', ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        status = 'pending',
        confirm_token = excluded.confirm_token,
        subscribed_at = excluded.subscribed_at,
        confirmed_at = NULL
    `)
    .run(normalized, confirmToken, now);
  return normalized;
}

export function confirmNewsletter(token) {
  const row = getDb()
    .prepare('SELECT email FROM newsletter WHERE confirm_token = ? AND status = ?')
    .get(token, 'pending');
  if (!row) return null;
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      UPDATE newsletter SET status = 'confirmed', confirmed_at = ?, confirm_token = NULL
      WHERE email = ?
    `)
    .run(now, row.email);
  return row.email;
}

export function unsubscribeNewsletter(email) {
  const normalized = String(email).toLowerCase().trim();
  const result = getDb().prepare('DELETE FROM newsletter WHERE email = ?').run(normalized);
  return result.changes > 0;
}

export function getNewsletterCount() {
  return getDb().prepare(`SELECT COUNT(*) AS c FROM newsletter WHERE status = 'confirmed'`).get().c;
}

// Legacy-Aufruf – leitet auf Double-Opt-In um (nur für Tests)
export function subscribeNewsletter(email) {
  const token = generateAccessToken();
  createNewsletterPending(email, token);
  confirmNewsletter(token);
  return true;
}

// ── Webhook log ──

export function logWebhook(payload) {
  getDb()
    .prepare('INSERT INTO webhook_log (payload, received_at) VALUES (?, ?)')
    .run(JSON.stringify(payload), new Date().toISOString());

  getDb().prepare(`
    DELETE FROM webhook_log WHERE id NOT IN (
      SELECT id FROM webhook_log ORDER BY id DESC LIMIT 200
    )
  `).run();
}

/** Tests: alle Tabellen leeren. */
export function clearAllDataForTests() {
  const db = getDb();
  db.exec(`
    DELETE FROM orders;
    DELETE FROM analytics;
    DELETE FROM newsletter;
    DELETE FROM webhook_log;
    DELETE FROM meta;
  `);
}
