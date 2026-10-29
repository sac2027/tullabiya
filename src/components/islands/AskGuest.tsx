import { useEffect, useState } from 'preact/hooks';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import { getApi } from '~/lib/api';
import SubmitBox from './SubmitBox';

interface Props {
  lang: Lang;
  questions: { id: string; text: string; votes: number }[];
}

/** Approved questions with one upvote each per reader; new questions go to review. */
export default function AskGuest({ lang, questions }: Props) {
  const [votes, setVotes] = useState<Record<string, { count: number; mine: boolean }>>({});

  useEffect(() => {
    getApi()
      .exportAll()
      .then((json) => {
        const mine = new Set<string>((JSON.parse(json).upvotes as string[]) ?? []);
        const v: Record<string, { count: number; mine: boolean }> = {};
        for (const q of questions) v[q.id] = { count: q.votes + (mine.has(q.id) ? 1 : 0), mine: mine.has(q.id) };
        setVotes(v);
      });
  }, [questions]);

  const countOf = (q: Props['questions'][number]) => votes[q.id]?.count ?? q.votes;
  const sorted = [...questions].sort((a, b) => countOf(b) - countOf(a));

  async function toggle(id: string) {
    const r = await getApi().upvoteQuestion(id);
    setVotes((s) => ({ ...s, [id]: r }));
  }

  return (
    <div class="ask">
      <ul class="qs">
        {sorted.map((q) => {
          const v = votes[q.id] ?? { count: q.votes, mine: false };
          return (
            <li key={q.id}>
              <span>{q.text}</span>
              <button type="button" class="react" aria-pressed={v.mine} aria-label={`${t(lang, v.mine ? 'community.upvoted' : 'community.upvote')}: ${q.text}`} onClick={() => toggle(q.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 19V6M6 12l6-6 6 6" />
                </svg>
                <span class="n">{v.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <SubmitBox lang={lang} kind="ask-guest" label={t(lang, 'community.askPlaceholder')} placeholder={t(lang, 'community.askPlaceholder')} />
    </div>
  );
}
