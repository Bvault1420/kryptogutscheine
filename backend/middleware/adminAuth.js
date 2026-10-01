import { AppError } from '../utils/errors.js';
import { timingSafeEqualString } from '../utils/crypto.js';

/**
 * Schützt Admin-Endpoints (Analytics, Order-Liste).
 * Header: Authorization: Bearer <ADMIN_API_KEY>
 */
export function adminAuth(req, _res, next) {
  const key = process.env.ADMIN_API_KEY?.trim();
  if (!key || key.length < 32) {
    return next(new AppError('Admin-API ist nicht konfiguriert.', 503, 'ADMIN_NOT_CONFIGURED'));
  }

  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token || !timingSafeEqualString(token, key)) {
    return next(new AppError('Nicht autorisiert.', 401, 'ADMIN_UNAUTHORIZED'));
  }

  next();
}
