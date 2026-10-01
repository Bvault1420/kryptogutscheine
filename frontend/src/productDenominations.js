import { escapeHtml, formatCurrency } from './utils.js';

import { MAX_VOUCHER_AMOUNT, isAmountWithinLimit } from './voucherLimits.js';



/** Alle Paket-Beträge aus der Bitrefill-API, numerisch sortiert. */

export function getSortedPackages(product) {

  if (!product?.packages?.length) return [];

  return [...product.packages]

    .filter((p) => isAmountWithinLimit(p.value))

    .sort((a, b) => Number(a.value) - Number(b.value));

}



/** Min/Max/Step – aus packages, range oder amount_summary (Backend). Max. 500 €. */

export function getAmountBounds(product) {

  let bounds;

  if (product?.amount_summary) {

    bounds = {

      min: Number(product.amount_summary.min),

      max: Number(product.amount_summary.max),

      step: Number(product.amount_summary.step) || 1,

      supportsCustomAmount: Boolean(product.amount_summary.supportsCustomAmount),

      packageCount: product.amount_summary.packageCount ?? 0,

    };

  } else {

    const packages = getSortedPackages(product);

    const pkgValues = packages.map((p) => Number(p.value)).filter((n) => !Number.isNaN(n));

    const range = product?.range;

    const rangeMin = range?.min != null ? Number(range.min) : null;

    let rangeMax = range?.max != null ? Number(range.max) : null;

    if (rangeMax != null && !Number.isNaN(rangeMax)) rangeMax = Math.min(rangeMax, MAX_VOUCHER_AMOUNT);

    const candidatesMin = [pkgValues[0], rangeMin].filter((n) => n != null && !Number.isNaN(n));

    const candidatesMax = [pkgValues[pkgValues.length - 1], rangeMax].filter((n) => n != null && !Number.isNaN(n));



    bounds = {

      min: candidatesMin.length ? Math.min(...candidatesMin) : null,

      max: candidatesMax.length ? Math.max(...candidatesMax) : null,

      step: range?.step != null ? Number(range.step) : 1,

      supportsCustomAmount: rangeMin != null && rangeMax != null && rangeMax > rangeMin,

      packageCount: packages.length,

    };

  }



  if (bounds.max != null && !Number.isNaN(bounds.max)) {

    bounds.max = Math.min(bounds.max, MAX_VOUCHER_AMOUNT);

  }

  if (bounds.min != null && bounds.min > MAX_VOUCHER_AMOUNT) {

    bounds.min = null;

    bounds.max = null;

    bounds.supportsCustomAmount = false;

  }

  return bounds;

}



export function getAllAmountValues(product) {

  const packages = getSortedPackages(product);

  if (packages.length) {

    return [...new Set(packages.map((p) => Number(p.value)).filter((n) => !Number.isNaN(n)))].sort(

      (a, b) => a - b

    );

  }

  const { min, max } = getAmountBounds(product);

  if (min != null && max != null) return [min, max];

  return [];

}



/** Verteilte Schnellauswahl für Produktkarten – min, Zwischenwerte, max. */

export function getQuickAmountOptions(product, maxChips = 6) {

  const values = getAllAmountValues(product);

  if (!values.length) return [];



  if (values.length <= maxChips) {

    return values.map((value) => ({

      value,

      packageId: findPackageForAmount(product, value)?.packageId || '',

    }));

  }



  const picked = new Set([values[0], values[values.length - 1]]);

  const slots = maxChips - 2;

  for (let i = 1; i <= slots; i++) {

    const idx = Math.round((i / (slots + 1)) * (values.length - 1));

    picked.add(values[idx]);

  }



  return [...picked]

    .sort((a, b) => a - b)

    .map((value) => ({

      value,

      packageId: findPackageForAmount(product, value)?.packageId || '',

    }));

}



export function findPackageForAmount(product, amount) {

  const num = Number(amount);

  if (Number.isNaN(num)) return null;



  const pkg = getSortedPackages(product).find((p) => Number(p.value) === num);

  if (pkg) {

    return {

      value: num,

      packageId: pkg.package_id || pkg.id || '',

    };

  }



  const { min, max, supportsCustomAmount } = getAmountBounds(product);

  if (supportsCustomAmount && min != null && max != null && num >= min && num <= max) {

    return { value: num, packageId: '' };

  }



  return null;

}



/** Validiert Eingabe und liefert Fehlermeldung oder aufgelösten Betrag. */

export function validateSelectedAmount(product, value, packageId) {

  const resolved = findPackageForAmount(product, value);

  if (resolved && (!packageId || resolved.packageId === packageId || !resolved.packageId)) {

    return { ok: true, ...resolved };

  }



  if (packageId) {

    const pkg = getSortedPackages(product).find((p) => (p.package_id || p.id) === packageId);

    if (pkg) return { ok: true, value: Number(pkg.value), packageId };

  }



  const bounds = getAmountBounds(product);

  const currency = product?.currency || 'EUR';

  const amounts = getAllAmountValues(product);



  if (bounds.supportsCustomAmount && bounds.min != null && bounds.max != null) {

    return {

      ok: false,

      error: `Bitte einen Betrag zwischen ${formatCurrency(bounds.min, currency)} und ${formatCurrency(bounds.max, currency)} eingeben.`,

    };

  }



  if (amounts.length) {

    const list = amounts.map((a) => formatCurrency(a, currency)).join(', ');

    return {

      ok: false,

      error: `Für dieses Produkt sind nur folgende Beträge verfügbar: ${list}.`,

    };

  }



  return { ok: false, error: 'Bitte einen gültigen Betrag eingeben.' };

}



/** Preisanzeige für Karten: „ab 10 €“ oder „1 € – 500 €“. */

export function formatPriceRangeLabel(product) {

  const { min, max } = getAmountBounds(product);

  const currency = product?.currency || 'EUR';

  if (min == null) return '';

  if (max != null && max > min) {

    return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;

  }

  return `ab ${formatCurrency(min, currency)}`;

}



export function canAddProductToCart(product) {

  return getSortedPackages(product).length > 0 || getAmountBounds(product).min != null;

}



export function defaultDenomination(product) {

  const packages = getSortedPackages(product);

  if (packages.length) {

    const minPkg = packages[0];

    return { value: Number(minPkg.value), packageId: minPkg.package_id || minPkg.id || '' };

  }

  const { min } = getAmountBounds(product);

  if (min != null) return { value: min, packageId: '' };

  return { value: undefined, packageId: '' };

}



/** Betragsauswahl: Eingabefeld + optionale Schnellauswahl. */

export function renderDenominationPicker(product) {

  const packages = getSortedPackages(product);

  const bounds = getAmountBounds(product);

  const currency = product.currency || 'EUR';

  const defaults = defaultDenomination(product);



  if (!packages.length && bounds.min == null) return '';



  const rangeHint =

    bounds.min != null && bounds.max != null && bounds.max > bounds.min

      ? `${formatCurrency(bounds.min, currency)} – ${formatCurrency(bounds.max, currency)}`

      : '';



  const hint = bounds.supportsCustomAmount

    ? `Frei wählbar${rangeHint ? `: ${rangeHint}` : ''} (Plattform-Maximum: ${formatCurrency(MAX_VOUCHER_AMOUNT, currency)}).`

    : packages.length

      ? `Nur feste Beträge: ${packages.map((p) => formatCurrency(p.value, currency)).join(', ')}.`

      : '';



  let html = `

    <div class="mt-6" id="denomination-picker"

         data-min="${bounds.min ?? ''}"

         data-max="${bounds.max ?? ''}"

         data-step="${bounds.step ?? 1}"

         data-currency="${escapeHtml(currency)}"

         data-custom="${bounds.supportsCustomAmount ? '1' : '0'}">

      <label for="custom-value" class="mb-2 block text-sm font-medium">Betrag eingeben</label>

      <div class="flex flex-wrap items-center gap-3">

        <input type="number" id="custom-value" class="input-field max-w-[180px] text-lg font-semibold"

               min="${bounds.min ?? 1}" max="${bounds.max ?? MAX_VOUCHER_AMOUNT}" step="${bounds.step || 1}"

               value="${defaults.value ?? ''}"

               placeholder="${rangeHint || `${bounds.min ?? 1}–${bounds.max ?? MAX_VOUCHER_AMOUNT}`}"

               data-active="true" />

        <span class="text-sm font-medium text-content-muted">${escapeHtml(currency)}</span>

      </div>

      ${hint ? `<p class="mt-2 text-xs text-content-muted">${escapeHtml(hint)}</p>` : ''}`;



  if (packages.length) {

    html += `

      <p class="mb-2 mt-5 text-sm font-medium text-content-muted">Schnellauswahl</p>

      <div class="flex flex-wrap gap-2" id="package-options">

        ${packages

          .map(

            (pkg) => `

          <button type="button" class="denom-quick btn-secondary px-4 py-2 text-sm font-semibold"

                  data-value="${escapeHtml(String(pkg.value))}"

                  data-package-id="${escapeHtml(String(pkg.package_id || pkg.id || ''))}">

            ${formatCurrency(pkg.value, currency)}

          </button>`

          )

          .join('')}

      </div>`;

  }



  html += '</div>';

  return html;

}



export function bindDenominationPicker() {

  const customEl = document.getElementById('custom-value');

  const quickBtns = document.querySelectorAll('.denom-quick');



  quickBtns.forEach((btn) => {

    btn.addEventListener('click', () => {

      if (!customEl) return;

      customEl.value = btn.dataset.value || '';

      customEl.dataset.active = 'true';

      customEl.dataset.packageId = btn.dataset.packageId || '';

      quickBtns.forEach((b) => b.classList.remove('ring-2', 'ring-brand-500'));

      btn.classList.add('ring-2', 'ring-brand-500');

    });

  });



  customEl?.addEventListener('input', () => {

    customEl.dataset.active = 'true';

    customEl.dataset.packageId = '';

    quickBtns.forEach((b) => b.classList.remove('ring-2', 'ring-brand-500'));

  });

}



export function readSelectedDenomination() {

  const customEl = document.getElementById('custom-value');



  if (customEl?.value && customEl.dataset.active !== 'false') {

    const val = Number(customEl.value);

    const packageId = customEl.dataset.packageId || undefined;

    if (!Number.isNaN(val) && isAmountWithinLimit(val)) {

      return { value: val, packageId: packageId || undefined };

    }

  }



  return { value: undefined, packageId: undefined };

}


