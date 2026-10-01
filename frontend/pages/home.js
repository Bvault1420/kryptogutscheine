import { api, clearApiCache } from '../src/api.js';
import {
  renderProductGrid,
  renderCompactProductRow,
} from '../components/ProductCard.js';
import { renderLoadingGrid, renderSpinner } from '../components/Loading.js';
import { renderCategoryBar } from '../components/CategoryBar.js';
import { renderTrustSection, renderPartnerBar } from '../components/TrustSection.js';
import { renderHowItWorks } from '../components/HowItWorks.js';
import { escapeHtml } from '../src/utils.js';
import { getCountry, getCountryName } from '../src/country.js';
import { getPopularIds } from '../src/popularProducts.js';
import { getRecentlyViewed } from '../src/userData.js';
import { isVisibleProduct, matchesCategory, sortProducts } from '../src/productFilters.js';
import { t } from '../src/i18n.js';

export async function renderHome(container) {
  const country = getCountry();
  const countryName = getCountryName(country);

  container.innerHTML = `
    <div class="page-container pb-20 lg:pb-8">
      <section class="mb-10">
        <div class="hero-card">
          <p class="eyebrow">
            ${t('home.eyebrow', { country: escapeHtml(countryName) })}
          </p>
          <h1 class="mt-3 font-display text-3xl font-bold leading-tight text-content sm:text-4xl text-balance">
            ${t('home.title')}
          </h1>
          <p class="mt-4 max-w-lg text-sm leading-relaxed text-content-muted sm:text-base">
            ${t('home.subtitle')}
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a href="#/shop" data-nav="/shop" class="btn-primary">${t('home.toShop')}</a>
            <a href="#/faq" data-nav="/faq" class="btn-secondary">${t('home.howItWorks')}</a>
          </div>
          <div class="mt-6 flex flex-wrap gap-4 text-xs text-content-muted">
            <span class="flex items-center gap-1.5"><svg class="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> ${t('home.instantDelivery')}</span>
            <span class="flex items-center gap-1.5"><svg class="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> ${t('home.securePayment')}</span>
            <span class="flex items-center gap-1.5"><svg class="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> ${t('home.lightningCrypto')}</span>
          </div>
        </div>
      </section>

      ${renderHowItWorks()}

      <section class="mb-8">
        <div id="home-categories">${renderCategoryBar({ active: '', btnClass: 'home-cat-btn' })}</div>
      </section>

      <section class="mb-10 hidden" id="recent-section">
        <h2 class="mb-4 font-display text-lg font-semibold">${t('home.recent')}</h2>
        <div id="recent-row"></div>
      </section>

      <section class="mb-10">
        <div class="mb-4 flex items-end justify-between">
          <h2 class="font-display text-lg font-semibold sm:text-xl">${t('home.popularIn', { country: escapeHtml(countryName) })}</h2>
          <a href="#/shop" data-nav="/shop" class="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">${t('home.viewAll')}</a>
        </div>
        <div id="popular-row">${renderSpinner(t('common.loading'))}</div>
      </section>

      <section id="catalog-section">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-lg font-semibold">${t('home.allVouchers')}</h2>
          <span id="catalog-count" class="text-sm text-content-muted"></span>
        </div>
        <div id="catalog-grid" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderLoadingGrid(12)}
        </div>
        <div class="mt-8 flex justify-center">
          <a href="#/shop" data-nav="/shop" class="btn-secondary">${t('home.allInShop')}</a>
        </div>
      </section>

      ${renderTrustSection()}
      ${renderPartnerBar()}
    </div>`;

  let selectedCategory = '';
  let allCatalog = [];
  let catalogSize = 0;
  const popularIds = new Set(getPopularIds(country));

  document.querySelectorAll('.home-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category || '';
      document.querySelectorAll('.home-cat-btn').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('border-brand-500', active);
        b.classList.toggle('bg-brand-50', active);
        b.classList.toggle('text-brand-700', active);
        b.classList.toggle('dark:bg-brand-950/40', active);
        b.classList.toggle('text-brand-300', active);
        b.classList.toggle('border-theme', !active);
        b.classList.toggle('text-content-muted', !active);
      });
      renderCatalog();
    });
  });

  async function loadPage() {
    const grid = document.getElementById('catalog-grid');
    const popEl = document.getElementById('popular-row');
    grid.innerHTML = renderLoadingGrid(12);

    try {
      const result = await api.getCuratedProducts(country, { limit: 48 });
      allCatalog = result.data || [];
      catalogSize = result.catalogSize || allCatalog.length;

      const wantedPopular = getPopularIds(country);
      const popularSet = new Set(wantedPopular);
      let popularProducts = sortProducts(
        allCatalog.filter((p) => popularSet.has(p.id) && isVisibleProduct(p, country))
      );

      if (popularProducts.length < 8) {
        const loadedIds = new Set(allCatalog.map((p) => p.id));
        const missing = wantedPopular.filter((id) => !loadedIds.has(id)).slice(0, 12);
        if (missing.length) {
          try {
            const { data: extra } = await api.getProductsBatch(missing, country);
            popularProducts = sortProducts([
              ...popularProducts,
              ...(extra || []).filter((p) => isVisibleProduct(p, country)),
            ]);
          } catch {
            /* optional fallback */
          }
        }
      }

      popularProducts = popularProducts.slice(0, 12);
      popularProducts.forEach((p) => popularIds.add(p.id));

      popEl.innerHTML = popularProducts.length
        ? renderCompactProductRow(popularProducts)
        : `<div class="rounded-xl border border-theme bg-surface-muted/40 p-4">
            <p class="text-sm text-content-muted">${t('home.noVouchers')}</p>
            <p class="mt-1 text-xs text-content-muted">${t('home.noVouchersHint')}</p>
            <button type="button" class="btn-secondary mt-3 text-sm" data-reload-catalog>${t('home.retry')}</button>
          </div>`;

      renderCatalog();
      document.querySelector('[data-reload-catalog]')?.addEventListener('click', () => {
        clearApiCache('/api/products');
        loadPage();
      });
    } catch (err) {
      grid.innerHTML = `<div class="col-span-full card border-red-200">
        <p class="text-sm text-red-600">${escapeHtml(err.message)}</p>
        <button type="button" class="btn-secondary mt-3 text-sm" data-reload-catalog>${t('home.retry')}</button>
      </div>`;
      popEl.innerHTML = '';
      document.querySelector('[data-reload-catalog]')?.addEventListener('click', () => {
        clearApiCache('/api/products');
        loadPage();
      });
    }
  }

  function loadRecent() {
    const recent = getRecentlyViewed();
    const section = document.getElementById('recent-section');
    const el = document.getElementById('recent-row');
    if (!recent.length || !section || !el) return;
    section.classList.remove('hidden');
    el.innerHTML = renderCompactProductRow(recent);
  }

  function renderCatalog() {
    const filtered = sortProducts(allCatalog.filter((p) => isVisibleProduct(p, country) && matchesCategory(p, selectedCategory)));
    document.getElementById('catalog-grid').innerHTML = renderProductGrid(filtered.slice(0, 24), { popularIds });
    // Bei leerem Fetch nicht die Whitelist-Größe (z. B. 150) als „verfügbar“ anzeigen
    const count = allCatalog.length
      ? (catalogSize > filtered.length ? catalogSize : filtered.length)
      : 0;
    document.getElementById('catalog-count').textContent = t('home.curatedCount', { count });
  }

  loadRecent();
  await loadPage();
}
