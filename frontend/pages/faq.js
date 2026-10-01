import { t } from '../src/i18n.js';

const FAQ_ITEMS = [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
  { q: 'faq.q4', a: 'faq.a4' },
  { q: 'faq.q5', a: 'faq.a5' },
  { q: 'faq.q6', a: 'faq.a6' },
];

export async function renderFaq(container) {
  container.innerHTML = `
    <div class="page-container max-w-3xl">
      <h1 class="section-title">${t('faq.title')}</h1>
      <p class="mt-4 text-content-muted">${t('faq.subtitle')}</p>

      <div class="mt-10 space-y-4 fade-stagger">
        ${FAQ_ITEMS.map((item) => faqItem(t(item.q), t(item.a))).join('')}
      </div>

      <p class="mt-10 text-xs text-content-muted">
        ${t('faq.legal')}
        <a href="#/agb" data-nav="/agb" class="text-brand-600 hover:underline">${t('nav.agb')}</a>,
        <a href="#/datenschutz" data-nav="/datenschutz" class="text-brand-600 hover:underline">${t('nav.privacy')}</a>,
        <a href="#/widerruf" data-nav="/widerruf" class="text-brand-600 hover:underline">${t('nav.widerruf')}</a>.
      </p>
    </div>`;

  container.querySelectorAll('[data-faq-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.nextElementSibling;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      panel.classList.toggle('hidden', expanded);
      btn.querySelector('[data-chevron]')?.classList.toggle('rotate-180', !expanded);
    });
  });
}

function faqItem(question, answer) {
  return `
    <div class="card animate-slide-up opacity-0 overflow-hidden p-0">
      <button type="button" data-faq-toggle class="flex w-full items-center justify-between px-6 py-4 text-left font-semibold transition hover:bg-surface" aria-expanded="false">
        <span>${question}</span>
        <svg data-chevron class="h-5 w-5 shrink-0 text-content-muted transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="hidden border-t border-theme px-6 py-4 text-sm text-content-muted">${answer}</div>
    </div>`;
}
