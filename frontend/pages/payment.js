import { api } from '../src/api.js';
import { renderCryptoPayment, bindCryptoPayment } from '../components/QrPayment.js';
import { renderSpinner } from '../components/Loading.js';
import { renderCheckoutSteps } from '../components/CheckoutSteps.js';
import { startPaymentTimer } from '../components/ConfirmModal.js';
import { renderNetworkWarning } from '../src/networkWarnings.js';
import { escapeHtml, setSessionOrder, showToast } from '../src/utils.js';
import { navigate, registerCleanup } from '../src/router.js';
import { getPaymentMethod } from '../src/paymentMethods.js';
import {
  buildActivePaymentFromInvoice,
  getActivePayment,
  saveActivePayment,
} from '../src/paymentRecovery.js';
import { t } from '../src/i18n.js';
import { renderOrderReceipt, bindOrderReceipt } from '../components/OrderReceipt.js';
import { getOrderByInvoiceId } from '../src/userData.js';

export async function renderPayment(container, query) {
  const invoiceId = query.get('invoiceId');
  const orderId = query.get('orderId') || '';
  const cached = getActivePayment();

  if (!invoiceId) {
    container.innerHTML = `
      <div class="page-container">
        <div class="card text-center">
          <p>${t('payment.missing')}</p>
          <a href="#/cart" data-nav="/cart" class="btn-primary mt-4 inline-flex">${t('payment.backCart')}</a>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-container pb-20 lg:pb-8">
      ${renderCheckoutSteps(1)}
      <div class="mx-auto max-w-lg">
        <h1 class="section-title text-center">${t('payment.title')}</h1>
        <p class="mt-2 text-center text-content-muted">${t('payment.subtitle')}</p>
        <p class="mt-2 text-center text-xs text-emerald-700 dark:text-emerald-400">
          Zahlung gespeichert – bleibt aktiv auch bei Absturz oder Browser-Neustart.
        </p>
        <div id="payment-content" class="mt-8">${renderSpinner(t('payment.loading'))}</div>
      </div>
    </div>`;

  let stopTimer = null;
  registerCleanup(() => {
    if (stopTimer) stopTimer();
  });

  function remainingSecondsFor(expiresInSecondsDefault) {
    if (cached?.invoiceId && cached.invoiceId === invoiceId && cached?.expiresAt) {
      const ms = new Date(cached.expiresAt).getTime() - Date.now();
      if (Number.isFinite(ms)) return Math.max(0, Math.ceil(ms / 1000));
    }
    return Number.isFinite(expiresInSecondsDefault) ? Math.max(0, Math.floor(expiresInSecondsDefault)) : 900;
  }

  function renderPaymentUi({
    method,
    payAddress,
    price,
    payCurrency,
    giftLabel,
    invoiceId: id,
    orderId: ordId,
    expiresInSeconds,
    accessToken,
    total,
  }) {
    const content = document.getElementById('payment-content');
    if (!content) return;

    content.innerHTML = `
      ${renderCryptoPayment({ method, address: payAddress, amount: price, currency: payCurrency, giftLabel })}
      <p id="payment-timer" class="mt-4 text-center text-sm font-medium text-amber-700 dark:text-amber-300"></p>
      ${renderNetworkWarning(method)}
      ${accessToken ? renderOrderReceipt({ invoiceId: id, accessToken, productName: giftLabel, total }) : ''}
      <div class="mt-6 space-y-3 text-center">
        <p class="text-xs text-content-muted">${t('payment.savedHint')}</p>
        <p class="font-mono text-xs text-content-muted break-all">${escapeHtml(id)}</p>
        <a href="#/order-status?invoiceId=${encodeURIComponent(id)}${ordId ? `&orderId=${encodeURIComponent(ordId)}` : ''}"
           data-nav="/order-status?invoiceId=${encodeURIComponent(id)}"
           class="btn-primary inline-flex">${t('checkout.trackStatus')}</a>
      </div>`;

    if (accessToken) bindOrderReceipt({ invoiceId: id, accessToken, productName: giftLabel, total });

    bindCryptoPayment({ method, address: payAddress });
    stopTimer = startPaymentTimer('payment-timer', remainingSecondsFor(expiresInSeconds));
  }

  function goToOrderStatus(id, ordId) {
    navigate(
      `/order-status?invoiceId=${encodeURIComponent(id)}&orderId=${encodeURIComponent(ordId || '')}`
    );
  }

  try {
    const { data: invoice } = await api.getInvoice(invoiceId, cached?.accessToken);
    const payAddress = invoice.payment?.address || cached?.paymentAddress;
    const price = invoice.payment?.price ?? cached?.paymentAmount;
    const payCurrency = invoice.payment?.currency || cached?.paymentCurrency || 'BTC';
    const method = invoice.payment?.method || cached?.paymentMethod || 'lightning';
    const meta = getPaymentMethod(method);
    const giftLabel = invoice.orders?.[0]?.product?.name || cached?.productName || '';
    const resolvedOrderId = orderId || invoice.orders?.[0]?.id || cached?.orderId || '';

    const accessToken = cached?.accessToken || getOrderByInvoiceId(invoiceId)?.accessToken;

    saveActivePayment(
      buildActivePaymentFromInvoice(invoice, {
        orderId: resolvedOrderId,
        productName: giftLabel || meta.label,
        total: cached?.total,
        items: cached?.items,
        accessToken,
      })
    );

    setSessionOrder({
      invoiceId,
      orderId: resolvedOrderId,
      productName: giftLabel || meta.label,
      status: invoice.status,
      paymentMethod: method,
      paymentAddress: payAddress,
      paymentAmount: price,
      paymentCurrency: payCurrency,
      expiresIn: 900,
      accessToken,
    });

    if (invoice.status === 'complete' || invoice.rawStatus === 'complete') {
      goToOrderStatus(invoiceId, resolvedOrderId);
      return;
    }

    if (!payAddress) {
      document.getElementById('payment-content').innerHTML = `
        <div class="card border-red-200 text-center">
          <p class="text-red-600">${t('payment.noAddress')}</p>
        </div>`;
      return;
    }

    renderPaymentUi({
      method,
      payAddress,
      price,
      payCurrency,
      giftLabel,
      invoiceId,
      orderId: resolvedOrderId,
      expiresInSeconds: invoice.expiresIn || 900,
      accessToken,
      total: cached?.total,
    });

    showToast(t('payment.created'));
  } catch (err) {
    if (cached?.invoiceId === invoiceId && cached.paymentAddress) {
      renderPaymentUi({
        method: cached.paymentMethod || 'lightning',
        payAddress: cached.paymentAddress,
        price: cached.paymentAmount,
        payCurrency: cached.paymentCurrency || 'BTC',
        giftLabel: cached.productName || '',
        invoiceId,
        orderId: orderId || cached.orderId || '',
        expiresInSeconds: Math.ceil(((new Date(cached.expiresAt).getTime() - Date.now()) || 0) / 1000) || 900,
        accessToken: cached.accessToken,
        total: cached.total,
      });
      showToast('Offline – gespeicherte Zahlungsdaten werden angezeigt');
      return;
    }

    document.getElementById('payment-content').innerHTML = `
      <div class="card border-red-200 text-center">
        <p class="text-red-600">${escapeHtml(err.message || t('payment.error'))}</p>
        <a href="#/cart" data-nav="/cart" class="btn-primary mt-4 inline-flex">${t('payment.backCart')}</a>
      </div>`;
  }
}
