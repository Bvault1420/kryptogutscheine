const DEFAULT_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '900000', 10); // 15 min
const store = new Map();
const inFlight = new Map();

function key(parts) {
  return parts.filter(Boolean).join('|');
}

export function cacheGet(k) {
  const entry = store.get(k);
  if (!entry) return null;
  if (Date.now() > entry.expires) return null;
  return entry.value;
}

/** Abgelaufenen Cache zurückgeben (z. B. bei API-Rate-Limits). */
export function cacheGetStale(k) {
  const entry = store.get(k);
  return entry?.value ?? null;
}

export function cacheSet(k, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(k, { value, expires: Date.now() + ttlMs });
}

/** Cache miss: nur ein Upstream-Request pro Key (kein Stampede). */
export async function cacheGetOrSet(k, factory, ttlMs = DEFAULT_TTL_MS) {
  const cached = cacheGet(k);
  if (cached !== null) return cached;

  if (inFlight.has(k)) return inFlight.get(k);

  const promise = Promise.resolve()
    .then(factory)
    .then((value) => {
      cacheSet(k, value, ttlMs);
      inFlight.delete(k);
      return value;
    })
    .catch((err) => {
      inFlight.delete(k);
      throw err;
    });

  inFlight.set(k, promise);
  return promise;
}

export function cacheDel(k) {
  store.delete(k);
}

export function cacheKey(...parts) {
  return key(parts);
}

export function cacheStats() {
  let active = 0;
  const now = Date.now();
  for (const [, v] of store) if (v.expires > now) active++;
  return { total: store.size, active, ttlMs: DEFAULT_TTL_MS };
}
