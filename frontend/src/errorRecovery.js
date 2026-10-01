import { escapeHtml } from './utils.js';
import { t } from './i18n.js';

const MAX_ROUTE_RETRIES = 3;
let routeRetryCount = 0;
let lastFailedPath = '';

export function resetRouteRetries() {
  routeRetryCount = 0;
  lastFailedPath = '';
}

export function isRecoverableLoadError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  const name = String(err?.name || '');

  return (
    name === 'ReferenceError' ||
    name === 'TypeError' ||
    err?.name === 'ChunkLoadError' ||
    msg.includes('is not defined') ||
    msg.includes('is not a function') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('importing a module script failed') ||
    msg.includes('renderspinner')
  );
}

export function shouldAutoRetryRoute(path, err) {
  if (path !== lastFailedPath) {
    lastFailedPath = path;
    routeRetryCount = 0;
  }
  if (routeRetryCount >= MAX_ROUTE_RETRIES) return false;
  return isRecoverableLoadError(err);
}

export function recordRouteRetry() {
  routeRetryCount += 1;
}

export function renderPageError(err, { onRetry, onHome } = {}) {
  const message = escapeHtml(err?.message || t('error.unknown'));
  const retryId = 'page-error-retry';
  const homeId = 'page-error-home';

  queueMicrotask(() => {
    document.getElementById(retryId)?.addEventListener('click', () => onRetry?.());
    document.getElementById(homeId)?.addEventListener('click', () => onHome?.());
  });

  return `
    <div class="page-container">
      <div class="card border-red-200 dark:border-red-900">
        <h2 class="text-lg font-semibold text-red-700 dark:text-red-400">${t('error.loadTitle')}</h2>
        <p class="mt-2 text-content-muted">${message}</p>
        <p class="mt-2 text-xs text-content-muted">${t('error.autoFix')}</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button type="button" id="${retryId}" class="btn-primary">${t('error.retry')}</button>
          <button type="button" id="${homeId}" class="btn-secondary">${t('error.home')}</button>
        </div>
      </div>
    </div>`;
}

/** Unerwartete Laufzeitfehler → Seite neu laden (gedrosselt). */
export function initGlobalErrorRecovery(reloadFn) {
  let lastAutoReload = 0;

  function tryRecover(source) {
    const now = Date.now();
    if (now - lastAutoReload < 30_000) return;
    lastAutoReload = now;
    console.warn('[Kryptogutscheine] Auto-Recovery:', source);
    reloadFn?.();
  }

  window.addEventListener('error', (event) => {
    if (!isRecoverableLoadError(event.error || { message: event.message })) return;
    event.preventDefault();
    tryRecover(event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!isRecoverableLoadError(event.reason)) return;
    event.preventDefault();
    tryRecover(String(event.reason?.message || event.reason));
  });
}
