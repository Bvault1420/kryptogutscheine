import { COUNTRIES, getCountryName } from '../src/country.js';
import { escapeHtml } from '../src/utils.js';
import { t } from '../src/i18n.js';

function countryFlag(code) {
  if (code === 'XI') return '🌍';
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '🏳️';
  const base = 127397;
  return String.fromCodePoint(...[...upper].map((c) => base + c.charCodeAt(0)));
}

export function renderCountrySelect({ id, selected, compact = false, className = '' }) {
  const current = COUNTRIES.find((c) => c.code === selected) || COUNTRIES[0];
  const minW = compact ? 'min-w-[130px]' : 'min-w-[160px]';

  return `
    <div class="country-select relative ${minW} ${className}" data-country-select="${escapeHtml(id)}">
      <button type="button"
              class="country-select-trigger flex w-full items-center gap-2 rounded-xl border border-theme bg-surface px-3 py-2 text-sm transition hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              aria-haspopup="listbox" aria-expanded="false" aria-label="${t('aria.country')}">
        <span class="text-lg leading-none" aria-hidden="true">${countryFlag(current.code)}</span>
        <span class="flex-1 truncate text-left font-medium">${escapeHtml(getCountryName(current.code))}</span>
        <svg class="h-4 w-4 shrink-0 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <input type="hidden" id="${escapeHtml(id)}" value="${escapeHtml(selected)}" />
      <ul class="country-select-menu absolute z-50 mt-1 hidden max-h-72 w-full min-w-[200px] overflow-auto rounded-xl border border-theme bg-surface-elevated py-1 shadow-xl"
          role="listbox">
        ${COUNTRIES.map(
          (c) => `
          <li role="option" aria-selected="${c.code === selected}"
              data-country-code="${escapeHtml(c.code)}"
              class="country-select-option flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition hover:bg-brand-50 dark:hover:bg-brand-950/30 ${c.code === selected ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : ''}">
            <span class="text-lg leading-none">${countryFlag(c.code)}</span>
            <span>${escapeHtml(getCountryName(c.code))}</span>
          </li>`
        ).join('')}
      </ul>
    </div>`;
}

export function bindCountrySelect(id, onChange) {
  const root = document.querySelector(`[data-country-select="${id}"]`);
  if (!root) return;

  const trigger = root.querySelector('.country-select-trigger');
  const menu = root.querySelector('.country-select-menu');
  const hidden = document.getElementById(id);

  function close() {
    menu?.classList.add('hidden');
    trigger?.setAttribute('aria-expanded', 'false');
  }

  function open() {
    document.querySelectorAll('.country-select-menu').forEach((m) => m.classList.add('hidden'));
    menu?.classList.remove('hidden');
    trigger?.setAttribute('aria-expanded', 'true');
  }

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu?.classList.contains('hidden')) open();
    else close();
  });

  menu?.querySelectorAll('.country-select-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const code = opt.dataset.countryCode;
      if (hidden) hidden.value = code;
      const flag = opt.querySelector('span')?.textContent;
      const name = getCountryName(code);
      if (trigger) {
        trigger.innerHTML = `
          <span class="text-lg leading-none">${flag || countryFlag(code)}</span>
          <span class="flex-1 truncate text-left font-medium">${escapeHtml(name)}</span>
          <svg class="h-4 w-4 shrink-0 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>`;
      }
      menu.querySelectorAll('.country-select-option').forEach((o) => {
        o.classList.toggle('bg-brand-50', o.dataset.countryCode === code);
        o.classList.toggle('font-semibold', o.dataset.countryCode === code);
        o.setAttribute('aria-selected', o.dataset.countryCode === code ? 'true' : 'false');
      });
      close();
      onChange?.(code);
    });
  });

  document.addEventListener('click', close);
}
