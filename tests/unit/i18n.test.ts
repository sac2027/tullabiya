import { describe, it, expect } from 'vitest';
import { formatDate, localized, plural, switchPath, t, tp, uiKeys, monthName } from '~/i18n';

describe('plural', () => {
  const forms = { zero: 'zero', one: 'one', two: 'two', few: 'few', many: 'many', other: 'other' };
  it('selects the six Arabic forms', () => {
    expect([0, 1, 2, 5, 10, 11, 100].map((n) => plural('ar', n, forms))).toEqual([
      'zero', 'one', 'two', 'few', 'few', 'many', 'other',
    ]);
  });
  it('selects one/other in English', () => {
    expect(plural('en', 1, forms)).toBe('one');
    expect(plural('en', 2, forms)).toBe('other');
  });
  it('fills {n}', () => {
    expect(plural('en', 3, { other: '{n} items' })).toBe('3 items');
  });
  it('tp reads plural keys from the dictionary', () => {
    expect(tp('ar', 'events.count', 3)).toBe('3 فعاليات');
    expect(tp('ar', 'events.count', 1)).toBe('فعالية واحدة');
    expect(tp('en', 'events.count', 1)).toBe('1 event');
    expect(tp('en', 'events.count', 4)).toBe('4 events');
  });
});

describe('formatDate', () => {
  it('Arabic with weekday uses Latin digits and Gregorian', () => {
    const s = formatDate('ar', '2026-09-15', { weekday: true });
    expect(s).toContain('الثلاثاء');
    expect(s).toContain('15');
    expect(s).toContain('2026');
    expect(s).not.toMatch(/[٠-٩]/);
  });
  it('Hijri year starts with 14', () => {
    const s = formatDate('ar', '2026-09-15', { hijri: true });
    expect(s).toMatch(/14\d\d|١٤\d\d/);
  });
  it('English', () => {
    expect(formatDate('en', '2026-09-15', { weekday: true })).toContain('Tuesday');
    expect(formatDate('en', '2026-09-15')).toContain('September');
  });
  it('monthName', () => {
    expect(monthName('ar', 2026, 9)).toBe('سبتمبر');
    expect(monthName('en', 2026, 9)).toBe('September');
  });
});

describe('localized', () => {
  it('falls back to Arabic and says so', () => {
    expect(localized({ ar: 'مرحبا' }, 'en')).toEqual({ text: 'مرحبا', fallback: true, machine: false });
  });
  it('returns English when present and flags machine text', () => {
    expect(localized({ ar: 'مرحبا', en: 'Hello', enStatus: 'machine' }, 'en')).toEqual({ text: 'Hello', fallback: false, machine: true });
    expect(localized({ ar: 'مرحبا', en: 'Hello' }, 'ar')).toEqual({ text: 'مرحبا', fallback: false, machine: false });
  });
});

describe('switchPath', () => {
  it('swaps the language segment', () => {
    expect(switchPath('/ar/archive/21', 'en')).toBe('/en/archive/21');
    expect(switchPath('/en/', 'ar')).toBe('/ar/');
    expect(switchPath('/ar', 'en')).toBe('/en');
  });
  it('prefixes a path without a language', () => {
    expect(switchPath('/calendar/', 'ar')).toBe('/ar/calendar/');
  });
});

describe('dictionaries', () => {
  it('have identical key sets', () => {
    expect(uiKeys('en').sort()).toEqual(uiKeys('ar').sort());
  });
  it('t throws on an unknown key', () => {
    expect(() => t('ar', 'nope.nope')).toThrow();
  });
  it('t interpolates and selects gendered variants', () => {
    expect(t('ar', 'end.caughtUp', { name: 'ريم', address: 'f' })).toContain('وصلتِ');
    expect(t('ar', 'end.caughtUp', { name: 'ريم', address: 'f' })).toContain('ريم');
    expect(t('ar', 'end.caughtUp', { name: 'سعد', address: 'm' })).toContain('وصلتَ');
    const n = t('ar', 'end.caughtUp', { name: 'سعد', address: 'neutral' });
    expect(n).not.toContain('وصلتَ');
    expect(n).not.toContain('وصلتِ');
  });
  it('t rejects plural keys', () => {
    expect(() => t('ar', 'events.count')).toThrow(/plural/);
  });
});
