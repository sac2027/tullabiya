// User text is stored as plain text: tags stripped, whitespace collapsed, capped by graphemes.

const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

export function graphemes(s: string): string[] {
  if (seg) return Array.from(seg.segment(s), (x) => x.segment);
  return Array.from(s);
}

export function sanitizeText(input: string, maxGraphemes: number = 280): string {
  const noScript = input.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const noTags = noScript.replace(/<[^>]*>/g, '');
  const collapsed = noTags.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/\s+/g, ' ').trim();
  const g = graphemes(collapsed);
  return g.length > maxGraphemes ? g.slice(0, maxGraphemes).join('') : collapsed;
}
