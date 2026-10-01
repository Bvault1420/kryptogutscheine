import { api } from '../src/api.js';

import { renderSpinner } from '../components/Loading.js';

import { escapeHtml, showToast } from '../src/utils.js';

import { navigate } from '../src/router.js';

import { addToCart } from '../src/cart.js';

import { addRecentlyViewed, isFavorite, toggleFavorite, getOrderHistory } from '../src/userData.js';
import {
  canStartNewPayment,
  getPendingPaymentBlockReason,
} from '../src/orderPayments.js';

import { getCountry } from '../src/country.js';
import { isAllowedProduct, isVisibleProduct } from '../src/productFilters.js';

import {

  bindDenominationPicker,

  formatPriceRangeLabel,

  readSelectedDenomination,

  renderDenominationPicker,

  validateSelectedAmount,

} from '../src/productDenominations.js';



export async function renderProduct(container, query) {

  const productId = query.get('id');



  if (!productId) {

    container.innerHTML = `<div class="page-container"><div class="card">Kein Produkt ausgewählt. <a href="#/shop" data-nav="/shop" class="text-brand-600">Zum Shop</a></div></div>`;

    return;

  }



  container.innerHTML = `<div class="page-container">${renderSpinner('Produkt wird geladen…')}</div>`;



  try {

    const country = getCountry();
    const { data: product } = await api.getProduct(productId, country);

    if (!isAllowedProduct(product) || !isVisibleProduct(product, country)) {

      container.innerHTML = `

        <div class="page-container">

          <div class="card border-amber-200">

            <h2 class="font-semibold text-amber-800 dark:text-amber-200">Produkt nicht verfügbar</h2>

            <p class="mt-2 text-content-muted">Dieses Produkt wird auf Kryptogutscheine derzeit nicht angeboten.</p>

            <a href="#/shop" data-nav="/shop" class="btn-primary mt-4 inline-flex">Zum Shop</a>

          </div>

        </div>`;

      return;

    }



    addRecentlyViewed(product);

    const image = escapeHtml(product.image || '');

    const favActive = isFavorite(product.id);

    const currency = product.currency || 'USD';

    const priceRange = formatPriceRangeLabel(product);

    const denominationHtml = renderDenominationPicker(product);



    container.innerHTML = `

      <div class="page-container">

        <nav class="mb-6 text-sm text-content-muted">

          <a href="#/shop" data-nav="/shop" class="hover:text-brand-600">Shop</a>

          <span class="mx-2">/</span>

          <span>${escapeHtml(product.name)}</span>

        </nav>



        <div class="grid gap-8 lg:grid-cols-2 fade-stagger">

          <div class="card overflow-hidden p-0 animate-slide-up opacity-0">

            ${image

              ? `<img src="${image}" alt="${escapeHtml(product.name)}" class="w-full object-cover" />`

              : `<div class="flex aspect-square items-center justify-center bg-surface text-content-muted">Kein Bild</div>`}

          </div>



          <div class="animate-slide-up opacity-0">

            <div class="flex items-start justify-between gap-4">

              <span class="badge bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300">${escapeHtml(product.country_name || product.country_code || '')}</span>

              <button type="button" id="fav-btn" class="rounded-xl border border-theme p-2 text-content-muted transition hover:border-brand-400 hover:text-red-500" aria-label="Favorit">

                <svg class="h-5 w-5" fill="${favActive ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>

              </button>

            </div>

            <h1 class="section-title mt-4">${escapeHtml(product.name)}</h1>

            <div class="mt-4 flex flex-wrap gap-2">

              ${product.discount_percentage ? `<span class="badge bg-brand-100 text-brand-800">-${product.discount_percentage}% Rabatt</span>` : ''}

              ${product.in_stock === false ? '<span class="badge bg-red-100 text-red-700">Nicht verfügbar</span>' : '<span class="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Verfügbar</span>'}

            </div>

            ${priceRange ? `<p class="mt-3 text-sm font-medium text-brand-600 dark:text-brand-400">${priceRange}</p>` : ''}

            <p class="mt-1 text-sm text-content-muted">Währung: ${escapeHtml(currency)}</p>



            ${product.redeem_instruction?.concise ? `

              <p class="mt-4 text-sm text-content-muted">${escapeHtml(product.redeem_instruction.concise)}</p>

            ` : ''}



            ${denominationHtml}



            <div class="mt-8 flex flex-col gap-3 sm:flex-row">

              <button type="button" id="buy-btn" class="btn-primary px-8 py-4 text-base" ${product.in_stock === false ? 'disabled' : ''}>

                Jetzt kaufen

              </button>

              <button type="button" id="add-cart-btn" class="btn-secondary px-8 py-4 text-base" ${product.in_stock === false ? 'disabled' : ''}>

                In den Warenkorb

              </button>

            </div>



            <p class="mt-6 text-xs text-content-muted">

              Kryptogutscheine vermittelt den Zugang zu diesem Gutschein über Bitrefill. Zahlung und Lieferung erfolgen durch Bitrefill.

              Bitte Einlösebedingungen des jeweiligen Anbieters vor dem Kauf prüfen.

            </p>

          </div>

        </div>

      </div>`;



    bindDenominationPicker();



    document.getElementById('fav-btn')?.addEventListener('click', () => {

      const added = toggleFavorite(product);

      const svg = document.querySelector('#fav-btn svg');

      if (svg) svg.setAttribute('fill', added ? 'currentColor' : 'none');

      showToast(added ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt');

    });



    document.getElementById('add-cart-btn')?.addEventListener('click', () => {

      const { value, packageId } = readSelectedDenomination();
      const check = validateSelectedAmount(product, value, packageId);

      if (!check.ok) {
        showToast(check.error || 'Bitte einen gültigen Betrag wählen', 'error');
        return;
      }

      addToCart({

        productId: product.id,

        name: product.name,

        image: product.image,

        currency,

        value: check.value,

        packageId: check.packageId,

        qty: 1,

      });

      api.trackProduct('cart', product.id);

      showToast(`${product.name} hinzugefügt`);

      window.dispatchEvent(new CustomEvent('Kryptogutscheine:open-cart'));

    });



    document.getElementById('buy-btn')?.addEventListener('click', () => {
      if (!canStartNewPayment(getOrderHistory())) {
        showToast(getPendingPaymentBlockReason(getOrderHistory()) || 'Zu viele offene Zahlungen', 'error');
        return;
      }

      const { value, packageId } = readSelectedDenomination();
      const check = validateSelectedAmount(product, value, packageId);

      if (!check.ok) {
        showToast(check.error || 'Bitte einen gültigen Betrag wählen', 'error');
        return;
      }

      const params = new URLSearchParams({ id: product.id, name: product.name, currency });

      if (check.packageId) params.set('packageId', check.packageId);

      if (check.value != null) params.set('value', String(check.value));

      navigate(`/checkout?${params}`);

    });

  } catch (err) {

    container.innerHTML = `

      <div class="page-container">

        <div class="card border-red-200">

          <h2 class="font-semibold text-red-600">Produkt nicht gefunden</h2>

          <p class="mt-2 text-content-muted">${escapeHtml(err.message)}</p>

          <a href="#/shop" data-nav="/shop" class="btn-primary mt-4 inline-flex">Zum Shop</a>

        </div>

      </div>`;

  }

}


