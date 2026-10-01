import fs from 'fs';
import path from 'path';
import { getDb, DATA_DIR } from './db.js';
import { generateAccessToken } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

function readJsonFile(name, fallback) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

/** Einmalige Migration von JSON-Dateien nach SQLite. */
export function migrateJsonToSqliteIfNeeded() {
  const db = getDb();
  const done = db.prepare(`SELECT value FROM meta WHERE key = 'json_migrated'`).get();
  if (done?.value === '1') return { orders: 0, analytics: 0, newsletter: 0, webhooks: 0 };

  let counts = { orders: 0, analytics: 0, newsletter: 0, webhooks: 0 };

  const insertOrder = db.prepare(`
    INSERT OR REPLACE INTO orders (invoice_id, order_id, payload, updated_at)
    VALUES (?, ?, ?, ?)
  `);

  const orders = readJsonFile('orders.json', []);
  for (const order of orders) {
    if (!order?.invoiceId) continue;
    if (!order.accessToken) order.accessToken = generateAccessToken();
    insertOrder.run(
      order.invoiceId,
      order.orderId || null,
      JSON.stringify(order),
      order.updatedAt || order.createdAt || new Date().toISOString()
    );
    counts.orders += 1;
  }

  const upsertAnalytics = db.prepare(`
    INSERT INTO analytics (bucket, product_id, count) VALUES (?, ?, ?)
    ON CONFLICT(bucket, product_id) DO UPDATE SET count = excluded.count
  `);

  const analytics = readJsonFile('analytics.json', { views: {}, cartAdds: {}, purchases: {} });
  for (const [bucket, map] of Object.entries(analytics)) {
    if (!map || typeof map !== 'object') continue;
    for (const [productId, count] of Object.entries(map)) {
      upsertAnalytics.run(bucket, productId, Number(count) || 0);
      counts.analytics += 1;
    }
  }

  const insertNewsletter = db.prepare(`
    INSERT OR IGNORE INTO newsletter (email, status, confirm_token, subscribed_at, confirmed_at)
    VALUES (?, ?, NULL, ?, ?)
  `);

  const subs = readJsonFile('newsletter.json', []);
  for (const entry of subs) {
    const email = (typeof entry === 'string' ? entry : entry.email)?.toLowerCase?.()?.trim();
    if (!email) continue;
    insertNewsletter.run(
      email,
      'confirmed',
      entry.subscribedAt || new Date().toISOString(),
      entry.subscribedAt || new Date().toISOString()
    );
    counts.newsletter += 1;
  }

  const insertWebhook = db.prepare(`
    INSERT INTO webhook_log (payload, received_at) VALUES (?, ?)
  `);

  const webhooks = readJsonFile('webhooks.json', []);
  for (const log of webhooks.slice(0, 200)) {
    insertWebhook.run(JSON.stringify(log), log.receivedAt || new Date().toISOString());
    counts.webhooks += 1;
  }

  db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('json_migrated', '1')`).run();

  const total = counts.orders + counts.analytics + counts.newsletter + counts.webhooks;
  if (total > 0) {
    logger.info('JSON → SQLite Migration abgeschlossen', counts);
  }

  return counts;
}
