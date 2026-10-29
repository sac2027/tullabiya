// What "finished the issue" means, and when the next one drops.
import type { IssueProgress } from '~/lib/api/Api';
import { SECTION_IDS } from '~/lib/model';

export type IssueState = 'none' | 'partial' | 'complete';

export function emptyProgress(issue: number): IssueProgress {
  return { issue, sectionsRead: [], voted: false, huntAttempted: false };
}

/** Complete = all five sections read, voted once, and the hunt attempted. */
export function issueState(p: IssueProgress | undefined): IssueState {
  if (!p) return 'none';
  const read = new Set(p.sectionsRead);
  const allRead = SECTION_IDS.every((s) => read.has(s));
  if (allRead && p.voted && p.huntAttempted) return 'complete';
  if (read.size > 0 || p.voted || p.huntAttempted) return 'partial';
  return 'none';
}

/** The first day of the month after `issueDate` (YYYY-MM-DD). */
export function nextIssueDate(issueDate: string): string {
  const [y, m] = issueDate.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, '0')}-01`;
}

export function sectionsReadCount(p: IssueProgress | undefined): number {
  return p ? new Set(p.sectionsRead).size : 0;
}
