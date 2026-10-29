import { describe, it, expect } from 'vitest';
import { buildIcs, escapeText, foldLine, toIcsEvent, type IcsEvent } from '~/lib/ics';
import { googleUrl, outlookUrl } from '~/lib/calendarLinks';
import { loadAll } from '~/data';

const b = loadAll();
const bcg = toIcsEvent(b.events.find((e) => e.id === 'bcg-2026-09-15')!);
const src = toIcsEvent(b.events.find((e) => e.id === 'src-2026')!);

function unfold(s: string): string {
  return s.replace(/\r\n[ \t]/g, '');
}

describe('foldLine', () => {
  it('keeps every physical line within 75 octets and never splits a character', () => {
    const title = 'SUMMARY:' + 'لقاء تعريفي مع شركة الاستشارات في الحرم الجامعي '.repeat(5);
    const folded = foldLine(title);
    const enc = new TextEncoder();
    const lines = folded.split('\r\n');
    expect(lines.length).toBeGreaterThan(2);
    for (const l of lines) expect(enc.encode(l).length).toBeLessThanOrEqual(75);
    for (const l of lines.slice(1)) expect(l.startsWith(' ')).toBe(true);
    expect(unfold(folded)).toBe(title);
    expect(folded).not.toContain('�');
    // round-trip through bytes: no decode error
    expect(new TextDecoder('utf-8', { fatal: true }).decode(enc.encode(folded))).toBe(folded);
  });
});

describe('escapeText', () => {
  it('escapes commas, semicolons, backslashes and newlines', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });
});

describe('buildIcs', () => {
  it('writes a one-day all-day event with an exclusive end', () => {
    const ics = buildIcs([bcg], 'ar');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260915');
    expect(ics).toContain('DTEND;VALUE=DATE:20260916');
  });
  it('a two-day event ends the day after', () => {
    const ics = buildIcs([src], 'ar');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260901');
    expect(ics).toContain('DTEND;VALUE=DATE:20260903');
  });
  it('timed events carry TZID=Asia/Riyadh and a VTIMEZONE at +0300', () => {
    const timed: IcsEvent = { ...bcg, allDay: false, start: '2026-09-15T14:00:00+03:00', end: '2026-09-15T15:30:00+03:00' };
    const ics = buildIcs([timed], 'en');
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20260915T140000');
    expect(ics).toContain('DTEND;TZID=Asia/Riyadh:20260915T153000');
    expect(ics).toContain('TZOFFSETTO:+0300');
    expect(ics).toContain('BEGIN:VTIMEZONE');
  });
  it('uses CRLF and ends with END:VCALENDAR', () => {
    const ics = buildIcs([bcg], 'ar');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
  });
  it('UID is stable across calls', () => {
    expect(toIcsEvent(b.events[3]).uid).toBe(toIcsEvent(b.events[3]).uid);
    expect(bcg.uid).toMatch(/^20260915-[0-9a-f]{8}@tullabiya\.kfupm\.edu\.sa$/);
  });
  it('summary follows the language and falls back to Arabic', () => {
    expect(unfold(buildIcs([bcg], 'en'))).toContain('SUMMARY:BCG on Campus');
    expect(unfold(buildIcs([bcg], 'ar'))).toContain('SUMMARY:BCG في الحرم الجامعي');
    const arOnly: IcsEvent = { ...bcg, title: { ar: 'عربي فقط' } };
    expect(unfold(buildIcs([arOnly], 'en'))).toContain('SUMMARY:عربي فقط');
  });
  it('includes a calendar name when asked', () => {
    expect(buildIcs([bcg], 'ar', { calName: 'تقويم الطلّابية' })).toContain('X-WR-CALNAME:تقويم الطلّابية');
  });
});

describe('calendar links', () => {
  it('google link carries dates and encoded text', () => {
    const u = googleUrl(bcg, 'ar');
    expect(u).toContain('dates=20260915%2F20260916');
    expect(u).toContain('text=' + encodeURIComponent('BCG في الحرم الجامعي').replace(/%20/g, '+'));
    expect(u.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE')).toBe(true);
  });
  it('outlook link is all-day with ISO dates', () => {
    const u = outlookUrl(bcg, 'en');
    expect(u).toContain('startdt=2026-09-15');
    expect(u).toContain('enddt=2026-09-16');
    expect(u).toContain('allday=true');
  });
});
