// Every person, unit, event or place in an article becomes something the reader can act on.
import type { ContentBundle, Lang, Localized } from '~/lib/model';

export type EntityKind = 'person' | 'unit' | 'event' | 'place';
export interface EntityRef {
  kind: EntityKind;
  id: string;
}

export type ActionId = 'email' | 'relay' | 'calendar' | 'remind' | 'register' | 'open';

export interface EntityAction {
  id: ActionId;
  label: Localized;
  /** May contain `{lang}`; resolve with resolveHref. */
  href?: string;
}

const LABELS: Record<ActionId, Localized> = {
  email: { ar: 'راسل بالبريد', en: 'Email', enStatus: 'reviewed' },
  relay: { ar: 'راسل عبر هيئة التحرير', en: 'Message via the editorial board', enStatus: 'reviewed' },
  calendar: { ar: 'أضف إلى التقويم', en: 'Add to calendar', enStatus: 'reviewed' },
  remind: { ar: 'ذكّرني قبلها بيوم', en: 'Remind me a day before', enStatus: 'reviewed' },
  register: { ar: 'سجّل', en: 'Register', enStatus: 'reviewed' },
  open: { ar: 'افتح', en: 'Open', enStatus: 'reviewed' },
};

export function mailto(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

export function resolveHref(href: string, lang: Lang): string {
  return href.replace(/\{lang\}/g, lang);
}

/** The actions an entity offers, most useful first. Throws on an unknown id. */
export function actionsFor(ref: EntityRef, bundle: ContentBundle, subject?: string): EntityAction[] {
  switch (ref.kind) {
    case 'person': {
      const p = bundle.people.find((x) => x.id === ref.id);
      if (!p) throw new Error(`unknown person ${ref.id}`);
      const out: EntityAction[] = [];
      if (p.contactable) out.push({ id: 'relay', label: LABELS.relay });
      const story = bundle.stories.find((s) => s.authorId === p.id);
      out.push({
        id: 'open',
        label: story ? { ar: 'اقرأ مقالاته', en: 'Read their stories', enStatus: 'reviewed' } : LABELS.open,
        href: story ? `/{lang}/issue/${story.issue}/${story.slug}/` : `/{lang}/`,
      });
      return out;
    }
    case 'unit': {
      const u = bundle.units.find((x) => x.id === ref.id);
      if (!u) throw new Error(`unknown unit ${ref.id}`);
      if (u.email) return [{ id: 'email', label: LABELS.email, href: mailto(u.email, subject ?? u.name.ar) }];
      return [{ id: 'relay', label: LABELS.relay }];
    }
    case 'event': {
      const e = bundle.events.find((x) => x.id === ref.id);
      if (!e) throw new Error(`unknown event ${ref.id}`);
      return [
        { id: 'calendar', label: LABELS.calendar },
        { id: 'remind', label: LABELS.remind },
        { id: 'register', label: LABELS.register },
      ];
    }
    case 'place':
      return [{ id: 'open', label: LABELS.open, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('KFUPM ' + ref.id)}` }];
    default:
      throw new Error(`unknown entity kind ${(ref as EntityRef).kind}`);
  }
}
