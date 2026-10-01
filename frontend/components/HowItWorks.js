import { t } from '../src/i18n.js';

const STEPS = [
  { num: '1', titleKey: 'how.step1.title', textKey: 'how.step1.text' },
  { num: '2', titleKey: 'how.step2.title', textKey: 'how.step2.text' },
  { num: '3', titleKey: 'how.step3.title', textKey: 'how.step3.text' },
];

export function renderHowItWorks() {
  return `
    <section class="mb-10" aria-label="${t('aria.howItWorks')}">
      <h2 class="sr-only">${t('home.howItWorks')}</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        ${STEPS.map(
          (s) => `
          <div class="card-static flex gap-4 p-5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">${s.num}</span>
            <div>
              <h3 class="text-sm font-semibold text-content">${t(s.titleKey)}</h3>
              <p class="mt-1 text-xs leading-relaxed text-content-muted">${t(s.textKey)}</p>
            </div>
          </div>`
        ).join('')}
      </div>
    </section>`;
}
