import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);

// Health-Checks und Preflight zählen nicht gegen das Limit
function skipNonCounting(req) {
  const p = req.path || '';
  return (
    req.method === 'OPTIONS' ||
    p === '/health' ||
    p === '/api/health' ||
    p === '/config' ||
    p === '/api/config'
  );
}

export const generalLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipNonCounting,
  message: { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.', code: 'RATE_LIMIT' },
});

export const invoiceLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_INVOICE_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rechnungslimit erreicht. Bitte warten Sie.', code: 'INVOICE_RATE_LIMIT' },
});

export const productLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_PRODUCT_MAX || '300', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Produktanfragen.', code: 'PRODUCT_RATE_LIMIT' },
});

export const newsletterLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_NEWSLETTER_MAX || '5', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Newsletter-Limit erreicht.', code: 'NEWSLETTER_RATE_LIMIT' },
});

export const trackLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_TRACK_MAX || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Tracking-Anfragen.', code: 'TRACK_RATE_LIMIT' },
});

export const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || '120', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Webhook-Limit erreicht.', code: 'WEBHOOK_RATE_LIMIT' },
});
