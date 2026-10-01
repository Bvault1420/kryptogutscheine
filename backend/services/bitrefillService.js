import { fetchWithRetry } from '../utils/retry.js';
import { BitrefillError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { cacheKey, cacheGet, cacheGetStale, cacheGetOrSet, cacheSet, cacheDel } from '../utils/cache.js';
import { applyVoucherLimitsToProduct } from '../utils/voucherLimits.js';
import { diskGetProduct, diskGetProducts, diskSetProduct, diskSetProducts } from '../utils/productDiskCache.js';
import { getCuratedIds } from '../data/curatedCatalog.js';

const BASE_URL = process.env.BITREFILL_API_BASE_URL || 'https://api-bitrefill.com/v2';

function getApiKey() {
  const apiKey = process.env.BITREFILL_API_KEY?.trim();
  if (!apiKey) {
    throw new BitrefillError(
      'Bitrefill API-Key nicht konfiguriert. BITREFILL_API_KEY in .env setzen.',
      503,
      'API_NOT_CONFIGURED'
    );
  }
  return apiKey;
}

function buildHeaders(extra = {}) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
    ...extra,
  };
}

async function parseResponse(response) {
  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!response.ok) {
    const upstreamCode = body?.error_code || 'BITREFILL_ERROR';
    let message = body?.message || body?.error || `Bitrefill API Fehler (${response.status})`;
    let code = upstreamCode;

    const codeMap = {
      unsupported_payment_method: 'PAYMENT_METHOD_UNSUPPORTED',
      product_not_found: 'PRODUCT_NOT_FOUND',
      not_found: 'PRODUCT_NOT_FOUND',
      invalid_product_value: 'INVALID_DENOMINATION',
      wrong_value: 'INVALID_DENOMINATION',
      invalid_value: 'INVALID_DENOMINATION',
      invalid_package_id: 'INVALID_PACKAGE',
      out_of_stock: 'PRODUCT_OUT_OF_STOCK',
      number_refused: 'INVALID_PHONE_NUMBER',
      invalid_phone_number: 'INVALID_PHONE_NUMBER',
      unsupported_operator: 'INVALID_PHONE_NUMBER',
      balance_too_low: 'PAYMENT_FAILED',
    };
    if (codeMap[upstreamCode]) code = codeMap[upstreamCode];

    if (code === 'PAYMENT_METHOD_UNSUPPORTED') {
      message = 'Zahlungsmethode wird für dieses Produkt nicht unterstützt.';
    } else if (upstreamCode === 'product_not_found' || upstreamCode === 'not_found') {
      message = 'Produkt bei Bitrefill nicht gefunden.';
    } else if (['invalid_product_value', 'wrong_value', 'invalid_value'].includes(upstreamCode)) {
      message = 'Der gewählte Betrag ist für dieses Produkt nicht verfügbar. Bitte wählen Sie eine andere Stückelung.';
    } else if (upstreamCode === 'invalid_package_id') {
      message = 'Das gewählte Paket ist nicht verfügbar. Bitte wählen Sie eine andere Stückelung.';
    } else if (upstreamCode === 'out_of_stock') {
      message = 'Dieses Produkt ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.';
    } else if (upstreamCode === 'missing_param' && /phone_number/i.test(message)) {
      message = 'Für dieses Produkt ist eine Telefonnummer erforderlich.';
    } else if (['number_refused', 'invalid_phone_number', 'unsupported_operator'].includes(upstreamCode)) {
      message = 'Die Telefonnummer wurde abgelehnt. Bitte prüfen Sie Nummer und Anbieter (Format mit Ländervorwahl, z. B. +49…).';
    } else if (upstreamCode === 'balance_too_low') {
      message = 'Zahlung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.';
    }

    logger.error('Bitrefill API error', { status: response.status, code, message });
    throw new BitrefillError(message, response.status, code, body);
  }

  return body;
}

function includeTestProducts() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.BITREFILL_INCLUDE_TEST_PRODUCTS === 'true';
  }
  return process.env.BITREFILL_INCLUDE_TEST_PRODUCTS !== 'false';
}

export function isTestCatalogMode() {
  return includeTestProducts();
}

function normalizePackages(packages) {
  if (!packages) return [];
  if (Array.isArray(packages)) return packages;
  if (typeof packages === 'object') {
    const values = Object.values(packages);
    if (values.every((v) => v && typeof v === 'object')) return values;
  }
  return [packages];
}

/** Bitrefill-Testkatalog liefert TikTok oft ohne packages – öffentliche EUR/USD-Stufen. */
function fallbackTikTokPackages(product) {
  const id = String(product?.id || '').toLowerCase();
  if (!id.includes('tiktok')) return null;
  const currency = String(product.currency || 'EUR').toUpperCase();
  const values = currency === 'USD' || currency === 'GBP' ? [10, 15, 25, 50] : [15, 20, 25, 35];
  return values.map((value) => ({
    id: `${product.id}<&>${value}`,
    package_id: `${product.id}<&>${value}`,
    value,
    label: `${value} ${currency}`,
  }));
}

function hydrateEmptyPackages(product) {
  if (!product) return product;
  if (product.packages?.length || product.range || product.amount_summary?.min != null) return product;
  const packages = fallbackTikTokPackages(product);
  if (!packages) return product;
  return applyVoucherLimitsToProduct({ ...product, packages });
}

function computeAmountSummary(packages, range) {
  const pkgValues = packages.map((p) => Number(p.value)).filter((n) => !Number.isNaN(n));
  const rangeMin = range?.min != null ? Number(range.min) : null;
  const rangeMax = range?.max != null ? Number(range.max) : null;
  const mins = [pkgValues[0], rangeMin].filter((n) => n != null && !Number.isNaN(n));
  const maxs = [pkgValues[pkgValues.length - 1], rangeMax].filter((n) => n != null && !Number.isNaN(n));

  if (!mins.length && !maxs.length) return null;

  return {
    min: mins.length ? Math.min(...mins) : null,
    max: maxs.length ? Math.max(...maxs) : null,
    step: range?.step != null ? Number(range.step) : 1,
    supportsCustomAmount: rangeMin != null && rangeMax != null,
    packageCount: packages.length,
  };
}

function sanitizeProduct(product) {
  if (!product) return product;

  const packages = normalizePackages(product.packages)
    .map((pkg) => ({
      id: pkg.id || pkg.package_id,
      package_id: pkg.id || pkg.package_id,
      value: pkg.value ?? pkg.amount,
      price: pkg.price,
      label: pkg.label || pkg.description || pkg.name || pkg.title,
      data: pkg.data,
      duration: pkg.duration,
    }))
    .sort((a, b) => Number(a.value) - Number(b.value));

  const range = product.range
    ? {
        min: product.range.min != null ? Number(product.range.min) : undefined,
        max: product.range.max != null ? Number(product.range.max) : undefined,
        step: product.range.step != null ? Number(product.range.step) : undefined,
        price_rate: product.range.price_rate,
      }
    : undefined;

  const amount_summary = computeAmountSummary(packages, range);

  const limited = applyVoucherLimitsToProduct({
    id: product.id,
    name: product.name,
    country_code: product.country_code,
    country_name: product.country_name,
    currency: product.currency,
    image:
      product.image?.startsWith('http')
        ? product.image
        : `https://cdn.bitrefill.com/primg/w250h100i1/${product.id}.webp`,
    in_stock: product.in_stock !== false,
    packages,
    range,
    amount_summary,
    recipient_type: product.recipient_type,
    categories: product.categories,
    discount_percentage: product.discount_percentage,
    cashback_percentage: product.cashback_percentage,
    description: product.description,
    redeem_instruction: product.redeem_instruction,
  });
  return hydrateEmptyPackages(limited);
}

function mapInvoiceStatus(status) {
  const map = {
    unpaid: 'pending',
    payment_detected: 'processing',
    payment_confirmed: 'processing',
    pending: 'processing',
    complete: 'complete',
    all_delivered: 'complete',
    delivered: 'complete',
    blocked: 'failed',
    denied: 'failed',
    payment_error: 'failed',
    not_delivered: 'pending',
  };
  return map[status] || status;
}

function sanitizeInvoice(invoice) {
  if (!invoice) return invoice;

  const orders = (invoice.orders || []).map((order) => ({
    id: order.id,
    status: order.status,
    product: order.product
      ? {
          id: order.product.id,
          name: order.product.name,
          value: order.product.value,
          currency: order.product.currency,
          image: order.product.image,
        }
      : undefined,
    redemption_info: order.redemption_info,
    delivered_time: order.delivered_time,
  }));

  return {
    id: invoice.id,
    status: mapInvoiceStatus(invoice.status),
    rawStatus: invoice.status,
    created_time: invoice.created_time,
    completed_time: invoice.completed_time,
    payment: invoice.payment
      ? {
          method: invoice.payment.method,
          address: invoice.payment.address,
          currency: invoice.payment.currency,
          price: invoice.payment.price,
          status: invoice.payment.status,
        }
      : undefined,
    orders,
  };
}

export const bitrefillService = {
  async ping() {
    const response = await fetchWithRetry(`${BASE_URL}/ping`, { headers: buildHeaders() });
    return parseResponse(response);
  },

  async getProducts({ start = 0, limit = 50, country, category, search } = {}) {
    const k = cacheKey('products', start, limit, country, category, search);
    try {
      return await cacheGetOrSet(k, async () => {
        const params = new URLSearchParams();
        params.set('start', String(start));
        params.set('limit', String(Math.min(limit, 50)));
        if (includeTestProducts()) params.set('include_test_products', 'true');
        if (country) params.set('country', country);
        if (category) params.set('category', category);

        const url = search
          ? `${BASE_URL}/products/search?${params}&q=${encodeURIComponent(search)}`
          : `${BASE_URL}/products?${params}`;

        const response = await fetchWithRetry(url, { headers: buildHeaders() });
        const body = await parseResponse(response);

        const data = (body.data || []).map(sanitizeProduct);
        diskSetProducts(data);
        return {
          meta: body.meta,
          data,
        };
      });
    } catch (err) {
      const stale = cacheGetStale(k);
      if (stale) return stale;
      throw err;
    }
  },

  async getProductById(id) {
    const k = cacheKey('product', id);
    const cached = cacheGet(k);
    if (cached?.packages?.length || cached?.amount_summary?.min != null) {
      return hydrateEmptyPackages(cached);
    }
    if (cached) cacheDel(k);

    const fromDisk = diskGetProduct(id);
    if (fromDisk?.packages?.length || fromDisk?.amount_summary?.min != null) {
      const ready = hydrateEmptyPackages(fromDisk);
      cacheSet(k, ready);
      return ready;
    }

    return cacheGetOrSet(k, async () => {
      try {
        const response = await fetchWithRetry(
          `${BASE_URL}/products/${encodeURIComponent(id)}`,
          { headers: buildHeaders() },
          { retries: 1 }
        );
        const body = await parseResponse(response);
        const product = sanitizeProduct(body.data);
        diskSetProduct(product);
        return product;
      } catch (err) {
        const stale = hydrateEmptyPackages(cacheGetStale(k) || diskGetProduct(id));
        if (stale) return stale;
        throw err;
      }
    });
  },

  async getProductsByIds(ids = []) {
    const unique = [...new Set(ids.filter(Boolean))].slice(0, 120);
    if (!unique.length) return [];

    const cached = [];
    const missing = [];
    for (const id of unique) {
      const hit = hydrateEmptyPackages(cacheGet(cacheKey('product', id)) || diskGetProduct(id));
      if (hit?.packages?.length || hit?.amount_summary?.min != null) {
        cacheSet(cacheKey('product', id), hit);
        cached.push(hit);
      } else if (hit && !String(id).toLowerCase().includes('tiktok')) {
        cacheSet(cacheKey('product', id), hit);
        cached.push(hit);
      } else {
        missing.push(id);
      }
    }

    if (!missing.length) {
      const byId = new Map(cached.map((p) => [p.id, p]));
      return unique.map((id) => byId.get(id)).filter(Boolean);
    }

    const k = cacheKey('batch', [...missing].sort().join(','));
    let fetched = [];
    let upstreamFailed = false;
    try {
      const cachedBatch = cacheGet(k);
      if (cachedBatch?.length) {
        fetched = cachedBatch;
      } else {
        const out = [];
        let failures = 0;
        const chunkSize = 20;
        for (let i = 0; i < missing.length; i += chunkSize) {
          const chunk = missing.slice(i, i + chunkSize);
          const results = await Promise.allSettled(chunk.map((id) => this.getProductById(id)));
          for (const r of results) {
            if (r.status === 'fulfilled' && r.value) out.push(r.value);
            else failures += 1;
          }
          if (i + chunkSize < missing.length) {
            await new Promise((r) => setTimeout(r, 30));
          }
        }
        // Leere Fehlschläge nicht cachen – sonst bleibt der Shop 15 Min leer
        if (out.length) {
          cacheSet(k, out);
          diskSetProducts(out);
          fetched = out;
        } else if (failures > 0) {
          upstreamFailed = true;
          fetched = diskGetProducts(missing);
        }
      }
    } catch {
      upstreamFailed = true;
      fetched = diskGetProducts(missing);
    }

    if (!fetched.length) {
      fetched = diskGetProducts(missing);
    }

    const byId = new Map([...cached, ...fetched].map((p) => [p.id, p]));
    const result = unique.map((id) => byId.get(id)).filter(Boolean);

    if (!result.length && missing.length && upstreamFailed) {
      throw new BitrefillError(
        'Gutschein-Katalog vorübergehend nicht erreichbar. Bitte später erneut versuchen.',
        503,
        'BITREFILL_UNAVAILABLE'
      );
    }

    return result.map(hydrateEmptyPackages);
  },

  async createInvoice({
    items,
    productId,
    value,
    packageId,
    phoneNumber,
    quantity = 1,
    paymentMethod = 'lightning',
  }) {
    const list =
      items && items.length
        ? items
        : [{ productId, value, packageId, phoneNumber, quantity }];

    const products = list.map((it) => {
      const product = { product_id: it.productId, quantity: it.quantity || 1 };
      if (it.packageId) product.package_id = it.packageId;
      else if (it.value !== undefined) product.value = it.value;
      if (it.phoneNumber) product.phone_number = it.phoneNumber;
      return product;
    });

    const payload = {
      products,
      payment_method: paymentMethod,
      send_email: false,
      auto_pay: false,
    };

    const response = await fetchWithRetry(
      `${BASE_URL}/invoices`,
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      { retries: 2, timeoutMs: 20000 }
    );

    const body = await parseResponse(response);
    return sanitizeInvoice(body.data);
  },

  async getInvoiceById(id) {
    const response = await fetchWithRetry(`${BASE_URL}/invoices/${encodeURIComponent(id)}`, {
      headers: buildHeaders(),
    });
    const body = await parseResponse(response);
    return sanitizeInvoice(body.data);
  },

  async getOrderById(id) {
    const response = await fetchWithRetry(`${BASE_URL}/orders/${encodeURIComponent(id)}`, {
      headers: buildHeaders(),
    });
    const body = await parseResponse(response);
    const order = body.data;

    return {
      id: order.id,
      status: order.status,
      product: order.product
        ? {
            id: order.product.id,
            name: order.product.name,
            value: order.product.value,
            currency: order.product.currency,
            image: order.product.image,
          }
        : undefined,
      redemption_info: order.redemption_info,
      delivered_time: order.delivered_time,
      invoice: order.invoice ? { id: order.invoice.id } : undefined,
    };
  },
};

function warmProductCache() {
  if (process.env.CACHE_WARMUP === 'false') return;

  setImmediate(async () => {
    try {
      const curatedWarm = getCuratedIds('DE').slice(0, 48);
      const [list, byIds] = await Promise.all([
        bitrefillService.getProducts({ start: 0, limit: 50, country: 'DE' }).catch(() => null),
        bitrefillService.getProductsByIds(curatedWarm),
      ]);
      if (list?.data?.length) diskSetProducts(list.data);
      if (byIds?.length) diskSetProducts(byIds);
      logger.info('Produkt-Cache vorgewärmt.', { curated: byIds?.length || 0 });
    } catch (err) {
      logger.debug('Cache-Warmup übersprungen', { err: err.message });
    }
  });
}

export function validateApiKeyAtStartup() {
  try {
    getApiKey();
    logger.info('Bitrefill API-Key konfiguriert.', {
      testProducts: includeTestProducts(),
    });
    warmProductCache();
  } catch (err) {
    logger.warn(`Bitrefill-Warnung: ${err.message}`, { code: err.code });
  }
}
