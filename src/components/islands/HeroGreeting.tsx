import { useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { t, tp, L } from '~/i18n';
import { college, type CollegeId, type Lang } from '~/lib/model';
import { displayName, dirFor } from '~/lib/name';
import { $profile, $sheet, hydrate } from '~/lib/store';

interface Props {
  lang: Lang;
  issue: number;
  month: string;
  totalEvents: number;
  /** Events per college id, computed at build time. */
  perCollege: Partial<Record<CollegeId, number>>;
}

/** The page's one h1. Server-rendered anonymous; personalized after hydration, with no motion. */
export default function HeroGreeting({ lang, issue, month, totalEvents, perCollege }: Props) {
  const profile = useStore($profile);
  useEffect(() => void hydrate(issue), [issue]);

  if (!profile) {
    return (
      <>
        <h1 id="hero-title">{t(lang, 'hero.greetingAnon')}</h1>
        <p class="hero-sub">{t(lang, 'hero.subAnon', { issue, month, events: tp(lang, 'events.count', totalEvents) })}</p>
        <p class="hero-invite">
          <button type="button" class="btn ghost on-field" onClick={() => $sheet.set('onboarding')}>
            {t(lang, 'profile.anon')}
          </button>
        </p>
      </>
    );
  }
  const name = displayName(profile.name);
  const n = perCollege[profile.college] ?? 0;
  const greeting = t(lang, 'hero.greeting', { name: '\u0000' }).split('\u0000');
  const long = Array.from(name).length > 9;
  return (
    <>
      <h1 id="hero-title" class={long ? 'long' : undefined}>
        {greeting[0]}
        <bdi dir={dirFor(profile.name)}>{name}</bdi>
        {greeting[1]}
      </h1>
      <p class="hero-sub">
        {t(lang, 'hero.sub', { issue, month, events: tp(lang, 'events.count', n), college: L(college(profile.college).name, lang) })}
      </p>
    </>
  );
}
