import { useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import { displayName } from '~/lib/name';
import { sectionsReadCount } from '~/lib/progress';
import { $profile, $progress, hydrate } from '~/lib/store';
import { useMounted } from '~/lib/useMounted';

interface Props {
  lang: Lang;
  issue: number;
  nextDate: string;
  sectionCount: number;
}

/** The issue is finite. Appears once every section is read; no streaks, no nagging. */
export default function EndOfIssue({ lang, issue, nextDate, sectionCount }: Props) {
  const profileStore = useStore($profile);
  const progressStore = useStore($progress);
  const mounted = useMounted();
  const profile = mounted ? profileStore : null;
  const progress = mounted ? progressStore : null;
  useEffect(() => void hydrate(issue), [issue]);
  const done = sectionsReadCount(progress ?? undefined) >= sectionCount;
  const line = profile
    ? t(lang, 'end.caughtUp', { name: displayName(profile.name), address: profile.address })
    : t(lang, 'end.caughtUpAnon');
  return (
    <section class="end" aria-live="polite" data-done={done ? 'true' : 'false'}>
      <p>
        {done ? line : t(lang, 'favs.progress', { k: sectionsReadCount(progress ?? undefined), n: sectionCount, address: profile?.address ?? 'neutral' })}
        <br />
        {t(lang, 'end.next', { date: nextDate })}
      </p>
    </section>
  );
}
