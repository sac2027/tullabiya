import { describe, it, expect } from 'vitest';
import { matchesAnswer, normalizeAnswer, pickWinners, type HuntSubmission } from '~/lib/hunt';

describe('normalizeAnswer', () => {
  it('strips diacritics', () => expect(normalizeAnswer('الأَحْرُفُ')).toBe('الاحرف'));
  it('removes tatweel and maps ta marbuta', () => expect(normalizeAnswer('مكتبـــة')).toBe('مكتبه'));
  it('maps hamza forms and alef maqsura', () => expect(normalizeAnswer('إِلى')).toBe('الي'));
  it('converts Arabic-Indic digits', () => expect(normalizeAnswer('٢٠٢٦')).toBe('2026'));
  it('lowercases and trims Latin', () => expect(normalizeAnswer('KFUPM  ')).toBe('kfupm'));
  it('drops punctuation', () => expect(normalizeAnswer('حروف، الجامعة؟!')).toBe('حروف الجامعه'));
  it('matches variants', () => {
    expect(matchesAnswer('  kfupm SIGN ', ['KFUPM sign'])).toBe(true);
    expect(matchesAnswer('the kfupm sign', ['KFUPM sign'])).toBe(false);
    expect(matchesAnswer('حروف الجامعه', ['حروف الجامعة'])).toBe(true);
    expect(matchesAnswer('', ['KFUPM'])).toBe(false);
  });
});

function subs(n: number, correct = true): HuntSubmission[] {
  return Array.from({ length: n }, (_, i) => ({ userId: `u${String(i).padStart(2, '0')}`, at: 1000 + i, correct }));
}
const rng = () => 0.5;

describe('pickWinners', () => {
  it('first 10 by time, 5 random from the rest, no overlap', () => {
    const r = pickWinners(subs(20), { firstN: 10, randomN: 5, rng });
    expect(r.first).toEqual(subs(10).map((s) => s.userId));
    expect(r.random.length).toBe(5);
    for (const id of r.random) expect(r.first).not.toContain(id);
  });
  it('12 correct gives 10 first and 2 random', () => {
    const r = pickWinners(subs(12), { firstN: 10, randomN: 5, rng });
    expect(r.first.length).toBe(10);
    expect(r.random.length).toBe(2);
  });
  it('3 correct gives 3 first and none random', () => {
    const r = pickWinners(subs(3), { firstN: 10, randomN: 5, rng });
    expect(r.first.length).toBe(3);
    expect(r.random).toEqual([]);
  });
  it('wrong submissions never win and duplicates are ignored', () => {
    const list = [...subs(5, false), { userId: 'u00', at: 1, correct: true }, { userId: 'u00', at: 2, correct: true }];
    const r = pickWinners(list, { firstN: 10, randomN: 5, rng });
    expect(r.first).toEqual(['u00']);
  });
  it('ties by time resolve by userId and the same rng gives the same draw', () => {
    const tie: HuntSubmission[] = [
      { userId: 'b', at: 5, correct: true },
      { userId: 'a', at: 5, correct: true },
    ];
    expect(pickWinners(tie, { firstN: 1, randomN: 0, rng }).first).toEqual(['a']);
    let s1 = 3;
    let s2 = 3;
    const r1 = () => ((s1 = (s1 * 48271) % 2147483647) / 2147483647);
    const r2 = () => ((s2 = (s2 * 48271) % 2147483647) / 2147483647);
    expect(pickWinners(subs(30), { firstN: 10, randomN: 5, rng: r1 })).toEqual(pickWinners(subs(30), { firstN: 10, randomN: 5, rng: r2 }));
  });
});
