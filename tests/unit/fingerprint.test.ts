import { describe, it, expect } from 'vitest';
import { fingerprint } from '~/lib/fingerprint';

describe('fingerprint', () => {
  it('is deterministic and bounded', () => {
    expect(fingerprint(21)).toEqual(fingerprint(21));
    expect(fingerprint(21).length).toBe(9);
    expect(fingerprint(21, 12).length).toBe(12);
    for (const n of [1, 7, 20, 21, 22]) for (const v of fingerprint(n)) expect(v >= 18 && v <= 95).toBe(true);
  });
  it('differs between issues', () => {
    expect(fingerprint(20)).not.toEqual(fingerprint(21));
  });
});
