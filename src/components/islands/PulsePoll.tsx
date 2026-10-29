import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { t, tp, L } from '~/i18n';
import { college, type Lang } from '~/lib/model';
import { getApi, type PollState } from '~/lib/api';
import { BREAKDOWN_MIN } from '~/lib/poll';
import { $profile, hydrate, markProgress } from '~/lib/store';
import { useMounted } from '~/lib/useMounted';

interface Props {
  lang: Lang;
  issue: number;
  pollId: string;
  options: { id: string; label: string }[];
  lead?: string;
}

/** Vote first, then the bars grow to the result (900ms ease-out) and keep moving while the poll is live. */
export default function PulsePoll({ lang, issue, pollId, options, lead }: Props) {
  const profileStore = useStore($profile);
  const mounted = useMounted();
  const profile = mounted ? profileStore : null;
  const [state, setState] = useState<PollState | null>(null);
  const [live, setLive] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate(issue);
    let stop: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !stop) {
          stop = getApi().subscribePoll(pollId, setState);
          setLive(true);
        } else if (!e.isIntersecting && stop) {
          stop();
          stop = null;
          setLive(false);
        }
      },
      { threshold: 0.2 },
    );
    if (root.current) io.observe(root.current);
    getApi().getPoll(pollId).then(setState);
    return () => {
      io.disconnect();
      stop?.();
    };
  }, [pollId, issue]);

  const voted = !!state?.myVote;

  async function vote(optionId: string) {
    if (voted) return;
    setState(await getApi().vote(pollId, optionId));
    await markProgress(issue, { voted: true });
  }

  const pct = (id: string) => state?.options.find((o) => o.id === id)?.pct ?? 0;
  const mine = profile ? state?.byCollege?.[profile.college] : undefined;
  const myOption = state?.myVote ? options.find((o) => o.id === state.myVote) : undefined;
  const announce = voted ? options.map((o) => `${o.label} ${pct(o.id)}%`).join(lang === 'ar' ? '، ' : ', ') : '';

  return (
    <div ref={root}>
      {lead && <p class="lead">{lead}</p>}
      <div class={`opts${voted ? ' voted' : ''}`} role="group" aria-label={t(lang, 'nav.pulse')}>
        {options.map((o, i) => {
          const p = pct(o.id);
          return (
            <button
              key={o.id}
              type="button"
              class={`opt fast-slab ${i === 0 ? 'a' : 'b'}${state?.myVote === o.id ? ' mine' : ''}`}
              disabled={voted || !state}
              aria-pressed={state?.myVote === o.id}
              onClick={() => vote(o.id)}
            >
              <span class="fill" style={{ '--p': voted ? p / 100 : 1 } as never} aria-hidden="true" />
              <span class="lab">{o.label}</span>
              <span class="pct" aria-hidden="true">{voted ? `${p}%` : ''}</span>
            </button>
          );
        })}
      </div>
      <p class="sr" aria-live="polite">{announce}</p>
      <p class="cmp" data-cmp>
        {voted && mine && myOption && t(lang, 'pulse.compare', { college: L(college(profile!.college).name, lang), option: myOption.label, mine: mine.pct[myOption.id] ?? 0, all: pct(myOption.id) })}
        {voted && profile && !mine && t(lang, 'pulse.breakdownSoon', { k: BREAKDOWN_MIN })}
        {voted && !profile && state && tp(lang, 'pulse.votes', state.total)}
        {!voted && t(lang, 'pulse.voteFirst')}
      </p>
      {voted && (
        <p class="live" aria-hidden={!live}>
          <i /> {t(lang, 'pulse.live')}{state ? ' · ' + tp(lang, 'pulse.votes', state.total) : ''}
        </p>
      )}
    </div>
  );
}
