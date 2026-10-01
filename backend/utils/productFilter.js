import { BLOCKED_ID_PATTERNS, BLOCKED_CATEGORY_KEYWORDS } from '../../shared/productBlocklist.js';

function categoryText(product) {
  const c = product?.categories;
  if (Array.isArray(c)) return c.join(' ').toLowerCase();
  return String(c || '').toLowerCase();
}

/** Nur klassische digitale Gutscheine (keine eSIMs, Aufladungen, Glücksspiel etc.). */
export function isAllowedProduct(product) {
  if (!product) return false;
  if (product.recipient_type === 'phone_number') return false;

  const id = String(product.id || '').toLowerCase();
  const cats = categoryText(product);

  if (BLOCKED_ID_PATTERNS.some((p) => id.includes(p))) return false;
  if (BLOCKED_CATEGORY_KEYWORDS.some((k) => cats.includes(k))) return false;

  return true;
}

export function filterAllowedProducts(products) {
  return (products || []).filter(isAllowedProduct);
}
