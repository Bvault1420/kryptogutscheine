import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedProduct } from '../utils/productFilter.js';

describe('isAllowedProduct', () => {
  test('allows standard gift card', () => {
    assert.equal(isAllowedProduct({ id: 'amazon_de-germany', categories: ['retail'] }), true);
  });

  test('blocks gambling', () => {
    assert.equal(isAllowedProduct({ id: 'bet365-germany', categories: ['gambling'] }), false);
  });

  test('blocks paysafecard', () => {
    assert.equal(isAllowedProduct({ id: 'paysafecard-germany', categories: ['gaming'] }), false);
  });

  test('blocks phone refill', () => {
    assert.equal(isAllowedProduct({ id: 'vodafone-de', recipient_type: 'phone_number' }), false);
  });

  test('blocks esim', () => {
    assert.equal(isAllowedProduct({ id: 'airalo-esim-germany', categories: ['esim'] }), false);
  });

  test('blocks crypto cards', () => {
    assert.equal(isAllowedProduct({ id: 'crypto-gift-card', categories: ['cryptocurrency'] }), false);
  });

  test('blocks dating apps', () => {
    assert.equal(isAllowedProduct({ id: 'tinder-plus-germany', categories: ['entertainment'] }), false);
  });

  test('allows TikTok Coins gift cards', () => {
    assert.equal(isAllowedProduct({ id: 'tiktok-coins-germany', categories: ['entertainment'] }), true);
  });
});
