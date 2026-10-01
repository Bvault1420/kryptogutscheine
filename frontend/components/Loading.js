import { escapeHtml } from '../src/utils.js';

/** Zentrale Lade-UI – immer von hier importieren, nicht aus ProductCard. */
export function renderSpinner(label = 'Lädt…') {
  return `
    <div class="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-live="polite">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      <p class="text-sm text-content-muted">${escapeHtml(label)}</p>
    </div>`;
}

export function renderLoadingGrid(count = 6) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="card skeleton-card overflow-hidden p-0">
        <div class="aspect-[16/10] skeleton-shimmer"></div>
        <div class="space-y-3 p-5">
          <div class="skeleton-shimmer h-3 w-1/3 rounded"></div>
          <div class="skeleton-shimmer h-5 w-2/3 rounded"></div>
          <div class="skeleton-shimmer h-10 w-full rounded-xl"></div>
        </div>
      </div>`
    )
    .join('');
}

export function renderInlineSpinner() {
  return '<div class="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" role="status" aria-label="Lädt"></div>';
}
