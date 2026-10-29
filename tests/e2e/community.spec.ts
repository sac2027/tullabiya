import { test, expect } from '@playwright/test';
import { hydrated } from './helpers';

test('upvoting a question counts once', async ({ page }) => {
  await page.goto('/ar/community/#ask');
  await page.locator('#ask').scrollIntoViewIfNeeded();
  await hydrated(page, '#ask');
  const first = page.locator('.qs li').first().locator('.react');
  const before = parseInt((await first.locator('.n').textContent()) ?? '0', 10);
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(first.locator('.n')).toHaveText(String(before + 1));
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await expect(first.locator('.n')).toHaveText(String(before));
});

test('a pitch lands in my submissions as pending and never in the public lists', async ({ page }) => {
  await page.goto('/ar/community/#pitch');
  await page.locator('#pitch').scrollIntoViewIfNeeded();
  await hydrated(page, '#pitch');
  const text = 'فكرة مقال عن الحافلات الليلية';
  await page.locator('#pitch textarea').fill(text);
  await page.locator('#pitch button[type="submit"]').click();
  await expect(page.locator('#pitch [data-note]')).toContainText('قيد المراجعة');
  await page.locator('#mine').scrollIntoViewIfNeeded();
  await hydrated(page, '#mine');
  await expect(page.locator('#mine .subs li', { hasText: text })).toBeVisible();
  await expect(page.locator('[data-public-kudos]')).not.toContainText(text);
  await expect(page.locator('.qs')).not.toContainText(text);
});

test('the kudos form rejects empty text', async ({ page }) => {
  await page.goto('/ar/community/#kudos');
  await page.locator('#kudos').scrollIntoViewIfNeeded();
  await hydrated(page, '#kudos');
  await page.locator('#kudos button[type="submit"]').click();
  await expect(page.locator('#kudos [data-note]')).toContainText('اكتب شيئاً');
});

for (const lang of ['ar', 'en'] as const) {
  test(`all modules render in ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/community/`);
    for (const id of ['#pitch', '#ask', '#caption', '#kudos', '#mine']) await expect(page.locator(`${id} h2`)).toBeVisible();
    await expect(page.locator('.kudos li')).toHaveCount(3);
    await expect(page.locator('.prev-captions blockquote')).toHaveCount(3);
  });
}
