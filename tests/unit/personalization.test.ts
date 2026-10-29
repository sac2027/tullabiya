import { describe, it, expect } from 'vitest';
import { isForMyCollege, orderForYou } from '~/lib/personalization';
import type { Profile, SectionId, CollegeId } from '~/lib/model';

type Item = { id: string; section: SectionId; colleges?: CollegeId[] | 'all' };
const items: Item[] = [
  { id: 'a', section: 'news', colleges: 'all' },
  { id: 'b', section: 'news', colleges: ['eng'] },
  { id: 'c', section: 'guest' },
  { id: 'd', section: 'experience', colleges: ['comp'] },
  { id: 'e', section: 'news', colleges: ['eng', 'biz'] },
];
const eng: Profile = { name: 'عبدالله', college: 'eng', address: 'm' };

describe('orderForYou', () => {
  it('pinned first, then my college, original order within groups', () => {
    const out = orderForYou(items, eng, { sections: ['guest'], units: [] }).map((x) => x.id);
    expect(out).toEqual(['c', 'b', 'e', 'a', 'd']);
  });
  it('returns the input order without a profile', () => {
    expect(orderForYou(items, null, { sections: ['guest'], units: [] }).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('ignores "all" as a college target', () => {
    expect(isForMyCollege({ colleges: 'all' }, eng)).toBe(false);
    expect(isForMyCollege({ colleges: ['eng'] }, eng)).toBe(true);
    expect(isForMyCollege({ colleges: ['eng'] }, null)).toBe(false);
  });
});
