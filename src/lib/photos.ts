// Photo keys used in content JSON resolve to optimized assets here.
import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>('/src/assets/issue21/*.jpg', { eager: true });

const byKey = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  const key = path.split('/').pop()!.replace(/\.jpg$/, '');
  byKey.set(key, mod.default);
}

export function photo(key: string): ImageMetadata {
  const p = byKey.get(key);
  if (!p) throw new Error(`unknown photo key: ${key}`);
  return p;
}

export function hasPhoto(key: string | undefined): key is string {
  return !!key && byKey.has(key);
}

export function photoKeys(): string[] {
  return Array.from(byKey.keys());
}
