import { describe, it, expect } from 'vitest';
import { actionsFor, resolveHref } from '~/lib/entities';
import { loadAll } from '~/data';

const b = loadAll();
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe('actionsFor', () => {
  it('a contactable person gets relay then open', () => {
    expect(ids(actionsFor({ kind: 'person', id: 'musab-albaqir' }, b))).toEqual(['relay', 'open']);
    const open = actionsFor({ kind: 'person', id: 'musab-albaqir' }, b)[1];
    expect(resolveHref(open.href!, 'ar')).toBe('/ar/issue/21/musab-the-message-that-changed-the-path/');
  });
  it('a non-contactable person only opens', () => {
    expect(ids(actionsFor({ kind: 'person', id: 'badr-alhumaidi' }, b))).toEqual(['open']);
  });
  it('a unit with email gets a mailto with an encoded subject', () => {
    const [a] = actionsFor({ kind: 'unit', id: 'dsa' }, b, 'استفسار عن الاستقبال');
    expect(a.id).toBe('email');
    expect(a.href).toBe('mailto:dsa-mag@kfupm.edu.sa?subject=' + encodeURIComponent('استفسار عن الاستقبال'));
  });
  it('a unit without email relays', () => {
    expect(ids(actionsFor({ kind: 'unit', id: 'housing' }, b))).toEqual(['relay']);
  });
  it('an event gets calendar, remind, register', () => {
    expect(ids(actionsFor({ kind: 'event', id: 'bcg-2026-09-15' }, b))).toEqual(['calendar', 'remind', 'register']);
  });
  it('throws on an unknown id', () => {
    expect(() => actionsFor({ kind: 'person', id: 'nobody' }, b)).toThrow(/unknown person/);
    expect(() => actionsFor({ kind: 'event', id: 'nope' }, b)).toThrow();
  });
});
