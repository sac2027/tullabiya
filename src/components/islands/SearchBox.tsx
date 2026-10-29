import { useRef, useState } from 'preact/hooks';
import { t, tp } from '~/i18n';
import type { Lang } from '~/lib/model';

interface Hit {
  url: string;
  title: string;
  excerpt: string;
}
interface Props {
  lang: Lang;
  /** Story titles and urls for the fallback when the Pagefind index is absent (dev server). */
  fallback: { title: string; url: string; text: string }[];
}

interface Pagefind {
  init?: () => Promise<void>;
  search: (q: string) => Promise<{ results: { data: () => Promise<{ url: string; meta: { title?: string }; excerpt: string }> }[] }>;
}

/** Full-text search over the site's own stories (Pagefind), with a plain title/summary filter as fallback. */
export default function SearchBox({ lang, fallback }: Props) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const pf = useRef<Pagefind | null | 'none'>(null);

  async function engine(): Promise<Pagefind | null> {
    if (pf.current === 'none') return null;
    if (pf.current) return pf.current;
    try {
      // Built at runtime so Vite leaves it alone: the index exists only in the built site.
      const path = ['', 'pagefind', 'pagefind.js'].join('/');
      const mod = (await import(/* @vite-ignore */ path)) as Pagefind;
      await mod.init?.();
      pf.current = mod;
      return mod;
    } catch {
      pf.current = 'none';
      return null;
    }
  }

  async function run(e: Event) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setBusy(true);
    const pfx = await engine();
    let out: Hit[] = [];
    if (pfx) {
      try {
        const r = await pfx.search(term);
        const top = await Promise.all(r.results.slice(0, 20).map((x) => x.data()));
        out = top
          .filter((d) => d.url.startsWith(`/${lang}/`))
          .map((d) => ({ url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt }));
      } catch {}
    }
    if (!pfx || out.length === 0) {
      const n = term.toLowerCase();
      out = fallback.filter((f) => f.title.toLowerCase().includes(n) || f.text.toLowerCase().includes(n)).map((f) => ({ url: f.url, title: f.title, excerpt: f.text.slice(0, 160) }));
    }
    setHits(out);
    setBusy(false);
  }

  return (
    <div class="searchbox">
      <form class="search" role="search" onSubmit={run}>
        <label class="sr" for="arch-q">{t(lang, 'arch.searchLabel')}</label>
        <input id="arch-q" type="search" placeholder={t(lang, 'arch.searchPlaceholder')} value={q} onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)} />
        <button class="btn" type="submit" disabled={busy}>{t(lang, 'arch.search')}</button>
      </form>
      {hits && (
        <div class="results" aria-live="polite" data-count={hits.length}>
          <p class="results-n">{tp(lang, 'arch.searchResults', hits.length)}</p>
          {hits.length === 0 && <p class="results-empty">{t(lang, 'arch.searchEmpty', { q: q.trim() })}</p>}
          <ul>
            {hits.map((h) => (
              <li key={h.url}>
                <a href={h.url}>{h.title}</a>
                <p dangerouslySetInnerHTML={{ __html: h.excerpt.replace(/<(?!\/?mark\b)[^>]*>/g, '') }} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
