import crypto from 'crypto';
import { AppError } from '../utils/errors.js';

const CSRF_COOKIE = 'redeemx_csrf';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_TTL_MS = 60 * 60 * 1000;

const DEV_FALLBACK_SECRET = 'redeemx-dev-csrf-secret-do-not-use-in-prod!!';

function getSecret() {
  const secret = process.env.CSRF_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return DEV_FALLBACK_SECRET;

  throw new AppError('CSRF_SECRET muss mindestens 32 Zeichen lang sein.', 500, 'CSRF_MISCONFIGURED');
}

function signToken(payload) {
  const secret = getSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;

  const [data, sig] = token.split('.');
  if (!data || !sig) return false;

  const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!payload.exp || Date.now() > payload.exp) return false;
    return payload;
  } catch {
    return false;
  }
}

export function generateCsrfToken() {
  const payload = { exp: Date.now() + TOKEN_TTL_MS, nonce: crypto.randomBytes(16).toString('hex') };
  return signToken(payload);
}

export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError('Ungültiges CSRF-Token.', 403, 'CSRF_INVALID'));
  }

  if (!verifyToken(cookieToken)) {
    return next(new AppError('CSRF-Token abgelaufen.', 403, 'CSRF_EXPIRED'));
  }

  next();
}

export function setCsrfCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd || process.env.FORCE_HTTPS === 'true',
    sameSite: 'strict',
    maxAge: TOKEN_TTL_MS,
    path: '/',
  });
}

export { CSRF_COOKIE, CSRF_HEADER };
