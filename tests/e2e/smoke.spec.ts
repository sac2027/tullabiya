import { test, expect } from '@playwright/test';

test('root redirects to /ar/ and the page is RTL Arabic', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/ar\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('/en/ is LTR English', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});
