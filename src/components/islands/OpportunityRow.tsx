import { useEffect, useState } from 'preact/hooks';
import { t, tp } from '~/i18n';
import type { Lang } from '~/lib/model';
import { getApi } from '~/lib/api';
import type { IcsEvent } from '~/lib/ics';
import AddToCalendar from './AddToCalendar';

interface Props {
  lang: Lang;
  event: IcsEvent;
  eventId: string;
  day: number;
  weekday: string;
  title: string;
  organizer: string;
  askHref: string;
  /** Days until the event relative to the demo "today"; negative when past. */
  daysLeft: number;
}

/** One opportunity: register (state toggle), add to calendar, ask the organizer. */
export default function OpportunityRow({ lang, event, eventId, day, weekday, title, organizer, askHref, daysLeft }: Props) {
  const [reg, setReg] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    getApi().getRegistrations().then((r) => alive && setReg(r.includes(eventId)));
    return () => {
      alive = false;
    };
  }, [eventId]);
  const toggle = async () => {
    setReg((r) => !r);
    const list = await getApi().toggleRegistration(eventId);
    setReg(list.includes(eventId));
  };
  const left = daysLeft < 0 ? t(lang, 'opp.past') : tp(lang, 'opp.daysLeft', daysLeft);

  return (
    <article class="row">
      <div class="d">
        {day}
        <small>{weekday}</small>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{organizer}</p>
        <p class="left">{left}</p>
      </div>
      <div class="acts">
        <button type="button" class={`btn sm${reg ? ' done' : ''}`} aria-pressed={!!reg} onClick={toggle} disabled={reg === null}>
          {reg ? t(lang, 'opp.registered') : t(lang, 'opp.register')}
        </button>
        <AddToCalendar lang={lang} event={event} />
        <a class="btn sm ghost" href={askHref}>{t(lang, 'opp.ask')}</a>
      </div>
    </article>
  );
}
