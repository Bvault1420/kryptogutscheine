import { t, getLang } from '../src/i18n.js';
import { canStartNewPayment } from '../src/orderPayments.js';
import { getOrderHistory } from '../src/userData.js';

export function renderCheckoutLegalCheckboxes() {
  const isEn = getLang() === 'en';
  const agbLink = `<a href="#/agb" data-nav="/agb" class="font-medium text-brand-600 hover:underline dark:text-brand-400">${isEn ? 'Terms of Service' : 'AGB'}</a>`;
  const privacyLink = `<a href="#/datenschutz" data-nav="/datenschutz" class="font-medium text-brand-600 hover:underline dark:text-brand-400">${isEn ? 'Privacy Policy' : 'Datenschutzerklärung'}</a>`;
  const widerrufLink = isEn
    ? ''
    : ` (<a href="#/widerruf" data-nav="/widerruf" class="font-medium text-brand-600 hover:underline dark:text-brand-400">Widerrufsbelehrung</a>)`;

  return `
    <div class="mt-4 space-y-3 rounded-xl border border-theme bg-surface p-4 text-xs leading-relaxed text-content-muted">
      <label class="flex cursor-pointer gap-2">
        <input type="checkbox" id="legal-agb" class="mt-0.5 shrink-0 rounded border-theme text-brand-600 focus:ring-brand-500" />
        <span>
          ${
            isEn
              ? `I accept the ${agbLink} and ${privacyLink}.`
              : `Ich akzeptiere die ${agbLink} und die ${privacyLink}.`
          }
        </span>
      </label>
      <label class="flex cursor-pointer gap-2">
        <input type="checkbox" id="legal-widerruf" class="mt-0.5 shrink-0 rounded border-theme text-brand-600 focus:ring-brand-500" />
        <span>${t('legal.widerruf')}${widerrufLink}.</span>
      </label>
      <label class="flex cursor-pointer gap-2">
        <input type="checkbox" id="legal-crypto" class="mt-0.5 shrink-0 rounded border-theme text-brand-600 focus:ring-brand-500" />
        <span>${t('legal.crypto')}</span>
      </label>
    </div>`;
}

const LEGAL_IDS = ['legal-agb', 'legal-widerruf', 'legal-crypto'];

export function isCheckoutLegalAccepted() {
  return LEGAL_IDS.every((id) => document.getElementById(id)?.checked);
}

export function bindCheckoutLegalToggle(onChange) {
  LEGAL_IDS.forEach((id) => {
    document.getElementById(id)?.addEventListener('change', onChange);
  });
}

export function updateCheckoutButtonState() {
  const btn = document.getElementById('checkout-btn') || document.getElementById('create-invoice-btn');
  if (!btn) return;
  const ok = isCheckoutLegalAccepted() && canStartNewPayment(getOrderHistory());
  btn.disabled = !ok;
  btn.classList.toggle('opacity-50', !ok);
  btn.classList.toggle('cursor-not-allowed', !ok);
}
