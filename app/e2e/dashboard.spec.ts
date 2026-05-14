import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('dashboard loads with key sections', async ({ page }) => {
    await expect(page).toHaveTitle(/CRM/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
