import { describe, it, expect } from 'vitest';
import { buildMonthGrid, daysUntil, weekdayLabels } from '~/lib/calendarGrid';

describe('buildMonthGrid', () => {
  it('September 2026 has five rows and starts on a Tuesday', () => {
    const g = buildMonthGrid(2026, 9);
    expect(g.length).toBe(5);
    expect(g[0].slice(0, 3)).toEqual([null, null, 1]);
    expect(g[4][2]).toBe(29);
    expect(g[4][3]).toBe(30);
    expect(g[4][4]).toBeNull();
  });
  it('a Saturday week start shifts the columns', () => {
    const g = buildMonthGrid(2026, 9, { weekStart: 6 });
    expect(g[0].slice(0, 4)).toEqual([null, null, null, 1]);
  });
  it('weekday labels follow the start', () => {
    expect(weekdayLabels('en-GB')[0]).toBe('Sun');
    expect(weekdayLabels('en-GB', 6)[0]).toBe('Sat');
    expect(weekdayLabels('ar-SA')[2]).toBe('الثلاثاء');
  });
});

describe('daysUntil', () => {
  it('counts calendar days in Riyadh', () => {
    expect(daysUntil('2026-09-15', new Date('2026-09-12T10:00:00+03:00'))).toBe(3);
    expect(daysUntil('2026-09-15', new Date('2026-09-15T23:30:00+03:00'))).toBe(0);
    expect(daysUntil('2026-09-01', new Date('2026-09-12T10:00:00+03:00'))).toBe(-11);
  });
});
