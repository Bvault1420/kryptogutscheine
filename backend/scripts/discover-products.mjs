import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { CURATED_BY_COUNTRY, CURATED_BLOCK_PATTERNS } from '../data/curatedCatalog.js';
import { BLOCKED_ID_PATTERNS, BLOCKED_CATEGORY_KEYWORDS } from '../../shared/productBlocklist.js';

const key = process.env.BITREFILL_API_KEY?.trim();
if (!key) {
  console.error('BITREFILL_API_KEY fehlt');
  process.exit(1);
}

function isSafe(id, categories = []) {
  const lower = id.toLowerCase();
  if (BLOCKED_ID_PATTERNS.some((p) => lower.includes(p))) return false;
  if (CURATED_BLOCK_PATTERNS.some((p) => lower.includes(p))) return false;
  const cats = (categories || []).join(' ').toLowerCase();
  if (BLOCKED_CATEGORY_KEYWORDS.some((k) => cats.includes(k))) return false;
  if (lower.includes('esim') || lower.includes('refill') || lower.includes('prepaid-visa')) return false;
  if (lower.includes('hotelgift') || lower.includes('airlinegift')) return false;
  return true;
}

const existing = new Set(Object.values(CURATED_BY_COUNTRY).flat());
const headers = { Authorization: `Bearer ${key}`, Accept: 'application/json' };

async function fetchCountry(country, pages = 4) {
  const found = [];
  for (let start = 0; start < pages * 50; start += 50) {
    const params = new URLSearchParams({
      start: String(start),
      limit: '50',
      country,
      include_test_products: 'true',
    });
    const res = await fetch(`https://api-bitrefill.com/v2/products?${params}`, { headers });
    const body = await res.json();
    if (!body.data?.length) break;
    for (const p of body.data) {
      if (isSafe(p.id, p.categories) && !existing.has(p.id)) {
        found.push({ id: p.id, name: p.name, country: p.country_code });
      }
    }
  }
  return found;
}

const countries = ['DE', 'AT', 'CH', 'FR', 'NL', 'ES', 'IT', 'GB', 'US'];
const all = {};
for (const c of countries) {
  all[c] = await fetchCountry(c);
  console.log(`${c}: ${all[c].length} neue Kandidaten`);
  all[c].slice(0, 15).forEach((p) => console.log(`  ${p.id}`));
}

console.log('\nJSON snippet:');
for (const c of ['DE', 'AT', 'CH']) {
  console.log(`// ${c} additions:`, all[c].slice(0, 20).map((p) => p.id));
}
