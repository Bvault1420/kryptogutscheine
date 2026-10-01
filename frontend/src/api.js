let csrfToken = null;

const GET_CACHE_MS = 300_000; // 5 min client-side cache
const memCache = new Map();
const inFlight = new Map();

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const res = await fetch('/api/csrf', { credentials: 'include' });
  if (!res.ok) throw new Error('CSRF-Token konnte nicht geladen werden.');
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };

  if (options.method && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    headers['X-CSRF-Token'] = await ensureCsrf();
  }

  if (options.orderToken) {
    headers['X-Order-Token'] = options.orderToken;
  }

  const { orderToken: _ot, ...fetchOptions } = options;
  const res = await fetch(path, { ...fetchOptions, headers, credentials: 'include' });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(body.error || `Anfrage fehlgeschlagen (${res.status})`);
    err.code = body.code;
    err.details = body.details;
    throw err;
  }

  return body;
}

/** GET mit In-Memory-Cache und In-Flight-Deduplizierung. */
function cachedGet(path) {
  const now = Date.now();
  const hit = memCache.get(path);
  if (hit && hit.expires > now) return Promise.resolve(hit.value);

  if (inFlight.has(path)) return inFlight.get(path);

  const promise = request(path)
    .then((body) => {
      // Leere Produktlisten nicht lange cachen (API-/TLS-Ausfälle sonst „kleben“)
      const emptyProducts =
        Array.isArray(body?.data) &&
        body.data.length === 0 &&
        /\/api\/products/.test(path);
      const ttl = emptyProducts ? 15_000 : GET_CACHE_MS;
      memCache.set(path, { value: body, expires: Date.now() + ttl });
      inFlight.delete(path);
      return body;
    })
    .catch((err) => {
      inFlight.delete(path);
      throw err;
    });

  inFlight.set(path, promise);
  return promise;
}

export function clearApiCache(prefix = '') {
  if (!prefix) {
    memCache.clear();
    return;
  }
  for (const key of memCache.keys()) {
    if (key.includes(prefix)) memCache.delete(key);
  }
}

function buildQs(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  return qs.toString();
}

export const api = {
  getProducts(params = {}) {
    return cachedGet(`/api/products?${buildQs(params)}`);
  },

  getCuratedProducts(country, params = {}) {
    return cachedGet(`/api/products/curated?${buildQs({ country, ...params })}`);
  },

  searchProducts(q, params = {}) {
    return cachedGet(`/api/products/search?${buildQs({ q, ...params })}`);
  },

  suggestProducts(q, country) {
    const qs = buildQs({ q, country });
    return cachedGet(`/api/products/suggest?${qs}`);
  },

  getPopularProducts(country) {
    const qs = country ? `?country=${country}` : '';
    return cachedGet(`/api/products/popular${qs}`);
  },

  trackProduct(type, productId) {
    return request('/api/products/track', {
      method: 'POST',
      body: JSON.stringify({ type, productId }),
    }).catch(() => {});
  },

  getProduct(id, country) {
    const qs = country ? `?country=${encodeURIComponent(country)}` : '';
    return cachedGet(`/api/products/${encodeURIComponent(id)}${qs}`);
  },

  getProductsBatch(ids, country) {
    const qs = new URLSearchParams({ ids: ids.join(',') });
    if (country) qs.set('country', country);
    return cachedGet(`/api/products/batch?${qs}`);
  },

  createInvoice(payload) {
    return request('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getInvoice(id, orderToken) {
    return request(`/api/invoices/${encodeURIComponent(id)}`, { orderToken });
  },

  getOrder(id, orderToken) {
    return request(`/api/orders/${encodeURIComponent(id)}`, { orderToken });
  },

  subscribeNewsletter(email) {
    return request('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  confirmNewsletter(token) {
    return request(`/api/newsletter/confirm?token=${encodeURIComponent(token)}`);
  },

  unsubscribeNewsletter(email) {
    return request('/api/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  health() {
    return cachedGet('/api/health');
  },
};
