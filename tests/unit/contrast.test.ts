import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { contrastRatio } from '~/lib/contrast';

const TURQ = '#115F66';
const GREEN = '#009767';
const BEIGE = '#ECE0C7';
const YELLOW = '#F0BA4F';
const PAPER = '#F7F2E6';
const INK = '#0B3A3F';
const DARK = '#0A2F33';

describe('contrastRatio', () => {
  it('ink on paper is AAA for body text', () => {
    expect(contrastRatio(INK, PAPER)).toBeGreaterThanOrEqual(7);
  });
  it('turquoise carries text on paper', () => {
    expect(contrastRatio(TURQ, PAPER)).toBeGreaterThanOrEqual(4.5);
  });
  it('beige text on a turquoise field', () => {
    expect(contrastRatio(BEIGE, TURQ)).toBeGreaterThanOrEqual(4.5);
  });
  it('ink on the yellow field', () => {
    expect(contrastRatio(INK, YELLOW)).toBeGreaterThanOrEqual(4.5);
  });
  it('ink on beige', () => {
    expect(contrastRatio(INK, BEIGE)).toBeGreaterThanOrEqual(4.5);
  });
  it('beige on the dark ground', () => {
    expect(contrastRatio(BEIGE, DARK)).toBeGreaterThanOrEqual(4.5);
  });
  it('documents why green never carries body text', () => {
    expect(contrastRatio(GREEN, BEIGE)).toBeLessThan(4.5);
  });
  it('is symmetric and accepts short hex', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 0);
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 0);
  });
});

describe('tokens.css', () => {
  const brand = [
    '115f66', '009767', 'ece0c7', 'a48a70', 'f0ba4f', '71b8d4', 'ffffff', 'adacad', '000000',
    '2aa880', 'de5e5e', 'f2c56c', '89c4db',
    '004a81', '6bbdbe', 'f58220', '8d5035', 'a31f34', '3d3c7f',
  ];
  const derived = ['f7f2e6', '0b3a3f', '0a2f33'];
  it('uses only brand hexes plus the three derived values', () => {
    const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
    const hexes = Array.from(css.matchAll(/#([0-9a-f]{6})\b/gi), (m) => m[1].toLowerCase());
    expect(hexes.length).toBeGreaterThan(10);
    const allowed = new Set([...brand, ...derived]);
    const unknown = hexes.filter((h) => !allowed.has(h));
    expect(unknown).toEqual([]);
  });
});
