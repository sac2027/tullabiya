import type { ComponentChildren } from 'preact';
import { latinRuns } from './latinRuns';

/** Renders text with each short Latin run inside Arabic kept on one line. */
export function latin(text: string): ComponentChildren {
  const runs = latinRuns(text);
  if (runs.length === 1 && !runs[0].nowrap) return text;
  return runs.map((r, i) =>
    r.nowrap ? (
      <span class="nowrap" key={i}>
        {r.text}
      </span>
    ) : (
      r.text
    ),
  );
}
