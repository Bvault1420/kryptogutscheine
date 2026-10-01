import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

let db;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function schemaStatements() {
  return `
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS orders (
      invoice_id TEXT PRIMARY KEY,
      order_id TEXT,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
    CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders(updated_at DESC);

    CREATE TABLE IF NOT EXISTS analytics (
      bucket TEXT NOT NULL,
      product_id TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (bucket, product_id)
    );

    CREATE TABLE IF NOT EXISTS newsletter (
      email TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      confirm_token TEXT,
      subscribed_at TEXT NOT NULL,
      confirmed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS webhook_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      received_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `;
}

/** SQLite-Verbindung (In-Memory in Tests, Datei sonst). */
export function getDb() {
  if (db) return db;

  ensureDataDir();
  const file =
    process.env.SQLITE_PATH ||
    (process.env.NODE_ENV === 'test' ? ':memory:' : path.join(DATA_DIR, 'redeemx.db'));

  db = new Database(file);
  db.exec(schemaStatements());
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export function resetDbForTests() {
  closeDb();
  return getDb();
}

export { DATA_DIR };
