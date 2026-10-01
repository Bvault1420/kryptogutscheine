import { escapeHtml } from '../src/utils.js';

/** Rechnungs-Beleg zum Speichern (Invoice-ID + Zugangstoken). */
export function renderOrderReceipt({ invoiceId, accessToken, productName, total }) {
  if (!invoiceId || !accessToken) return '';

  return `
    <section class="mt-6 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-950/20">
      <h3 class="font-display text-sm font-semibold text-brand-800 dark:text-brand-200">
        Beleg sichern – wichtig!
      </h3>
      <p class="mt-1 text-xs text-content-muted">
        Speichere Rechnungs-ID und Zugangstoken. Ohne Token kannst du die Bestellung später nicht wieder abrufen.
      </p>
      <dl class="mt-3 space-y-2 text-xs">
        <div>
          <dt class="text-content-muted">Rechnungs-ID</dt>
          <dd class="mt-0.5 font-mono break-all">${escapeHtml(invoiceId)}</dd>
        </div>
        <div>
          <dt class="text-content-muted">Zugangstoken</dt>
          <dd class="mt-0.5 font-mono break-all">${escapeHtml(accessToken)}</dd>
        </div>
        ${productName ? `<div><dt class="text-content-muted">Produkt</dt><dd class="mt-0.5">${escapeHtml(productName)}</dd></div>` : ''}
        ${total ? `<div><dt class="text-content-muted">Wert</dt><dd class="mt-0.5">${escapeHtml(total)}</dd></div>` : ''}
      </dl>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" id="receipt-copy-id" class="btn-secondary px-3 py-1.5 text-xs">ID kopieren</button>
        <button type="button" id="receipt-copy-token" class="btn-secondary px-3 py-1.5 text-xs">Token kopieren</button>
        <button type="button" id="receipt-download" class="btn-primary px-3 py-1.5 text-xs">Beleg herunterladen</button>
      </div>
    </section>`;
}

export function bindOrderReceipt({ invoiceId, accessToken, productName, total }) {
  const receipt = {
    service: 'Kryptogutscheine',
    invoiceId,
    accessToken,
    productName: productName || null,
    total: total || null,
    savedAt: new Date().toISOString(),
  };

  document.getElementById('receipt-copy-id')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(invoiceId);
    } catch {
      /* ignore */
    }
  });

  document.getElementById('receipt-copy-token')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(accessToken);
    } catch {
      /* ignore */
    }
  });

  document.getElementById('receipt-download')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kryptogutscheine-beleg-${invoiceId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
