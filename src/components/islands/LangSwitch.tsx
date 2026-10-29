import { useEffect, useRef } from 'preact/hooks';
import { otherLang, switchPath, t } from '~/i18n';
import { KEYS, type Lang } from '~/lib/model';
import { safeStorage, writeJson } from '~/lib/api/storage';

interface Props {
  lang: Lang;
  pathname: string;
}

/** Link to the same page in the other language. Keeps the hash, remembers the choice.
 *  Used rarely, so no motion beyond the shared press feedback. */
export default function LangSwitch({ lang, pathname }: Props) {
  const to = otherLang(lang);
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const update = () => {
      a.href = switchPath(location.pathname, to) + location.search + location.hash;
    };
    update();
    addEventListener('hashchange', update);
    return () => removeEventListener('hashchange', update);
  }, [to]);

  return (
    <a
      ref={ref}
      class="tool lang"
      href={switchPath(pathname, to)}
      hreflang={to}
      lang={to}
      aria-label={t(lang, 'lang.switchTo')}
      onClick={() => writeJson(safeStorage(), KEYS.lang, to)}
    >
      {t(lang, 'lang.short')}
    </a>
  );
}
