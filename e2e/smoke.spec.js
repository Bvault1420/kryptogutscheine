import { test, expect } from '@playwright/test';

test('API health responds', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('homepage loads in production mode', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible({ timeout: 10_000 });
});

test('shop page loads', async ({ page }) => {
  await page.goto('/#/shop');
  await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
});

test('CSRF endpoint works', async ({ request }) => {
  const res = await request.get('/api/csrf');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.csrfToken).toBeTruthy();
});
