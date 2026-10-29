import { describe, it, expect } from 'vitest';
import { breakdownVisible, largestRemainder, tally } from '~/lib/poll';

describe('largestRemainder', () => {
  it('always sums to 100', () => {
    expect(largestRemainder([1, 1, 1]).reduce((a, b) => a + b)).toBe(100);
    expect(largestRemainder([1, 1, 1])).toEqual([34, 33, 33]);
    expect(largestRemainder([2, 1, 1, 1]).reduce((a, b) => a + b)).toBe(100);
  });
  it('keeps exact splits', () => {
    expect(largestRemainder([58, 42])).toEqual([58, 42]);
    expect(largestRemainder([696, 504])).toEqual([58, 42]);
  });
  it('returns zeros for an empty poll', () => {
    expect(largestRemainder([0, 0])).toEqual([0, 0]);
    expect(largestRemainder([])).toEqual([]);
  });
  it('tally keeps ids', () => {
    expect(tally({ tea: 3, coffee: 1 })).toEqual({ total: 4, pct: { tea: 75, coffee: 25 } });
  });
});

describe('breakdownVisible', () => {
  it('hides below 20 votes', () => {
    expect(breakdownVisible(19)).toBe(false);
    expect(breakdownVisible(20)).toBe(true);
    expect(breakdownVisible(5, 5)).toBe(true);
  });
});
