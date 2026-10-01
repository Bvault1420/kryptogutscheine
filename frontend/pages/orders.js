import { escapeHtml, formatStatus, statusColor, showToast } from '../src/utils.js';
import { t, getLocale } from '../src/i18n.js';
import {
  getOrderHistory,
  clearOrderHistory,
  exportOrderHistoryJSON,
  exportOrderHistoryCSV,
} from '../src/userData.js';
import { addToCart } from '../src/cart.js';
import { navigate, registerCleanup } from '../src/router.js';
import { showConfirmModal } from '../components/ConfirmModal.js';

function formatOrderDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(getLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function renderTable(history) {
  if (!history.length) {
    return `
      <div class="card-static py-12 text-center">
        <p class="font-medium text-content">${t('orders.empty')}</p>
        <p class="mt-2 text-sm text-content-muted">${t('orders.emptyHint')}</p>
        <a href="#/shop" data-nav="/shop" class="btn-primary mt-6 inline-flex">${t('common.toShop')}</a>
      </div>`;
  }

  return `
    <div class="card-static overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="border-b border-theme bg-surface text-xs uppercase tracking-wide text-content-muted">
            <tr>
              <th class="px-4 py-3 font-medium">${t('orders.col.date')}</th>
              <th class="px-4 py-3 font-medium">${t('orders.col.product')}</th>
              <th class="px-4 py-3 font-medium">${t('orders.col.status')}</th>
              <th class="px-4 py-3 font-medium">${t('orders.col.total')}</th>
              <th class="px-4 py-3 font-medium">${t('orders.col.invoice')}</th>
              <th class="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[color:var(--border)]">
            ${history
              .map((o) => {
                const hasCodes = o.redemptions?.some((r) => r.info?.code || r.info?.link);
                return `
              <tr class="hover:bg-surface/80">
                <td class="px-4 py-3 whitespace-nowrap text-content-muted">${escapeHtml(formatOrderDate(o.updatedAt || o.createdAt))}</td>
                <td class="px-4 py-3">
                  <p class="font-medium">${escapeHtml(o.productName || '—')}</p>
                  ${hasCodes ? `<span class="text-xs text-emerald-600 dark:text-emerald-400">${t('orders.codeSaved')}</span>` : ''}
                </td>
                <td class="px-4 py-3"><span class="badge ${statusColor(o.status)}">${formatStatus(o.status)}</span></td>
                <td class="px-4 py-3 font-medium">${escapeHtml(o.total || '—')}</td>
                <td class="px-4 py-3 font-mono text-xs text-content-muted break-all max-w-[180px]">${escapeHtml(o.invoiceId)}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex gap-2">
                    <button type="button" data-open="${escapeHtml(o.invoiceId)}" class="btn-primary px-3 py-1.5 text-xs">${t('orders.open')}</button>
                    ${o.items?.length ? `<button type="button" data-buy="${escapeHtml(o.invoiceId)}" class="btn-secondary px-3 py-1.5 text-xs">${t('orders.buyAgain')}</button>` : ''}
                  </div>
                </td>
              </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

export async function renderOrders(container) {
  let history = getOrderHistory();

  function render() {
    history = getOrderHistory();
    container.innerHTML = `
      <div class="page-container pb-20 lg:pb-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="section-title">${t('orders.title')}</h1>
            <p class="mt-2 text-content-muted">${t('orders.subtitle')}</p>
            ${history.length ? `<p class="mt-1 text-sm text-content-muted">${t('orders.count', { count: history.length })}</p>` : ''}
          </div>
          ${
            history.length
              ? `<div class="flex flex-wrap gap-2">
                  <button type="button" id="export-json" class="btn-secondary text-sm">${t('orders.exportJson')}</button>
                  <button type="button" id="export-csv" class="btn-secondary text-sm">${t('orders.exportCsv')}</button>
                  <button type="button" id="clear-history" class="btn-secondary text-sm text-red-600 hover:border-red-300">${t('orders.clear')}</button>
                </div>`
              : ''
          }
        </div>

        <div class="legal-notice mt-6 text-xs">
          ${getLocale() === 'en-GB'
            ? 'Orders are stored locally in your browser (localStorage). Export regularly as backup. Clearing browser data removes this history.'
            : 'Bestellungen werden lokal im Browser gespeichert (localStorage). Exportiere regelmäßig als Backup. Browser-Daten löschen entfernt diese Historie.'}
        </div>

        <div id="orders-table" class="mt-8">${renderTable(history)}</div>
      </div>`;

    bindEvents();
  }

  function bindEvents() {
    document.getElementById('export-json')?.addEventListener('click', () => {
      exportOrderHistoryJSON();
      showToast(t('orders.exported'));
    });

    document.getElementById('export-csv')?.addEventListener('click', () => {
      exportOrderHistoryCSV();
      showToast(t('orders.exported'));
    });

    document.getElementById('clear-history')?.addEventListener('click', async () => {
      const ok = await showConfirmModal({
        title: t('orders.clear'),
        body: `<p>${t('orders.clearConfirm')}</p>`,
        confirmLabel: t('orders.clear'),
      });
      if (ok) {
        clearOrderHistory();
        showToast(t('orders.cleared'));
        render();
      }
    });

    container.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.open;
        const order = history.find((o) => o.invoiceId === id);
        const q = order?.orderId ? `?invoiceId=${encodeURIComponent(id)}&orderId=${encodeURIComponent(order.orderId)}` : `?invoiceId=${encodeURIComponent(id)}`;
        navigate(`/order-status${q}`);
      });
    });

    container.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const order = history.find((o) => o.invoiceId === btn.dataset.buy);
        if (!order?.items?.length) return;
        for (const it of order.items) addToCart(it);
        navigate('/cart');
      });
    });
  }

  render();

  const onOrdersChange = () => render();
  window.addEventListener('Kryptogutscheine:orders-change', onOrdersChange);
  registerCleanup(() => window.removeEventListener('Kryptogutscheine:orders-change', onOrdersChange));
}
