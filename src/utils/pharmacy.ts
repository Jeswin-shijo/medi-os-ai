import type { PharmacyLineStatus, PharmacyLineView, PharmacyOrderView, PharmacyPriority, PharmacyStore } from '../types';

// The same role sets as the API (pharmacy.controller.ts). Lab and front desk have no access.
/** Every read, and Explain. */
export const PHARMACY_READ = ['admin', 'doctor', 'nurse', 'pharmacist'];
/** Preview checks, order, cancel unissued lines, answer queries. */
export const PHARMACY_ORDER = ['admin', 'doctor'];
/** Approve, query, reject, issue, out of stock. */
export const PHARMACY_CHECK = ['admin', 'pharmacist'];
/** Receive, adjust, remove expired, reorder levels. */
export const PHARMACY_STOCK = ['admin', 'pharmacist'];

/** sessionStorage key for the Pharmacy Agent's open tab. */
export const PHARMACY_TAB_KEY = 'mediosPharmacyTab';

export const canReadPharmacy = (role: string): boolean => PHARMACY_READ.includes(role);
export const canOrderPharmacy = (role: string): boolean => PHARMACY_ORDER.includes(role);
export const canCheckPharmacy = (role: string): boolean => PHARMACY_CHECK.includes(role);
export const canStockPharmacy = (role: string): boolean => PHARMACY_STOCK.includes(role);

export const PRIORITY_LABEL: Record<PharmacyPriority, string> = { stat: 'STAT', urgent: 'Urgent', routine: 'Routine' };
/** The status-pill colour for a priority. */
export const PRIORITY_TONE: Record<PharmacyPriority, string> = { stat: 'red', urgent: 'orange', routine: 'gray' };

export const LINE_STATUS_LABEL: Record<PharmacyLineStatus, string> = {
  'to-check': 'To check',
  query: 'Query',
  approved: 'To issue',
  issued: 'Issued',
  stopped: 'Stopped',
  rejected: 'Rejected',
  cancelled: 'Cancelled'
};

export const STORE_LABEL: Record<PharmacyStore, string> = { main: 'Main pharmacy', er: 'ER' };

export const ROUTE_LABEL: Record<string, string> = { oral: 'Oral', sublingual: 'Sublingual', iv: 'IV', im: 'IM', sc: 'Subcutaneous', inhaled: 'Nebulised' };

export type OrderFilter = 'all' | 'to-check' | 'query' | 'to-issue' | 'issued' | 'flagged';

export const ORDER_FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'to-check', label: 'To check' },
  { id: 'query', label: 'Query' },
  { id: 'to-issue', label: 'To issue' },
  { id: 'issued', label: 'Issued' },
  { id: 'flagged', label: 'Flagged' }
];

/** A line that is finished without being issued (it no longer counts toward a filter or a flag). */
const isDead = (l: PharmacyLineView) => l.status === 'cancelled' || l.status === 'rejected' || l.status === 'stopped';

/** A line with an open query: status `query`, or an issued line whose query has no answer yet. */
export const hasOpenQuery = (l: PharmacyLineView): boolean => !!l.query && !l.query.answer;

/** Whether an order belongs under a filter chip. Flagged: any red flag on a line that is still live. */
export function matchesOrderFilter(o: PharmacyOrderView, filter: OrderFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'to-check':
      return o.lines.some((l) => l.status === 'to-check');
    case 'query':
      return o.lines.some(hasOpenQuery);
    case 'to-issue':
      return o.lines.some((l) => l.status === 'approved');
    case 'issued':
      return o.lines.some((l) => l.status === 'issued');
    case 'flagged':
      return o.lines.some((l) => !isDead(l) && l.flags.some((f) => f.severity === 'red'));
  }
}

/** A short status for a whole order: the furthest-behind open line, else how it ended. */
export function orderStatus(o: PharmacyOrderView): { label: string; tone: string } {
  const lines = o.lines;
  if (lines.some(hasOpenQuery)) return { label: 'Query', tone: 'red' };
  if (lines.some((l) => l.status === 'to-check')) return { label: 'To check', tone: 'orange' };
  if (lines.some((l) => l.status === 'approved')) return { label: lines.some((l) => l.waitingForStock) ? 'Waiting for stock' : 'To issue', tone: 'blue' };
  if (lines.length && lines.every((l) => l.status === 'issued')) return { label: 'Issued', tone: 'green' };
  if (lines.length && lines.every(isDead)) return { label: lines.every((l) => l.status === 'cancelled') ? 'Cancelled' : 'Closed', tone: 'gray' };
  return { label: 'Done', tone: 'green' };
}

/** "300 mg STAT", "75 mg OD for 7 days"; a dose the checks could not read says so. */
export function doseText(l: Pick<PharmacyLineView, 'dose' | 'unit' | 'frequency' | 'durationDays'>): string {
  const dose = l.dose === null ? 'Dose not readable' : `${l.dose} ${l.unit}`.trim();
  const freq = l.frequency ? ` ${l.frequency}` : '';
  const days = l.durationDays ? ` for ${l.durationDays} ${l.durationDays === 1 ? 'day' : 'days'}` : '';
  return `${dose}${freq}${days}`;
}

export const minutesText = (n: number | null): string => (n === null ? '— min' : `${n} min`);
export const percentText = (n: number | null): string => (n === null ? '—%' : `${n}%`);
