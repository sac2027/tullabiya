// Names the way students type them: Arabic, Latin, mixed, long, one letter, emoji.
import { graphemes } from '~/lib/sanitize';

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const LATIN = /[A-Za-z]/;

/** First grapheme of the name; Latin uppercased; empty for a blank name. */
export function initial(name: string): string {
  const g = graphemes(name.trim());
  if (!g.length) return '';
  const c = g[0];
  return LATIN.test(c) ? c.toUpperCase() : c;
}

/** First word, cut to `maxGraphemes` with an ellipsis when a single word runs long. */
export function displayName(name: string, maxGraphemes: number = 12): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  const g = graphemes(first);
  return g.length > maxGraphemes ? g.slice(0, maxGraphemes).join('') + '…' : first;
}

/** Direction of the first strong character so mixed names sit correctly inside either layout. */
export function dirFor(name: string): 'rtl' | 'ltr' {
  for (const ch of name) {
    if (ARABIC.test(ch)) return 'rtl';
    if (LATIN.test(ch)) return 'ltr';
  }
  return 'ltr';
}

const MAX_BYTES = 8 * 1024 * 1024;

/** Square 256px JPEG data URL from an uploaded image. Rejects non-images and files over 8 MB. */
export async function resizeAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not-image');
  if (file.size > MAX_BYTES) throw new Error('too-large');
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-canvas');
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 256, 256);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.86);
}
