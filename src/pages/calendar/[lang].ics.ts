// Subscribable calendar feed: /calendar/ar.ics and /calendar/en.ics
import type { APIRoute } from 'astro';
import { loadAll } from '~/data';
import { buildIcs, toIcsEvent } from '~/lib/ics';
import type { Lang } from '~/lib/model';

export function getStaticPaths() {
  return [{ params: { lang: 'ar' } }, { params: { lang: 'en' } }];
}

export const GET: APIRoute = ({ params }) => {
  const lang = params.lang as Lang;
  const events = loadAll().events.map(toIcsEvent);
  const body = buildIcs(events, lang, { calName: lang === 'ar' ? 'تقويم الطلّابية' : 'Al-Tullabiya calendar' });
  return new Response(body, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `inline; filename="tullabiya-${lang}.ics"` },
  });
};
