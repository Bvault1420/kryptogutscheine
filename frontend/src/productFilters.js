import { getAmountBounds } from './productDenominations.js';
import { t } from '../src/i18n.js';
import { BLOCKED_ID_PATTERNS, BLOCKED_CATEGORY_KEYWORDS } from '@shared/productBlocklist.js';

export const SORT_OPTIONS = [
  { id: 'name', labelKey: 'sort.name' },
  { id: 'price-asc', labelKey: 'sort.priceAsc' },
  { id: 'price-desc', labelKey: 'sort.priceDesc' },
  { id: 'discount', labelKey: 'sort.discount' },
];

export function getSortOptions() {
  return SORT_OPTIONS.map((o) => ({ id: o.id, label: t(o.labelKey) }));
}

export const CATEGORY_CHIPS = [
  { id: '', labelKey: 'cat.all' },
  { id: 'games,game-stores', labelKey: 'cat.gaming' },
  { id: 'electronics,home,ecommerce,retail', labelKey: 'cat.shopping' },
  { id: 'apparel', labelKey: 'cat.fashion' },
  { id: 'entertainment,streaming,experiences,social', labelKey: 'cat.entertainment' },
  { id: 'travel,accommodation', labelKey: 'cat.travel' },
  { id: 'sports-n-outdoors', labelKey: 'cat.sports' },
];

export function getCategoryChips() {
  return CATEGORY_CHIPS.map((c) => ({ id: c.id, label: t(c.labelKey) }));
}

function categoryText(product) {
  const c = product?.categories;
  if (Array.isArray(c)) return c.join(' ').toLowerCase();
  return String(c || '').toLowerCase();
}

function isBlocked(product) {
  const id = String(product?.id || '').toLowerCase();
  const cats = categoryText(product);

  if (product.recipient_type === 'phone_number') return true;
  if (BLOCKED_ID_PATTERNS.some((p) => id.includes(p))) return true;
  if (BLOCKED_CATEGORY_KEYWORDS.some((k) => cats.includes(k))) return true;
  return false;
}

/** Nur klassische digitale Gutscheine (keine eSIMs, Aufladungen, Glücksspiel etc.). */
export function isAllowedProduct(product) {
  if (!product) return false;
  return !isBlocked(product);
}

export { isVisibleProduct, isProductAvailable, matchesProductCountry } from './productAvailability.js';

/** @deprecated Alias – nutzt isAllowedProduct */
export function isGiftCard(product) {
  return isAllowedProduct(product);
}

export function matchesCategory(product, category) {
  if (!category) return true;
  const wanted = category.split(',').map((c) => c.trim().toLowerCase());
  const cats = categoryText(product).split(/[\s,]+/).filter(Boolean);
  return wanted.some((w) => cats.some((c) => c.includes(w) || w.includes(c)));
}

function minPrice(product) {
  const { min } = getAmountBounds(product);
  return min != null ? min : Infinity;
}

export function sortProducts(products, sortBy = 'name') {
  return [...products].sort((a, b) => {
    if (a.in_stock === false && b.in_stock !== false) return 1;
    if (b.in_stock === false && a.in_stock !== false) return -1;

    switch (sortBy) {
      case 'price-asc':
        return minPrice(a) - minPrice(b);
      case 'price-desc':
        return minPrice(b) - minPrice(a);
      case 'discount':
        return (Number(b.discount_percentage) || 0) - (Number(a.discount_percentage) || 0);
      default:
        return (a.name?.toLowerCase() || '').localeCompare(b.name?.toLowerCase() || '', 'de');
    }
  });
}
