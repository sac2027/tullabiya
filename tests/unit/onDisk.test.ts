import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { onDisk } from '~/data';

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'tullabiya-archive-'));
  const dir = join(root, 'public', 'archive', '7');
  mkdirSync(dir, { recursive: true });
  for (const f of ['cover.jpg', 'p01.jpg', 'p02.jpg', 'p03.jpg', 'issue.pdf']) writeFileSync(join(dir, f), '');
  mkdirSync(join(root, 'public', 'archive', '8'), { recursive: true });
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('onDisk', () => {
  it('counts the rendered pages of an issue that is present', () => {
    expect(onDisk({ number: 7, pages: 0 }, root)).toEqual({ number: 7, pages: 3, local: true });
  });

  it('marks an issue without files as remote, keeping the JSON page count for the record', () => {
    expect(onDisk({ number: 9, pages: 8, local: true }, root)).toEqual({ number: 9, pages: 8, local: false });
  });

  it('treats a folder with no cover as absent', () => {
    expect(onDisk({ number: 8, pages: 8 }, root).local).toBe(false);
  });
});
