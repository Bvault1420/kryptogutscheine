import QRCode from 'qrcode';
import { escapeHtml, formatCryptoAmount } from '../src/utils.js';
import { getPaymentMethod } from '../src/paymentMethods.js';

export async function renderQrCode(container, data, options = {}) {
  if (!container || !data) return;

  const canvas = document.createElement('canvas');
  canvas.className = options.className || 'mx-auto rounded-xl border border-theme bg-white p-3';
  canvas.setAttribute('aria-label', options.ariaLabel || 'QR-Code für Krypto-Zahlung');

  try {
    await QRCode.toCanvas(canvas, data, {
      width: options.size || 240,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
    container.innerHTML = '';
    container.appendChild(canvas);
  } catch {
    container.innerHTML = '<p class="text-sm text-red-600">QR-Code konnte nicht generiert werden.</p>';
  }
}

export function renderCryptoPayment({ method, address, amount, currency, giftLabel }) {
  const meta = getPaymentMethod(method);
  const safeAddress = address || '';
  const amountLabel = formatCryptoAmount(amount, currency);

  return `
    <div class="card text-center">
      <h3 class="font-display text-lg font-semibold">${escapeHtml(meta.label)}</h3>
      <p class="mt-1 text-xs text-content-muted">${escapeHtml(meta.description)}</p>
      ${giftLabel ? `<p class="mt-3 text-sm text-content-muted">Gutscheinwert: <span class="font-medium text-content">${escapeHtml(giftLabel)}</span></p>` : ''}
      ${amountLabel ? `
        <p class="mt-3 text-sm text-content-muted">Krypto-Betrag (exakt senden):</p>
        <p class="text-2xl font-bold text-brand-600">${escapeHtml(amountLabel)}</p>
      ` : ''}
      <div id="qr-container" class="mt-6 flex justify-center"></div>
      <div class="mt-6">
        <label class="mb-2 block text-left text-xs font-medium text-content-muted">${escapeHtml(meta.addressLabel)}</label>
        <div class="flex gap-2">
          <input type="text" readonly value="${safeAddress.replace(/"/g, '&quot;')}" id="crypto-address-input"
                 class="input-field font-mono text-xs" />
          <button type="button" id="copy-address-btn" class="btn-secondary shrink-0">Kopieren</button>
        </div>
      </div>
      <p class="mt-4 text-left text-xs text-content-muted">${escapeHtml(meta.hint)}</p>
      <p class="mt-2 text-left text-xs text-amber-700 dark:text-amber-300">
        Senden Sie exakt den angezeigten Betrag. Abweichungen können zu Verzögerungen oder Verlust führen.
      </p>
    </div>`;
}

export function bindCryptoPayment({ method, address }) {
  const container = document.getElementById('qr-container');
  const meta = getPaymentMethod(method);

  if (container && address) {
    renderQrCode(container, address, {
      ariaLabel: `QR-Code für ${meta.label}`,
    });
  }

  document.getElementById('copy-address-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('crypto-address-input');
    if (!input) return;
    try {
      await navigator.clipboard.writeText(input.value);
      const btn = document.getElementById('copy-address-btn');
      if (btn) {
        btn.textContent = 'Kopiert!';
        setTimeout(() => { btn.textContent = 'Kopieren'; }, 2000);
      }
    } catch {
      input.select();
      document.execCommand('copy');
    }
  });
}

/** @deprecated Use renderCryptoPayment */
export function renderLightningPayment(opts) {
  return renderCryptoPayment({ ...opts, method: 'lightning' });
}

/** @deprecated Use bindCryptoPayment */
export function bindLightningPayment(invoice) {
  bindCryptoPayment({ method: 'lightning', address: invoice });
}
