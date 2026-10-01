import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createInvoiceSchema, productIdSchema } from '../utils/validate.js';

describe('productIdSchema', () => {
  test('accepts valid product id', () => {
    const r = productIdSchema.parse({ id: 'amazon_de' });
    assert.equal(r.id, 'amazon_de');
  });

  test('rejects empty id', () => {
    assert.throws(() => productIdSchema.parse({ id: '' }));
  });
});

describe('createInvoiceSchema', () => {
  test('accepts single product with packageId', () => {
    const r = createInvoiceSchema.parse({
      productId: 'steam',
      packageId: 'steam-10',
    });
    assert.equal(r.productId, 'steam');
  });

  test('accepts items array', () => {
    const r = createInvoiceSchema.parse({
      items: [
        { productId: 'steam', packageId: 'steam-10', quantity: 2 },
        { productId: 'amazon_de', value: 25 },
      ],
    });
    assert.equal(r.items.length, 2);
  });

  test('rejects missing value and packageId', () => {
    assert.throws(() =>
      createInvoiceSchema.parse({ productId: 'steam' })
    );
  });

  test('defaults paymentMethod to lightning', () => {
    const r = createInvoiceSchema.parse({ productId: 'x', value: 10 });
    assert.equal(r.paymentMethod, 'lightning');
  });
});
