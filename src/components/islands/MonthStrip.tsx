import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { L, t, tp, formatDate, weekdayName } from '~/i18n';
import { college, type EventItem, type Lang } from '~/lib/model';
import { buildStrip } from '~/lib/strip';
import { toIcsEvent } from '~/lib/ics';
import { initial } from '~/lib/name';
import { getApi } from '~/lib/api';
import { $profile, hydrate } from '~/lib/store';
import AddToCalendar from './AddToCalendar';
import { useMounted } from '~/lib/useMounted';

interface Props {
  lang: Lang;
  issue: number;
  year: number;
  month: number;
  monthLabel: string;
  /** ISO date treated as today; `?today=YYYY-MM-DD` overrides for demos. */
  today: string;
  events: EventItem[];
  unitNames: Record<string, string>;
  contactHrefs: Record<string, string>;
}

/** Thirty slanted bars, one per day. Grows once on load (never again); selection is instant. */
export default function MonthStrip({ lang, issue, year, month, monthLabel, today: todayProp, events, unitNames, contactHrefs }: Props) {
  const profileStore = useStore($profile);
  const mounted = useMounted();
  const profile = mounted ? profileStore : null;
  const [today, setToday] = useState(todayProp);
  const days = useMemo(() => buildStrip(events, year, month, profile), [events, year, month, profile]);
  const firstEventDay = days.find((d) => d.events.length)?.day ?? 1;
  const todayDay = today.startsWith(`${year}-${String(month).padStart(2, '0')}-`) ? Number(today.slice(8, 10)) : 0;
  const defaultSel = todayDay && days[todayDay - 1]?.events.length ? todayDay : (days.find((d) => d.day >= todayDay && d.events.length)?.day ?? firstEventDay);
  const [sel, setSel] = useState(defaultSel);
  const [evIdx, setEvIdx] = useState(0);
  const [reminders, setReminders] = useState<string[]>([]);
  const [grown, setGrown] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    hydrate(issue);
    const q = new URLSearchParams(location.search).get('today');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) setToday(q);
    getApi().getReminders().then(setReminders);
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [issue]);

  useEffect(() => {
    setSel(defaultSel);
  }, [defaultSel]);

  // Keep the selected day in view on narrow screens.
  useEffect(() => {
    const sc = scroller.current;
    const el = strip.current?.children[sel - 1] as HTMLElement | undefined;
    if (!sc || !el || sc.scrollWidth <= sc.clientWidth) return;
    // Scroll only the strip's own scroller; scrollIntoView would also move the window.
    const a = el.getBoundingClientRect();
    const b = sc.getBoundingClientRect();
    sc.scrollLeft += a.left + a.width / 2 - (b.left + b.width / 2);
  }, [sel]);

  const select = (d: number) => {
    setSel(d);
    setEvIdx(0);
  };

  const onKey = (e: KeyboardEvent) => {
    let next = sel;
    if (e.key === 'ArrowLeft') next = dir === 'rtl' ? sel + 1 : sel - 1;
    else if (e.key === 'ArrowRight') next = dir === 'rtl' ? sel - 1 : sel + 1;
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = days.length;
    else return;
    e.preventDefault();
    next = Math.max(1, Math.min(days.length, next));
    select(next);
    (strip.current?.children[next - 1] as HTMLElement | undefined)?.focus();
  };

  const day = days[sel - 1];
  const ev = day?.events[evIdx] ?? day?.events[0];
  const myCollege = profile ? college(profile.college) : null;

  return (
    <>
      <div class="legend">
        {myCollege && (
          <span>
            <i style={{ background: myCollege.color }} />
            {t(lang, 'month.legend.mine', { college: L(myCollege.name, lang) })}
          </span>
        )}
        <span>
          <i style={{ background: 'var(--bar)' }} />
          {t(lang, 'month.legend.all')}
        </span>
        <span>
          <i style={{ background: 'var(--quiet)' }} />
          {t(lang, 'month.legend.quiet')}
        </span>
      </div>
      <div class="strip-scroll" ref={scroller}>
        <div class={`strip${grown ? ' grow' : ''}`} ref={strip} role="group" aria-label={t(lang, 'month.days', { month: monthLabel })} onKeyDown={onKey}>
          {days.map((d) => {
            const isToday = d.day === todayDay;
            const label = `${t(lang, 'month.day', { d: d.day })}${isToday ? `, ${t(lang, 'month.today')}` : ''}${d.events.length ? ': ' + d.events.map((e) => L(e.title, lang)).join(lang === 'ar' ? '، ' : ', ') : ''}`;
            return (
              <button
                key={d.day}
                type="button"
                class={`day${d.kind !== 'quiet' ? ' ev' : ''}${d.kind === 'mine' ? ' mine' : ''}`}
                style={{ '--i': d.day } as never}
                aria-pressed={d.day === sel}
                aria-label={label}
                tabIndex={d.day === sel ? 0 : -1}
                onClick={() => select(d.day)}
              >
                {isToday && (
                  <span class="av you" aria-hidden="true" style={myCollege ? { background: myCollege.color, color: myCollege.ink === 'ink' ? 'var(--ink)' : 'var(--beige)' } : undefined}>
                    {profile ? initial(profile.name) : '•'}
                  </span>
                )}
                <span class="b" style={{ blockSize: `${d.heightPct}%` }} />
                <span class="n">{d.day}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div class="detail" aria-live="polite">
        <div class="big">{sel}</div>
        {!ev && (
          <div>
            <h3>{t(lang, 'month.quietTitle')}</h3>
            <p>{formatDate(lang, day.iso, { weekday: true })}</p>
            <p>{t(lang, 'month.quietLead')}</p>
          </div>
        )}
        {ev && (
          <div>
            <h3>{L(ev.title, lang)}</h3>
            <p>
              {weekdayName(lang, day.iso)}
              {day.events.length > 1 && ' ' + tp(lang, 'month.more', day.events.length - 1)}
            </p>
            <p>{L(ev.description, lang)}</p>
            <p>{t(lang, 'month.organizer', { unit: unitNames[ev.unitId] ?? ev.unitId })}</p>
            {day.events.length > 1 && (
              <div class="chips" role="group">
                {day.events.map((e, i) => (
                  <button key={e.id} type="button" class="chip pin" aria-pressed={i === evIdx} onClick={() => setEvIdx(i)}>
                    {L(e.title, lang)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {ev && (
          <div class="acts">
            <AddToCalendar lang={lang} event={toIcsEvent(ev)} label={t(lang, 'month.addCal')} />
            <button
              type="button"
              class={`btn sm${reminders.includes(ev.id) ? ' done' : ''}`}
              aria-pressed={reminders.includes(ev.id)}
              onClick={async () => setReminders(await getApi().toggleReminder(ev.id))}
            >
              {reminders.includes(ev.id) ? t(lang, 'month.reminded') : t(lang, 'month.remind')}
            </button>
            <a class="btn sm ghost" href={contactHrefs[ev.unitId] ?? 'mailto:dsa-mag@kfupm.edu.sa'}>{t(lang, 'month.contact')}</a>
          </div>
        )}
      </div>
    </>
  );
}
