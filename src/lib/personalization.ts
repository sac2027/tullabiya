// What the reader pinned and which college they belong to decide what comes first.
import type { CollegeId, Favorites, Profile, SectionId } from '~/lib/model';

export interface Targeted {
  colleges?: CollegeId[] | 'all';
}

export function isForMyCollege(item: Targeted, profile: Profile | null): boolean {
  if (!profile || !item.colleges || item.colleges === 'all') return false;
  return item.colleges.includes(profile.college);
}

/** Stable: pinned sections first, then items for my college, then everything else. */
export function orderForYou<T extends { section: SectionId } & Targeted>(
  items: T[],
  profile: Profile | null,
  favs: Favorites,
): T[] {
  if (!profile) return [...items];
  const pinned = new Set(favs.sections);
  const rank = (x: T) => (pinned.has(x.section) ? 0 : isForMyCollege(x, profile) ? 1 : 2);
  return items
    .map((x, i) => ({ x, i, r: rank(x) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((o) => o.x);
}

export function countForMe<T extends Targeted>(items: T[], profile: Profile | null): number {
  return items.filter((x) => isForMyCollege(x, profile)).length;
}
