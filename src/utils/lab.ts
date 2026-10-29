import type { LabCriticalRow, LabLimit, LabLineStatus, LabPriority, LabRejectReason, LabRequestView } from '../types';

// The same role sets as the API (lab.controller.ts). Front desk has no access.
/** Reads. */
export const LAB_READ = ['admin', 'doctor', 'nurse', 'lab', 'pharmacist'];
/** Order tests and cancel them. */
export const LAB_ORDER = ['admin', 'doctor'];
/** Collect samples, mark not collected, labels. */
export const LAB_COLLECT = ['admin', 'nurse', 'lab'];
/** Receive, reject, enter, send back, release, amend. */
export const LAB_BENCH = ['admin', 'lab'];
/** Acknowledge critical results. */
export const LAB_ACK = ['admin', 'doctor'];

/** sessionStorage key for the Lab Agent's open tab. */
export const LAB_TAB_KEY = 'mediosLabTab';

export const canReadLab = (role: string): boolean => LAB_READ.includes(role);
export const canOrderLab = (role: string): boolean => LAB_ORDER.includes(role);
export const canCollectLab = (role: string): boolean => LAB_COLLECT.includes(role);
export const canBenchLab = (role: string): boolean => LAB_BENCH.includes(role);
export const canAckLab = (role: string): boolean => LAB_ACK.includes(role);

export const PRIORITY_LABEL: Record<LabPriority, string> = { stat: 'STAT', urgent: 'Urgent', routine: 'Routine' };
/** The status-pill colour for a priority. */
export const PRIORITY_TONE: Record<LabPriority, string> = { stat: 'red', urgent: 'orange', routine: 'gray' };

export const LINE_STATUS_LABEL: Record<LabLineStatus, string> = {
  ordered: 'Ordered',
  collected: 'Collected',
  received: 'Received',
  'awaiting-validation': 'Awaiting validation',
  released: 'Released',
  cancelled: 'Cancelled'
};

export type OrderFilter = 'all' | 'pending' | 'in-progress' | 'completed' | 'critical';

export const ORDER_FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'critical', label: 'Critical' }
];

const isCritical = (r: LabRequestView) => r.lines.some((l) => l.critical?.active && l.status !== 'cancelled');

/** Whether a request belongs under a filter chip. Pending: any line ordered or collected. In progress: received or awaiting validation. Completed: every line released or cancelled. */
export function matchesOrderFilter(r: LabRequestView, filter: OrderFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'pending':
      return r.lines.some((l) => l.status === 'ordered' || l.status === 'collected');
    case 'in-progress':
      return r.lines.some((l) => l.status === 'received' || l.status === 'awaiting-validation');
    case 'completed':
      return r.lines.length > 0 && r.lines.every((l) => l.status === 'released' || l.status === 'cancelled');
    case 'critical':
      return isCritical(r);
  }
}

/** A short status for a whole request: its critical state, else the furthest-behind open line. */
export function requestStatus(r: LabRequestView): { label: string; tone: string } {
  const crit = r.lines.filter((l) => l.critical?.active && l.status !== 'cancelled');
  if (crit.some((l) => !l.critical?.ackAt)) return { label: 'Critical — not acknowledged', tone: 'red' };
  if (crit.length) return { label: 'Critical — acknowledged', tone: 'orange' };
  if (matchesOrderFilter(r, 'completed')) return { label: r.lines.every((l) => l.status === 'cancelled') ? 'Cancelled' : 'Completed', tone: r.lines.every((l) => l.status === 'cancelled') ? 'gray' : 'green' };
  if (matchesOrderFilter(r, 'pending')) return { label: 'Pending', tone: 'orange' };
  return { label: 'In progress', tone: 'blue' };
}

export const locationText = (loc: { area: string; ward?: string }): string => (loc.ward ? `${loc.area} · ${loc.ward}` : loc.area);

export const minutesText = (n: number | null): string => (n === null ? '— min' : `${n} min`);
export const percentText = (n: number | null): string => (n === null ? '—%' : `${n}%`);

/** Whole minutes from now to `iso` on the real clock: negative once past. */
export const minutesUntil = (iso: string, now: number): number => Math.floor((new Date(iso).getTime() - now) / 60_000);

/** A unit for printing after a value: empty for a missing or dash-only unit (INR and pH have none). */
export const unitText = (unit?: string): string => (!unit || /^[\s\-–—]*$/.test(unit) ? '' : unit);

export const REJECT_LABEL: Record<LabRejectReason, string> = {
  haemolysed: 'Haemolysed',
  clotted: 'Clotted',
  'wrong-tube': 'Wrong tube',
  unlabelled: 'Unlabelled',
  insufficient: 'Insufficient sample',
  other: 'Other'
};

export interface ParamDef {
  name: string;
  low: number | null;
  high: number | null;
  text: boolean;
}

export type ValueFlag = 'normal' | 'low' | 'high' | 'abnormal';

const NORMAL_TEXT = ['nil', 'no growth'];

/**
 * The same rules as the API's flagValue, so the form can flag a value while it is typed. Numbers: below the low
 * bound is Low, above the high bound is High, a value on a bound is normal. Critical: below the critical low or
 * above the critical high. Text is normal only for Nil or No growth (as the API: Negative is stored as Nil); `anyAbnormalText` makes any other
 * text critical. The server stays authoritative.
 */
export function flagValue(test: string, param: ParamDef, value: number | string, limits: Record<string, LabLimit>): { flag: ValueFlag; critical: boolean } {
  const limit = limits[`${test}.${param.name}`];
  if (param.text) {
    const flag: ValueFlag = NORMAL_TEXT.includes(String(value).trim().toLowerCase()) ? 'normal' : 'abnormal';
    return { flag, critical: flag === 'abnormal' && limit?.anyAbnormalText === true };
  }
  const n = Number(value);
  let flag: ValueFlag = 'normal';
  if (param.low !== null && n < param.low) flag = 'low';
  else if (param.high !== null && n > param.high) flag = 'high';
  const critical = !!limit && ((limit.low != null && n < limit.low) || (limit.high != null && n > limit.high));
  return { flag, critical };
}

/** The words for a flag: shown beside the colour, never colour alone. */
export const flagLabel = (flag: ValueFlag, critical: boolean): string => (critical ? (flag === 'low' ? 'Critical low' : flag === 'high' ? 'Critical high' : 'Critical') : flag === 'normal' ? 'Normal' : flag === 'low' ? 'Low' : flag === 'high' ? 'High' : 'Abnormal');
export const flagTone = (flag: ValueFlag, critical: boolean): string => (critical ? 'red' : flag === 'normal' ? 'green' : 'orange');

/** "Hb 5.9 g/dL (Critical low)" for each critical value of a row, joined with " · ". */
export const criticalValuesText = (c: LabCriticalRow): string => {
  const list = c.criticals?.length ? c.criticals : [{ param: c.parameter, value: c.value, unit: c.unit, flag: 'abnormal' }];
  return list
    .map((v) => {
      const unit = unitText(v.unit);
      return `${v.param} ${v.value}${unit ? ` ${unit}` : ''} (${flagLabel(v.flag as ValueFlag, true)})`;
    })
    .join(' · ');
};

/** The first critical value and "and N more", for a one-line preview. */
export const criticalFirstText = (c: LabCriticalRow): string => {
  const n = c.criticals?.length ?? 0;
  const first = criticalValuesText({ ...c, criticals: n ? [c.criticals[0]] : [] });
  return n > 1 ? `${first} and ${n - 1} more` : first;
};

/** Name · UHID · location, for a critical row. */
export const criticalWho = (c: LabCriticalRow): string =>
  [c.patientName, c.patientUhid, c.location ? locationText(c.location) : ''].filter(Boolean).join(' · ');

/** The words for minutes to a deadline: "N min overdue" once past, never a negative number. */
export const dueText = (left: number): string => (left < 0 ? `${-left} min overdue` : `Acknowledge within ${left} min`);
