import { api } from '../src/api.js';
import { renderPriceBreakdown } from '../components/PriceBreakdown.js';
import { escapeHtml, formatCurrency, setSessionOrder, showToast } from '../src/utils.js';
import { navigate } from '../src/router.js';
import {
  getPaymentMethod,
  getSavedPaymentMethod,
  savePaymentMethod,
} from '../src/paymentMethods.js';
import {
  renderCheckoutLegalCheckboxes,
  bindCheckoutLegalToggle,
  isCheckoutLegalAccepted,
  updateCheckoutButtonState,
} from '../components/LegalCheckout.js';
import { renderPaymentMethodPicker, bindPaymentMethodPicker } from '../components/PaymentMethodSelect.js';
import { renderNetworkWarning } from '../src/networkWarnings.js';
import { t } from '../src/i18n.js';
import { getOrderHistory } from '../src/userData.js';
import {
  canStartNewPayment,
  getPendingPaymentBlockReason,
  renderPendingPaymentWarning,
} from '../src/orderPayments.js';
import { buildActivePaymentFromInvoice, saveActivePayment } from '../src/paymentRecovery.js';

export async function renderCheckout(container, query) {
  const productId = query.get('id');
  const productName = query.get('name') || 'Gutschein';
  const currency = query.get('currency') || 'USD';
  const value = query.get('value');
  const packageId = query.get('packageId');
  let selectedMethod = getSavedPaymentMethod();

  if (!productId || (!value && !packageId)) {
    container.innerHTML = `<div class="page-container"><div class="card">${t('checkout.invalid')} <a href="#/shop" data-nav="/shop">${t('checkout.toShop')}</a></div></div>`;
    return;
  }

  const priceLabel = value ? formatCurrency(value, currency) : t('common.package');
  const fiatNum = value ? parseFloat(value) : null;

  function renderPage() {
    const meta = getPaymentMethod(selectedMethod);
    const orderHistory = getOrderHistory();
    const paymentBlocked = !canStartNewPayment(orderHistory);

    container.innerHTML = `
      <div class="page-container">
        <h1 class="section-title">${t('checkout.title')}</h1>
        <p class="mt-2 text-content-muted">${t('checkout.subtitle')}</p>

        <div class="mx-auto mt-8 max-w-xl">
          <div class="card">
            <h2 class="font-display text-lg font-semibold">${t('checkout.overview')}</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex justify-between"><dt class="text-content-muted">${t('checkout.product')}</dt><dd class="font-medium">${escapeHtml(productName)}</dd></div>
              <div class="flex justify-between"><dt class="text-content-muted">${t('checkout.voucherValue')}</dt><dd class="font-medium">${escapeHtml(priceLabel)}</dd></div>
            </dl>

            ${fiatNum ? renderPriceBreakdown({ fiatTotal: fiatNum, currency, paymentMethod: selectedMethod }) : ''}

            <div class="mt-6">
              <label class="mb-3 block text-sm font-medium">${t('checkout.selectCrypto')}</label>
              ${renderPaymentMethodPicker(selectedMethod)}
              <div id="network-warning" class="mt-3">${renderNetworkWarning(selectedMethod)}</div>
            </div>

            ${renderCheckoutLegalCheckboxes()}

            ${renderPendingPaymentWarning(orderHistory)}

            <button type="button" id="create-invoice-btn" class="btn-primary mt-6 w-full py-4" disabled>
              ${paymentBlocked ? 'Zu viele offene Zahlungen' : t('checkout.startPayment', { method: meta.checkoutLabel || meta.label })}
            </button>
            <p class="mt-3 text-xs text-content-muted">${t('checkout.footer')}</p>
          </div>
        </div>
      </div>`;

    bindCheckoutLegalToggle(updateCheckoutButtonState);
    updateCheckoutButtonState();

    bindPaymentMethodPicker((id) => {
      selectedMethod = id;
      savePaymentMethod(selectedMethod);
      renderPage();
    });

    document.getElementById('create-invoice-btn')?.addEventListener('click', createInvoice);
  }

  async function createInvoice() {
    if (!canStartNewPayment(getOrderHistory())) {
      showToast(getPendingPaymentBlockReason(getOrderHistory()) || 'Zu viele offene Zahlungen', 'error');
      return;
    }
    if (!isCheckoutLegalAccepted()) {
      showToast(t('cart.legalError'), 'error');
      return;
    }

    const btn = document.getElementById('create-invoice-btn');
    const method = selectedMethod;
    btn.disabled = true;
    btn.textContent = t('checkout.creating');

    try {
      const payload = { productId, paymentMethod: method, quantity: 1 };
      if (packageId) payload.packageId = packageId;
      else if (value) payload.value = parseFloat(value);

      const result = await api.createInvoice(payload);
      const invoice = result.data;
      const orderId = invoice.orders?.[0]?.id;

      setSessionOrder({
        invoiceId: invoice.id,
        orderId,
        productId,
        productName,
        status: invoice.status,
        total: priceLabel,
        items: [{ productId, name: productName, value, packageId, currency, qty: 1 }],
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
          productName,
          total: priceLabel,
          items: [{ productId, name: productName, value, packageId, currency, qty: 1 }],
          paymentMethod: method,
          expiresIn: result.expiresIn || 900,
          accessToken: result.accessToken,
        })
      );

      navigate(
        `/payment?invoiceId=${encodeURIComponent(invoice.id)}${orderId ? `&orderId=${encodeURIComponent(orderId)}` : ''}`
      );
    } catch (err) {
      showToast(err.message || t('checkout.retry'), 'error');
      btn.disabled = false;
      btn.textContent = t('checkout.retry');
    }
  }

  renderPage();
}
