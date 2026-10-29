import { describe, it, expect } from 'vitest';
import { loadAll, currentIssue, storiesOf, eventsInMonth } from '~/data';
import { SECTION_IDS } from '~/lib/model';

const b = loadAll();

describe('content bundle', () => {
  it('parses every file and resolves every reference', () => {
    expect(b.stories.length).toBeGreaterThanOrEqual(16);
    expect(b.qa.length).toBe(30);
    expect(currentIssue().number).toBe(21);
    expect(storiesOf(21).length).toBe(currentIssue().storyIds.length);
  });

  it('every story section is a known section and ids are unique', () => {
    for (const s of b.stories) expect(SECTION_IDS).toContain(s.section);
    expect(new Set(b.stories.map((s) => s.id)).size).toBe(b.stories.length);
    expect(new Set(b.stories.map((s) => `${s.issue}/${s.slug}`)).size).toBe(b.stories.length);
  });

  it('all events fall in September 2026', () => {
    for (const e of b.events) {
      expect(e.start >= '2026-09-01' && e.start <= '2026-09-30').toBe(true);
      if (e.end) expect(e.end >= e.start).toBe(true);
    }
    expect(eventsInMonth(2026, 9).length).toBe(b.events.length);
  });

  it('contains exactly the printed calendar', () => {
    const got = b.events.map((e) => [e.start.slice(8), e.title.ar]).sort();
    expect(got).toEqual(
      [
        ['01', 'برنامج Career Talks'],
        ['01', 'مؤتمر SRC 2026'],
        ['13', 'مسابقة The Stage @ KFUPM'],
        ['15', 'BCG في الحرم الجامعي'],
        ['23', 'افتتاح كأس الخليج 27'],
        ['23', 'اليوم الوطني السعودي: عزنا بطبعنا'],
        ['29', 'برنامج Career Talks'],
      ].sort(),
    );
    const src = b.events.find((e) => e.id === 'src-2026')!;
    expect(src.end).toBe('2026-09-02');
  });

  it('BCG is an all-day event on Tuesday 15 September', () => {
    const bcg = b.events.find((e) => e.id === 'bcg-2026-09-15')!;
    expect(bcg.allDay).toBe(true);
    expect(bcg.start).toBe('2026-09-15');
    expect(new Date('2026-09-15T12:00:00+03:00').getUTCDay()).toBe(2);
  });

  it('every English value carries an enStatus', () => {
    const walk = (v: unknown, path: string) => {
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (typeof o.ar === 'string' && typeof o.en === 'string') {
          expect(o.enStatus, path).toMatch(/machine|reviewed/);
        }
        for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
      }
    };
    walk(b, 'bundle');
  });

  it('every photo key referenced exists in the assets folder', async () => {
    const { readdirSync } = await import('node:fs');
    const keys = new Set(readdirSync(new URL('../../src/assets/issue21/', import.meta.url)).map((f) => f.replace(/\.jpg$/, '')));
    const refs: string[] = [];
    for (const s of b.stories) {
      if (s.photo) refs.push(s.photo);
      for (const p of s.photos ?? []) refs.push(p);
    }
    for (const i of b.issues) refs.push(i.coverPhoto);
    for (const h of b.hunts) for (const c of h.clues) if (c.photo) refs.push(c.photo);
    refs.push(b.community.captionPhoto);
    for (const r of refs) expect(keys.has(r), r).toBe(true);
  });

  it('sample interaction data is labelled', () => {
    for (const p of b.polls) expect(p.sample).toBe(true);
    for (const h of b.hunts) expect(h.sample).toBe(true);
    expect(b.community.sample).toBe(true);
  });
});
