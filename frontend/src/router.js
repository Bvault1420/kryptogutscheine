import { renderHeader, bindHeaderEvents } from '../components/Header.js';
import { renderFooter } from '../components/Footer.js';
import { renderMobileNav, bindMobileNav } from '../components/MobileNav.js';
import { renderSiteBanners } from '../components/SiteBanner.js';
import { initCartDrawer } from '../components/CartDrawer.js';
import { setPageMeta } from './meta.js';
import { toggleFavorite } from './userData.js';
import { showToast } from './utils.js';
import { renderPaymentResumeBanner, updatePaymentResumeBanner } from './paymentRecovery.js';
import { renderInlineSpinner } from '../components/Loading.js';
import { t } from './i18n.js';
import {
  renderPageError,
  shouldAutoRetryRoute,
  recordRouteRetry,
  resetRouteRetries,
} from './errorRecovery.js';

const routes = [
  { path: '/', loader: () => import('../pages/home.js'), render: 'renderHome' },
  { path: '/shop', loader: () => import('../pages/shop.js'), render: 'renderShop' },
  { path: '/favorites', loader: () => import('../pages/favorites.js'), render: 'renderFavorites' },
  { path: '/product', loader: () => import('../pages/product.js'), render: 'renderProduct' },
  { path: '/checkout', loader: () => import('../pages/checkout.js'), render: 'renderCheckout' },
  { path: '/cart', loader: () => import('../pages/cart.js'), render: 'renderCart' },
  { path: '/payment', loader: () => import('../pages/payment.js'), render: 'renderPayment' },
  { path: '/orders', loader: () => import('../pages/orders.js'), render: 'renderOrders' },
  { path: '/order-status', loader: () => import('../pages/orderStatus.js'), render: 'renderOrderStatus' },
  { path: '/faq', loader: () => import('../pages/faq.js'), render: 'renderFaq' },
  { path: '/impressum', loader: () => import('../pages/impressum.js'), render: 'renderImpressum' },
  { path: '/datenschutz', loader: () => import('../pages/datenschutz.js'), render: 'renderDatenschutz' },
  { path: '/agb', loader: () => import('../pages/agb.js'), render: 'renderAgb' },
  { path: '/widerruf', loader: () => import('../pages/widerruf.js'), render: 'renderWiderruf' },
  { path: '/newsletter-confirm', loader: () => import('../pages/newsletterConfirm.js'), render: 'renderNewsletterConfirm' },
];

function getPath() {
  const hash = window.location.hash.slice(1) || '/';
  const [path] = hash.split('?');
  return path || '/';
}

function getQuery() {
  const hash = window.location.hash.slice(1) || '/';
  const idx = hash.indexOf('?');
  return idx >= 0 ? new URLSearchParams(hash.slice(idx + 1)) : new URLSearchParams();
}

export function navigate(path) {
  window.location.hash = path;
}

const cleanups = new Set();

export function registerCleanup(fn) {
  cleanups.add(fn);
  return fn;
}

function runCleanups() {
  for (const fn of cleanups) {
    try { fn(); } catch { /* ignore */ }
  }
  cleanups.clear();
}

export async function renderApp() {
  runCleanups();

  const app = document.getElementById('app');
  const path = getPath();
  const query = getQuery();
  const route = routes.find((r) => r.path === path) || routes[0];
  const banners = await renderSiteBanners();

  app.innerHTML = `
    ${banners}
    ${renderPaymentResumeBanner(path)}
    ${renderHeader(path)}
    <main id="main-content" class="min-h-[calc(100vh-12rem)]"></main>
    ${renderFooter()}
    ${renderMobileNav(path)}
  `;

  bindHeaderEvents();
  bindMobileNav();

  setPageMeta(path, query.get('id') ? { title: `Produkt – Kryptogutscheine` } : {});

  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-container flex justify-center py-20">${renderInlineSpinner()}</div>`;

  try {
    const mod = await route.loader();
    await mod[route.render](main, query);
    resetRouteRetries();
  } catch (err) {
    console.error('[Kryptogutscheine] Seitenfehler:', err);

    const needsHardReload =
      err?.name === 'ReferenceError' ||
      String(err?.message || '').toLowerCase().includes('is not defined');

    if (shouldAutoRetryRoute(path, err)) {
      recordRouteRetry();
      main.innerHTML = `<div class="page-container flex flex-col items-center justify-center py-20">${renderInlineSpinner()}<p class="mt-4 text-sm text-content-muted">${t('error.autoReload')}</p></div>`;
      await new Promise((r) => setTimeout(r, needsHardReload ? 400 : 900));
      if (needsHardReload) {
        window.location.reload();
        return;
      }
      return renderApp();
    }

    main.innerHTML = renderPageError(err, {
      onRetry: () => renderApp(),
      onHome: () => navigate('/'),
    });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initFavorites() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav-toggle]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite({
      id: btn.dataset.id,
      name: btn.dataset.name,
      image: btn.dataset.image,
      currency: btn.dataset.currency,
    });
    showToast(added ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt');
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', added ? 'currentColor' : 'none');
  });
}

export function initRouter() {
  initCartDrawer();
  initFavorites();
  window.addEventListener('hashchange', renderApp);
  window.addEventListener('Kryptogutscheine:country-change', renderApp);
  window.addEventListener('Kryptogutscheine:lang-change', renderApp);
  window.addEventListener('Kryptogutscheine:active-payment-change', updatePaymentResumeBanner);
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      e.preventDefault();
      navigate(nav.dataset.nav);
    }
  });
}
