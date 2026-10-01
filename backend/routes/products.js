import { Router } from 'express';
import {
  listProducts,
  getProduct,
  searchProducts,
  batchProducts,
  suggestProducts,
  listCuratedProducts,
} from '../controllers/productsController.js';
import { trackProductEvent, getPopularProducts } from '../controllers/analyticsController.js';
import { productLimiter, trackLimiter } from '../middleware/rateLimiter.js';
import { productCacheHeaders } from '../middleware/productCache.js';
import { csrfProtection } from '../middleware/csrf.js';

const router = Router();

router.use(productCacheHeaders);

router.get('/curated', productLimiter, listCuratedProducts);
router.get('/', productLimiter, listProducts);
router.get('/search', productLimiter, searchProducts);
router.get('/suggest', productLimiter, suggestProducts);
router.get('/popular', productLimiter, getPopularProducts);
router.get('/batch', productLimiter, batchProducts);
router.post('/track', trackLimiter, csrfProtection, trackProductEvent);
router.get('/:id', productLimiter, getProduct);

export default router;
