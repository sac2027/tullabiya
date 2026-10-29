import ar from './ui.ar.json';
import en from './ui.en.json';
import type { Address, Lang, Localized } from '~/lib/model';

type Dict = Record<string, string | Record<string, string>>;
const dicts: Record<Lang, Dict> = { ar: ar as Dict, en: en as Dict };

export type UiKey = keyof typeof ar;
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
type Params = Record<string, string | number | undefined> & { address?: Address };

const ADDRESS_SUFFIX: Record<Address, string> = { neutral: 'n', m: 'm', f: 'f' };

function interpolate(s: string, params?: Params): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => {
    const v = params[k];
    return v === undefined ? m : String(v);
  });
}

/** A UI string. With `params.address`, prefers `key.m` / `key.f` / `key.n` when they exist. */
export function t(lang: Lang, key: UiKey | string, params?: Params): string {
  const d = dicts[lang];
  let v: string | Record<string, string> | undefined;
  if (params?.address) {
    v = d[`${key}.${ADDRESS_SUFFIX[params.address]}`] ?? d[`${key}.n`];
  }
  v ??= d[key];
  if (v === undefined) throw new Error(`missing UI string: ${lang}:${String(key)}`);
  if (typeof v !== 'string') throw new Error(`${String(key)} is a plural key; use tp()`);
  return interpolate(v, params);
}

/** Pick the plural form for `n` and fill `{n}`. Arabic has six forms. */
export function plural(lang: Lang, n: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(lang).select(n);
  const s = forms[rule] ?? forms.other;
  return s.replace(/\{n\}/g, String(n));
}

/** A plural UI string whose JSON value is an object of forms. */
export function tp(lang: Lang, key: UiKey | string, n: number, params?: Params): string {
  const v = dicts[lang][key];
  if (v === undefined) throw new Error(`missing UI string: ${lang}:${String(key)}`);
  if (typeof v === 'string') return interpolate(v, { ...params, n });
  return interpolate(plural(lang, n, v as PluralForms), params);
}

const DATE_LOCALE: Record<Lang, string> = {
  ar: 'ar-SA-u-nu-latn-ca-gregory',
  en: 'en-GB-u-ca-gregory',
};
const HIJRI_LOCALE: Record<Lang, string> = {
  ar: 'ar-SA-u-nu-latn-ca-islamic-umalqura',
  en: 'en-GB-u-ca-islamic-umalqura',
};

function asDate(iso: string): Date {
  // Date-only strings are pinned to noon in Riyadh so no timezone shifts the day.
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00+03:00`) : new Date(iso);
}

export function formatDate(
  lang: Lang,
  isoDate: string,
  opts: { weekday?: boolean; hijri?: boolean; month?: 'long' | 'short'; year?: boolean } = {},
): string {
  const d = asDate(isoDate);
  const fmt = new Intl.DateTimeFormat(opts.hijri ? HIJRI_LOCALE[lang] : DATE_LOCALE[lang], {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: opts.month ?? 'long',
    year: opts.year === false ? undefined : 'numeric',
    weekday: opts.weekday ? 'long' : undefined,
  });
  return fmt.format(d);
}

export function weekdayName(lang: Lang, isoDate: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], { timeZone: 'Asia/Riyadh', weekday: 'long' }).format(asDate(isoDate));
}

export function monthName(lang: Lang, year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 15, 12));
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], { timeZone: 'Asia/Riyadh', month: 'long' }).format(d);
}

export function formatTime(lang: Lang, iso: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], { timeZone: 'Asia/Riyadh', hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}

/** Resolve a localized field; `fallback` is true when English was asked for and is missing. */
export function localized(v: Localized, lang: Lang): { text: string; fallback: boolean; machine: boolean } {
  if (lang === 'en' && v.en) return { text: v.en, fallback: false, machine: v.enStatus === 'machine' };
  return { text: v.ar, fallback: lang === 'en', machine: false };
}

/** Shorthand when only the text is needed. */
export function L(v: Localized | undefined, lang: Lang): string {
  return v ? localized(v, lang).text : '';
}

export function switchPath(pathname: string, to: Lang): string {
  const re = /^\/(ar|en)(?=\/|$)/;
  if (re.test(pathname)) return pathname.replace(re, `/${to}`);
  return `/${to}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'ar' ? 'en' : 'ar';
}

export function dirOf(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function isLang(x: unknown): x is Lang {
  return x === 'ar' || x === 'en';
}

export function uiKeys(lang: Lang): string[] {
  return Object.keys(dicts[lang]);
}
