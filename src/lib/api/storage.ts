/** Storage that never throws. Private windows and blocked site data fall back to memory. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

let memo: StorageLike | null = null;

export function safeStorage(): StorageLike {
  if (memo) return memo;
  try {
    const ls = globalThis.localStorage;
    const probe = '__tullabiya_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    memo = {
      getItem: (k) => {
        try {
          return ls.getItem(k);
        } catch {
          return null;
        }
      },
      setItem: (k, v) => {
        try {
          ls.setItem(k, v);
        } catch {}
      },
      removeItem: (k) => {
        try {
          ls.removeItem(k);
        } catch {}
      },
    };
  } catch {
    memo = memoryStorage();
  }
  return memo;
}

export function readJson<T>(s: StorageLike, key: string, fallback: T): T {
  try {
    const raw = s.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(s: StorageLike, key: string, value: unknown): void {
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {}
}
