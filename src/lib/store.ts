// Shared reader state for the islands: profile, pins, progress. Hydrated once from the Api.
import { atom } from 'nanostores';
import { getApi, type IssueProgress } from '~/lib/api';
import { EMPTY_FAVORITES, type Favorites, type Profile, type SectionId } from '~/lib/model';

export const $profile = atom<Profile | null>(null);
export const $favorites = atom<Favorites>(EMPTY_FAVORITES);
export const $progress = atom<IssueProgress | null>(null);
export const $ready = atom(false);

let hydrating: Promise<void> | null = null;

export function hydrate(issue: number): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = (async () => {
    const api = getApi();
    const [p, f, pr] = await Promise.all([api.getProfile(), api.getFavorites(), api.getProgress(issue)]);
    $profile.set(p);
    $favorites.set(f);
    $progress.set(pr);
    $ready.set(true);
  })();
  return hydrating;
}

export async function saveProfile(p: Profile): Promise<void> {
  await getApi().saveProfile(p);
  $profile.set(await getApi().getProfile());
}

export async function clearProfile(): Promise<void> {
  await getApi().clearProfile();
  $profile.set(null);
}

export async function saveFavorites(f: Favorites): Promise<void> {
  await getApi().saveFavorites(f);
  $favorites.set(await getApi().getFavorites());
}

export async function togglePinnedSection(id: SectionId): Promise<void> {
  const f = $favorites.get();
  const sections = f.sections.includes(id) ? f.sections.filter((s) => s !== id) : [...f.sections, id].slice(-5);
  await saveFavorites({ ...f, sections });
}

export async function markProgress(issue: number, patch: Partial<IssueProgress>): Promise<void> {
  $progress.set(await getApi().markProgress(issue, patch));
}

export async function resetAll(): Promise<void> {
  await getApi().reset();
  hydrating = null;
  $profile.set(null);
  $favorites.set(EMPTY_FAVORITES);
  $progress.set(null);
}
