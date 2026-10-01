import { z } from 'zod';
import { createNewsletterPending, confirmNewsletter, unsubscribeNewsletter } from '../storage/store.js';
import { generateAccessToken } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

const emailSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

const tokenSchema = z.object({
  token: z.string().min(32).max(128),
});

/** Newsletter-Anmeldung (Double-Opt-In). */
export function subscribe(req, res, next) {
  try {
    const { email } = emailSchema.parse(req.body);
    const confirmToken = generateAccessToken();
    createNewsletterPending(email, confirmToken);

    const base = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://127.0.0.1:5320';
    const confirmUrl = `${base.replace(/\/$/, '')}/#/newsletter-confirm?token=${encodeURIComponent(confirmToken)}`;

    if (process.env.NEWSLETTER_SMTP_URL) {
      logger.info('Newsletter-Bestätigung (SMTP noch nicht angebunden)', { email, confirmUrl });
    }

    const payload = {
      ok: true,
      pending: true,
      message: 'Bitte bestätige deine E-Mail-Adresse über den Link.',
    };

    // In Development: Bestätigungslink anzeigen (kein SMTP nötig)
    if (process.env.NODE_ENV !== 'production') {
      payload.confirmUrl = confirmUrl;
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
}

export function confirm(req, res, next) {
  try {
    const { token } = tokenSchema.parse(req.query);
    const email = confirmNewsletter(token);
    if (!email) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Link.', code: 'NEWSLETTER_CONFIRM_INVALID' });
    }
    res.json({ ok: true, message: 'Newsletter-Anmeldung bestätigt.', email });
  } catch (err) {
    next(err);
  }
}

export function unsubscribe(req, res, next) {
  try {
    const { email } = emailSchema.parse(req.body);
    const removed = unsubscribeNewsletter(email);
    res.json({
      ok: true,
      removed,
      message: removed ? 'Du wurdest abgemeldet.' : 'E-Mail war nicht angemeldet.',
    });
  } catch (err) {
    next(err);
  }
}
