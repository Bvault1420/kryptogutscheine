import { logWebhook, updateOrderStatus } from '../storage/store.js';
import { logger } from '../utils/logger.js';
import { timingSafeEqualString } from '../utils/crypto.js';

/**
 * Bitrefill-Webhook: Signatur ist in Production Pflicht.
 * Header: x-bitrefill-signature oder Authorization: Bearer <secret>
 */
export function handleBitrefillWebhook(req, res) {
  const secret = process.env.BITREFILL_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return res.status(503).json({ error: 'Webhook nicht konfiguriert.', code: 'WEBHOOK_NOT_CONFIGURED' });
  }

  const header = req.headers['x-bitrefill-signature'] || req.headers['authorization'] || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7).trim() : String(header).trim();
  if (!provided || !timingSafeEqualString(provided, secret)) {
    return res.status(401).json({ error: 'Unauthorized', code: 'WEBHOOK_UNAUTHORIZED' });
  }

  const payload = req.body || {};
  logWebhook(sanitizeWebhookPayload(payload));

  const invoiceId = payload.invoice_id || payload.invoiceId || payload.data?.id;
  const status = payload.status || payload.data?.status;

  if (invoiceId && status && typeof invoiceId === 'string' && typeof status === 'string') {
    updateOrderStatus(String(invoiceId).slice(0, 128), String(status).slice(0, 64), {
      webhookAt: new Date().toISOString(),
    });
    logger.info('Webhook verarbeitet', { invoiceId, status });
  }

  res.json({ received: true });
}

/** Nur Status-Felder speichern – keine vollen Payloads mit potenziellen Secrets. */
function sanitizeWebhookPayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return {
    invoice_id: payload.invoice_id || payload.invoiceId || payload.data?.id,
    status: payload.status || payload.data?.status,
    event: payload.event || payload.type,
  };
}
