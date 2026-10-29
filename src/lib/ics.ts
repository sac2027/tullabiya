// RFC 5545 calendar files with Arabic text that imports correctly everywhere.
import type { EventItem, Lang, Localized } from '~/lib/model';
import { L } from '~/i18n';

export interface IcsEvent {
  uid: string;
  title: Localized;
  description?: Localized;
  /** YYYY-MM-DD for all-day, else ISO datetime with offset. */
  start: string;
  end?: string;
  allDay: boolean;
  tz?: 'Asia/Riyadh';
  url?: string;
  location?: Localized;
}

const DOMAIN = 'tullabiya.kfupm.edu.sa';
const CRLF = '\r\n';

export function hashId(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function toIcsEvent(e: EventItem): IcsEvent {
  return {
    uid: `${compactDate(e.start)}-${hashId(e.id)}@${DOMAIN}`,
    title: e.title,
    description: e.description,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    tz: 'Asia/Riyadh',
    location: e.place,
  };
}

/** Escape per RFC 5545 section 3.3.11. */
export function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold to 75 octets per line; continuation lines start with one space and never split a UTF-8 sequence. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let curBytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (curBytes + n > limit) {
      out.push(cur);
      cur = ' ' + ch;
      curBytes = 1 + n;
      limit = 75;
    } else {
      cur += ch;
      curBytes += n;
    }
  }
  out.push(cur);
  return out.join(CRLF);
}

function compactDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Local wall-clock time in Riyadh as YYYYMMDDTHHMMSS. */
export function riyadhLocal(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${g('year')}${g('month')}${g('day')}T${g('hour')}${g('minute')}${g('second')}`;
}

function dtLines(e: IcsEvent): string[] {
  if (e.allDay) {
    const start = e.start.slice(0, 10);
    const endExclusive = addDays(e.end ? e.end.slice(0, 10) : start, 1);
    return [`DTSTART;VALUE=DATE:${compactDate(start)}`, `DTEND;VALUE=DATE:${compactDate(endExclusive)}`];
  }
  const endIso = e.end ?? new Date(new Date(e.start).getTime() + 60 * 60 * 1000).toISOString();
  return [`DTSTART;TZID=Asia/Riyadh:${riyadhLocal(e.start)}`, `DTEND;TZID=Asia/Riyadh:${riyadhLocal(endIso)}`];
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Riyadh',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0300',
  'TZOFFSETTO:+0300',
  'TZNAME:AST',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export function buildIcs(
  events: IcsEvent[],
  lang: Lang,
  opts: { calName?: string; stamp?: string } = {},
): string {
  const stamp = opts.stamp ?? '20260901T000000Z';
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//KFUPM Student Affairs//Al-Tullabiya//${lang.toUpperCase()}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  if (opts.calName) {
    lines.push(`X-WR-CALNAME:${escapeText(opts.calName)}`, 'X-WR-TIMEZONE:Asia/Riyadh');
  }
  if (events.some((e) => !e.allDay)) lines.push(...VTIMEZONE);
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stamp}`, ...dtLines(e), `SUMMARY:${escapeText(L(e.title, lang))}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeText(L(e.description, lang))}`);
    if (e.location) lines.push(`LOCATION:${escapeText(L(e.location, lang))}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}

export function icsFileName(e: IcsEvent): string {
  return `tullabiya-${compactDate(e.start)}.ics`;
}
