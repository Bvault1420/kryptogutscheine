/** Client-IP hinter Reverse-Proxy (trust proxy muss gesetzt sein). */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 45);
  }
  return (req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 45);
}
