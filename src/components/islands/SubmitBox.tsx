import { useState } from 'preact/hooks';
import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import { getApi, type SubmissionKind } from '~/lib/api';

interface Props {
  lang: Lang;
  kind: SubmissionKind;
  refId?: string;
  placeholder: string;
  label: string;
  buttonLabel?: string;
  multiline?: boolean;
  pendingText?: string;
  compact?: boolean;
}

/** Everything a reader submits goes to the editorial board first. The reader only ever sees "pending". */
export default function SubmitBox({ lang, kind, refId, placeholder, label, buttonLabel, multiline, pendingText, compact }: Props) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const id = `sb-${kind}-${refId ?? 'x'}`;

  async function submit(e: Event) {
    e.preventDefault();
    if (!value.trim()) {
      setNote({ text: t(lang, 'common.required'), error: true });
      return;
    }
    try {
      const sub = await getApi().submitUserContent(kind, value, refId);
      setNote({ text: pendingText ?? t(lang, 'common.pendingRef', { id: sub.id }) });
      setValue('');
    } catch {
      setNote({ text: t(lang, 'common.error'), error: true });
    }
  }

  return (
    <form class={compact ? 'yours' : 'submit-box'} onSubmit={submit} data-kind={kind}>
      <label class="sr" for={id}>{label}</label>
      {multiline ? (
        <textarea id={id} class="field" rows={3} placeholder={placeholder} value={value} onInput={(e) => setValue((e.currentTarget as HTMLTextAreaElement).value)} aria-invalid={!!note?.error} />
      ) : (
        <input id={id} class="field" type="text" autocomplete="off" placeholder={placeholder} value={value} onInput={(e) => setValue((e.currentTarget as HTMLInputElement).value)} aria-invalid={!!note?.error} />
      )}
      <button class="btn sm" type="submit">{buttonLabel ?? t(lang, 'community.send')}</button>
      <p class={`note${note?.error ? ' form-err' : ''}`} aria-live="polite" data-note>{note?.text ?? ''}</p>
    </form>
  );
}
