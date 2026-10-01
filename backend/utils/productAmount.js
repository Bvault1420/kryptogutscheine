import { isAmountWithinLimit, MAX_VOUCHER_AMOUNT } from './voucherLimits.js';
import { AppError } from './errors.js';

function sortedPackages(product) {
  return [...(product?.packages || [])]
    .filter((p) => isAmountWithinLimit(p.value))
    .sort((a, b) => Number(a.value) - Number(b.value));
}

export function getProductAmountBounds(product) {
  const summary = product?.amount_summary;
  if (summary?.min != null) {
    let max = summary.max != null ? Math.min(Number(summary.max), MAX_VOUCHER_AMOUNT) : null;
    let min = Number(summary.min);
    if (min > MAX_VOUCHER_AMOUNT) min = null;
    return {
      min,
      max,
      step: Number(summary.step) || 1,
      supportsCustomAmount: Boolean(summary.supportsCustomAmount),
    };
  }

  const packages = sortedPackages(product);
  const pkgValues = packages.map((p) => Number(p.value)).filter((n) => !Number.isNaN(n));
  const range = product?.range;
  const rangeMin = range?.min != null ? Number(range.min) : null;
  let rangeMax = range?.max != null ? Number(range.max) : null;
  if (rangeMax != null) rangeMax = Math.min(rangeMax, MAX_VOUCHER_AMOUNT);

  const mins = [pkgValues[0], rangeMin].filter((n) => n != null && !Number.isNaN(n));
  const maxs = [pkgValues[pkgValues.length - 1], rangeMax].filter((n) => n != null && !Number.isNaN(n));

  return {
    min: mins.length ? Math.min(...mins) : null,
    max: maxs.length ? Math.max(...maxs) : null,
    step: range?.step != null ? Number(range.step) : 1,
    supportsCustomAmount: rangeMin != null && rangeMax != null && rangeMax > rangeMin,
  };
}

export function resolveProductAmount(product, { value, packageId } = {}) {
  const packages = sortedPackages(product);

  if (packageId) {
    const pkg = packages.find((p) => (p.package_id || p.id) === packageId);
    if (pkg) {
      return { value: Number(pkg.value), packageId: pkg.package_id || pkg.id || packageId };
    }
  }

  const num = Number(value);
  if (Number.isNaN(num) || !isAmountWithinLimit(num)) return null;

  const exact = packages.find((p) => Number(p.value) === num);
  if (exact) {
    return { value: num, packageId: exact.package_id || exact.id || undefined };
  }

  const { min, max, supportsCustomAmount } = getProductAmountBounds(product);
  if (supportsCustomAmount && min != null && max != null && num >= min && num <= max) {
    return { value: num, packageId: undefined };
  }

  return null;
}

export function assertValidProductAmount(product, { value, packageId } = {}) {
  const resolved = resolveProductAmount(product, { value, packageId });
  if (resolved) return resolved;

  const packages = sortedPackages(product);
  const amounts = packages.map((p) => Number(p.value));
  const { min, max, supportsCustomAmount } = getProductAmountBounds(product);
  const currency = product?.currency || 'EUR';

  if (supportsCustomAmount && min != null && max != null) {
    throw new AppError(
      `Bitte einen Betrag zwischen ${min} und ${max} ${currency} eingeben (max. ${MAX_VOUCHER_AMOUNT} ${currency}).`,
      400,
      'INVALID_DENOMINATION'
    );
  }

  if (amounts.length) {
    const list = amounts.map((a) => `${a} ${currency}`).join(', ');
    throw new AppError(
      `Für dieses Produkt sind nur folgende Beträge verfügbar: ${list}.`,
      400,
      'INVALID_DENOMINATION'
    );
  }

  throw new AppError('Ungültiger Gutscheinbetrag.', 400, 'INVALID_DENOMINATION');
}
