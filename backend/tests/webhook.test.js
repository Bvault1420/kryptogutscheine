import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { handleBitrefillWebhook } from '../controllers/webhookController.js';

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

describe('webhook security', () => {
  const prevSecret = process.env.BITREFILL_WEBHOOK_SECRET;

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.BITREFILL_WEBHOOK_SECRET;
    else process.env.BITREFILL_WEBHOOK_SECRET = prevSecret;
  });

  test('rejects when secret is not configured', () => {
    delete process.env.BITREFILL_WEBHOOK_SECRET;
    const res = mockRes();
    handleBitrefillWebhook({ body: { invoice_id: 'x', status: 'complete' }, headers: {} }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'WEBHOOK_NOT_CONFIGURED');
  });

  test('rejects forged webhook without signature', () => {
    process.env.BITREFILL_WEBHOOK_SECRET = 'test-webhook-secret-at-least-32-chars!!';
    const res = mockRes();
    handleBitrefillWebhook(
      { body: { invoice_id: 'x', status: 'complete' }, headers: { authorization: 'Bearer wrong' } },
      res
    );
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.code, 'WEBHOOK_UNAUTHORIZED');
  });

  test('accepts valid bearer signature', () => {
    const secret = 'test-webhook-secret-at-least-32-chars!!';
    process.env.BITREFILL_WEBHOOK_SECRET = secret;
    const res = mockRes();
    handleBitrefillWebhook(
      { body: { invoice_id: 'x', status: 'complete' }, headers: { authorization: `Bearer ${secret}` } },
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.received, true);
  });
});
