import { isAllowedProduct } from './productFilter.js';
import { isProductAvailable } from './productAvailability.js';
import {
  getCuratedIds,
  isCuratedIdBlocked,
  isCuratedProductId,
  isCuratedProductIdAnyCountry,
} from '../data/curatedCatalog.js';

export { getCuratedIds, isCuratedProductId, isCuratedProductIdAnyCountry, curatedCatalogSize } from '../data/curatedCatalog.js';

/** Produkt muss Sperrliste passieren UND auf der kuratierten Whitelist stehen. */
export function isCuratedProduct(product, country) {
  if (!product || !isAllowedProduct(product)) return false;
  if (isCuratedIdBlocked(product.id)) return false;
  return isCuratedProductId(product.id, country);
}

export function filterCuratedProducts(products, country) {
  const allowed = new Set(getCuratedIds(country));
  return (products || [])
    .filter(
      (p) => isAllowedProduct(p) && !isCuratedIdBlocked(p.id) && allowed.has(p.id)
    )
    .filter((p) => isProductAvailable(p, country));
}

/** Reihenfolge gemäß kuratierter Liste beibehalten. */
export function sortByCuratedOrder(products, country) {
  const order = getCuratedIds(country);
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...products].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
}
