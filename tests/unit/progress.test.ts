import { describe, it, expect } from 'vitest';
import { issueState, nextIssueDate, emptyProgress } from '~/lib/progress';

describe('nextIssueDate', () => {
  it('rolls to the first of next month', () => {
    expect(nextIssueDate('2026-09-01')).toBe('2026-10-01');
    expect(nextIssueDate('2026-12-01')).toBe('2027-01-01');
  });
});

describe('issueState', () => {
  it('none, partial, complete', () => {
    expect(issueState(undefined)).toBe('none');
    expect(issueState(emptyProgress(21))).toBe('none');
    expect(issueState({ ...emptyProgress(21), sectionsRead: ['news'] })).toBe('partial');
    expect(issueState({ issue: 21, sectionsRead: ['news', 'guest', 'experience', 'contributions', 'last'], voted: true, huntAttempted: false })).toBe('partial');
    expect(issueState({ issue: 21, sectionsRead: ['news', 'guest', 'experience', 'contributions', 'last'], voted: true, huntAttempted: true })).toBe('complete');
  });
});
