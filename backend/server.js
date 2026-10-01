import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { applySecurityMiddleware } from './middleware/security.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import { logger } from './utils/logger.js';
import { validateApiKeyAtStartup } from './services/bitrefillService.js';
import { migrateOrderAccessTokens } from './storage/store.js';
import { migrateJsonToSqliteIfNeeded } from './storage/migrate-from-json.js';
import { initMonitoring } from './utils/monitoring.js';

initMonitoring();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? undefined : '127.0.0.1');
const isProd = process.env.NODE_ENV === 'production';

applySecurityMiddleware(app);
app.use(requestIdMiddleware);

app.use(compression());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(cookieParser(process.env.CSRF_SECRET));

app.use('/api', apiRoutes);

if (isProd) {
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist, { maxAge: '1d', index: false }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason: reason?.message || String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
});

function validateSecurityConfigAtStartup() {
  const isProd = process.env.NODE_ENV === 'production';
  const csrf = process.env.CSRF_SECRET?.trim();
  if (isProd && (!csrf || csrf.length < 32)) {
    logger.error('CSRF_SECRET fehlt oder ist zu kurz (min. 32 Zeichen). Server startet nicht sicher.');
    process.exit(1);
  }
  if (isProd && !process.env.BITREFILL_WEBHOOK_SECRET?.trim()) {
    logger.error('BITREFILL_WEBHOOK_SECRET fehlt – Webhooks werden abgelehnt. Server startet nicht sicher.');
    process.exit(1);
  }
  if (!isProd && !process.env.BITREFILL_WEBHOOK_SECRET?.trim()) {
    logger.warn('BITREFILL_WEBHOOK_SECRET fehlt – Webhooks werden abgelehnt (auch in Development).');
  }
  if (!process.env.ADMIN_API_KEY?.trim() || process.env.ADMIN_API_KEY.trim().length < 32) {
    logger.warn('ADMIN_API_KEY fehlt/zu kurz – /api/orders und /api/analytics sind deaktiviert.');
  }
}

function onListen() {
  const addr = HOST ? `${HOST}:${PORT}` : `Port ${PORT}`;
  logger.info(`RedeemX Backend läuft auf ${addr} (${process.env.NODE_ENV || 'development'})`);
  validateSecurityConfigAtStartup();
  migrateJsonToSqliteIfNeeded();
  const migrated = migrateOrderAccessTokens();
  if (migrated > 0) {
    logger.info(`${migrated} Bestellung(en) mit neuem Zugangstoken versehen (Legacy-Migration).`);
  }
  validateApiKeyAtStartup();
}

if (HOST) app.listen(PORT, HOST, onListen);
else app.listen(PORT, onListen);

export default app;
