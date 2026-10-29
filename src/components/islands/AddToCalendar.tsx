import { t } from '~/i18n';
import type { Lang } from '~/lib/model';
import { buildIcs, icsFileName, type IcsEvent } from '~/lib/ics';
import { googleUrl, outlookUrl } from '~/lib/calendarLinks';
import { usePopover } from '~/lib/popover';

interface Props {
  lang: Lang;
  event: IcsEvent;
  label?: string;
  small?: boolean;
  ghost?: boolean;
}

export function downloadIcs(events: IcsEvent[], lang: Lang, fileName: string, calName?: string): void {
  const body = buildIcs(events, lang, { calName });
  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** Apple/ICS, Google and Outlook in one menu. Opens rarely, so a standard 180ms popover. */
export default function AddToCalendar({ lang, event, label, small = true, ghost = false }: Props) {
  const pop = usePopover();
  const cls = `btn${small ? ' sm' : ''}${ghost ? ' ghost' : ''}`;
  return (
    <div class="pop-wrap" ref={pop.wrap}>
      <button
        type="button"
        class={cls}
        ref={pop.trigger}
        aria-haspopup="menu"
        aria-expanded={pop.open}
        onClick={pop.toggle}
      >
        {label ?? t(lang, 'cal.menu')}
      </button>
      <div class={pop.panelClass} ref={pop.panel} data-open={pop.open} role="menu" aria-label={t(lang, 'cal.menu')}>
        <ul class="menu">
          <li>
            <button
              type="button"
              class="menu-item"
              role="menuitem"
              onClick={() => {
                downloadIcs([event], lang, icsFileName(event));
                pop.close(true);
              }}
            >
              <Icon d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3" />
              {t(lang, 'cal.apple')}
            </button>
          </li>
          <li>
            <a class="menu-item" role="menuitem" href={googleUrl(event, lang)} target="_blank" rel="noopener" onClick={() => pop.close()}>
              <Icon d="M4 5h16v15H4zM4 10h16M9 3v4M15 3v4" />
              {t(lang, 'cal.google')}
            </a>
          </li>
          <li>
            <a class="menu-item" role="menuitem" href={outlookUrl(event, lang)} target="_blank" rel="noopener" onClick={() => pop.close()}>
              <Icon d="M4 5h16v15H4zM4 10h16M8 14h3v3H8z" />
              {t(lang, 'cal.outlook')}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
