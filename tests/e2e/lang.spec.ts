import { test, expect } from '@playwright/test';

test('switch keeps the place and the choice is remembered', async ({ page }) => {
  await page.goto('/ar/#main');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/#main$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/$/);
  await page.getByRole('link', { name: 'العربية' }).click();
  await expect(page).toHaveURL(/\/ar\/$/);
});

test('switch works with storage blocked and root falls back to Arabic', async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('storage blocked');
      },
    });
  });
  await page.goto('/ar/');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/ar\/$/);
});
