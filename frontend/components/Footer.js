import { t } from '../src/i18n.js';

export function renderFooter() {
  const year = new Date().getFullYear();

  return `
    <footer class="mt-20 border-t border-theme bg-surface-elevated/90">
      <div class="page-container">
        <div class="legal-notice mb-8 text-xs">
          ${t('footer.notice')}
        </div>

        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-600 text-sm font-bold text-white shadow-sm shadow-brand-600/20">K</span>
              <div>
                <h3 class="text-base font-bold tracking-tight text-content">Kryptogutscheine</h3>
                <p class="text-xs text-content-muted">Schnell. Klar. Ohne Schnickschnack.</p>
              </div>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-content-muted">
              ${t('footer.tagline')}
            </p>
            <p class="mt-3 text-xs text-content-muted">
              <a href="https://kryptogutscheine.com" class="font-medium text-brand-600 hover:underline dark:text-brand-400">kryptogutscheine.com</a>
              · ${t('footer.paymentDelivery')} <a href="https://www.bitrefill.com" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-600 hover:underline dark:text-brand-400">bitrefill.com</a>
            </p>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-content">${t('footer.navigation')}</h4>
            <ul class="mt-3 space-y-2 text-sm text-content-muted">
              <li><a href="#/" data-nav="/" class="transition-colors hover:text-brand-600">${t('nav.home')}</a></li>
              <li><a href="#/shop" data-nav="/shop" class="transition-colors hover:text-brand-600">${t('nav.shop')}</a></li>
              <li><a href="#/orders" data-nav="/orders" class="transition-colors hover:text-brand-600">${t('nav.orders')}</a></li>
              <li><a href="#/order-status" data-nav="/order-status" class="transition-colors hover:text-brand-600">${t('nav.orderStatus')}</a></li>
              <li><a href="#/faq" data-nav="/faq" class="transition-colors hover:text-brand-600">${t('nav.faq')}</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-content">${t('nav.legal')}</h4>
            <ul class="mt-3 space-y-2 text-sm text-content-muted">
              <li><a href="#/impressum" data-nav="/impressum" class="transition-colors hover:text-brand-600">${t('nav.impressum')}</a></li>
              <li><a href="#/agb" data-nav="/agb" class="transition-colors hover:text-brand-600">${t('nav.agb')}</a></li>
              <li><a href="#/widerruf" data-nav="/widerruf" class="transition-colors hover:text-brand-600">${t('nav.widerruf')}</a></li>
              <li><a href="#/datenschutz" data-nav="/datenschutz" class="transition-colors hover:text-brand-600">${t('nav.privacy')}</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-content">${t('nav.security')}</h4>
            <ul class="mt-3 space-y-2 text-sm text-content-muted">
              <li>${t('footer.noCustody')}</li>
              <li>${t('footer.noWallet')}</li>
              <li>${t('footer.noAccount')}</li>
              <li>${t('footer.security')}</li>
            </ul>
          </div>
        </div>

        <div class="mt-10 border-t border-theme py-6 text-center text-xs text-content-muted">
          <p>${t('footer.accept')} <a href="#/agb" data-nav="/agb" class="hover:text-brand-600">${t('nav.agb')}</a> ${t('footer.and')} <a href="#/datenschutz" data-nav="/datenschutz" class="hover:text-brand-600">${t('nav.privacyLong')}</a>.</p>
          <p class="mt-2">&copy; ${year} Kryptogutscheine · kryptogutscheine.com</p>
          <p class="mt-1">${t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  `;
}
