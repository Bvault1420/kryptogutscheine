import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export function requestIdMiddleware(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID().slice(0, 8);
  req.requestId = id;
  res.setHeader('X-Request-Id', id);

  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.originalUrl}`, {
      requestId: id,
      status: res.statusCode,
      ms,
    });
  });

  next();
}
