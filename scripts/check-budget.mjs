// Performance budget on the built site: home JavaScript under 120 KB gzipped,
// no hero image over 250 KB. Run after `npm run build`.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const JS_BUDGET = 120 * 1024;
const IMG_BUDGET = 250 * 1024;

function page(path) {
  return readFileSync(join(DIST, path), 'utf8');
}

function scriptsIn(html) {
  const out = new Set();
  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) out.add(m[1]);
  for (const m of html.matchAll(/component-url="([^"]+)"/g)) out.add(m[1]);
  for (const m of html.matchAll(/renderer-url="([^"]+)"/g)) out.add(m[1]);
  for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) out.add(m[1]);
  return [...out].filter((s) => s.startsWith('/_astro/'));
}

function importsOf(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  let src = '';
  try {
    src = readFileSync(join(DIST, file), 'utf8');
  } catch {
    return seen;
  }
  for (const m of src.matchAll(/from"(\.\/[^"]+\.js)"/g)) importsOf('/_astro/' + m[1].slice(2), seen);
  for (const m of src.matchAll(/import\("(\.\/[^"]+\.js)"\)/g)) importsOf('/_astro/' + m[1].slice(2), seen);
  return seen;
}

let failed = false;
for (const lang of ['ar', 'en']) {
  const html = page(`${lang}/index.html`);
  const files = new Set();
  for (const s of scriptsIn(html)) importsOf(s, files);
  let total = 0;
  for (const f of files) total += gzipSync(readFileSync(join(DIST, f))).length;
  const kb = (total / 1024).toFixed(1);
  console.log(`${lang}/ home JS: ${kb} KB gzipped across ${files.size} modules (budget ${JS_BUDGET / 1024} KB)`);
  if (total > JS_BUDGET) failed = true;
  const hero = html.match(/<img[^>]+fetchpriority="high"[^>]+src="([^"]+)"/)?.[1] ?? html.match(/<img[^>]+src="([^"]+)"[^>]+fetchpriority="high"/)?.[1];
  if (hero) {
    const size = statSync(join(DIST, decodeURIComponent(hero))).size;
    console.log(`${lang}/ hero image: ${(size / 1024).toFixed(0)} KB (budget ${IMG_BUDGET / 1024} KB) ${hero}`);
    if (size > IMG_BUDGET) failed = true;
  }
}
const astroDir = join(DIST, '_astro');
const big = readdirSync(astroDir)
  .filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
  .map((f) => ({ f, s: statSync(join(astroDir, f)).size }))
  .filter((x) => x.s > IMG_BUDGET);
for (const b of big) console.log(`note: large image ${b.f} ${(b.s / 1024).toFixed(0)} KB`);
if (failed) {
  console.error('budget exceeded');
  process.exit(1);
}
console.log('budget ok');
