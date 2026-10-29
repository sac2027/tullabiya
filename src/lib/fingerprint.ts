// Every issue gets its own pattern of bars: deterministic, so the wall is stable across builds.
export function fingerprint(issue: number, bars: number = 9): number[] {
  const out: number[] = [];
  let x = (issue * 2654435761) >>> 0;
  for (let i = 0; i < bars; i++) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    out.push(18 + (x % 78));
  }
  return out;
}
