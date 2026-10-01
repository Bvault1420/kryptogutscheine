import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { generalLimiter } from './rateLimiter.js';
import { logger } from '../utils/logger.js';

function getAllowedOrigins() {
  const raw = process.env.FRONTEND_URL || 'http://127.0.0.1:5320,http://localhost:5320';
  const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
  const extras = [process.env.RENDER_EXTERNAL_URL, process.env.PUBLIC_SITE_ORIGIN];
  for (const extra of extras) {
    const value = extra?.trim();
    if (value && !origins.includes(value)) origins.push(value);
  }
  return origins;
}

function isLocalHost(host = '') {
  const h = String(host).split(':')[0].toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

function enforceHttps(req, res, next) {
  const force = process.env.FORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
  if (!force) return next();

  // Lokaler Zugriff ohne TLS (npm run start:prod / Tests)
  if (isLocalHost(req.headers.host)) return next();

  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  if (proto !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

export function applySecurityMiddleware(app) {
  app.set('trust proxy', 1);

  app.use(enforceHttps);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https://cdn.bitrefill.com', 'https://res.cloudinary.com'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        const allowed = getAllowedOrigins();
        // Same-origin / Server-to-Server ohne Origin erlauben
        if (!origin || allowed.includes(origin)) return callback(null, true);
        logger.warn('CORS blockiert', { origin });
        callback(new Error('CORS nicht erlaubt'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization', 'X-Order-Token'],
    })
  );

  app.use(hpp());
  app.use(generalLimiter);

  app.disable('x-powered-by');
}
