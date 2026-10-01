import { logger } from './logger.js';

/**
 * Optional: Fehler an externes Monitoring (Sentry o. ä.) senden.
 * Setze MONITORING_DSN in .env – Hook ist vorbereitet für spätere Integration.
 */
export function initMonitoring() {
  const dsn = process.env.MONITORING_DSN?.trim();
  if (dsn) {
    logger.info('Monitoring DSN konfiguriert (Stub – Sentry-Integration bei Bedarf).');
  }
}

export function captureError(err, context = {}) {
  if (process.env.MONITORING_DSN?.trim()) {
    logger.error('[monitoring]', { message: err?.message, ...context });
  }
}
