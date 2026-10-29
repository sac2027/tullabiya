// Shared types. Task 2 adds Localized/Profile; Task 3 adds content types.
export type Lang = 'ar' | 'en';
export const LANGS: readonly Lang[] = ['ar', 'en'] as const;

/** Storage keys. The pre-paint theme script in Base.astro reads THEME directly;
 *  everything else goes through src/lib/api/storage.ts. */
export const KEYS = {
  theme: 'tullabiya:v1:theme',
  lang: 'tullabiya:v1:lang',
} as const;
