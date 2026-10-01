import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getProductAmountBounds,
  resolveProductAmount,
  assertValidProductAmount,
} from '../utils/productAmount.js';
import { AppError } from '../utils/errors.js';

const steam = {
  id: 'steam-eur-international',
  currency: 'EUR',
  packages: [
    { id: 'p10', value: '10' },
    { id: 'p20', value: '20' },
    { id: 'p30', value: '30' },
  ],
  amount_summary: { min: 10, max: 30, step: 1, supportsCustomAmount: false, packageCount: 3 },
};

const zalando = {
  id: 'zalando-germany',
  currency: 'EUR',
  packages: [{ id: 'z5', value: '5' }],
  range: { min: 5, max: 200, step: 1 },
  amount_summary: { min: 5, max: 200, step: 1, supportsCustomAmount: true, packageCount: 1 },
};

describe('productAmount', () => {
  test('steam fixed packages only', () => {
    assert.deepEqual(resolveProductAmount(steam, { value: 20 }), { value: 20, packageId: 'p20' });
    assert.equal(resolveProductAmount(steam, { value: 5 }), null);
    assert.throws(
      () => assertValidProductAmount(steam, { value: 5 }),
      (err) => err instanceof AppError && err.code === 'INVALID_DENOMINATION'
    );
  });

  test('zalando custom amount in range', () => {
    assert.deepEqual(resolveProductAmount(zalando, { value: 17 }), { value: 17, packageId: undefined });
    assert.throws(() => assertValidProductAmount(zalando, { value: 501 }));
  });

  test('bounds capped at platform max', () => {
    const wide = {
      range: { min: 1, max: 4000, step: 1 },
      amount_summary: { min: 1, max: 4000, step: 1, supportsCustomAmount: true, packageCount: 0 },
    };
    assert.equal(getProductAmountBounds(wide).max, 500);
  });
});
