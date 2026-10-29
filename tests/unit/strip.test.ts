import { describe, it, expect } from 'vitest';
import { buildStrip, daysInMonth } from '~/lib/strip';
import { loadAll } from '~/data';
import type { Profile } from '~/lib/model';

const events = loadAll().events;
const eng: Profile = { name: 'عبدالله', college: 'eng', address: 'm' };

describe('buildStrip', () => {
  it('has one bar per day of September', () => {
    expect(daysInMonth(2026, 9)).toBe(30);
    expect(buildStrip(events, 2026, 9, null).length).toBe(30);
    expect(daysInMonth(2026, 2)).toBe(28);
  });
  it('event days are taller than every quiet day, and busier days are taller', () => {
    const s = buildStrip(events, 2026, 9, null);
    const quiet = s.filter((d) => d.kind === 'quiet');
    const busy = s.filter((d) => d.kind !== 'quiet');
    const maxQuiet = Math.max(...quiet.map((d) => d.heightPct));
    for (const d of busy) expect(d.heightPct).toBeGreaterThan(maxQuiet);
    const one = s[12]; // 13: one event
    const two = s[22]; // 23: two events
    expect(two.heightPct).toBeGreaterThan(one.heightPct);
  });
  it('a two-day event marks both days', () => {
    const s = buildStrip(events, 2026, 9, null);
    expect(s[0].events.map((e) => e.id)).toContain('src-2026');
    expect(s[1].events.map((e) => e.id)).toContain('src-2026');
  });
  it('marks my college days and leaves the rest for everyone', () => {
    const s = buildStrip(events, 2026, 9, eng);
    expect(s[0].kind).toBe('mine');
    expect(s[14].kind).toBe('mine');
    expect(s[28].kind).toBe('mine');
    expect(s[12].kind).toBe('all');
    expect(buildStrip(events, 2026, 9, null).every((d) => d.kind !== 'mine')).toBe(true);
  });
  it('quiet heights are deterministic', () => {
    const a = buildStrip(events, 2026, 9, null).map((d) => d.heightPct);
    const b = buildStrip(events, 2026, 9, null).map((d) => d.heightPct);
    expect(a).toEqual(b);
  });
});
