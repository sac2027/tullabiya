import { useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { t, L } from '~/i18n';
import { SECTIONS, type Lang } from '~/lib/model';
import { $favorites, $profile, $progress, hydrate, togglePinnedSection } from '~/lib/store';
import { sectionsReadCount } from '~/lib/progress';
import { Star } from './Onboarding';

interface Props {
  lang: Lang;
  issue: number;
}

/** Pin sections; see progress as five bars. Toggling is a state change: 150ms color, press feedback. */
export default function FavoritesBand({ lang, issue }: Props) {
  const favs = useStore($favorites);
  const progress = useStore($progress);
  const profile = useStore($profile);
  useEffect(() => void hydrate(issue), [issue]);
  const read = sectionsReadCount(progress ?? undefined);
  const readSet = new Set(progress?.sectionsRead ?? []);

  return (
    <div class="favs-in">
      <div>
        <h2 id="favs-title">{t(lang, 'favs.title')}</h2>
        <p class="lead">{t(lang, 'favs.lead')}</p>
        <div class="chips" role="group" aria-labelledby="favs-title">
          {SECTIONS.map((s) => {
            const on = favs.sections.includes(s.id);
            const label = L(s.name, lang);
            return (
              <button
                key={s.id}
                type="button"
                class="chip pin"
                aria-pressed={on}
                aria-label={t(lang, on ? 'favs.unpin' : 'favs.pin', { section: label })}
                onClick={() => void togglePinnedSection(s.id)}
              >
                <Star on={on} />
                <span aria-hidden="true">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div class="progress" aria-live="polite">
        <strong>{t(lang, 'favs.progress', { k: read, n: SECTIONS.length, address: profile?.address ?? 'neutral' })}</strong>
        <div class="pbars" aria-hidden="true">
          {SECTIONS.map((s) => (
            <i key={s.id} class={`fast-bar${readSet.has(s.id) ? ' on' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
