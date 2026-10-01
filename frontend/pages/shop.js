import { api, clearApiCache } from '../src/api.js';
import { renderProductGrid, renderLoadingGrid } from '../components/ProductCard.js';
import { renderCategoryBar } from '../components/CategoryBar.js';
import { escapeHtml } from '../src/utils.js';
import { getCountry, saveCountry } from '../src/country.js';
import { renderCountrySelect, bindCountrySelect } from '../components/CountrySelect.js';
import { getPopularIds } from '../src/popularProducts.js';
import { isVisibleProduct, matchesCategory, sortProducts, getSortOptions } from '../src/productFilters.js';
import { t } from '../src/i18n.js';

export async function renderShop(container, query) {
  const initialCountry = getCountry();
  const initialSearch = query?.get('q')?.trim() || '';
  const initialCategory = query?.get('cat') || '';

  container.innerHTML = `
    <div class="page-container pb-20 lg:pb-8">
      <div class="mb-6">
        <h1 class="section-title">${t('shop.title')}</h1>
        <p class="mt-2 text-content-muted">${t('shop.subtitle')}</p>
      </div>

      <div class="mb-6 flex flex-wrap items-center gap-3">
        ${renderCountrySelect({ id: 'shop-country', selected: initialCountry })}
        <select id="shop-sort" class="input-field w-auto min-w-[160px]" aria-label="${t('shop.sortLabel')}">
          ${getSortOptions().map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
        </select>
      </div>

      <div class="mb-6" id="shop-categories">${renderCategoryBar({ active: initialCategory, btnClass: 'shop-cat-btn' })}</div>

      <p id="shop-count" class="mb-4 text-sm text-content-muted"></p>

      <div id="shop-grid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        ${renderLoadingGrid(24)}
      </div>

      <div class="mt-8 flex justify-center gap-4">
        <button type="button" id="shop-prev" class="btn-secondary" disabled>${t('shop.prev')}</button>
        <button type="button" id="shop-next" class="btn-secondary">${t('shop.next')}</button>
      </div>
    </div>
  `;

  const pageSize = 24;
  const fetchSize = 48;
  let page = 0;
  let searchQuery = initialSearch;
  let selectedCategory = initialCategory;
  let allProducts = [];
  let catalogSize = 0;
  let apiOffset = 0;
  let hasMore = false;
  let loadingMore = false;
  const popularIds = new Set(getPopularIds(initialCountry));

  function visibleProducts() {
    const country = document.getElementById('shop-country')?.value || initialCountry;
    const sortBy = document.getElementById('shop-sort')?.value || 'name';
    const filtered = allProducts.filter(
      (p) => isVisibleProduct(p, country) && matchesCategory(p, selectedCategory)
    );
    return sortProducts(filtered, sortBy);
  }

  function renderPage(reset = false) {
    const grid = document.getElementById('shop-grid');
    const sorted = visibleProducts();
    const total = sorted.length;

    if (reset) page = 0;

    const slice = sorted.slice(0, (page + 1) * pageSize);
    grid.innerHTML = renderProductGrid(slice, { popularIds });

    const countEl = document.getElementById('shop-count');
    if (countEl) {
      const displayTotal = searchQuery ? total : Math.max(total, catalogSize);
      countEl.textContent = searchQuery
        ? t('shop.searchHits', { count: total })
        : t('shop.curatedAvailable', { count: displayTotal });
    }

    document.getElementById('shop-prev').disabled = page <= 0;
    const atEnd = slice.length >= total;
    document.getElementById('shop-next').disabled = atEnd && !hasMore;
  }

  async function fetchMoreCurated() {
    if (loadingMore || !hasMore || searchQuery) return;
    loadingMore = true;
    const country = document.getElementById('shop-country')?.value || initialCountry;
    try {
      const result = await api.getCuratedProducts(country, { limit: fetchSize, offset: apiOffset });
      allProducts = [...allProducts, ...(result.data || [])];
      apiOffset += fetchSize;
      hasMore = result.hasMore === true;
      catalogSize = result.catalogSize || catalogSize;
      renderPage(false);
    } catch {
      /* keep current view */
    } finally {
      loadingMore = false;
    }
  }

  async function loadProducts(reset = true) {
    const grid = document.getElementById('shop-grid');
    if (reset) {
      page = 0;
      apiOffset = 0;
      hasMore = false;
      allProducts = [];
      grid.innerHTML = renderLoadingGrid(24);
    }

    const country = document.getElementById('shop-country')?.value || initialCountry;

    try {
      if (searchQuery) {
        const result = await api.searchProducts(searchQuery, { start: 0, limit: 50, country, category: selectedCategory || undefined });
        allProducts = (result.data || []).filter((p) => isVisibleProduct(p, country));
        catalogSize = allProducts.length;
        hasMore = false;
      } else {
        const result = await api.getCuratedProducts(country, { limit: fetchSize, offset: 0 });
        allProducts = result.data || [];
        catalogSize = result.catalogSize || allProducts.length;
        apiOffset = fetchSize;
        hasMore = result.hasMore === true;
      }
      renderPage(true);
      if (!searchQuery && !allProducts.length) {
        grid.innerHTML = `
          <div class="col-span-full rounded-xl border border-theme bg-surface-muted/40 p-6 text-center">
            <p class="text-sm text-content-muted">${t('home.noVouchers')}</p>
            <p class="mt-1 text-xs text-content-muted">${t('home.noVouchersHint')}</p>
            <button type="button" class="btn-secondary mt-4 text-sm" data-reload-shop>${t('home.retry')}</button>
          </div>`;
        document.querySelector('[data-reload-shop]')?.addEventListener('click', () => {
          clearApiCache('/api/products');
          loadProducts(true);
        });
      }
    } catch (err) {
      grid.innerHTML = `
        <div class="col-span-full card border-red-200">
          <p class="text-red-600">${escapeHtml(err.message)}</p>
          <button type="button" class="btn-secondary mt-3 text-sm" data-reload-shop>${t('home.retry')}</button>
        </div>`;
      document.querySelector('[data-reload-shop]')?.addEventListener('click', () => {
        clearApiCache('/api/products');
        loadProducts(true);
      });
    }
  }

  document.querySelectorAll('.shop-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category || '';
      document.querySelectorAll('.shop-cat-btn').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('border-brand-500', active);
        b.classList.toggle('bg-brand-50', active);
        b.classList.toggle('text-brand-700', active);
        b.classList.toggle('dark:bg-brand-950/40', active);
        b.classList.toggle('dark:text-brand-300', active);
        b.classList.toggle('border-theme', !active);
        b.classList.toggle('text-content-muted', !active);
      });
      renderPage(true);
    });
  });

  document.getElementById('shop-sort')?.addEventListener('change', () => renderPage(true));
  bindCountrySelect('shop-country', (code) => {
    saveCountry(code);
    popularIds.clear();
    getPopularIds(code).forEach((id) => popularIds.add(id));
    loadProducts(true);
  });
  document.getElementById('shop-next')?.addEventListener('click', async () => {
    const sorted = visibleProducts();
    const slice = sorted.slice(0, (page + 1) * pageSize);
    if (slice.length >= sorted.length && hasMore && !searchQuery) {
      await fetchMoreCurated();
    }
    page += 1;
    renderPage(false);
  });
  document.getElementById('shop-prev')?.addEventListener('click', () => {
    page = Math.max(0, page - 1);
    renderPage(false);
  });

  await loadProducts(true);
}
