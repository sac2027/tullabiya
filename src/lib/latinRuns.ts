export interface Run {
  text: string;
  nowrap: boolean;
}

const RUN = /[A-Za-z][A-Za-z0-9@&.'’-]*(?:\s+[A-Za-z0-9@&][A-Za-z0-9@&.'’-]*)*/g;
const ARABIC = /[؀-ۿ]/;
/** Longer runs wrap as usual: a phone column is about 30 characters of display type. */
const MAX_RUN = 28;

/** Splits Arabic text so each short Latin run (a program or brand name such as "The Stage @ KFUPM")
 *  can be kept on one line. Text with no Arabic comes back as a single wrapping run. */
export function latinRuns(text: string): Run[] {
  if (!ARABIC.test(text)) return [{ text, nowrap: false }];
  const out: Run[] = [];
  let last = 0;
  for (const m of text.matchAll(RUN)) {
    const i = m.index ?? 0;
    if (m[0].length > MAX_RUN) continue;
    if (i > last) out.push({ text: text.slice(last, i), nowrap: false });
    out.push({ text: m[0], nowrap: true });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), nowrap: false });
  return out;
}
