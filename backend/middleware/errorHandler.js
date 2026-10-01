import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { captureError } from '../utils/monitoring.js';

export function notFoundHandler(_req, _res, next) {
  next(new AppError('Route nicht gefunden.', 404, 'NOT_FOUND'));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validierungsfehler',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Ungültiger JSON-Body.', code: 'INVALID_JSON' });
  }

  const status = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (status >= 500) {
    logger.error(err.message, { code, stack: err.stack });
    captureError(err, { code });
  } else {
    logger.warn(err.message, { code });
  }

  const payload = {
    error: err.isOperational ? err.message : 'Ein interner Fehler ist aufgetreten.',
    code,
  };

  if (err.details && status < 500) {
    payload.details = err.details;
  }

  res.status(status).json(payload);
}
