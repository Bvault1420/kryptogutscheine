import { escapeHtml, formatCurrency } from '../src/utils.js';
import { estimateCryptoAmount } from '../src/cryptoEstimate.js';
import { getPaymentMethod } from '../src/paymentMethods.js';
import { t } from '../src/i18n.js';

/**
 * Transparente Preisübersicht vor dem Kauf (Feature #7).
 */
export function renderPriceBreakdown({ fiatTotal, currency, paymentMethod, lines = [] }) {
  if (!Number.isFinite(fiatTotal) || fiatTotal <= 0) return '';

  const meta = getPaymentMethod(paymentMethod);
  const est = estimateCryptoAmount(fiatTotal, currency, paymentMethod);

  const extraLines = lines
    .map(
      (l) => `
      <div class="flex justify-between gap-4 text-sm">
        <dt class="text-content-muted">${escapeHtml(l.label)}</dt>
        <dd class="font-medium text-right">${escapeHtml(l.value)}</dd>
      </div>`
    )
    .join('');

  return `
    <div class="mt-4 rounded-lg border border-theme bg-surface p-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-content-muted">${t('price.title')}</h3>
      <dl class="mt-3 space-y-2">
        ${extraLines}
        <div class="flex justify-between gap-4 border-t border-theme pt-2 text-sm">
          <dt class="text-content-muted">${t('price.voucherValue')}</dt>
          <dd class="font-semibold">${escapeHtml(formatCurrency(fiatTotal, currency))}</dd>
        </div>
        ${
          est
            ? `<div class="flex justify-between gap-4 text-sm">
                <dt class="text-content-muted">${t('price.estimatedCrypto')}</dt>
                <dd class="font-mono text-sm">≈ ${escapeHtml(est.amount)} ${escapeHtml(est.symbol)}</dd>
              </div>`
            : ''
        }
        <div class="flex justify-between gap-4 text-sm">
          <dt class="text-content-muted">${t('price.paymentMethod')}</dt>
          <dd>${escapeHtml(meta.label)}</dd>
        </div>
        <div class="flex justify-between gap-4 text-sm">
          <dt class="text-content-muted">${t('price.recipient')}</dt>
          <dd class="font-medium text-brand-700 dark:text-brand-300">${t('price.recipientValue')}</dd>
        </div>
        <div class="flex justify-between gap-4 text-sm">
          <dt class="text-content-muted">${t('price.KryptogutscheineFee')}</dt>
          <dd>${t('price.noFee')}</dd>
        </div>
      </dl>
      <p class="mt-3 text-xs leading-relaxed text-content-muted">${t('price.disclaimer')}</p>
      <p class="mt-1 text-xs leading-relaxed text-content-muted">${t('price.networkFees')}</p>
    </div>`;
}
