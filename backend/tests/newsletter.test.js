import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNewsletterPending,
  confirmNewsletter,
  unsubscribeNewsletter,
  getNewsletterCount,
  clearAllDataForTests,
} from '../storage/store.js';
import { resetDbForTests } from '../storage/db.js';
import { generateAccessToken } from '../utils/crypto.js';

describe('newsletter double opt-in', () => {
  beforeEach(() => {
    resetDbForTests();
    clearAllDataForTests();
  });

  test('pending until confirmed', () => {
    const token = generateAccessToken();
    createNewsletterPending('user@example.com', token);
    assert.equal(getNewsletterCount(), 0);
    const email = confirmNewsletter(token);
    assert.equal(email, 'user@example.com');
    assert.equal(getNewsletterCount(), 1);
  });

  test('invalid confirm token returns null', () => {
    assert.equal(confirmNewsletter('invalid-token'), null);
  });

  test('unsubscribe removes email', () => {
    const token = generateAccessToken();
    createNewsletterPending('del@example.com', token);
    confirmNewsletter(token);
    assert.equal(unsubscribeNewsletter('del@example.com'), true);
    assert.equal(getNewsletterCount(), 0);
  });
});
