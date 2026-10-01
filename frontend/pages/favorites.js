import { api } from '../src/api.js';
import { renderProductGrid } from '../components/ProductCard.js';
import { renderSpinner } from '../components/Loading.js';
import { renderEmptyState, EMPTY_ICONS } from '../components/EmptyState.js';
import { escapeHtml } from '../src/utils.js';
import { getFavorites } from '../src/userData.js';
import { getCountry } from '../src/country.js';
import { isVisibleProduct } from '../src/productFilters.js';

export async function renderFavorites(container) {
  const favorites = getFavorites();

  container.innerHTML = `
    <div class="page-container pb-20 lg:pb-8">
      <div class="mb-8">
        <h1 class="section-title">Favoriten</h1>
        <p class="mt-2 text-content-muted">Deine gespeicherten Gutscheine.</p>
      </div>
      <div id="fav-grid">${favorites.length ? renderSpinner('Favoriten werden geladen…') : ''}</div>
    </div>`;

  if (!favorites.length) {
    document.getElementById('fav-grid').innerHTML = renderEmptyState({
      icon: EMPTY_ICONS.heart,
      title: 'Noch keine Favoriten',
      text: 'Klicke auf das Herz-Symbol bei einem Gutschein.',
      ctaLabel: 'Zum Shop',
      ctaPath: '/shop',
    });
    return;
  }

  try {
    const ids = favorites.map((f) => f.id);
    const country = getCountry();
    const { data } = await api.getProductsBatch(ids, country);
    const products = (data || []).filter((p) => isVisibleProduct(p, country));
    document.getElementById('fav-grid').innerHTML = products.length
      ? `<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${renderProductGrid(products)}</div>`
      : '<p class="text-content-muted">Favoriten konnten nicht geladen werden.</p>';
  } catch (err) {
    document.getElementById('fav-grid').innerHTML = `<p class="text-red-600">${escapeHtml(err.message)}</p>`;
  }
}
