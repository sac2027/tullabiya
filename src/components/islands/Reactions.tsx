import { useEffect, useState } from 'preact/hooks';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import { getApi, type ReactionKind, type ReactionState } from '~/lib/api';

interface Props {
  lang: Lang;
  storyId: string;
}

const KINDS: { k: ReactionKind; key: 'react.useful' | 'react.inspiring' | 'react.metoo'; d: string }[] = [
  { k: 'useful', key: 'react.useful', d: 'M8 12.5l2.6 2.6L16 9.5' },
  { k: 'inspiring', key: 'react.inspiring', d: 'M12 7v10M7 12h10' },
  { k: 'metoo', key: 'react.metoo', d: 'M9.5 10.5h.01M14.5 10.5h.01M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8' },
];

/** Three octagon reactions. Toggle = state change: 150ms color, 160ms press, icon scale. */
export default function Reactions({ lang, storyId }: Props) {
  const [state, setState] = useState<ReactionState | null>(null);
  useEffect(() => {
    let alive = true;
    getApi().getReactions(storyId).then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, [storyId]);

  const toggle = async (k: ReactionKind) => {
    // optimistic, then reconcile
    setState((s) => {
      if (!s) return s;
      const on = s.mine.includes(k);
      return { counts: { ...s.counts, [k]: s.counts[k] + (on ? -1 : 1) }, mine: on ? s.mine.filter((x) => x !== k) : [...s.mine, k] };
    });
    setState(await getApi().toggleReaction(storyId, k));
  };

  return (
    <div class="reacts" role="group" aria-label={lang === 'ar' ? 'تفاعل' : 'React'}>
      {KINDS.map(({ k, key, d }) => {
        const on = !!state?.mine.includes(k);
        return (
          <button key={k} type="button" class="react" aria-pressed={on} onClick={() => toggle(k)} disabled={!state}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 3h6l6 6v6l-6 6H9l-6-6V9z" />
              <path d={d} />
            </svg>
            <span>{t(lang, key)}</span>
            <span class="n">{state ? state.counts[k] : ''}</span>
          </button>
        );
      })}
    </div>
  );
}
