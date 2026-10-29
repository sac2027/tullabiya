// Shared types for content, people and the reader's own data.
// Task 3 adds the content types (Story, EventItem, Unit, Person, QaItem).

export type Lang = 'ar' | 'en';
export const LANGS: readonly Lang[] = ['ar', 'en'] as const;

/** Storage keys. The pre-paint theme script in Base.astro reads `theme` directly;
 *  everything else goes through src/lib/api/storage.ts. */
export const KEYS = {
  theme: 'tullabiya:v1:theme',
  lang: 'tullabiya:v1:lang',
  state: 'tullabiya:v1:state',
} as const;

/** Arabic is the source language. English is optional per field. */
export interface Localized {
  ar: string;
  en?: string;
  /** How the English came to be. Machine text is shown with a note until reviewed. */
  enStatus?: 'machine' | 'reviewed';
}

export type CollegeId = 'eng' | 'comp' | 'biz' | 'dbe' | 'chem' | 'pet' | 'gen';

export interface College {
  id: CollegeId;
  name: Localized;
  /** CSS custom property holding the brand's college accent. */
  color: string;
  /** Text color that passes on that accent. */
  ink: 'ink' | 'beige';
}

export const COLLEGES: readonly College[] = [
  { id: 'eng', name: { ar: 'الهندسة والفيزياء', en: 'Engineering & Physics', enStatus: 'reviewed' }, color: 'var(--col-eng)', ink: 'ink' },
  { id: 'comp', name: { ar: 'الحاسب الآلي والرياضيات', en: 'Computing & Mathematics', enStatus: 'reviewed' }, color: 'var(--col-comp)', ink: 'ink' },
  { id: 'biz', name: { ar: 'الأعمال', en: 'Business', enStatus: 'reviewed' }, color: 'var(--col-biz)', ink: 'beige' },
  { id: 'dbe', name: { ar: 'التصميم والبيئة العمرانية', en: 'Design & Built Environment', enStatus: 'reviewed' }, color: 'var(--col-dbe)', ink: 'beige' },
  { id: 'chem', name: { ar: 'الكيمياء والمواد', en: 'Chemicals & Materials', enStatus: 'reviewed' }, color: 'var(--col-chem)', ink: 'ink' },
  { id: 'pet', name: { ar: 'هندسة البترول وعلوم الأرض', en: 'Petroleum Engineering & Geosciences', enStatus: 'reviewed' }, color: 'var(--col-pet)', ink: 'beige' },
  { id: 'gen', name: { ar: 'الدراسات العامة', en: 'General Studies', enStatus: 'reviewed' }, color: 'var(--col-gen)', ink: 'beige' },
] as const;

export function college(id: CollegeId): College {
  const c = COLLEGES.find((x) => x.id === id);
  if (!c) throw new Error(`unknown college: ${id}`);
  return c;
}

export type SectionId = 'news' | 'guest' | 'experience' | 'contributions' | 'last';

export const SECTIONS: readonly { id: SectionId; name: Localized }[] = [
  { id: 'news', name: { ar: 'الأخبار', en: 'News', enStatus: 'reviewed' } },
  { id: 'guest', name: { ar: 'ضيف الثلاثين', en: 'Guest of the 30th', enStatus: 'reviewed' } },
  { id: 'experience', name: { ar: 'تجربتي', en: 'My Experience', enStatus: 'reviewed' } },
  { id: 'contributions', name: { ar: 'مشاركاتي', en: 'My Contributions', enStatus: 'reviewed' } },
  { id: 'last', name: { ar: 'الأخيرة', en: 'The Last Page', enStatus: 'reviewed' } },
] as const;

export const SECTION_IDS: readonly SectionId[] = SECTIONS.map((s) => s.id);

/** How the site addresses the reader in Arabic. */
export type Address = 'neutral' | 'm' | 'f';

export interface Profile {
  name: string;
  college: CollegeId;
  address: Address;
  /** Square JPEG data URL, 256px, or absent. */
  avatar?: string;
}

export interface Favorites {
  sections: SectionId[];
  units: string[];
}

export const EMPTY_FAVORITES: Favorites = { sections: [], units: [] };
