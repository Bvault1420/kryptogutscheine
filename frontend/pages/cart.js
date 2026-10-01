import { api } from '../src/api.js';
import { escapeHtml, formatCurrency, setSessionOrder, showToast } from '../src/utils.js';
import { navigate } from '../src/router.js';
import { addToCart, getCart, getItemCount, getTotalsByCurrency, cartKey, updateQty, removeFromCart, clearCart } from '../src/cart.js';
import { renderCheckoutSteps } from '../components/CheckoutSteps.js';
import { showConfirmModal } from '../components/ConfirmModal.js';
import { renderNetworkWarning } from '../src/networkWarnings.js';
import { renderPriceBreakdown } from '../components/PriceBreakdown.js';
import { t } from '../src/i18n.js';
import {
  renderCheckoutLegalCheckboxes,
  bindCheckoutLegalToggle,
  isCheckoutLegalAccepted,
  updateCheckoutButtonState,
} from '../components/LegalCheckout.js';
import { addOrderHistory, getOrderHistory } from '../src/userData.js';
import {
  canStartNewPayment,
  getPendingPaymentBlockReason,
  renderPendingPaymentWarning,
} from '../src/orderPayments.js';
import { buildActivePaymentFromInvoice, saveActivePayment } from '../src/paymentRecovery.js';
import {
  getPaymentMethod,
  getSavedPaymentMethod,
  savePaymentMethod,
} from '../src/paymentMethods.js';
import { renderPaymentMethodPicker, bindPaymentMethodPicker } from '../components/PaymentMethodSelect.js';

const imgFallback =
  "this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect fill=%22%23e2e8f0%22 width=%2264%22 height=%2264%22/></svg>'";

export async function renderCart(container) {
  let selectedMethod = getSavedPaymentMethod();

  function totalsLabel() {
    const totals = getTotalsByCurrency();
    const entries = Object.entries(totals);
    if (!entries.length) return formatCurrency(0, 'EUR');
    return entries.map(([cur, val]) => formatCurrency(val, cur)).join(' + ');
  }

  function primaryTotal() {
    const totals = getTotalsByCurrency();
    const entries = Object.entries(totals);
    if (!entries.length) return { total: 0, currency: 'EUR' };
    return { total: entries[0][1], currency: entries[0][0] };
  }

  function renderEmpty() {
    container.innerHTML = `
      <div class="page-container">
        <h1 class="section-title">${t('cart.title')}</h1>
        <div class="mt-8 card flex flex-col items-center py-16 text-center">
          <svg class="mb-4 h-14 w-14 text-content-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <p class="text-lg font-semibold">${t('cart.empty')}</p>
          <p class="mt-2 text-content-muted">${t('cart.emptyHint')}</p>
          <a href="#/shop" data-nav="/shop" class="btn-primary mt-6">${t('common.toShop')}</a>
        </div>
      </div>`;
  }

  function renderItemsList() {
    const items = getCart();
    return items
      .map((it) => {
        const key = cartKey(it);
        const line = it.value != null ? formatCurrency(it.value, it.currency) : t('common.package');
        const lineTotal = it.value != null ? formatCurrency(it.value * it.qty, it.currency) : '';
        const qtyLabel = it.qty > 1 && it.value != null
          ? `${it.qty} × ${line} = ${lineTotal}`
          : line;
        return `
        <li class="flex items-center gap-4 py-4" data-cart-row="${escapeHtml(key)}">
          <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-theme bg-white">
            ${it.image ? `<img src="${escapeHtml(it.image)}" alt="" class="h-full w-full object-contain p-1.5" onerror="${imgFallback}" />` : ''}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">${escapeHtml(it.name)}</p>
            <p class="text-sm font-medium text-brand-600 dark:text-brand-400">${escapeHtml(qtyLabel)}</p>
          </div>
          <div class="flex items-center gap-1 rounded-xl border border-theme">
            <button type="button" data-c-dec="${escapeHtml(key)}" class="px-3 py-2 text-content-muted hover:text-brand-600" aria-label="Weniger">−</button>
            <span class="min-w-[1.5rem] text-center text-sm font-semibold">${it.qty}</span>
            <button type="button" data-c-inc="${escapeHtml(key)}" class="px-3 py-2 text-content-muted hover:text-brand-600" aria-label="Mehr">+</button>
          </div>
          <div class="hidden w-24 text-right font-semibold sm:block">${escapeHtml(lineTotal)}</div>
          <button type="button" data-c-rem="${escapeHtml(key)}" class="shrink-0 rounded-lg p-2 text-content-muted hover:text-red-600" aria-label="Entfernen">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </li>`;
      })
      .join('');
  }

  function renderPage() {
    if (!getItemCount()) {
      renderEmpty();
      return;
    }

    const meta = getPaymentMethod(selectedMethod);
    const { total: fiatTotal, currency: fiatCurrency } = primaryTotal();
    const orderHistory = getOrderHistory();
    const paymentBlocked = !canStartNewPayment(orderHistory);

    container.innerHTML = `
      <div class="page-container pb-20 lg:pb-8">
        ${renderCheckoutSteps(0)}
        <h1 class="section-title">${t('cart.title')}</h1>

        <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div class="card p-0">
            <ul id="cart-rows" class="divide-y divide-[color:var(--border)] px-6">${renderItemsList()}</ul>
            <div class="flex items-center justify-between border-t border-theme px-6 py-4">
              <a href="#/shop" data-nav="/shop" class="text-sm font-medium text-brand-600 hover:underline">${t('cart.continue')}</a>
              <button type="button" id="cart-clear" class="text-sm font-medium text-content-muted hover:text-red-600">${t('cart.clear')}</button>
            </div>
          </div>

          <div class="lg:sticky lg:top-24 lg:self-start">
            <div class="card">
              <h2 class="font-display text-lg font-semibold">${t('cart.summary')}</h2>
              <div class="mt-4 flex items-center justify-between border-b border-theme pb-4">
                <span class="text-content-muted">${t('cart.total')}</span>
                <span id="cart-total" class="font-display text-xl font-bold">${escapeHtml(totalsLabel())}</span>
              </div>

              ${renderPriceBreakdown({ fiatTotal, currency: fiatCurrency, paymentMethod: selectedMethod })}

              <div class="mt-4">
                <label class="mb-3 block text-sm font-medium">${t('checkout.selectCrypto')}</label>
                ${renderPaymentMethodPicker(selectedMethod)}
                <div id="network-warning" class="mt-3">${renderNetworkWarning(selectedMethod)}</div>
              </div>

              ${renderCheckoutLegalCheckboxes()}

              ${renderPendingPaymentWarning(orderHistory)}

              <button type="button" id="checkout-btn" class="btn-primary mt-6 w-full py-4" disabled>
                ${paymentBlocked ? 'Zu viele offene Zahlungen' : t('cart.startPayment', { method: meta.checkoutLabel || meta.label })}
              </button>

              <p class="mt-4 text-xs text-content-muted">${t('cart.footer')}</p>
            </div>
          </div>
        </div>
      </div>`;

    bindEvents();
    bindPaymentMethodPicker((id) => {
      selectedMethod = id;
      savePaymentMethod(selectedMethod);
      renderPage();
    });
    bindCheckoutLegalToggle(updateCheckoutButtonState);
    updateCheckoutButtonState();
  }

  function refreshTotals() {
    const total = document.getElementById('cart-total');
    if (total) total.textContent = totalsLabel();
  }

  function bindEvents() {
    const rows = document.getElementById('cart-rows');

    rows?.addEventListener('click', (e) => {
      const inc = e.target.closest('[data-c-inc]');
      const dec = e.target.closest('[data-c-dec]');
      const rem = e.target.closest('[data-c-rem]');
      if (inc) {
        const item = getCart().find((it) => cartKey(it) === inc.dataset.cInc);
        if (item) updateQty(inc.dataset.cInc, (item.qty || 1) + 1);
        renderPage();
      } else if (dec) {
        const item = getCart().find((it) => cartKey(it) === dec.dataset.cDec);
        if (item) updateQty(dec.dataset.cDec, (item.qty || 1) - 1);
        renderPage();
      } else if (rem) {
        removeFromCart(rem.dataset.cRem);
        renderPage();
      }
    });

    document.getElementById('cart-clear')?.addEventListener('click', () => {
      clearCart();
      renderPage();
    });

    document.getElementById('checkout-btn')?.addEventListener('click', async () => {
      if (!canStartNewPayment(getOrderHistory())) {
        showToast(getPendingPaymentBlockReason(getOrderHistory()) || 'Zu viele offene Zahlungen', 'error');
        return;
      }
      if (!isCheckoutLegalAccepted()) {
        showToast(t('cart.legalError'), 'error');
        return;
      }

      const items = getCart();
      const summary = items.map((it) => {
        const line = it.value != null ? formatCurrency(it.value, it.currency) : t('common.package');
        return `${it.qty > 1 ? `${it.qty}× ` : ''}${it.name} (${line})`;
      }).join('<br>');

      const ok = await showConfirmModal({
        title: t('cart.confirmTitle'),
        body: `<p>${t('cart.confirmBody')}</p><p class="mt-2 font-medium text-content">${summary}</p><p class="mt-3">${t('cart.confirmTotal')}: <strong>${escapeHtml(totalsLabel())}</strong></p><p class="mt-2 text-xs">${t('cart.confirmPayment', { method: getPaymentMethod(selectedMethod).checkoutLabel || getPaymentMethod(selectedMethod).label })}</p>`,
        confirmLabel: t('cart.confirmPay'),
      });
      if (ok) createInvoice();
    });
  }

  async function createInvoice() {
    if (!canStartNewPayment(getOrderHistory())) {
      showToast(getPendingPaymentBlockReason(getOrderHistory()) || 'Zu viele offene Zahlungen', 'error');
      return;
    }
    const btn = document.getElementById('checkout-btn');
    const method = selectedMethod;
    btn.disabled = true;
    btn.textContent = 'Wird erstellt…';

    try {
      const items = getCart().map((it) => {
        const item = { productId: it.productId, quantity: it.qty || 1 };
        if (it.packageId) item.packageId = it.packageId;
        else if (it.value != null) item.value = Number(it.value);
        return item;
      });

      const result = await api.createInvoice({ items, paymentMethod: method });
      const invoice = result.data;
      const orderId = invoice.orders?.[0]?.id;
      const cartSnapshot = getCart();

      addOrderHistory({
        invoiceId: invoice.id,
        orderId,
        productName: cartSnapshot.map((i) => i.name).join(', ') || 'Bestellung',
        status: invoice.status,
        total: totalsLabel(),
        paymentMethod: invoice.payment?.method || method,
        items: cartSnapshot,
        accessToken: result.accessToken,
        createdAt: new Date().toISOString(),
      });

      setSessionOrder({
        invoiceId: invoice.id,
        orderId,
        productName: `${getItemCount()} Artikel`,
        status: invoice.status,
        total: totalsLabel(),
        items: cartSnapshot,
        paymentMethod: invoice.payment?.method || method,
        paymentAddress: invoice.payment?.address,
        paymentAmount: invoice.payment?.price,
        paymentCurrency: invoice.payment?.currency,
        expiresIn: result.expiresIn || 900,
        accessToken: result.accessToken,
      });

      saveActivePayment(
        buildActivePaymentFromInvoice(invoice, {
          orderId,
          productName: cartSnapshot.map((i) => i.name).join(', ') || 'Bestellung',
          total: totalsLabel(),
          items: cartSnapshot,
          paymentMethod: invoice.payment?.method || method,
          expiresIn: result.expiresIn || 900,
          accessToken: result.accessToken,
        })
      );

      clearCart();
      navigate(
        `/payment?invoiceId=${encodeURIComponent(invoice.id)}${orderId ? `&orderId=${encodeURIComponent(orderId)}` : ''}`
      );
    } catch (err) {
      showToast(err.message || 'Fehler beim Erstellen der Rechnung', 'error');
      btn.disabled = false;
      btn.textContent = t('cart.startPayment', { method: getPaymentMethod(selectedMethod).checkoutLabel || getPaymentMethod(selectedMethod).label });
    }
  }

  renderPage();
  refreshTotals();
}
