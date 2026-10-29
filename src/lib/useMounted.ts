import { useEffect, useState } from 'preact/hooks';

/** False on the server and on the first client render, so hydration matches the SSR'd markup exactly.
 *  Islands read shared stores only once mounted; otherwise an island hydrating after another one has
 *  filled the store renders differently from the server, and Preact keeps the stale SSR attributes. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
