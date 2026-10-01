import { getClientIp } from '../utils/clientIp.js';
import { AppError } from '../utils/errors.js';

/**
 * Optional: Admin-API nur von bestimmten IPs (kommagetrennt in ADMIN_ALLOWED_IPS).
 * Beispiel: ADMIN_ALLOWED_IPS=127.0.0.1,10.0.0.5
 */
export function adminIpAllowlist(req, _res, next) {
  const raw = process.env.ADMIN_ALLOWED_IPS?.trim();
  if (!raw) return next();

  const allowed = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const ip = getClientIp(req);

  if (!allowed.includes(ip)) {
    return next(new AppError('Admin-Zugriff von dieser IP nicht erlaubt.', 403, 'ADMIN_IP_DENIED'));
  }

  next();
}
