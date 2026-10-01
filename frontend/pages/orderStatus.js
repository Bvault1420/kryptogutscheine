import { api } from '../src/api.js';
import { renderSpinner } from '../components/Loading.js';
import { renderCheckoutSteps } from '../components/CheckoutSteps.js';
import {
  escapeHtml,
  formatCryptoAmount,
  formatStatus,
  statusColor,
  getActiveOrder,
  showToast,
  safeUrl,
} from '../src/utils.js';
import { registerCleanup } from '../src/router.js';
import {
  getOrderHistory,
  getOrderByInvoiceId,
  saveOrderSnapshot,
  hydrateOrderFromVault,
  hasStoredRedemptions,
} from '../src/userData.js';
import { countActivePendingOrders, isOrderCompleted } from '../src/orderPayments.js';
import { renderOrderReceipt, bindOrderReceipt } from '../components/OrderReceipt.js';

function formatOrderDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function renderHistorySection(history) {
  if (!history.length) {
    return `
      <section class="mt-6 card-static max-w-3xl">
        <h2 class="font-display text-lg font-semibold">Deine Bestellungen auf diesem Gerät</h2>
        <p class="mt-2 text-sm text-content-muted">Noch keine Bestellungen gespeichert. Nach dem Checkout erscheinen Rechnungs-ID und Status hier – auch wenn du den Browser schließt.</p>
      </section>`;
  }

  const pendingCount = countActivePendingOrders(history);
  const completedCount = history.filter((o) => isOrderCompleted(o.status)).length;

  return `
    <section class="mt-6">
      <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 class="font-display text-lg font-semibold">Deine Bestellungen auf diesem Gerät</h2>
          <p class="text-sm text-content-muted">
            ${history.length} gespeichert · ${completedCount} abgeschlossen${pendingCount ? ` · ${pendingCount} offen` : ''} · bleibt auch nach Browser-Neustart
          </p>
        </div>
      </div>
      <div class="space-y-3">
        ${history
          .map((o) => {
            const date = formatOrderDate(o.updatedAt || o.createdAt);
            const hasCodes = o.redemptions?.some((r) => r.info?.code || r.info?.link);
            return `
          <article class="card-static flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">${escapeHtml(o.productName || 'Bestellung')}</p>
              <p class="mt-1 font-mono text-xs text-content-muted break-all">${escapeHtml(o.invoiceId)}</p>
              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-content-muted">
                ${date ? `<span>${escapeHtml(date)}</span>` : ''}
                ${o.total ? `<span>· ${escapeHtml(o.total)}</span>` : ''}
                ${hasCodes ? '<span class="text-emerald-600 dark:text-emerald-400">· Code gespeichert</span>' : ''}
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-2">
              <span class="badge ${statusColor(o.status)}">${formatStatus(o.status)}</span>
              <button type="button" data-history-id="${escapeHtml(o.invoiceId)}"
                class="btn-primary px-4 py-2 text-xs">Öffnen</button>
              ${o.items?.length ? `<button type="button" data-buy-again="${escapeHtml(o.invoiceId)}" class="btn-secondary px-4 py-2 text-xs">Nochmal</button>` : ''}
            </div>
          </article>`;
          })
          .join('')}
      </div>
    </section>`;
}

function renderCachedOrderBanner(cached) {
  return `
    <div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
      <strong>Offline / API nicht erreichbar.</strong> Es werden die zuletzt auf diesem Gerät gespeicherten Daten angezeigt
      (${escapeHtml(formatOrderDate(cached.cachedAt || cached.updatedAt))}).
      ${cached.redemptions?.length ? ' Gespeicherte Gutschein-Codes sind unten sichtbar.' : ''}
    </div>`;
}

function renderCachedStatus(cached) {
  const redemptions = cached.redemptions || [];
  return `
    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card-static">
        <h2 class="font-display text-lg font-semibold">Gespeicherte Rechnung</h2>
        <div class="mt-4 space-y-3 text-sm">
          <div class="flex justify-between"><span class="text-content-muted">Status</span><span class="badge ${statusColor(cached.status)}">${formatStatus(cached.status)}</span></div>
          <div class="flex justify-between gap-4"><span class="text-content-muted shrink-0">Rechnungs-ID</span><span class="font-mono text-xs break-all text-right">${escapeHtml(cached.invoiceId)}</span></div>
          ${cached.orderId ? `<div class="flex justify-between gap-4"><span class="text-content-muted shrink-0">Bestell-ID</span><span class="font-mono text-xs break-all text-right">${escapeHtml(cached.orderId)}</span></div>` : ''}
          ${cached.total ? `<div class="flex justify-between"><span class="text-content-muted">Wert</span><span>${escapeHtml(cached.total)}</span></div>` : ''}
          ${cached.paymentMethod ? `<div class="flex justify-between"><span class="text-content-muted">Zahlung</span><span>${escapeHtml(cached.paymentMethod)}</span></div>` : ''}
        </div>
      </div>
      <div class="card-static">
        <h2 class="font-display text-lg font-semibold">Gespeicherte Gutscheine</h2>
        ${redemptions.length
          ? redemptions
              .map(
                (r) => `
            <div class="mt-4 border-t border-theme pt-4 first:mt-0 first:border-0 first:pt-0">
              <p class="mb-2 text-sm font-medium">${escapeHtml(r.name)}</p>
              ${renderRedemption(r.info, cached.status, 'delivered')}
            </div>`
              )
              .join('')
          : `<p class="mt-4 text-sm text-content-muted">Noch kein Code lokal gespeichert. Sobald die Verbindung wieder steht, bitte erneut abfragen.</p>`}
      </div>
    </div>`;
}

export async function renderOrderStatus(container, query) {
  let invoiceId = query.get('invoiceId');
  let orderId = query.get('orderId');

  const active = getActiveOrder();
  if (!invoiceId && active?.invoiceId) invoiceId = active.invoiceId;
  if (!orderId && active?.orderId) orderId = active.orderId;

  let history = getOrderHistory();

  function refreshHistory() {
    history = getOrderHistory();
    const section = document.getElementById('orders-history-section');
    if (section) section.innerHTML = renderHistorySection(history);
    bindHistoryButtons();
  }

  container.innerHTML = `
    <div class="page-container pb-20 lg:pb-8">
      ${renderCheckoutSteps(2)}
      <h1 class="section-title">Bestellstatus</h1>
      <p class="mt-2 text-content-muted">Deine Bestellungen werden auf diesem Gerät gespeichert – auch nach Schließen des Tabs oder Browsers.</p>

      <div class="legal-notice mt-4 max-w-3xl text-xs">
        <strong>Tipp:</strong> Notiere dir die Rechnungs-ID oder öffne diese Seite erneut. Deine Historie bleibt in diesem Browser gespeichert (localStorage), solange du die Browser-Daten nicht löschst.
      </div>

      <div id="orders-history-section">${renderHistorySection(history)}</div>

      <div class="mt-8 card max-w-xl">
        <label for="invoice-lookup" class="mb-2 block text-sm font-medium">Rechnungs-ID eingeben</label>
        <div class="flex gap-2">
          <input type="text" id="invoice-lookup" class="input-field font-mono text-sm"
                 placeholder="z. B. bd6b6018-d852-4930-b991-7b37e00ced0e" value="${escapeHtml(invoiceId || '')}" />
          <button type="button" id="lookup-btn" class="btn-primary shrink-0">Abfragen</button>
        </div>
      </div>

      <div id="status-content" class="mt-8">${invoiceId ? renderSpinner('Status wird geladen…') : ''}</div>
      <div id="order-receipt-slot"></div>
    </div>`;

  let pollTimer = null;
  let stopped = false;
  let pollCount = 0;
  const MAX_POLLS = 40;
  registerCleanup(() => {
    stopped = true;
    if (pollTimer) clearTimeout(pollTimer);
  });

  function bindCopyCode() {
    document.querySelectorAll('[data-copy-code]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const code = btn.dataset.copyCode;
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code);
          const prev = btn.textContent;
          btn.textContent = 'Kopiert!';
          setTimeout(() => {
            btn.textContent = prev;
          }, 2000);
        } catch {
          /* ignore */
        }
      });
    });
  }

  async function loadStatus(id, ordId, isPoll = false) {
    if (stopped) return;
    const content = document.getElementById('status-content');
    if (!isPoll) content.innerHTML = renderSpinner();

    const cachedBefore = getOrderByInvoiceId(id);
    await hydrateOrderFromVault(id);

    try {
      const { data: invoice, snapshot } = await api.getInvoice(id, cachedBefore?.accessToken);

      const orderResults = invoice.orders || [];

      saveOrderSnapshot({
        invoice,
        orderResults,
        productName: cachedBefore?.productName,
        total: cachedBefore?.total,
        items: cachedBefore?.items,
        paymentMethod: invoice.payment?.method || cachedBefore?.paymentMethod,
      });
      refreshHistory();

      const saved = getOrderByInvoiceId(id);
      const codesSaved = hasStoredRedemptions(saved?.redemptions);
      const primaryOrder = orderResults[0] || invoice.orders?.[0];
      const redemption = primaryOrder?.redemption_info || invoice.orders?.[0]?.redemption_info;
      const isDelivered =
        ['complete', 'all_delivered', 'delivered'].includes(invoice.status) ||
        orderResults.some((o) => o.status === 'delivered');

      const allRedemptions = orderResults
        .filter((o) => o.redemption_info)
        .map((o, i) => ({ info: o.redemption_info, name: o.product?.name || `Gutschein ${i + 1}` }));

      content.innerHTML = `
        <div class="grid gap-6 lg:grid-cols-2 fade-stagger">
          <div class="card animate-slide-up opacity-0">
            <h2 class="font-display text-lg font-semibold">Rechnungsstatus</h2>
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-content-muted">Status</span>
                <span class="badge ${statusColor(invoice.status)}">${formatStatus(invoice.status)}</span>
              </div>
              <div class="flex justify-between gap-4 text-sm"><span class="text-content-muted shrink-0">Rechnungs-ID</span><span class="font-mono text-xs break-all text-right">${escapeHtml(invoice.id)}</span></div>
              ${invoice.payment ? `
                <div class="flex justify-between text-sm"><span class="text-content-muted">Zahlungsmethode</span><span>${escapeHtml(invoice.payment.method)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-content-muted">Betrag</span><span>${escapeHtml(formatCryptoAmount(invoice.payment.price, invoice.payment.currency || ''))}</span></div>
              ` : ''}
              ${snapshot ? `<div class="flex justify-between text-sm"><span class="text-content-muted">Artikel</span><span>${invoice.orders?.length || snapshot.length || 1}</span></div>` : ''}
            </div>
            <p class="mt-4 text-xs text-content-muted">✓ Auf diesem Gerät gespeichert</p>
            ${codesSaved ? `
              <p class="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                🔒 Gutschein-Code dauerhaft auf diesem Gerät gesichert (bleibt auch nach Browser-Neustart)
              </p>` : ''}
            ${['pending', 'processing'].includes(invoice.status) ? `
              <p class="mt-4 text-sm text-amber-700 dark:text-amber-300 animate-pulse-soft">
                Warten auf Zahlung… Diese Seite aktualisiert sich automatisch.
              </p>` : ''}
            ${isDelivered ? `
              <div class="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Zahlung bestätigt – Gutschein bereit!
              </div>` : ''}
          </div>

          <div class="card animate-slide-up opacity-0">
            <h2 class="font-display text-lg font-semibold">Deine Gutscheine</h2>
            ${allRedemptions.length > 1
              ? allRedemptions
                  .map(
                    (r) => `<div class="mt-4 border-t border-theme pt-4 first:mt-0 first:border-0 first:pt-0"><p class="mb-2 text-sm font-medium">${escapeHtml(r.name)}</p>${renderRedemption(r.info, invoice.status, 'delivered')}</div>`
                  )
                  .join('')
              : renderRedemption(redemption, invoice.status, primaryOrder?.status)}
          </div>
        </div>`;

      bindCopyCode();

      const receiptSlot = document.getElementById('order-receipt-slot');
      const token = saved?.accessToken || cachedBefore?.accessToken;
      if (receiptSlot && token) {
        receiptSlot.innerHTML = renderOrderReceipt({
          invoiceId: id,
          accessToken: token,
          productName: saved?.productName || cachedBefore?.productName,
          total: saved?.total || cachedBefore?.total,
        });
        bindOrderReceipt({
          invoiceId: id,
          accessToken: token,
          productName: saved?.productName,
          total: saved?.total,
        });
      }

      const resolvedOrderId = ordId || invoice.orders?.[0]?.id;
      pollCount += 1;
      if (
        !stopped &&
        pollCount < MAX_POLLS &&
        !['complete', 'all_delivered', 'delivered', 'failed', 'refunded', 'denied'].includes(invoice.status) &&
        !orderResults.some((o) => o.status === 'delivered')
      ) {
        pollTimer = setTimeout(() => loadStatus(id, resolvedOrderId, true), 10000);
      }
    } catch (err) {
      if (cachedBefore) {
        content.innerHTML =
          renderCachedOrderBanner(cachedBefore) +
          `<p class="mb-4 text-sm text-content-muted">${escapeHtml(err.message)}</p>` +
          renderCachedStatus(cachedBefore);
        bindCopyCode();
      } else if (err.code === 'ORDER_ACCESS_DENIED') {
        content.innerHTML = `<div class="card border-amber-200 max-w-xl">
          <p class="text-amber-800 dark:text-amber-300">Kein Zugriff auf diese Rechnung.</p>
          <p class="mt-2 text-sm text-content-muted">Neue Bestellungen sind nur mit dem auf diesem Gerät gespeicherten Zugangstoken abrufbar. Bitte die Bestellung über deine lokale Historie öffnen oder vom gleichen Browser aus, in dem du bezahlt hast.</p>
        </div>`;
      } else {
        content.innerHTML = `<div class="card border-red-200 max-w-xl"><p class="text-red-600">${escapeHtml(err.message)}</p><p class="mt-2 text-sm text-content-muted">Falls du bereits bezahlt hast, speichere die Rechnungs-ID und versuche es später erneut.</p></div>`;
      }
    }
  }

  function bindHistoryButtons() {
    document.querySelectorAll('[data-history-id]').forEach((btn) => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('[data-buy-again]').forEach((btn) => {
      btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll('[data-history-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.historyId;
        document.getElementById('invoice-lookup').value = id;
        pollCount = 0;
        loadStatus(id);
        window.scrollTo({ top: document.getElementById('status-content').offsetTop - 80, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('[data-buy-again]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const order = getOrderHistory().find((o) => o.invoiceId === btn.dataset.buyAgain);
        if (!order?.items?.length) return;
        for (const it of order.items) {
          addToCart({
            productId: it.productId,
            name: it.name || it.productId,
            image: it.image || '',
            currency: it.currency || 'EUR',
            value: it.value,
            packageId: it.packageId,
            qty: it.quantity || it.qty || 1,
          });
        }
        showToast('Artikel erneut in den Warenkorb gelegt');
        window.dispatchEvent(new CustomEvent('Kryptogutscheine:open-cart'));
      });
    });
  }

  bindHistoryButtons();

  if (invoiceId) await loadStatus(invoiceId, orderId);

  // Server-weite Order-Liste ist admin-geschützt – Historie bleibt lokal im Browser
  document.getElementById('lookup-btn')?.addEventListener('click', () => {
    const id = document.getElementById('invoice-lookup')?.value.trim();
    if (id) {
      pollCount = 0;
      loadStatus(id);
    }
  });
}

function renderRedemption(redemption, invoiceStatus, orderStatus) {
  if ((orderStatus === 'delivered' || ['complete', 'all_delivered', 'delivered'].includes(invoiceStatus)) && redemption) {
    if (typeof redemption === 'string') {
      return `<div class="mt-4 rounded-xl bg-surface p-4"><p class="text-sm whitespace-pre-wrap">${escapeHtml(redemption)}</p></div>`;
    }

    const expiration = redemption.expiration_date
      ? new Date(redemption.expiration_date).toLocaleDateString('de-DE')
      : null;

    return `
      <div class="mt-4 space-y-4">
        ${redemption.code ? `
          <div class="rounded-xl bg-brand-50 p-5 dark:bg-brand-950/30">
            <p class="text-xs font-medium text-content-muted">Gutschein-Code</p>
            <p class="mt-2 font-mono text-2xl font-bold tracking-wider text-brand-700 dark:text-brand-300">${escapeHtml(redemption.code)}</p>
            <button type="button" data-copy-code="${escapeHtml(redemption.code)}" class="btn-primary mt-4 w-full">Code kopieren</button>
          </div>` : ''}
        ${redemption.pin ? `<p class="text-sm"><span class="text-content-muted">PIN:</span> <span class="font-mono font-semibold">${escapeHtml(redemption.pin)}</span></p>` : ''}
        ${redemption.link ? (() => {
          const href = safeUrl(redemption.link);
          return href ? `
          <div class="rounded-xl bg-brand-50 p-4 dark:bg-brand-950/30">
            <p class="text-xs font-medium text-content-muted">Einlöse-Link</p>
            <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="btn-primary mt-3 w-full justify-center">
              Gutschein öffnen
            </a>
          </div>` : '';
        })() : ''}
        ${expiration ? `<p class="text-sm"><span class="text-content-muted">Gültig bis:</span> ${escapeHtml(expiration)}</p>` : ''}
        ${redemption.instructions ? `<p class="text-sm text-content-muted whitespace-pre-wrap">${escapeHtml(redemption.instructions)}</p>` : ''}
      </div>`;
  }

  return `
    <div class="mt-4 flex flex-col items-center py-8 text-center text-content-muted">
      <svg class="mb-3 h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <p class="text-sm">Dein Gutschein-Code erscheint hier nach erfolgreicher Zahlung.</p>
    </div>`;
}
