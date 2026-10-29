import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';

interface Props {
  lang: Lang;
  issue: number;
  pages: number;
  base: string;
}

const src = (base: string, p: number) => `${base}p${String(p).padStart(2, '0')}.jpg`;

/** The printed issue, page by page: buttons, arrows in reading direction, a swipe, thumbnails. */
export default function PageViewer({ lang, issue, pages, base }: Props) {
  const [p, setP] = useState(1);
  const [fading, setFading] = useState(false);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  function go(next: number) {
    const n = Math.max(1, Math.min(pages, next));
    if (n === p) return;
    setFading(true);
    setTimeout(() => {
      setP(n);
      setFading(false);
    }, 120);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'ArrowLeft') go(dir === 'rtl' ? p + 1 : p - 1);
      else if (e.key === 'ArrowRight') go(dir === 'rtl' ? p - 1 : p + 1);
      else return;
      e.preventDefault();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <div class="viewer" aria-label={t(lang, 'arch.viewer')}>
      <div
        class="viewer-stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, t: Date.now() };
        }}
        onPointerUp={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          const v = Math.abs(dx) / Math.max(1, Date.now() - drag.current.t);
          drag.current = null;
          if (Math.abs(dx) < 60 && v < 0.11) return;
          const forward = dir === 'rtl' ? dx > 0 : dx < 0;
          go(forward ? p + 1 : p - 1);
        }}
      >
        <img class={fading ? 'fading' : ''} src={src(base, p)} alt={t(lang, 'story.printedAlt', { n: p })} width={918} height={1298} data-page={p} />
      </div>
      <div class="viewer-nav">
        <button type="button" class="btn sm" onClick={() => go(p - 1)} disabled={p === 1}>{t(lang, 'arch.prevPage')}</button>
        <span class="viewer-count" aria-live="polite">{t(lang, 'arch.page', { k: p, n: pages })}</span>
        <button type="button" class="btn sm" onClick={() => go(p + 1)} disabled={p === pages}>{t(lang, 'arch.nextPage')}</button>
      </div>
      <div class="thumbs" role="tablist" aria-label={t(lang, 'arch.viewer')}>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" role="tab" aria-selected={n === p} class={`thumb${n === p ? ' sel' : ''}`} onClick={() => go(n)} aria-label={t(lang, 'arch.page', { k: n, n: pages })}>
            <img src={src(base, n)} alt="" width={92} height={130} loading="lazy" />
          </button>
        ))}
      </div>
      <p class="sr">{t(lang, 'arch.issue', { n: issue })}</p>
    </div>
  );
}
