import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function ready(page: Page, lang: 'ar' | 'en' = 'ar') {
  await page.goto(`/${lang}/#month`);
  await page.locator('.month astro-island:not([ssr])').first().waitFor({ state: 'attached' });
  await expect(page.locator('.day')).toHaveCount(30);
}

test('tapping day 15 shows BCG and the ICS download is named for the date', async ({ page }) => {
  await ready(page);
  await page.locator('.day').nth(14).click();
  await expect(page.locator('.detail h3')).toContainText('BCG');
  await page.locator('.detail').getByRole('button', { name: 'أضف إلى التقويم' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('menuitem', { name: /آبل|ICS/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('tullabiya-20260915.ics');
  const body = readFileSync(await download.path(), 'utf8');
  expect(body).toContain('BCG');
  expect(body).toContain('DTSTART;VALUE=DATE:20260915');
});

test('day 1 sits on the right in Arabic and on the left in English', async ({ page }) => {
  await ready(page, 'ar');
  const ar1 = await page.locator('.day').nth(0).boundingBox();
  const ar30 = await page.locator('.day').nth(29).boundingBox();
  expect(ar1!.x).toBeGreaterThan(ar30!.x);
  await ready(page, 'en');
  const en1 = await page.locator('.day').nth(0).boundingBox();
  const en30 = await page.locator('.day').nth(29).boundingBox();
  expect(en1!.x).toBeLessThan(en30!.x);
});

test('arrow keys move in reading direction', async ({ page }) => {
  await ready(page, 'ar');
  await page.locator('.day').nth(14).click();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.day').nth(15)).toBeFocused();
  await expect(page.locator('.detail .big')).toHaveText('16');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.day').nth(14)).toBeFocused();
  await ready(page, 'en');
  await page.locator('.day').nth(14).click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.day').nth(15)).toBeFocused();
});

test('the selected day is inside the visible strip area', async ({ page }) => {
  await ready(page);
  const sc = await page.locator('.strip-scroll').boundingBox();
  const sel = await page.locator('.day[aria-pressed="true"]').boundingBox();
  expect(sel!.x).toBeGreaterThanOrEqual(sc!.x - 1);
  expect(sel!.x + sel!.width).toBeLessThanOrEqual(sc!.x + sc!.width + 1);
});

test('a quiet day says so and a reminder toggles', async ({ page }) => {
  await ready(page);
  await page.locator('.day').nth(4).click();
  await expect(page.locator('.detail h3')).toContainText('يوم هادئ');
  await page.locator('.day').nth(12).click();
  const remind = page.locator('.detail').getByRole('button', { name: /ذكّرني|سنذكّرك/ });
  await remind.click();
  await expect(remind).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.locator('.month astro-island:not([ssr])').first().waitFor({ state: 'attached' });
  await page.locator('.day').nth(12).click();
  await expect(page.locator('.detail').getByRole('button', { name: /سنذكّرك/ })).toHaveAttribute('aria-pressed', 'true');
});
