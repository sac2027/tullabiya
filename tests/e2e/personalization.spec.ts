import { test, expect, type Page } from '@playwright/test';

async function openSheet(page: Page) {
  // Astro drops the `ssr` attribute once an island has hydrated.
  await page.locator('.hero astro-island:not([ssr])').first().waitFor({ state: 'attached' });
  await page.locator('.hero-invite button').click();
  await expect(page.locator('.sheet-root[data-open="true"]')).toBeVisible();
}

async function h1Lines(page: Page) {
  return page.locator('h1').evaluate((el) => {
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().height / parseFloat(cs.lineHeight);
  });
}

test('first visit is generic; the hero invites; skipping keeps it generic', async ({ page }) => {
  await page.goto('/ar/');
  await expect(page.locator('h1')).toContainText('هذا شهرك في الجامعة');
  await expect(page.locator('.sheet-root')).toHaveAttribute('data-open', 'false');
  await openSheet(page);
  await page.getByRole('button', { name: 'لاحقاً' }).click();
  await expect(page.locator('.sheet-root')).toHaveAttribute('data-open', 'false');
  await expect(page.locator('h1')).toContainText('هذا شهرك في الجامعة');
});

test('completing the sheet personalizes the hero and chip, persists, and gendered copy follows', async ({ page }) => {
  await page.goto('/ar/');
  await openSheet(page);
  await page.getByLabel('اسمك').fill('ريم');
  await page.getByText('الحاسب الآلي والرياضيات').click();
  await page.getByText('بصيغة المؤنث').click();
  await page.locator('.sheet').getByRole('button', { name: 'ضيف الثلاثين' }).click();
  await page.getByRole('button', { name: 'احفظ' }).click();
  await expect(page.locator('.sheet-root')).toHaveAttribute('data-open', 'false');
  await expect(page.locator('h1')).toContainText('ريم');
  await expect(page.locator('h1')).toContainText('هذا شهرك');
  await expect(page.locator('.me-chip')).toContainText('ريم');
  await expect(page.locator('.favs-in .chip.pin[aria-pressed="true"]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('h1')).toContainText('ريم');
  await expect(page.locator('.progress strong')).toContainText('قرأتِ');
});

test('empty name is rejected and a non-image photo shows an error', async ({ page }) => {
  await page.goto('/ar/');
  await openSheet(page);
  await page.getByRole('button', { name: 'احفظ' }).click();
  await expect(page.locator('.form-err')).toContainText('اكتب اسمك');
  await page.locator('#ob-photo').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.locator('.form-err')).toContainText('صورة');
  await expect(page.locator('.sheet-photo img')).toHaveCount(0);
});

for (const name of ['A', 'عبدالعزيزعبدالرحمنعبداللهالفلانيالطويلجداجداجداجداجداجداجدا', 'Sara 👩‍💻 الطالبة']) {
  test(`name "${name.slice(0, 12)}" keeps the hero within two lines without overflow`, async ({ page }) => {
    await page.goto('/ar/');
    await openSheet(page);
    await page.getByLabel('اسمك').fill(name);
    await page.getByRole('button', { name: 'احفظ' }).click();
    await expect(page.locator('.sheet-root')).toHaveAttribute('data-open', 'false');
    expect(await h1Lines(page)).toBeLessThanOrEqual(2.2);
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    expect(sw).toBeLessThanOrEqual(iw + 1);
    await expect(page.locator('.me-chip .av')).toBeVisible();
  });
}
