import { escapeHtml, formatCurrency, showToast } from '../src/utils.js';
import {
  getCart,
  getItemCount,
  getTotalsByCurrency,
  cartKey,
  updateQty,
  removeFromCart,
  addToCart,
} from '../src/cart.js';
import { navigate } from '../src/router.js';
import { api } from '../src/api.js';
import { t } from '../src/i18n.js';

const imgFallback =
  "this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect fill=%22%23e2e8f0%22 width=%2264%22 height=%2264%22/></svg>'";

export function renderCartButton() {
  const count = getItemCount();
  return `
    <button type="button" data-cart-toggle
      class="relative rounded-xl border border-theme p-2 text-content-muted transition-colors hover:border-brand-400 hover:text-brand-600"
      aria-label="${t('aria.cart')}">
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span data-cart-badge
        class="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white ${count ? '' : 'hidden'}">${count}</span>
    </button>`;
}

function totalsLabel() {
  const totals = getTotalsByCurrency();
  const entries = Object.entries(totals);
  if (!entries.length) return '';
  return entries.map(([cur, val]) => formatCurrency(val, cur)).join(' + ');
}

function renderItems() {
  const items = getCart();
  if (!items.length) {
    return `
      <div class="px-5 py-10 text-center text-content-muted">
        <svg class="mx-auto mb-3 h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        <p class="text-sm">Dein Warenkorb ist leer.</p>
        <p class="mt-1 text-xs">Füge Gutscheine hinzu, um sie hier zu sehen.</p>
      </div>`;
  }

  return `<ul class="divide-y divide-[color:var(--border)]">
    ${items
      .map((it) => {
        const key = cartKey(it);
        const line = it.value != null ? formatCurrency(it.value, it.currency) : 'Paket';
        const lineTotal = it.value != null ? formatCurrency(it.value * it.qty, it.currency) : '';
        const qtyLabel = it.qty > 1 && it.value != null
          ? `${it.qty} × ${line} = ${lineTotal}`
          : line;
        return `
        <li class="flex items-center gap-3 px-4 py-3" data-cart-item="${escapeHtml(key)}">
          <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-theme bg-white">
            ${it.image ? `<img src="${escapeHtml(it.image)}" alt="" class="h-full w-full object-contain p-1" onerror="${imgFallback}" />` : ''}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">${escapeHtml(it.name)}</p>
            <p class="text-xs font-medium text-brand-600 dark:text-brand-400">${escapeHtml(qtyLabel)}</p>
            <div class="mt-1 inline-flex items-center gap-2 rounded-lg border border-theme">
              <button type="button" data-qty-dec="${escapeHtml(key)}" class="px-2 py-0.5 text-content-muted hover:text-brand-600" aria-label="Menge verringern">−</button>
              <span class="min-w-[1.25rem] text-center text-sm font-medium">${it.qty}</span>
              <button type="button" data-qty-inc="${escapeHtml(key)}" class="px-2 py-0.5 text-content-muted hover:text-brand-600" aria-label="Menge erhöhen">+</button>
            </div>
          </div>
          <button type="button" data-cart-remove="${escapeHtml(key)}" class="shrink-0 rounded-lg p-1 text-content-muted hover:text-red-600" aria-label="Entfernen">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </li>`;
      })
      .join('')}
  </ul>`;
}

function renderDrawerContent() {
  const count = getItemCount();
  const total = totalsLabel();
  return `
    <div class="flex items-center justify-between border-b border-theme px-5 py-4">
      <h2 class="font-display text-base font-semibold">Warenkorb ${count ? `(${count})` : ''}</h2>
      <button type="button" data-cart-close class="rounded-lg p-1 text-content-muted hover:text-content" aria-label="Schließen">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="max-h-[55vh] overflow-y-auto">${renderItems()}</div>
    ${
      count
        ? `<div class="border-t border-theme px-5 py-4">
            <div class="mb-4 flex items-center justify-between">
              <span class="text-sm text-content-muted">Gesamt</span>
              <span class="font-display text-lg font-bold">${escapeHtml(total)}</span>
            </div>
            <div class="flex gap-2">
              <button type="button" data-cart-close class="btn-secondary flex-1">Weiter einkaufen</button>
              <button type="button" data-cart-checkout class="btn-primary flex-1">Zur Kasse</button>
            </div>
          </div>`
        : ''
    }`;
}

let isOpen = false;

function refresh() {
  const panel = document.getElementById('cart-drawer-panel');
  if (panel) panel.innerHTML = renderDrawerContent();

  const count = getItemCount();
  document.querySelectorAll('[data-cart-badge]').forEach((b) => {
    b.textContent = String(count);
    b.classList.toggle('hidden', count === 0);
  });
}

function openDrawer() {
  isOpen = true;
  const root = document.getElementById('cart-drawer-root');
  if (root) {
    root.classList.remove('pointer-events-none');
    document.getElementById('cart-drawer-overlay')?.classList.remove('opacity-0');
    const panel = document.getElementById('cart-drawer-panel');
    panel?.classList.remove('translate-x-full');
  }
  refresh();
}

function closeDrawer() {
  isOpen = false;
  document.getElementById('cart-drawer-overlay')?.classList.add('opacity-0');
  document.getElementById('cart-drawer-panel')?.classList.add('translate-x-full');
  setTimeout(() => {
    if (!isOpen) document.getElementById('cart-drawer-root')?.classList.add('pointer-events-none');
  }, 300);
}

export function initCartDrawer() {
  if (document.getElementById('cart-drawer-root')) return;

  const root = document.createElement('div');
  root.id = 'cart-drawer-root';
  root.className = 'pointer-events-none fixed inset-0 z-[60]';
  root.innerHTML = `
    <div id="cart-drawer-overlay" class="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300"></div>
    <aside id="cart-drawer-panel"
      class="absolute right-0 top-0 flex h-full w-full max-w-sm translate-x-full flex-col bg-surface-elevated shadow-2xl transition-transform duration-300"></aside>`;
  document.body.appendChild(root);

  root.addEventListener('click', (e) => {
    if (e.target.id === 'cart-drawer-overlay') return closeDrawer();
    if (e.target.closest('[data-cart-close]')) return closeDrawer();

    if (e.target.closest('[data-cart-checkout]')) {
      closeDrawer();
      navigate('/cart');
      return;
    }

    const inc = e.target.closest('[data-qty-inc]');
    if (inc) {
      const key = inc.dataset.qtyInc;
      const item = getCart().find((it) => cartKey(it) === key);
      if (item) updateQty(key, (item.qty || 1) + 1);
      return;
    }

    const dec = e.target.closest('[data-qty-dec]');
    if (dec) {
      const key = dec.dataset.qtyDec;
      const item = getCart().find((it) => cartKey(it) === key);
      if (item) updateQty(key, (item.qty || 1) - 1);
      return;
    }

    const rem = e.target.closest('[data-cart-remove]');
    if (rem) {
      removeFromCart(rem.dataset.cartRemove);
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-toggle]')) {
      e.preventDefault();
      openDrawer();
      return;
    }

    const addBtn = e.target.closest('[data-add-cart]');
    if (addBtn) {
      e.preventDefault();
      const ds = addBtn.dataset;
      addToCart({
        productId: ds.id,
        name: ds.name,
        image: ds.image,
        currency: ds.currency,
        value: ds.value != null && ds.value !== '' ? Number(ds.value) : undefined,
        packageId: ds.packageId || undefined,
        qty: ds.qty ? Number(ds.qty) : 1,
      });
      api.trackProduct('cart', ds.id);
      showToast(`${ds.name} hinzugefügt`);
      openDrawer();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeDrawer();
  });

  window.addEventListener('Kryptogutscheine:cart-change', refresh);
  window.addEventListener('Kryptogutscheine:open-cart', openDrawer);
}
