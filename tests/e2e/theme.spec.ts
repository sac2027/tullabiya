import { test, expect } from '@playwright/test';

test('theme toggle sets dark, survives reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/ar/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /الوضع الداكن|الوضع الفاتح/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('page loads in light theme when storage throws', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('storage blocked');
      },
    });
  });
  await page.goto('/ar/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('h1')).toBeVisible();
  // toggling still works for this visit
  await page.getByRole('button', { name: /الوضع الداكن/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('KFUPM Display Black and Plex are loaded on /ar/', async ({ page }) => {
  await page.goto('/ar/');
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    await document.fonts.load('900 32px "KFUPM Display"');
    await document.fonts.load('400 16px "IBM Plex Sans Arabic"');
    return Array.from(document.fonts)
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replace(/"/g, '')}:${f.weight}`);
  });
  expect(loaded).toContain('KFUPM Display:900');
  expect(loaded).toContain('IBM Plex Sans Arabic:400');
});
