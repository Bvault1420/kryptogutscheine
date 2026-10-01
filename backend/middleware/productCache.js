/** Kurzes HTTP-Caching für öffentliche Produkt-GETs (Browser + CDN). */
export function productCacheHeaders(req, res, next) {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
  }
  next();
}
