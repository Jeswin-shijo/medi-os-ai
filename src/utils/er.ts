import type { ErVisit, TriageColour } from '../types';

export const ER_ROLES = ['admin', 'doctor', 'nurse', 'staff'];

export const TRIAGE_COLOURS: TriageColour[] = ['red', 'orange', 'yellow', 'green'];
export const COLOUR_LABEL: Record<TriageColour, string> = { red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green' };
const COLOUR_RANK: Record<TriageColour, number> = { red: 0, orange: 1, yellow: 2, green: 3 };

/** Minutes from arrival to triage (the backend's fixed triage wait). */
export const TRIAGE_WAIT_MIN = 10;
const MIN_MS = 60_000;

export const STATUS_LABEL: Record<ErVisit['status'], string> = {
  'waiting-triage': 'Waiting for triage',
  'waiting-doctor': 'Waiting for doctor',
  'in-treatment': 'In treatment',
  'waiting-bed': 'Waiting for a bed',
  left: 'Left'
};

/** The backend names an unknown patient "Unknown <male|female|person>, ER-<number>"; the view has no flag for it. */
const PLACEHOLDER = /^Unknown (male|female|person), ER-/i;
export const isPlaceholderName = (name: string): boolean => PLACEHOLDER.test(name);
export const placeholderGender = (name: string): 'Male' | 'Female' | null => {
  const m = PLACEHOLDER.exec(name)?.[1].toLowerCase();
  return m === 'male' ? 'Male' : m === 'female' ? 'Female' : null;
};

/** Untriaged first, then red to green, then the earlier arrival (the same order as the backend board). */
export const boardOrder = (a: ErVisit, b: ErVisit): number => {
  const rank = (v: ErVisit) => (v.colour ? COLOUR_RANK[v.colour] : -1);
  return rank(a) - rank(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

/**
 * Minutes past the deadline, or null when on time. The deadline runs from the visit's real `createdAt`:
 * triage within 10 minutes while untriaged, then the colour's doctor target while waiting for a doctor.
 * Pathway steps are not counted here; the visit panel shows those.
 */
export function overdueMinutes(visit: ErVisit, doctorTargetMin: Partial<Record<TriageColour, number>>, now: number): number | null {
  let dueMin: number | undefined;
  if (visit.status === 'waiting-triage' && !visit.colour) dueMin = TRIAGE_WAIT_MIN;
  else if (visit.status === 'waiting-doctor' && !visit.doctorSeenAt && visit.colour) dueMin = doctorTargetMin[visit.colour];
  if (dueMin === undefined) return null;
  const late = Math.floor((now - (new Date(visit.createdAt).getTime() + dueMin * MIN_MS)) / MIN_MS);
  return late > 0 ? late : null;
}
