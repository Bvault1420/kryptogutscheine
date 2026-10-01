import { escapeHtml } from '../src/utils.js';
import { navigate } from '../src/router.js';
import { api } from '../src/api.js';
import { getCountry } from '../src/country.js';
import { addRecentSearch, getRecentSearches } from '../src/search.js';
import { t } from '../src/i18n.js';

let debounceTimer = null;

export function renderSearchBar({ id = 'global-search', value = '', compact = false } = {}) {
  const cls = compact ? 'input-field py-2.5 text-sm' : 'input-field';
  return `
    <form id="${id}-form" class="relative flex-1 max-w-xl" role="search">
      <svg class="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input type="search" id="${id}" placeholder="${t('search.placeholder')}" value="${escapeHtml(value)}"
        class="${cls} pl-11" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="${id}-suggestions" />
      <div id="${id}-suggestions" class="absolute left-0 right-0 top-full z-50 mt-2 hidden max-h-72 overflow-y-auto rounded-2xl border border-theme bg-surface-elevated shadow-lg" role="listbox"></div>
    </form>`;
}

function renderSuggestions(id, items, recent) {
  const el = document.getElementById(`${id}-suggestions`);
  if (!el) return;

  const parts = [];
  if (recent?.length) {
    parts.push(`<p class="px-3 pt-2 text-xs font-medium text-content-muted">${t('search.recent')}</p>`);
    recent.slice(0, 4).forEach((term) => {
      parts.push(`<button type="button" data-suggest-term="${escapeHtml(term)}" class="flex w-full px-3 py-2.5 text-left text-sm transition hover:bg-surface">${escapeHtml(term)}</button>`);
    });
  }
  if (items?.length) {
    parts.push(`<p class="px-3 pt-2 text-xs font-medium text-content-muted">Vorschläge</p>`);
    items.forEach((p) => {
      parts.push(`
        <button type="button" data-suggest-id="${escapeHtml(p.id)}" class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-surface">
          ${p.image ? `<img src="${escapeHtml(p.image)}" alt="" class="h-8 w-8 rounded object-contain" />` : ''}
          <span>${escapeHtml(p.name)}</span>
        </button>`);
    });
  }

  if (!parts.length) {
    el.classList.add('hidden');
    return;
  }
  el.innerHTML = parts.join('');
  el.classList.remove('hidden');
}

function hideSuggestions(id) {
  document.getElementById(`${id}-suggestions`)?.classList.add('hidden');
}

function goSearch(q) {
  addRecentSearch(q);
  navigate(`/shop?q=${encodeURIComponent(q)}`);
}

export function bindSearchBar({ id = 'global-search' } = {}) {
  const input = document.getElementById(id);
  const form = document.getElementById(`${id}-form`);
  if (!input || !form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    hideSuggestions(id);
    if (q) goSearch(q);
    else navigate('/shop');
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      renderSuggestions(id, [], getRecentSearches());
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const { data } = await api.suggestProducts(q, getCountry());
        renderSuggestions(id, data, []);
      } catch {
        hideSuggestions(id);
      }
    }, 250);
  });

  input.addEventListener('focus', () => {
    const q = input.value.trim();
    if (q.length < 2) renderSuggestions(id, [], getRecentSearches());
  });

  form.addEventListener('click', (e) => {
    const termBtn = e.target.closest('[data-suggest-term]');
    if (termBtn) {
      e.preventDefault();
      input.value = termBtn.dataset.suggestTerm;
      goSearch(termBtn.dataset.suggestTerm);
      return;
    }
    const idBtn = e.target.closest('[data-suggest-id]');
    if (idBtn) {
      e.preventDefault();
      hideSuggestions(id);
      navigate(`/product?id=${encodeURIComponent(idBtn.dataset.suggestId)}`);
    }
  });

  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) hideSuggestions(id);
  });
}
