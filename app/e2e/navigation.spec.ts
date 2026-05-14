import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('navigates to all main routes from sidebar', async ({ page }) => {
    const navLinks = [
      { href: '/', label: 'Dashboard' },
      { href: '/citas', label: 'Citas' },
      { href: '/servicios', label: 'Servicios' },
      { href: '/clientes', label: 'Clientas' },
      { href: '/staff', label: 'Staff' },
      { href: '/pagos', label: 'Pagos' },
    ];

    for (const link of navLinks) {
      const navItem = page.locator(`a[href="${link.href}"]`).first();
      await expect(navItem).toBeVisible({ timeout: 5000 });
      await navItem.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(link.href);
    }
  });

  test('six main navigation items exist', async ({ page }) => {
    const navItems = page.locator('nav a[href]');
    const visibleNavItems = await navItems.all();
    expect(visibleNavItems.length).toBeGreaterThanOrEqual(6);
  });
});
