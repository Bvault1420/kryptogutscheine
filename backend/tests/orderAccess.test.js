import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { assertInvoiceAccess, assertOrderAccess } from '../middleware/orderAccess.js';
import { generateAccessToken, timingSafeEqualString } from '../utils/crypto.js';
import { saveOrder, getOrderByInvoiceId, clearAllDataForTests } from '../storage/store.js';
import { resetDbForTests } from '../storage/db.js';

describe('crypto utils', () => {
  test('timingSafeEqualString matches equal strings', () => {
    assert.equal(timingSafeEqualString('abc', 'abc'), true);
    assert.equal(timingSafeEqualString('abc', 'abd'), false);
  });

  test('generateAccessToken returns 64 hex chars', () => {
    const token = generateAccessToken();
    assert.match(token, /^[a-f0-9]{64}$/);
  });
});

describe('order access tokens', () => {
  beforeEach(() => {
    resetDbForTests();
    clearAllDataForTests();
  });

  test('requires token for protected orders', () => {
    const token = generateAccessToken();
    saveOrder({ invoiceId: '550e8400-e29b-41d4-a716-446655440001', orderId: 'ord-1', status: 'pending', accessToken: token });

    assert.doesNotThrow(() => assertInvoiceAccess('550e8400-e29b-41d4-a716-446655440001', token));
    assert.throws(() => assertInvoiceAccess('550e8400-e29b-41d4-a716-446655440001', 'wrong'), (err) => err.code === 'ORDER_ACCESS_DENIED');
    assert.throws(() => assertInvoiceAccess('550e8400-e29b-41d4-a716-446655440099', token), (err) => err.code === 'ORDER_NOT_FOUND');
  });

  test('rejects access without token even when order exists', () => {
    saveOrder({ invoiceId: '550e8400-e29b-41d4-a716-446655440002', orderId: 'ord-2', status: 'pending', accessToken: generateAccessToken() });
    assert.throws(() => assertInvoiceAccess('550e8400-e29b-41d4-a716-446655440002', ''), (err) => err.code === 'ORDER_ACCESS_DENIED');
  });

  test('order access by orderId', () => {
    const token = generateAccessToken();
    saveOrder({ invoiceId: '550e8400-e29b-41d4-a716-446655440003', orderId: 'ord-3', status: 'pending', accessToken: token });
    assert.doesNotThrow(() => assertOrderAccess('ord-3', token));
    assert.throws(() => assertOrderAccess('ord-3', 'bad'), (err) => err.code === 'ORDER_ACCESS_DENIED');
  });

  test('stores accessToken in sqlite', () => {
    const token = generateAccessToken();
    saveOrder({ invoiceId: '550e8400-e29b-41d4-a716-446655440004', orderId: 'ord-4', status: 'pending', accessToken: token });
    const order = getOrderByInvoiceId('550e8400-e29b-41d4-a716-446655440004');
    assert.equal(order.accessToken, token);
  });
});
