import { Router } from 'express';
import {
  createInvoice,
  getInvoiceStatus,
  getOrderDetails,
  getCsrfToken,
  healthCheck,
  getPublicConfig,
  listOrders,
} from '../controllers/invoicesController.js';
import { handleBitrefillWebhook } from '../controllers/webhookController.js';
import { subscribe, confirm, unsubscribe } from '../controllers/newsletterController.js';
import { getAnalytics } from '../controllers/analyticsController.js';
import { csrfProtection } from '../middleware/csrf.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { adminIpAllowlist } from '../middleware/adminIpAllowlist.js';
import { invoiceLimiter, newsletterLimiter, webhookLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/csrf', getCsrfToken);
router.get('/config', getPublicConfig);
router.get('/health', healthCheck);

// Admin-only: Bestellliste & Analytics
router.get('/orders', adminIpAllowlist, adminAuth, listOrders);
router.get('/analytics', adminIpAllowlist, adminAuth, getAnalytics);

router.post('/webhook/bitrefill', webhookLimiter, handleBitrefillWebhook);
router.post('/newsletter', newsletterLimiter, csrfProtection, subscribe);
router.get('/newsletter/confirm', confirm);
router.post('/newsletter/unsubscribe', newsletterLimiter, csrfProtection, unsubscribe);
router.post('/invoices', invoiceLimiter, csrfProtection, createInvoice);
router.get('/invoices/:id', getInvoiceStatus);
router.get('/orders/:id', getOrderDetails);

export default router;
