// A month as rows of seven, and whole-day distances in Riyadh time.
import { daysInMonth } from '~/lib/strip';

/** Rows of day numbers (null outside the month). Week starts Sunday (0) by default, Saturday with 6. */
export function buildMonthGrid(year: number, month: number, opts: { weekStart?: 0 | 6 } = {}): (number | null)[][] {
  const weekStart = opts.weekStart ?? 0;
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday
  const lead = (first - weekStart + 7) % 7;
  const n = daysInMonth(year, month);
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function riyadhDate(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${g('year')}-${g('month')}-${g('day')}`;
}

/** Calendar days from `now` (in Riyadh) to `isoDate`; negative when past. */
export function daysUntil(isoDate: string, now: Date): number {
  const a = Date.UTC(+isoDate.slice(0, 4), +isoDate.slice(5, 7) - 1, +isoDate.slice(8, 10));
  const t = riyadhDate(now);
  const b = Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10));
  return Math.round((a - b) / 86_400_000);
}

/** Localized short weekday labels in grid order. */
export function weekdayLabels(locale: string, weekStart: 0 | 6 = 0): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  // 2026-09-06 is a Sunday
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2026, 8, 6 + ((i + weekStart) % 7)))));
}
