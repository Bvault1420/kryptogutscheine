import { t } from '../src/i18n.js';

const STORAGE_KEY = 'Kryptogutscheine_cookie_consent';

function renderBannerHtml() {
  return `
    <p class="text-sm text-content-muted">
      ${t('cookie.text')}
      <a href="#/datenschutz" data-nav="/datenschutz" class="font-medium text-brand-600 hover:underline dark:text-brand-400">${t('nav.privacyLong')}</a>.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button type="button" id="cookie-accept" class="btn-primary px-4 py-2 text-xs">${t('cookie.accept')}</button>
      <a href="#/datenschutz" data-nav="/datenschutz" class="btn-secondary px-4 py-2 text-xs">${t('cookie.more')}</a>
    </div>`;
}

export function initCookieBanner() {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
  } catch {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.className =
    'fixed bottom-20 left-4 right-4 z-[60] mx-auto max-w-2xl rounded-xl border border-theme bg-surface-elevated p-4 shadow-md sm:bottom-6 lg:left-auto lg:right-6';
  banner.innerHTML = renderBannerHtml();

  document.body.appendChild(banner);

  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    banner.remove();
  });

  window.addEventListener('Kryptogutscheine:lang-change', () => {
    const existing = document.getElementById('cookie-banner');
    if (!existing) return;
    existing.innerHTML = renderBannerHtml();
    existing.querySelector('#cookie-accept')?.addEventListener('click', () => {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
      existing.remove();
    });
  });
}
