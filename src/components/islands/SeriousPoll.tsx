import { useEffect, useState } from 'preact/hooks';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import { getApi, type PollState } from '~/lib/api';
import { markProgress } from '~/lib/store';

interface Props {
  lang: Lang;
  issue: number;
  pollId: string;
  question: string;
  options: { id: string; label: string }[];
  answer?: string;
}

/** The question the Deanship commits to answer. Yes/no, then the split and the promise. */
export default function SeriousPoll({ lang, issue, pollId, question, options, answer }: Props) {
  const [state, setState] = useState<PollState | null>(null);
  useEffect(() => {
    getApi().getPoll(pollId).then(setState);
  }, [pollId]);
  const voted = !!state?.myVote;
  const pct = (id: string) => state?.options.find((o) => o.id === id)?.pct ?? 0;

  return (
    <aside class="serious" aria-labelledby="serious-title">
      <h3 id="serious-title">{question}</h3>
      <p>{t(lang, 'pulse.seriousNote')}</p>
      <div class="row-btns">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            class={`btn sm${state?.myVote === o.id ? ' done' : ''}`}
            disabled={voted || !state}
            aria-pressed={state?.myVote === o.id}
            onClick={async () => {
              setState(await getApi().vote(pollId, o.id));
              await markProgress(issue, { voted: true });
            }}
          >
            {o.label}
            {voted ? ` ${pct(o.id)}%` : ''}
          </button>
        ))}
      </div>
      <p class="msg" aria-live="polite">{voted ? t(lang, 'pulse.seriousThanks') : ''}</p>
      {answer && (
        <p>
          <strong>{t(lang, 'pulse.answer')}:</strong> {answer}
        </p>
      )}
    </aside>
  );
}
