// Deep links into Google Calendar and Outlook for one event.
import type { Lang } from '~/lib/model';
import { L } from '~/i18n';
import { riyadhLocal, type IcsEvent } from '~/lib/ics';

function compact(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

function plusDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function endIso(e: IcsEvent): string {
  return e.end ?? new Date(new Date(e.start).getTime() + 3600_000).toISOString();
}

export function googleUrl(e: IcsEvent, lang: Lang): string {
  const dates = e.allDay
    ? `${compact(e.start)}/${compact(plusDays((e.end ?? e.start).slice(0, 10), 1))}`
    : `${riyadhLocal(e.start)}/${riyadhLocal(endIso(e))}`;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: L(e.title, lang), dates, ctz: 'Asia/Riyadh' });
  if (e.description) p.set('details', L(e.description, lang));
  if (e.location) p.set('location', L(e.location, lang));
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function outlookUrl(e: IcsEvent, lang: Lang): string {
  const p = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: L(e.title, lang) });
  if (e.allDay) {
    p.set('startdt', e.start.slice(0, 10));
    p.set('enddt', plusDays((e.end ?? e.start).slice(0, 10), 1));
    p.set('allday', 'true');
  } else {
    p.set('startdt', new Date(e.start).toISOString());
    p.set('enddt', new Date(endIso(e)).toISOString());
  }
  if (e.description) p.set('body', L(e.description, lang));
  if (e.location) p.set('location', L(e.location, lang));
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p.toString()}`;
}
