import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { t, L } from '~/i18n';
import { COLLEGES, SECTIONS, type Address, type CollegeId, type Lang, type SectionId } from '~/lib/model';
import { resizeAvatar, initial } from '~/lib/name';
import { $favorites, $profile, $ready, $sheet, dismissOnboarding, hydrate, onboardingDismissed, saveFavorites, saveProfile } from '~/lib/store';

interface Props {
  lang: Lang;
  issue: number;
}

/** A bottom sheet, seen once (or when the reader edits their profile): 420ms drawer curve in, faster out. */
export default function Onboarding({ lang, issue }: Props) {
  const sheet = useStore($sheet);
  const profile = useStore($profile);
  const favs = useStore($favorites);
  const ready = useStore($ready);
  const open = sheet === 'onboarding';
  const [name, setName] = useState('');
  const [col, setCol] = useState<CollegeId>('eng');
  const [addr, setAddr] = useState<Address>('neutral');
  const [pins, setPins] = useState<SectionId[]>([]);
  const [avatar, setAvatar] = useState<string | undefined>();
  const [err, setErr] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => void hydrate(issue), [issue]);
  // Never auto-opens: the hero invites the reader; the sheet is only ever opened on purpose.
  void ready;
  void onboardingDismissed;

  useEffect(() => {
    if (!open) return;
    setName(profile?.name ?? '');
    setCol(profile?.college ?? 'eng');
    setAddr(profile?.address ?? 'neutral');
    setPins(favs.sections);
    setAvatar(profile?.avatar);
    setErr(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => firstField.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') later();
      if (e.key === 'Tab' && panel.current) {
        const f = Array.from(panel.current.querySelectorAll<HTMLElement>('input, button, [tabindex="0"]')).filter((x) => !x.hasAttribute('disabled'));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function later() {
    dismissOnboarding();
    $sheet.set(null);
  }

  async function save(e: Event) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setErr(t(lang, 'onboarding.nameRequired'));
      firstField.current?.focus();
      return;
    }
    await saveProfile({ name: clean, college: col, address: addr, avatar });
    await saveFavorites({ ...favs, sections: pins });
    dismissOnboarding();
    $sheet.set(null);
  }

  async function onPhoto(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      setAvatar(await resizeAvatar(file));
      setErr(null);
    } catch {
      setErr(t(lang, 'onboarding.photoError'));
    }
    input.value = '';
  }

  const togglePin = (id: SectionId) =>
    setPins((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 5 ? p : [...p, id]));

  return (
    <div class="sheet-root" data-open={open} aria-hidden={!open}>
      <div class="sheet-backdrop" onClick={later} />
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ob-title" ref={panel}>
        <form onSubmit={save} class="sheet-form">
          <div class="sheet-grip" aria-hidden="true" />
          <h2 id="ob-title" class="sheet-title">{t(lang, 'onboarding.title')}</h2>
          <p class="sheet-lead">{t(lang, 'onboarding.lead')}</p>

          <label class="sheet-label" for="ob-name">{t(lang, 'onboarding.name')}</label>
          <input id="ob-name" ref={firstField} class="field" type="text" autocomplete="given-name" maxLength={60} placeholder={t(lang, 'onboarding.namePlaceholder')} value={name} onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} aria-invalid={!!err && !name.trim()} aria-describedby={err ? 'ob-err' : undefined} />

          <fieldset class="sheet-fieldset">
            <legend class="sheet-label">{t(lang, 'onboarding.college')}</legend>
            <div class="college-grid">
              {COLLEGES.map((c) => (
                <label key={c.id} class="college-opt" style={{ '--c': c.color, '--ci': c.ink === 'ink' ? 'var(--ink)' : 'var(--beige)' } as never}>
                  <input type="radio" name="college" value={c.id} checked={col === c.id} onChange={() => setCol(c.id)} />
                  <span class="college-swatch" aria-hidden="true" />
                  <span>{L(c.name, lang)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset class="sheet-fieldset">
            <legend class="sheet-label">{t(lang, 'onboarding.address')}</legend>
            <div class="seg" role="radiogroup">
              {(['neutral', 'm', 'f'] as Address[]).map((a) => (
                <label key={a} class="seg-opt">
                  <input type="radio" name="address" value={a} checked={addr === a} onChange={() => setAddr(a)} />
                  <span>{t(lang, `onboarding.addr.${a === 'neutral' ? 'n' : a}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset class="sheet-fieldset">
            <legend class="sheet-label">{t(lang, 'onboarding.sections')}</legend>
            <div class="chips">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" class="chip pin" aria-pressed={pins.includes(s.id)} onClick={() => togglePin(s.id)}>
                  <Star on={pins.includes(s.id)} />
                  {L(s.name, lang)}
                </button>
              ))}
            </div>
          </fieldset>

          <div class="sheet-photo">
            <span class="av av-lg" aria-hidden="true" style={avatar ? undefined : { background: COLLEGES.find((c) => c.id === col)!.color }}>
              {avatar ? <img src={avatar} alt="" width={64} height={64} /> : initial(name)}
            </span>
            <div>
              <label class="btn sm ghost" for="ob-photo">{avatar ? t(lang, 'onboarding.photoChange') : t(lang, 'onboarding.photo')}</label>
              <input id="ob-photo" type="file" accept="image/*" class="sr" onChange={onPhoto} />
              {avatar && <button type="button" class="btn sm ghost" onClick={() => setAvatar(undefined)}>{t(lang, 'onboarding.photoRemove')}</button>}
              <p class="pop-sub">{t(lang, 'onboarding.photoHint')}</p>
            </div>
          </div>

          {err && <p id="ob-err" class="form-err" role="alert">{err}</p>}

          <div class="sheet-actions">
            <button type="submit" class="btn">{t(lang, 'onboarding.save')}</button>
            <button type="button" class="btn ghost" onClick={later}>{profile ? t(lang, 'onboarding.close') : t(lang, 'onboarding.skip')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Star({ on }: { on: boolean }) {
  return (
    <svg class="star" viewBox="0 0 24 24" width="18" height="18" fill={on ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z" />
    </svg>
  );
}
