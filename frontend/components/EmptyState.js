import { escapeHtml } from '../src/utils.js';

export function renderEmptyState({ icon, title, text, ctaLabel, ctaPath }) {
  return `
    <div class="card flex flex-col items-center py-16 text-center">
      <div class="mb-4 text-content-muted opacity-40">${icon}</div>
      <p class="text-lg font-semibold">${escapeHtml(title)}</p>
      <p class="mt-2 max-w-sm text-content-muted">${escapeHtml(text)}</p>
      ${ctaLabel && ctaPath ? `<a href="#${ctaPath}" data-nav="${ctaPath}" class="btn-primary mt-6">${escapeHtml(ctaLabel)}</a>` : ''}
    </div>`;
}

export const EMPTY_ICONS = {
  cart: `<svg class="mx-auto h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
  heart: `<svg class="mx-auto h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`,
  search: `<svg class="mx-auto h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
  gift: `<svg class="mx-auto h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>`,
};
