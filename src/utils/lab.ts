import type { LabLineStatus, LabPriority, LabRequestView } from '../types';

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
  if (isCritical(r)) return { label: 'Critical', tone: 'red' };
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
