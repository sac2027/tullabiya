// Percentages that always add up to 100, and the anonymity threshold for breakdowns.

/** Largest-remainder rounding: integers that sum to exactly 100, or all zeros for an empty poll. */
export function largestRemainder(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total <= 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c * 100) / total);
  const floors = raw.map((r) => Math.floor(r));
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floors[i] += 1;
    remainder -= 1;
  }
  return floors;
}

/** A college breakdown is shown only once enough people voted that no one can be singled out. */
export const BREAKDOWN_MIN = 20;

export function breakdownVisible(n: number, k: number = BREAKDOWN_MIN): boolean {
  return n >= k;
}

export function tally(counts: Record<string, number>): { total: number; pct: Record<string, number> } {
  const ids = Object.keys(counts);
  const pcts = largestRemainder(ids.map((id) => counts[id]));
  const pct: Record<string, number> = {};
  ids.forEach((id, i) => (pct[id] = pcts[i]));
  return { total: ids.reduce((a, id) => a + counts[id], 0), pct };
}
