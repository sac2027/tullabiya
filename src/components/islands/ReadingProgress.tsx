import { useEffect, useState } from 'preact/hooks';
import { t } from '~/i18n';
import type { Lang, SectionId } from '~/lib/model';
import { hydrate, markProgress } from '~/lib/store';

interface Props {
  lang: Lang;
  issue: number;
  section: SectionId;
  /** Selector of the article; reaching its end marks the section read. */
  articleSelector: string;
}

/** A thin bar that follows the scroll (linear, since it is a measure, not a decoration). */
export default function ReadingProgress({ lang, issue, section, articleSelector }: Props) {
  const [p, setP] = useState(0);
  useEffect(() => {
    hydrate(issue);
    const art = document.querySelector<HTMLElement>(articleSelector);
    if (!art) return;
    let marked = false;
    const onScroll = () => {
      const r = art.getBoundingClientRect();
      const total = r.height - innerHeight;
      const done = total <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / total));
      setP(done);
      if (!marked && done >= 0.95) {
        marked = true;
        void markProgress(issue, { sectionsRead: [section] });
      }
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, [articleSelector, issue, section]);

  return (
    <div class="read-progress" role="progressbar" aria-label={t(lang, 'story.progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
      <i style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
