import { useRef, useState } from 'preact/hooks';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import SubmitBox from './SubmitBox';

interface Props {
  lang: Lang;
  items: { id: string; q: string; a: string }[];
}

/** Thirty rapid-fire cards. Buttons, arrows in reading direction, and a swipe with a velocity threshold. */
export default function QaDeck({ lang, items }: Props) {
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState<null | 1 | -1>(null);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const n = items.length;

  function go(delta: 1 | -1) {
    if (leaving) return;
    setLeaving(delta);
    setTimeout(() => {
      setI((cur) => (cur + delta + n) % n);
      setLeaving(null);
    }, 190);
  }
  const next = () => go(1);
  const prev = () => go(-1);

  function onKey(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') (dir === 'rtl' ? next : prev)();
    else if (e.key === 'ArrowRight') (dir === 'rtl' ? prev : next)();
    else return;
    e.preventDefault();
  }
  function onDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('input, button')) return;
    drag.current = { x: e.clientX, t: Date.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onUp(e: PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const velocity = Math.abs(dx) / Math.max(1, Date.now() - drag.current.t);
    drag.current = null;
    if (Math.abs(dx) < 60 && velocity < 0.11) return;
    // a swipe toward the reading start is "next"
    const forward = dir === 'rtl' ? dx > 0 : dx < 0;
    (forward ? next : prev)();
  }

  const item = items[i];
  const travel = leaving === 1 ? (dir === 'rtl' ? '24px' : '-24px') : leaving === -1 ? (dir === 'rtl' ? '-24px' : '24px') : '0';

  return (
    <div class="deck" role="group" aria-roledescription="carousel" aria-label={t(lang, 'nav.current')} tabIndex={0} onKeyDown={onKey} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (drag.current = null)}>
      <div class={`deck-card${leaving ? ' leaving' : ''}`} style={{ '--dx': travel } as never} aria-live="polite">
        <p class="q">{item.q}</p>
        <p class="a">{item.a}</p>
      </div>
      <p class="q" style={{ minBlockSize: 0, marginBlockStart: 'auto' }}>{t(lang, 'guest.yours')}</p>
      <SubmitBox lang={lang} kind="guest-answer" refId={item.id} label={t(lang, 'guest.yoursPlaceholder')} placeholder={t(lang, 'guest.yoursPlaceholder')} buttonLabel={t(lang, 'guest.send')} pendingText={t(lang, 'guest.pending')} compact />
      <div class="deck-nav">
        <button type="button" class="btn sm" onClick={prev} aria-label={t(lang, 'guest.prev')}>{t(lang, 'guest.prev')}</button>
        <button type="button" class="btn sm" onClick={next} aria-label={t(lang, 'guest.next')}>{t(lang, 'guest.next')}</button>
        <span class="count" data-count>{t(lang, 'guest.count', { k: i + 1, n })}</span>
      </div>
    </div>
  );
}
