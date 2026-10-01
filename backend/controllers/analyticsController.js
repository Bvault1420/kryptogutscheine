import { trackEvent, getRankedProductIds, getAnalyticsSummary } from '../storage/store.js';
import { bitrefillService } from '../services/bitrefillService.js';
import { filterAllowedProducts } from '../utils/productFilter.js';
import { cacheKey, cacheGetOrSet } from '../utils/cache.js';
import { z } from 'zod';

const eventSchema = z.object({
  type: z.enum(['view', 'cart', 'purchase']),
  productId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_\-<>]+$/),
});

export function trackProductEvent(req, res, next) {
  try {
    const { type, productId } = eventSchema.parse(req.body);
    trackEvent(type, productId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function getPopularProducts(req, res, next) {
  try {
    const country = req.query.country || 'DE';
    const k = cacheKey('popular', country);
    const data = await cacheGetOrSet(k, async () => {
      const ids = getRankedProductIds(16);
      if (!ids.length) return [];
      const products = await bitrefillService.getProductsByIds(ids);
      return filterAllowedProducts(products);
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export function getAnalytics(req, res) {
  res.json({ data: getAnalyticsSummary() });
}
