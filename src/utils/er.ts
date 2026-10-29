import type { BedRequestPriority, ErDispositionKind, ErMode, ErVisit, TriageColour } from '../types';

export const ER_ROLES = ['admin', 'doctor', 'nurse', 'staff'];

/** Triage, bays, steps, pathways and the handover note. */
export const ER_CLINICAL_ROLES = ['admin', 'doctor', 'nurse'];
/** Seen by doctor and the disposition. */
export const ER_DOCTOR_ROLES = ['admin', 'doctor'];

export const TRIAGE_COLOURS: TriageColour[] = ['red', 'orange', 'yellow', 'green'];
export const COLOUR_LABEL: Record<TriageColour, string> = { red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green' };
export const COLOUR_RANK: Record<TriageColour, number> = { red: 0, orange: 1, yellow: 2, green: 3 };

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

/** The bed priority a triage colour asks for. */
export const PRIORITY_FROM_COLOUR: Record<TriageColour, BedRequestPriority> = { red: 'critical', orange: 'high', yellow: 'medium', green: 'low' };

export const MODE_LABEL: Record<ErMode, string> = { 'walk-in': 'Walk-in', ambulance: 'Ambulance', referred: 'Referred' };

export const DISPOSITION_LABEL: Record<ErDispositionKind, string> = {
  admit: 'Admit',
  home: 'Home',
  transfer: 'Transfer',
  'left-against-advice': 'Left against advice',
  died: 'Died'
};

/** Whole minutes from `now` to `dueAt` (real time): negative once past due. */
export const minutesTo = (dueAt: string, now: number): number => Math.floor((new Date(dueAt).getTime() - now) / MIN_MS);

export const leftText = (minutes: number): string => (minutes < 0 ? `${-minutes} min late` : `${minutes} min left`);

/** The visit's clock for a pathway step. The doctor step shares the doctor clock when it has no clock of its own. */
export function stepClock(visit: ErVisit, step: string) {
  return visit.clocks.find((c) => c.key === `er-step-${step}`) ?? (step === 'doctor' ? visit.clocks.find((c) => c.key === 'er-doctor') : undefined);
}

/** The ten digits of an Indian mobile number typed as "98765 43210", "+91 98765-43210" or "09876543210"; null when it is not one. */
export function indianMobile(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
