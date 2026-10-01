import '../styles/main.css';
import { initTheme, toggleTheme, getTheme, themeIcon } from './theme.js';
import { initRouter, renderApp, navigate } from './router.js';
import { initCookieBanner } from '../components/CookieBanner.js';
import { initLang, t } from './i18n.js';
import { initPaymentRecovery, getActivePayment } from './paymentRecovery.js';
import { initGlobalErrorRecovery } from './errorRecovery.js';

initLang();
initTheme();
initRouter();
initPaymentRecovery({ navigate });
initGlobalErrorRecovery(() => renderApp());

async function bootApp(attempt = 1) {
  try {
    await renderApp();
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      return bootApp(attempt + 1);
    }
    throw err;
  }
}

bootApp().catch((err) => {
  const app = document.getElementById('app');
  const msg = err?.message || t('error.unknown');
  const active = getActivePayment();
  if (app) {
    app.innerHTML = `
      <div class="page-container py-20">
        <div class="card border-red-200">
          <h1 class="text-lg font-semibold text-red-700">${t('error.bootTitle')}</h1>
          <p class="mt-2 text-sm text-content-muted">${msg}</p>
          <p class="mt-3 text-sm text-content-muted">${t('error.bootHint')}</p>
          ${
            active
              ? `<a href="#/payment?invoiceId=${encodeURIComponent(active.invoiceId)}" class="btn-primary mt-4 inline-flex">${t('error.resumePayment')}</a>`
              : `<button type="button" class="btn-primary mt-4" onclick="location.reload()">${t('error.reload')}</button>`
          }
        </div>
      </div>`;
  }
});
initCookieBanner();

// Service Worker nur in Production – in Vite-Dev blockiert er sonst oft JS/CSS (weiße Seite)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
  if ('caches' in window) {
    caches.keys().then((keys) => keys.filter((k) => k.startsWith('Kryptogutscheine-')).forEach((k) => caches.delete(k)));
  }
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-theme-toggle]');
  if (!btn) return;
  const next = toggleTheme();
  btn.innerHTML = themeIcon(next === 'dark');
});

export { getTheme, themeIcon };
