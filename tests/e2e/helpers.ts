import { expect, type Page } from '@playwright/test';

/** Fails on horizontal overflow in either direction. RTL pages overflow to the left, which a plain
 *  scrollWidth check hides; Chrome also folds a classic left-side scrollbar into scrollWidth/scrollX,
 *  so the scrollbar width is discounted. */
export async function expectNoHorizontalScroll(page: Page) {
  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const x0 = scrollX;
    const y0 = scrollY;
    scrollTo(-1e6, y0);
    const minX = scrollX;
    scrollTo(1e6, y0);
    const maxX = scrollX;
    scrollTo(x0, y0);
    const sb = Math.max(0, innerWidth - de.clientWidth);
    return { minX, maxX, sw: de.scrollWidth, cw: de.clientWidth, sb };
  });
  expect(r.minX, `leftward overflow ${JSON.stringify(r)}`).toBeGreaterThanOrEqual(-r.sb - 1);
  expect(r.maxX, `rightward overflow ${JSON.stringify(r)}`).toBeLessThanOrEqual(r.sb + 1);
  expect(r.sw, `scrollWidth ${JSON.stringify(r)}`).toBeLessThanOrEqual(r.cw + r.sb + 1);
}

/** Lines a heading occupies, from its box height and computed line-height. */
export async function headingLines(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    return el.getBoundingClientRect().height / lh;
  });
}

/** Record anchor-initiated downloads instead of handing them to the OS; returns name and decoded content. */
export async function captureDownloads(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __downloads: { name: string; href: string }[] }).__downloads = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.hasAttribute('download')) {
        (window as unknown as { __downloads: { name: string; href: string }[] }).__downloads.push({ name: this.download, href: this.href });
        return;
      }
      return orig.call(this);
    };
  });
}

export async function lastDownload(page: Page): Promise<{ name: string; body: string }> {
  return page.evaluate(async () => {
    const list = (window as unknown as { __downloads: { name: string; href: string }[] }).__downloads;
    const d = list[list.length - 1];
    if (!d) throw new Error('no download captured');
    const body = d.href.startsWith('data:') ? decodeURIComponent(d.href.slice(d.href.indexOf(',') + 1)) : await (await fetch(d.href)).text();
    return { name: d.name, body };
  });
}

/** Wait for the first Astro island inside `scope` to hydrate (Astro drops `ssr` after hydration). */
export async function hydrated(page: Page, scope: string) {
  await page.locator(`${scope} astro-island:not([ssr])`).first().waitFor({ state: 'attached' });
}
