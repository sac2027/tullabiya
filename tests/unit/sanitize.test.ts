import { describe, it, expect } from 'vitest';
import { sanitizeText } from '~/lib/sanitize';

describe('sanitizeText', () => {
  it('strips tags', () => expect(sanitizeText('<b>hi</b>')).toBe('hi'));
  it('drops script content entirely', () => expect(sanitizeText('<script>alert(1)</script>x')).toBe('x'));
  it('collapses whitespace', () => expect(sanitizeText('  a \n\n  b\t c ')).toBe('a b c'));
  it('caps at 280 graphemes without splitting a combined character', () => {
    const s = 'ع'.repeat(279) + '👩‍💻' + 'x'.repeat(30);
    const out = sanitizeText(s);
    expect(out.endsWith('👩‍💻')).toBe(true);
    expect(out.length).toBe(279 + '👩‍💻'.length);
  });
  it('leaves short text alone', () => expect(sanitizeText('تعليق رائع')).toBe('تعليق رائع'));
});
