import { bitrefillService } from '../services/bitrefillService.js';
import { productListSchema, productIdSchema, productIdsQuerySchema } from '../utils/validate.js';
import { filterAllowedProducts, isAllowedProduct } from '../utils/productFilter.js';
import {
  filterCuratedProducts,
  getCuratedIds,
  isCuratedProduct,
  isCuratedProductIdAnyCountry,
  sortByCuratedOrder,
  curatedCatalogSize,
} from '../utils/curatedCatalog.js';
import { trackEvent } from '../storage/store.js';
import { cacheKey, cacheGetStale } from '../utils/cache.js';
import { filterAvailableProducts } from '../utils/productAvailability.js';
import { BitrefillError } from '../utils/errors.js';
import { z } from 'zod';

export async function listProducts(req, res, next) {
  try {
    const query = productListSchema.parse(req.query);
    const result = await bitrefillService.getProducts(query);
    res.json({ ...result, data: filterAllowedProducts(result.data) });
  } catch (err) {
    next(err);
  }
}

/** Kuratierte Whitelist – nur rechtlich unbedenkliche Marken-Gutscheine (~100 pro Land). */
export async function listCuratedProducts(req, res, next) {
  try {
    const country = (req.query.country || 'DE').toUpperCase();
    const allIds = getCuratedIds(country);
    const catalogSize = curatedCatalogSize(country);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '48', 10) || 48, 1), 80);
    const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);
    const ids = allIds.slice(offset, offset + limit);
    let fetched;
    let stale = false;
    const cacheK = cacheKey('batch', [...ids].sort().join(','));
    try {
      fetched = await bitrefillService.getProductsByIds(ids);
      if (!fetched.length) {
        const cached = cacheGetStale(cacheK);
        if (cached?.length) {
          fetched = cached;
          stale = true;
        }
      }
    } catch (err) {
      const cached = cacheGetStale(cacheK);
      if (cached?.length) {
        fetched = cached;
        stale = true;
      } else {
        throw err;
      }
    }
    const data = sortByCuratedOrder(filterCuratedProducts(fetched || [], country), country);

    // Erste Seite: Upstream lieferte nichts und kein Stale-Cache → echter Ausfall
    if (!data.length && !fetched?.length && ids.length && offset === 0 && !stale) {
      throw new BitrefillError(
        'Gutschein-Katalog vorübergehend nicht erreichbar. Bitte später erneut versuchen.',
        503,
        'BITREFILL_UNAVAILABLE'
      );
    }

    res.json({
      data,
      total: data.length,
      curated: true,
      catalogSize,
      fetchedCount: data.length,
      offset,
      limit,
      hasMore: offset + limit < catalogSize,
      country,
      ...(stale ? { stale: true } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const { id } = productIdSchema.parse(req.params);
    trackEvent('view', id);
    const product = await bitrefillService.getProductById(id);
    if (!isAllowedProduct(product)) {
      return res.status(404).json({ error: 'Produkt nicht verfügbar.', code: 'PRODUCT_NOT_FOUND' });
    }
    const country = req.query.country?.toUpperCase();
    if (country && !isCuratedProduct(product, country)) {
      return res.status(404).json({ error: 'Produkt nicht im kuratierten Katalog.', code: 'PRODUCT_NOT_CURATED' });
    }
    if (country && !filterAvailableProducts([product], country).length) {
      return res.status(404).json({ error: 'Produkt für dieses Land nicht verfügbar.', code: 'PRODUCT_NOT_AVAILABLE' });
    }
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function searchProducts(req, res, next) {
  try {
    const query = productListSchema.parse({ ...req.query, search: req.query.q || req.query.search });
    const country = (req.query.country || 'DE').toUpperCase();
    const result = await bitrefillService.getProducts(query);
    const data = filterAvailableProducts(filterAllowedProducts(result.data), country).filter((p) =>
      isCuratedProduct(p, country)
    );
    res.json({ ...result, data, total: data.length });
  } catch (err) {
    next(err);
  }
}

export async function suggestProducts(req, res, next) {
  try {
    const q = z.string().min(1).max(100).parse(req.query.q);
    const country = (req.query.country || 'DE').toUpperCase();
    const result = await bitrefillService.getProducts({ search: q, limit: 8, start: 0, country });
    const suggestions = filterAvailableProducts(filterAllowedProducts(result.data || []), country)
      .filter((p) => isCuratedProduct(p, country))
      .map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      currency: p.currency,
    }));
    res.json({ data: suggestions });
  } catch (err) {
    next(err);
  }
}

export async function batchProducts(req, res, next) {
  try {
    const { ids } = productIdsQuerySchema.parse(req.query);
    const country = (req.query.country || 'DE').toUpperCase();
    const data = filterAvailableProducts(
      filterAllowedProducts(await bitrefillService.getProductsByIds(ids)),
      country
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
