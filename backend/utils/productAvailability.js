import { hasPurchasableAmount } from './voucherLimits.js';
import { matchesProductCountry } from './productCountry.js';

export function isProductInStock(product) {
  return product?.in_stock !== false;
}

/** Verfügbar, passend zum Land und mit gültigem Betrag (min API – max 500). */
export function isProductAvailable(product, country) {
  if (!product) return false;
  if (!isProductInStock(product)) return false;
  if (!hasPurchasableAmount(product)) return false;
  if (!matchesProductCountry(product, country)) return false;
  return true;
}

export function filterAvailableProducts(products, country) {
  return (products || []).filter((p) => isProductAvailable(p, country));
}
