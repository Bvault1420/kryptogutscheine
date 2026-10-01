import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const CACHE_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../data/product-cache.json'
);

const MAX_ENTRIES = 400;
let memory = null;
let writeTimer = null;

function load() {
  if (memory) return memory;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      memory = raw && typeof raw === 'object' ? raw : {};
      return memory;
    }
  } catch (err) {
    logger.debug('Produkt-Disk-Cache konnte nicht gelesen werden', { err: err.message });
  }
  memory = {};
  return memory;
}

function scheduleWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      const data = load();
      const entries = Object.entries(data);
      if (entries.length > MAX_ENTRIES) {
        entries
          .sort((a, b) => (a[1]?.savedAt || 0) - (b[1]?.savedAt || 0))
          .slice(0, entries.length - MAX_ENTRIES)
          .forEach(([id]) => delete data[id]);
      }
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
    } catch (err) {
      logger.debug('Produkt-Disk-Cache konnte nicht geschrieben werden', { err: err.message });
    }
  }, 800);
}

/** Einzelnes Produkt aus Disk-Cache (ohne Ablauf – Fallback bei API-Ausfall). */
export function diskGetProduct(id) {
  const entry = load()[id];
  return entry?.product || null;
}

export function diskGetProducts(ids = []) {
  const out = [];
  for (const id of ids) {
    const p = diskGetProduct(id);
    if (p) out.push(p);
  }
  return out;
}

export function diskSetProduct(product) {
  if (!product?.id) return;
  const data = load();
  data[product.id] = { product, savedAt: Date.now() };
  scheduleWrite();
}

export function diskSetProducts(products = []) {
  for (const p of products) diskSetProduct(p);
}
