import { getTheme, themeIcon } from '../src/theme.js';
import { getCountry, saveCountry } from '../src/country.js';
import { renderCountrySelect, bindCountrySelect } from './CountrySelect.js';
import { renderCartButton } from './CartDrawer.js';
import { renderSearchBar, bindSearchBar } from './SearchBar.js';
import { getFavorites } from '../src/userData.js';
import { getLang, setLang, t } from '../src/i18n.js';

const navLinks = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/shop', labelKey: 'nav.shop' },
  { path: '/orders', labelKey: 'nav.orders' },
  { path: '/order-status', labelKey: 'nav.orderStatus' },
  { path: '/faq', labelKey: 'nav.faq' },
];

export function renderHeader(currentPath) {
  const isDark = getTheme() === 'dark';
  const country = getCountry();
  const favCount = getFavorites().length;

  const links = navLinks
    .map(
      (l) => `
      <a href="#${l.path}" data-nav="${l.path}"
         class="rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
           currentPath === l.path
             ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300'
             : 'text-content-muted hover:bg-surface hover:text-content'
         }">${t(l.labelKey)}</a>`
    )
    .join('');

  const lang = getLang();
  return `
    <header class="sticky top-0 z-50 border-b border-theme/80 glass">
      <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#/" data-nav="/" class="group flex shrink-0 items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-sm font-bold text-white shadow-sm shadow-brand-600/20">
            K
          </span>
          <span class="hidden sm:inline">
            <span class="block text-base font-bold leading-none tracking-tight text-content">Kryptogutscheine</span>
            <span class="mt-0.5 block text-[11px] font-medium text-content-muted">Gift Cards mit Krypto</span>
          </span>
        </a>

        <div class="hidden flex-1 md:block">${renderSearchBar({ id: 'header-search', compact: true })}</div>

        <nav class="hidden items-center gap-1 xl:flex" aria-label="${t('aria.mainNav')}">${links}</nav>

        <div class="ml-auto flex items-center gap-2">
          <div class="hidden items-center rounded-lg border border-theme p-0.5 sm:flex" role="group" aria-label="${t('aria.language')}">
            <button type="button" data-lang="de" class="rounded-md px-2 py-1 text-xs font-semibold transition ${lang === 'de' ? 'bg-brand-600 text-white' : 'text-content-muted hover:text-content'}">${t('lang.de')}</button>
            <button type="button" data-lang="en" class="rounded-md px-2 py-1 text-xs font-semibold transition ${lang === 'en' ? 'bg-brand-600 text-white' : 'text-content-muted hover:text-content'}">${t('lang.en')}</button>
          </div>
          ${renderCountrySelect({ id: 'header-country', selected: country, compact: true, className: 'hidden lg:block' })}
          <a href="#/favorites" data-nav="/favorites"
             class="relative hidden rounded-xl border border-theme p-2 text-content-muted transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-600 sm:inline-flex"
             aria-label="${t('nav.favorites')}" title="${t('nav.favorites')}">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            ${favCount ? `<span class="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">${favCount}</span>` : ''}
          </a>
          <button type="button" data-theme-toggle class="rounded-xl border border-theme p-2 text-content-muted transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-600" aria-label="${t('aria.theme')}">
            ${themeIcon(isDark)}
          </button>
          ${renderCartButton()}
          <button type="button" id="mobile-menu-btn" class="rounded-xl border border-theme p-2 xl:hidden" aria-label="${t('aria.menu')}">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>

      <div class="border-t border-theme/80 px-4 py-2 md:hidden">
        ${renderSearchBar({ id: 'mobile-search', compact: true })}
      </div>

      <nav id="mobile-menu" class="hidden border-t border-theme/80 px-4 py-3 xl:hidden" aria-label="${t('aria.mobileNav')}">
        <div class="mb-3">
          <label class="mb-1 block text-xs font-medium text-content-muted">${t('aria.countryLabel')}</label>
          ${renderCountrySelect({ id: 'header-country-mobile', selected: country })}
        </div>
        <div class="flex flex-col gap-1">${links}</div>
      </nav>
    </header>
  `;
}

export function bindHeaderEvents() {
  const sync = (value) => {
    saveCountry(value);
    window.dispatchEvent(new CustomEvent('Kryptogutscheine:country-change'));
  };

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lang !== getLang()) setLang(btn.dataset.lang);
    });
  });

  bindCountrySelect('header-country', sync);
  bindCountrySelect('header-country-mobile', sync);

  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
  });

  bindSearchBar({ id: 'header-search' });
  bindSearchBar({ id: 'mobile-search' });
}
