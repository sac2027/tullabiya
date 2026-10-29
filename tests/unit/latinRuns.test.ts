import { describe, expect, it } from 'vitest';
import { latinRuns } from '~/lib/latinRuns';

describe('latinRuns', () => {
  it('keeps a Latin name inside Arabic on one line', () => {
    expect(latinRuns('مسابقة The Stage @ KFUPM')).toEqual([
      { text: 'مسابقة ', nowrap: false },
      { text: 'The Stage @ KFUPM', nowrap: true },
    ]);
  });

  it('splits around a run in the middle and loses no characters', () => {
    const text = 'جلسة BCG للطلاب';
    const runs = latinRuns(text);
    expect(runs.map((r) => r.text).join('')).toBe(text);
    expect(runs.filter((r) => r.nowrap).map((r) => r.text)).toEqual(['BCG']);
  });

  it('leaves English text wrapping as usual', () => {
    expect(latinRuns('The Stage @ KFUPM competition')).toEqual([{ text: 'The Stage @ KFUPM competition', nowrap: false }]);
  });

  it('lets a run too long for a phone wrap', () => {
    const long = 'International Conference on Petroleum Engineering';
    expect(latinRuns(`مؤتمر ${long}`).every((r) => !r.nowrap)).toBe(true);
  });

  it('leaves plain Arabic untouched', () => {
    expect(latinRuns('حفل استقبال المستجدين')).toEqual([{ text: 'حفل استقبال المستجدين', nowrap: false }]);
  });
});
