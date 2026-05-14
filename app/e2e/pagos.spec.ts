import { test, expect } from '@playwright/test';

test.describe('Pagos Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pagos');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with tabs', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText(/pago/i);
  });
});
