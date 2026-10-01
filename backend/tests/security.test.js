import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedProduct, filterAllowedProducts } from '../utils/productFilter.js';
import { ALLOWED_PAYMENT_METHODS, isAllowedPaymentMethod } from '../utils/paymentMethods.js';
import { MAX_VOUCHER_AMOUNT, isAmountWithinLimit } from '../utils/voucherLimits.js';
import {
  assertCanCreateInvoice,
  countActivePendingOrders,
  MAX_ACTIVE_PENDING_PAYMENTS,
} from '../utils/pendingPayments.js';
import { invoiceIdSchema } from '../utils/validate.js';

describe('shared product blocklist', () => {
  test('blocks gambling via shared list', () => {
    assert.equal(isAllowedProduct({ id: 'casino-de', categories: ['gambling'] }), false);
  });

  test('filterAllowedProducts drops blocked', () => {
    const out = filterAllowedProducts([
      { id: 'amazon_de-germany', categories: ['retail'] },
      { id: 'paysafecard-de', categories: ['gaming'] },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].id, 'amazon_de-germany');
  });
});

describe('payment methods whitelist', () => {
  test('contains expected methods', () => {
    assert.ok(ALLOWED_PAYMENT_METHODS.includes('lightning'));
    assert.ok(ALLOWED_PAYMENT_METHODS.includes('bitcoin'));
    assert.ok(ALLOWED_PAYMENT_METHODS.includes('usdc_polygon'));
    assert.ok(ALLOWED_PAYMENT_METHODS.includes('usdt_erc20'));
    assert.equal(isAllowedPaymentMethod('dogecoin'), false);
    assert.equal(isAllowedPaymentMethod('jump_usd'), false);
  });
});

describe('voucher limits', () => {
  test('rejects over max', () => {
    assert.equal(isAmountWithinLimit(MAX_VOUCHER_AMOUNT), true);
    assert.equal(isAmountWithinLimit(MAX_VOUCHER_AMOUNT + 1), false);
  });
});

describe('pending payment limits', () => {
  test('blocks when too many pending from same IP', () => {
    const now = new Date().toISOString();
    const ip = '192.168.1.100';
    const orders = Array.from({ length: MAX_ACTIVE_PENDING_PAYMENTS }, (_, i) => ({
      invoiceId: `inv-${i}`,
      status: 'pending',
      updatedAt: now,
      clientIp: ip,
    }));
    assert.equal(countActivePendingOrders(orders, ip), MAX_ACTIVE_PENDING_PAYMENTS);
    assert.throws(() => assertCanCreateInvoice(orders, ip), /TOO_MANY_PENDING_PAYMENTS|offene Zahlungen/);
  });

  test('does not count pending orders from other IPs', () => {
    const now = new Date().toISOString();
    const orders = Array.from({ length: MAX_ACTIVE_PENDING_PAYMENTS }, (_, i) => ({
      invoiceId: `inv-${i}`,
      status: 'pending',
      updatedAt: now,
      clientIp: '10.0.0.1',
    }));
    assert.equal(countActivePendingOrders(orders, '192.168.1.200'), 0);
    assert.doesNotThrow(() => assertCanCreateInvoice(orders, '192.168.1.200'));
  });
});

describe('invoice id validation', () => {
  test('requires UUID', () => {
    assert.throws(() => invoiceIdSchema.parse({ id: 'not-a-uuid' }));
    const r = invoiceIdSchema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' });
    assert.equal(r.id, '550e8400-e29b-41d4-a716-446655440000');
  });
});
