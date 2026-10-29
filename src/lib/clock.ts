// The prototype's clock. Issue 21 is September 2026, so "today" is pinned inside that month
// for every page and for the simulated backend; `?now=YYYY-MM-DD` overrides it for demos.
// For launch: set DEMO_TODAY to null and the real date takes over.
export const DEMO_TODAY: string | null = '2026-09-12';

export function demoOverride(): number | null {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search).get('now');
  if (!q) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(q) ? `${q}T12:00:00+03:00` : q;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Milliseconds since epoch for "now" as the prototype understands it. */
export function now(): number {
  const o = demoOverride();
  if (o !== null) return o;
  if (DEMO_TODAY) return new Date(`${DEMO_TODAY}T10:00:00+03:00`).getTime();
  return Date.now();
}

/** Today as YYYY-MM-DD in Riyadh. */
export function todayIso(): string {
  const d = new Date(now());
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${g('year')}-${g('month')}-${g('day')}`;
}
