import {
  MAX_VOUCHER_AMOUNT as DEFAULT_MAX,
} from '../../shared/constants.js';

/** Plattformweites Maximal-Limit pro Gutschein (ENV überschreibt Shared-Default). */
export const MAX_VOUCHER_AMOUNT = parseInt(
  process.env.MAX_VOUCHER_AMOUNT || String(DEFAULT_MAX),
  10
);

function computeAmountSummary(packages, range) {
  const pkgValues = packages.map((p) => Number(p.value)).filter((n) => !Number.isNaN(n));
  const rangeMin = range?.min != null ? Number(range.min) : null;
  const rangeMax = range?.max != null ? Number(range.max) : null;
  const mins = [pkgValues[0], rangeMin].filter((n) => n != null && !Number.isNaN(n));
  const maxs = [pkgValues[pkgValues.length - 1], rangeMax].filter((n) => n != null && !Number.isNaN(n));

  if (!mins.length && !maxs.length) return null;

  return {
    min: mins.length ? Math.min(...mins) : null,
    max: maxs.length ? Math.max(...maxs) : null,
    step: range?.step != null ? Number(range.step) : 1,
    supportsCustomAmount: rangeMin != null && rangeMax != null && rangeMax > rangeMin,
    packageCount: packages.length,
  };
}

export function isAmountWithinLimit(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0 && n <= MAX_VOUCHER_AMOUNT;
}

/** Pakete > Max entfernen, Range begrenzen – Minimum bleibt API-Minimum. */
export function applyVoucherLimitsToProduct(product) {
  if (!product) return product;

  const packages = (product.packages || []).filter((p) => isAmountWithinLimit(p.value));

  let range;
  if (product.range) {
    const min = product.range.min != null ? Number(product.range.min) : undefined;
    let max = product.range.max != null ? Number(product.range.max) : undefined;
    if (max != null && !Number.isNaN(max)) max = Math.min(max, MAX_VOUCHER_AMOUNT);
    if (min != null && !Number.isNaN(min) && min <= MAX_VOUCHER_AMOUNT) {
      range = {
        ...product.range,
        min,
        max: max != null && max >= min ? max : undefined,
        step: product.range.step,
      };
    }
  }

  const amount_summary = computeAmountSummary(packages, range);

  return {
    ...product,
    packages,
    range,
    amount_summary,
  };
}

export function hasPurchasableAmount(product) {
  const limited = applyVoucherLimitsToProduct(product);
  if (limited.packages?.length) return true;
  const summary = limited.amount_summary;
  if (!summary) return false;
  const { min, max } = summary;
  return min != null && max != null && min <= MAX_VOUCHER_AMOUNT && max >= min;
}
