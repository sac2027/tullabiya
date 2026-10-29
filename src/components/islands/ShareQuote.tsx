import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import { renderShareCard, type ShareCardOptions } from '~/lib/shareCard';
import { $profile, hydrate } from '~/lib/store';
import { displayName } from '~/lib/name';

interface Props {
  lang: Lang;
  issue: number;
  storyId: string;
  source: string;
  issueLine: string;
  coverUrl?: string;
  coverLine?: string;
  /** Selector of the element whose text may be selected and shared. */
  bodySelector: string;
}

declare global {
  interface Window {
    __tullabiya?: { renderShareCard: typeof renderShareCard };
  }
}

async function deliver(blob: Blob, fileName: string, text: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (typeof nav.share === 'function' && (!nav.canShare || nav.canShare({ files: [file] }))) {
    try {
      await nav.share({ files: [file], text });
      return 'shared';
    } catch {}
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}

/** Select a sentence, get a card. Also the story's share button (link via Web Share, else copy). */
export default function ShareQuote({ lang, issue, storyId, source, issueLine, coverUrl, coverLine, bodySelector }: Props) {
  const profile = useStore($profile);
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);
  const [note, setNote] = useState('');
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    hydrate(issue);
    window.__tullabiya = { renderShareCard };
    const body = document.querySelector(bodySelector);
    const onSel = () => {
      const s = document.getSelection();
      const text = s?.toString().trim() ?? '';
      if (!s || s.isCollapsed || text.length < 10 || !body || !body.contains(s.anchorNode)) {
        setSel(null);
        return;
      }
      const r = s.getRangeAt(0).getBoundingClientRect();
      setSel({ text: text.slice(0, 280), x: r.left + r.width / 2 + scrollX, y: r.top + scrollY });
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [bodySelector, issue]);

  const base: Omit<ShareCardOptions, 'kind'> = {
    source,
    issueLine,
    lang,
    profile,
    forLine: profile ? t(lang, 'share.for', { name: displayName(profile.name) }) : undefined,
  };

  async function shareQuote() {
    if (!sel) return;
    const { blob } = await renderShareCard({ ...base, kind: 'quote', quote: sel.text });
    const how = await deliver(blob, `tullabiya-${storyId}-quote.png`, `${sel.text} — ${source}`);
    setNote(t(lang, how === 'downloaded' ? 'story.downloaded' : 'story.share'));
    setSel(null);
  }

  async function shareStory() {
    const nav = navigator as Navigator;
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: source, url: location.href });
        return;
      } catch {}
    }
    const { blob } = await renderShareCard({ ...base, kind: coverUrl ? 'cover' : 'quote', quote: source, coverUrl, coverLine });
    const how = await deliver(blob, `tullabiya-${storyId}.png`, location.href);
    setNote(t(lang, how === 'downloaded' ? 'story.downloaded' : 'story.share'));
  }

  return (
    <>
      <button type="button" class="btn sm" onClick={shareStory}>{t(lang, 'story.share')}</button>
      <span class="note" aria-live="polite" data-share-note>{note}</span>
      {sel && (
        <button
          ref={btn}
          type="button"
          class="btn sm yellow share-float"
          style={{ insetBlockStart: `${Math.max(8, sel.y - 56)}px`, insetInlineStart: lang === 'ar' ? 'auto' : `${sel.x}px`, insetInlineEnd: lang === 'ar' ? `${Math.max(8, document.documentElement.clientWidth - sel.x)}px` : 'auto' }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={shareQuote}
        >
          {t(lang, 'story.shareQuote')}
        </button>
      )}
    </>
  );
}
