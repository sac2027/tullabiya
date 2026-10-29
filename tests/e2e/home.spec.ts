import { test, expect, type Page } from '@playwright/test';

async function noHorizontalScroll(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, 'horizontal overflow').toBeLessThanOrEqual(iw + 1);
}

async function headingLines(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    return el.getBoundingClientRect().height / lh;
  });
}

for (const lang of ['ar', 'en'] as const) {
  test.describe(`home ${lang}`, () => {
    test('one h1 within two lines, headings on every section, no overflow', async ({ page }) => {
      await page.goto(`/${lang}/`);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await headingLines(page, 'h1')).toBeLessThanOrEqual(2.2);
      await noHorizontalScroll(page);
      const sections = page.locator('section');
      const n = await sections.count();
      expect(n).toBeGreaterThan(6);
      for (let i = 0; i < n; i++) {
        const s = sections.nth(i);
        const labelled = await s.getAttribute('aria-labelledby');
        const hasHeading = (await s.locator('h1, h2, h3').count()) > 0;
        const live = await s.getAttribute('aria-live');
        expect(labelled || hasHeading || live, `section ${i} has a heading`).toBeTruthy();
      }
    });

    test('every image has alt and the hero image has dimensions', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const imgs = page.locator('img');
      const n = await imgs.count();
      expect(n).toBeGreaterThan(4);
      for (let i = 0; i < n; i++) {
        const alt = await imgs.nth(i).getAttribute('alt');
        expect(alt, `img ${i} alt`).toBeTruthy();
      }
      const hero = page.locator('.hero-photo img');
      await expect(hero).toHaveAttribute('width', /\d+/);
      await expect(hero).toHaveAttribute('height', /\d+/);
    });

    test('layout shift stays small after load', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const cls = await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            let total = 0;
            const po = new PerformanceObserver((list) => {
              for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
                if (!e.hadRecentInput) total += e.value;
              }
            });
            po.observe({ type: 'layout-shift', buffered: true });
            setTimeout(() => {
              po.disconnect();
              resolve(total);
            }, 1500);
          }),
      );
      expect(cls).toBeLessThan(0.05);
    });

    test('renders the hero, news and opportunities without JavaScript', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:4321/${lang}/`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.news h2')).toBeVisible();
      await expect(page.locator('.lead-story h3')).toBeVisible();
      await expect(page.locator('.opp h2')).toBeVisible();
      expect(await page.locator('.row').count()).toBeGreaterThan(0);
      await ctx.close();
    });
  });
}
