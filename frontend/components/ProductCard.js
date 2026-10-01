import { escapeHtml } from '../src/utils.js';
import { isFavorite } from '../src/userData.js';
import {
  canAddProductToCart,
  defaultDenomination,
  formatPriceRangeLabel,
  getQuickAmountOptions,
} from '../src/productDenominations.js';

export { renderSpinner, renderLoadingGrid } from './Loading.js';

function favBtn(product) {
  const active = isFavorite(product.id);
  return `
    <button type="button" data-fav-toggle data-id="${escapeHtml(product.id)}"
      data-name="${escapeHtml(product.name)}" data-image="${escapeHtml(product.image || '')}"
      data-currency="${escapeHtml(product.currency || 'USD')}"
      class="absolute right-2 top-2 z-10 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50"
      aria-label="${active ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
      <svg class="h-4 w-4" fill="${active ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    </button>`;
}

/** Kann der Artikel direkt in den Warenkorb? */
export function canAddToCart(product) {
  return canAddProductToCart(product);
}

function quickAmountChips(product) {
  const opts = getQuickAmountOptions(product, 6);
  if (!opts.length) return '';
  const sym = product.currency === 'USD' ? '$' : product.currency === 'GBP' ? '£' : '€';
  return `
    <div class="mt-2 flex flex-wrap gap-1.5">
      ${opts
        .map((o) => {
          const attrs = [
            'type="button"',
            'data-add-cart',
            `data-id="${escapeHtml(product.id)}"`,
            `data-name="${escapeHtml(product.name)}"`,
            `data-image="${escapeHtml(product.image || '')}"`,
            `data-currency="${escapeHtml(product.currency || 'USD')}"`,
            `data-value="${escapeHtml(String(o.value))}"`,
            o.packageId ? `data-package-id="${escapeHtml(String(o.packageId))}"` : '',
            'class="rounded-lg border border-theme px-2 py-0.5 text-xs font-medium text-content-muted transition hover:border-brand-400 hover:text-brand-600"',
          ]
            .filter(Boolean)
            .join(' ');
          return `<button ${attrs}>${sym}${o.value}</button>`;
        })
        .join('')}
    </div>`;
}

function popularityBadge(product) {
  if (!product._popular) return '';
  return `<span class="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
    <svg class="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
    Beliebt
  </span>`;
}
function defaultDenominationForCart(product) {
  return defaultDenomination(product);
}

/** data-* Attribute für den Warenkorb-Button erzeugen. */
export function cartDataAttrs(product) {
  const { value, packageId } = defaultDenominationForCart(product);
  return [
    `data-add-cart`,
    `data-id="${escapeHtml(product.id)}"`,
    `data-name="${escapeHtml(product.name)}"`,
    `data-image="${escapeHtml(product.image || '')}"`,
    `data-currency="${escapeHtml(product.currency || 'USD')}"`,
    value != null ? `data-value="${escapeHtml(String(value))}"` : '',
    packageId ? `data-package-id="${escapeHtml(String(packageId))}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function renderProductCard(product) {
  const image = escapeHtml(product.image || '');
  const name = escapeHtml(product.name);
  const id = escapeHtml(product.id);
  const country = escapeHtml(product.country_name || product.country_code || '');
  const inStock = product.in_stock !== false;

  const priceLabel = formatPriceRangeLabel(product);

  const imgFallback = "this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 120%22><rect fill=%22%23e2e8f0%22 width=%22200%22 height=%22120%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2214%22>Gutschein</text></svg>'";

  return `
    <article class="card group flex flex-col overflow-hidden rounded-3xl p-0 animate-slide-up opacity-0">
      <div class="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        ${favBtn(product)}
        ${image
          ? `<img src="${image}" alt="${name}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="${imgFallback}" />`
          : `<div class="flex h-full items-center justify-center text-content-muted">Gutschein</div>`}
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
        ${inStock ? '' : '<span class="absolute left-3 top-3 badge bg-red-100 text-red-700">Nicht verfügbar</span>'}
        ${product.discount_percentage ? `<span class="absolute right-3 top-3 badge bg-brand-100 text-brand-800">-${product.discount_percentage}%</span>` : ''}
        ${popularityBadge(product)}
      </div>
      <div class="flex flex-1 flex-col p-5 sm:p-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-content-muted">${country}</p>
        <h3 class="mt-2 font-display text-lg font-semibold leading-snug text-content">${name}</h3>
        ${priceLabel ? `<p class="mt-2 text-sm font-semibold text-brand-600 dark:text-brand-400">${priceLabel}</p>` : ''}
        ${quickAmountChips(product)}
        <div class="mt-auto flex gap-2 pt-5">
          <a href="#/product?id=${encodeURIComponent(product.id)}" data-nav="/product?id=${encodeURIComponent(product.id)}"
             class="btn-secondary flex-1 ${inStock ? '' : 'pointer-events-none opacity-50'}">
            Details
          </a>
          <button type="button" ${cartDataAttrs(product)}
             class="btn-primary shrink-0 px-4 ${inStock && canAddToCart(product) ? '' : 'pointer-events-none opacity-50'}"
             aria-label="In den Warenkorb">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

export function renderCompactProductCard(product) {
  const image = escapeHtml(product.image || '');
  const name = escapeHtml(product.name);
  const id = escapeHtml(product.id);
  const inStock = product.in_stock !== false;

  const priceLabel = formatPriceRangeLabel(product);

  const imgFallback = "this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 80%22><rect fill=%22%23e2e8f0%22 width=%22120%22 height=%2280%22/></svg>'";

  return `
    <a href="#/product?id=${encodeURIComponent(product.id)}" data-nav="/product?id=${encodeURIComponent(product.id)}"
       class="card group flex min-w-[148px] max-w-[168px] shrink-0 flex-col overflow-hidden rounded-3xl p-0 transition hover:border-brand-300 ${inStock ? '' : 'opacity-60'}">
      <div class="relative aspect-square overflow-hidden bg-white dark:bg-surface">
        ${image
          ? `<img src="${image}" alt="${name}" class="h-full w-full object-contain p-2 transition-transform group-hover:scale-105" loading="lazy" onerror="${imgFallback}" />`
          : `<div class="flex h-full items-center justify-center text-xs text-content-muted">Gutschein</div>`}
      </div>
      <div class="p-3.5">
        <p class="line-clamp-2 text-sm font-semibold leading-snug">${name}</p>
        ${priceLabel ? `<p class="mt-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">${priceLabel}</p>` : ''}
      </div>
    </a>`;
}

export function renderRecommendedGrid(products) {
  if (!products.length) return '';
  const imgFallback = "this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%23e2e8f0%22 width=%2280%22 height=%2280%22/></svg>'";
  return `
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      ${products
        .map((p) => {
          const image = escapeHtml(p.image || '');
          const name = escapeHtml(p.name);
          let price = formatPriceRangeLabel(p);
          return `
          <a href="#/product?id=${encodeURIComponent(p.id)}" data-nav="/product?id=${encodeURIComponent(p.id)}"
             class="group flex items-center gap-3 rounded-2xl border border-theme p-2.5 transition hover:border-brand-300 hover:bg-surface">
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-surface">
              ${image ? `<img src="${image}" alt="" class="h-full w-full object-contain p-1" loading="lazy" onerror="${imgFallback}" />` : ''}
            </div>
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold leading-tight">${name}</p>
              ${price ? `<p class="text-[11px] font-medium text-brand-600 dark:text-brand-400">${price}</p>` : ''}
            </div>
          </a>`;
        })
        .join('')}
    </div>`;
}

export function renderCompactProductRow(products) {
  if (!products.length) return '';
  return `<div class="flex gap-4 overflow-x-auto pb-2">${products.map(renderCompactProductCard).join('')}</div>`;
}

export function renderProductGrid(products, options = {}) {
  const popular = options.popularIds instanceof Set ? options.popularIds : new Set(options.popularIds || []);
  if (!products.length) {
    return `<div class="col-span-full py-16 text-center text-content-muted">Keine Produkte gefunden.</div>`;
  }
  return products
    .map((p) => renderProductCard({ ...p, _popular: popular.has(p.id) }))
    .join('');
}
