import { describe, it, expect } from 'vitest';
import { dirFor, displayName, initial } from '~/lib/name';

describe('initial', () => {
  it('first grapheme, Latin uppercased, empty for blank', () => {
    expect(initial('عبدالله')).toBe('ع');
    expect(initial('a')).toBe('A');
    expect(initial('👩‍💻 Sara')).toBe('👩‍💻');
    expect(initial('   ')).toBe('');
  });
});

describe('displayName', () => {
  it('takes the first word', () => {
    expect(displayName('عبدالعزيز بن عبدالرحمن الفلاني')).toBe('عبدالعزيز');
    expect(displayName('  Sara Ahmed ')).toBe('Sara');
  });
  it('cuts a very long single word', () => {
    const long = 'ع'.repeat(40);
    expect(displayName(long)).toBe('ع'.repeat(14) + '…');
  });
});

describe('dirFor', () => {
  it('detects direction from the first strong letter', () => {
    expect(dirFor('Sara')).toBe('ltr');
    expect(dirFor('ريم')).toBe('rtl');
    expect(dirFor('👩‍💻 ريم')).toBe('rtl');
  });
});
