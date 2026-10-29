import type { ErVisit, TriageColour } from '../types';

export const ER_ROLES = ['admin', 'doctor', 'nurse', 'staff'];

export const TRIAGE_COLOURS: TriageColour[] = ['red', 'orange', 'yellow', 'green'];
export const COLOUR_LABEL: Record<TriageColour, string> = { red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green' };
const COLOUR_RANK: Record<TriageColour, number> = { red: 0, orange: 1, yellow: 2, green: 3 };

const MIN_MS = 60_000;

export const STATUS_LABEL: Record<ErVisit['status'], string> = {
  'waiting-triage': 'Waiting for triage',
  'waiting-doctor': 'Waiting for doctor',
  'in-treatment': 'In treatment',
  'waiting-bed': 'Waiting for a bed',
  left: 'Left'
};

/** Untriaged first, then red to green, then the earlier arrival (the same order as the backend board). */
export const boardOrder = (a: ErVisit, b: ErVisit): number => {
  const rank = (v: ErVisit) => (v.colour ? COLOUR_RANK[v.colour] : -1);
  return rank(a) - rank(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

/** The visit's earliest clock, as minutes from now: negative once past due. Null with no clocks. Counts from the real clock. */
export function nextDeadline(visit: ErVisit, now: number): { label: string; minutes: number } | null {
  if (!visit.clocks.length) return null;
  const due = Math.min(...visit.clocks.map((c) => new Date(c.dueAt).getTime()));
  const minutes = Math.floor((due - now) / MIN_MS);
  const label = visit.clocks.find((c) => new Date(c.dueAt).getTime() === due)?.label ?? '';
  return { label, minutes };
}
