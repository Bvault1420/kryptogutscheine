import { getItemCount } from '../src/cart.js';
import { t } from '../src/i18n.js';

export function renderMobileNav(currentPath) {
  const cartCount = getItemCount();
  const items = [
    { path: '/', labelKey: 'nav.home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/shop', labelKey: 'nav.shop', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { path: '/favorites', labelKey: 'nav.favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { path: '/cart', labelKey: 'nav.cart', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', badge: cartCount },
    { path: '/order-status', labelKey: 'nav.status', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ];

  return `
    <nav class="mobile-nav fixed bottom-0 left-0 right-0 z-50 border-t border-theme bg-surface-elevated/95 backdrop-blur-lg lg:hidden" aria-label="${t('aria.mobileNav')}">
      <div class="mx-auto flex max-w-xl items-center justify-around px-2 py-1.5">
        ${items
          .map((item) => {
            const active = currentPath === item.path;
            return `
            <a href="#${item.path}" data-nav="${item.path}"
               class="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition ${
                 active ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : 'text-content-muted'
               }">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="${active ? 2.5 : 2}" d="${item.icon}"/>
              </svg>
              ${t(item.labelKey)}
              ${item.badge ? `<span class="absolute right-2 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">${item.badge}</span>` : ''}
            </a>`;
          })
          .join('')}
      </div>
    </nav>
    ${currentPath !== '/cart' && cartCount ? `
    <button type="button" data-cart-toggle class="sticky-cart-fab" aria-label="${t('aria.cart')}">
      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      <span class="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">${cartCount}</span>
    </button>` : ''}`;
}

export function bindMobileNav() {
  window.addEventListener('Kryptogutscheine:cart-change', () => {
    document.querySelectorAll('.mobile-nav [data-nav="/cart"] span').forEach((badge) => {
      const count = getItemCount();
      badge.textContent = String(count);
      badge.classList.toggle('hidden', count === 0);
    });
  });
}
