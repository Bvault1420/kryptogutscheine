import { t } from '../src/i18n.js';

const TRUST_ITEMS = [
  {
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
    titleKey: 'trust.noCustody.title',
    textKey: 'trust.noCustody.text',
  },
  {
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`,
    titleKey: 'trust.privacy.title',
    textKey: 'trust.privacy.text',
  },
  {
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    titleKey: 'trust.legal.title',
    textKey: 'trust.legal.text',
  },
  {
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`,
    titleKey: 'trust.delivery.title',
    textKey: 'trust.delivery.text',
  },
];

export function renderTrustSection() {
  return `
    <section class="mt-12 border-t border-theme pt-10" aria-label="${t('aria.trust')}">
      <h2 class="mb-6 text-center text-sm font-semibold uppercase tracking-[0.18em] text-content-muted">${t('trust.title')}</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        ${TRUST_ITEMS.map(
          (item) => `
          <div class="card-static flex items-start gap-3 rounded-2xl p-5">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              ${item.icon}
            </div>
            <div>
              <h3 class="text-sm font-semibold text-content">${t(item.titleKey)}</h3>
              <p class="mt-1 text-sm leading-relaxed text-content-muted">${t(item.textKey)}</p>
            </div>
          </div>`
        ).join('')}
      </div>
    </section>`;
}

export function renderPartnerBar() {
  return `
    <div class="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-theme pt-8 text-xs text-content-muted">
      <span class="font-medium">${t('trust.partner')}</span>
      <a href="https://www.bitrefill.com" target="_blank" rel="noopener noreferrer" class="font-semibold text-content transition hover:text-brand-600">Bitrefill</a>
      <span class="hidden sm:inline text-content-muted/50">|</span>
      <span>${t('trust.crypto')}</span>
    </div>`;
}
