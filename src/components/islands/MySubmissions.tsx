import { useEffect, useState } from 'preact/hooks';
import { t, formatDate } from '~/i18n';
import type { Lang } from '~/lib/model';
import { getApi, type Submission } from '~/lib/api';

interface Props {
  lang: Lang;
}

const KIND_KEY: Record<Submission['kind'], string> = {
  'guest-answer': 'guest.yours',
  'ask-guest': 'community.ask',
  caption: 'community.caption',
  kudos: 'community.kudos',
  pitch: 'community.pitch',
  contact: 'contact.title',
  comment: 'community.mine',
};

/** Only the reader's own items, only ever "under review". Nothing here is public. */
export default function MySubmissions({ lang }: Props) {
  const [items, setItems] = useState<Submission[] | null>(null);
  useEffect(() => {
    getApi().listMySubmissions().then(setItems);
    const onChange = () => getApi().listMySubmissions().then(setItems);
    addEventListener('tullabiya:submitted', onChange);
    return () => removeEventListener('tullabiya:submitted', onChange);
  }, []);
  if (!items) return <p class="pop-sub">{t(lang, 'common.loading')}</p>;
  if (items.length === 0) return <p class="empty" data-empty>{t(lang, 'community.mineEmpty')}</p>;
  return (
    <ul class="subs" data-count={items.length}>
      {items.map((s) => (
        <li key={s.id}>
          <span class="tag">{t(lang, 'common.pending')}</span>
          <strong>{t(lang, KIND_KEY[s.kind])}</strong>
          <p>{s.text}</p>
          <small>
            {s.id} · {formatDate(lang, s.createdAt.slice(0, 10))}
          </small>
        </li>
      ))}
    </ul>
  );
}
