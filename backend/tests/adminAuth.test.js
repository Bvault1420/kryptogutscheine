import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { adminAuth } from '../middleware/adminAuth.js';

const KEY = 'test-admin-key-with-at-least-32-characters!!';

function mockReq(authHeader) {
  return { get: (name) => (name.toLowerCase() === 'authorization' ? authHeader : null) };
}

describe('adminAuth middleware', () => {
  const prev = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_API_KEY = KEY;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_API_KEY;
    else process.env.ADMIN_API_KEY = prev;
  });

  test('rejects when ADMIN_API_KEY is missing', () => {
    delete process.env.ADMIN_API_KEY;
    let err;
    adminAuth(mockReq(`Bearer ${KEY}`), {}, (e) => {
      err = e;
    });
    assert.equal(err?.code, 'ADMIN_NOT_CONFIGURED');
  });

  test('rejects wrong bearer token', () => {
    let err;
    adminAuth(mockReq('Bearer wrong-token-xxxxxxxxxxxxxxxxxxxxxxx'), {}, (e) => {
      err = e;
    });
    assert.equal(err?.code, 'ADMIN_UNAUTHORIZED');
  });

  test('accepts correct bearer token', () => {
    let nextCalled = false;
    let err;
    adminAuth(mockReq(`Bearer ${KEY}`), {}, (e) => {
      if (e) err = e;
      else nextCalled = true;
    });
    assert.equal(err, undefined);
    assert.equal(nextCalled, true);
  });
});
