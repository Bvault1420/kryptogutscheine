import { escapeHtml } from '../src/utils.js';

export function renderConfirmModal({ title, body, confirmLabel = 'Bestätigen', cancelLabel = 'Abbrechen' }) {
  return `
    <div id="confirm-modal" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-md rounded-2xl border border-theme bg-surface-elevated p-6 shadow-2xl">
        <h3 class="font-display text-lg font-semibold">${escapeHtml(title)}</h3>
        <div class="mt-3 text-sm text-content-muted">${body}</div>
        <div class="mt-6 flex gap-3">
          <button type="button" id="confirm-cancel" class="btn-secondary flex-1">${escapeHtml(cancelLabel)}</button>
          <button type="button" id="confirm-ok" class="btn-primary flex-1">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    </div>`;
}

export function showConfirmModal({ title, body, confirmLabel, cancelLabel }) {
  return new Promise((resolve) => {
    const existing = document.getElementById('confirm-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', renderConfirmModal({ title, body, confirmLabel, cancelLabel }));

    const close = (result) => {
      document.getElementById('confirm-modal')?.remove();
      resolve(result);
    };

    document.getElementById('confirm-ok')?.addEventListener('click', () => close(true));
    document.getElementById('confirm-cancel')?.addEventListener('click', () => close(false));
    document.getElementById('confirm-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'confirm-modal') close(false);
    });
  });
}

export function startPaymentTimer(containerId, seconds = 900) {
  const el = document.getElementById(containerId);
  if (!el) return () => {};

  let remaining = seconds;
  const tick = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    el.textContent = `Zahle innerhalb von ${m}:${String(s).padStart(2, '0')} Min.`;
    if (remaining <= 0) {
      el.textContent = 'Zahlungsfrist abgelaufen – bitte neue Rechnung erstellen.';
      el.classList.add('text-red-600');
      clearInterval(timer);
    }
    remaining--;
  };
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}
