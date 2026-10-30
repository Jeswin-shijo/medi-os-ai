import type { PharmacyFlag, PharmacyLineStatus, PharmacyLineView, PharmacyOrderView, PharmacyPriority, PharmacyStore } from '../types';

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

/** The query kinds and their words. A pharmacist picks any but `stock`, which only Out of stock opens. */
export const QUERY_KIND_LABEL: Record<string, string> = {
  allergy: 'Allergy',
  clash: 'Medicine clash',
  dose: 'Dose',
  kidney: 'Kidney function',
  stock: 'Stock',
  other: 'Something else'
};

/** The kinds the To check Query doctor form offers. */
export const CHECK_QUERY_KINDS = Object.keys(QUERY_KIND_LABEL).filter((k) => k !== 'stock');

/** Whole minutes from `now` to a time (negative once it has passed). */
export const minutesUntil = (iso: string, now: number): number => Math.floor((new Date(iso).getTime() - now) / 60_000);

/** "12 min left", "Due now", "5 min late". */
export function dueText(iso: string | null, now: number): { text: string; late: boolean } | null {
  if (!iso) return null;
  const m = minutesUntil(iso, now);
  if (m > 0) return { text: m >= 120 ? `${Math.floor(m / 60)} h left` : `${m} min left`, late: false };
  if (m === 0) return { text: 'Due now', late: true };
  const late = -m;
  return { text: late >= 120 ? `${Math.floor(late / 60)} h late` : `${late} min late`, late: true };
}

const redOf = (l: Pick<PharmacyLineView, 'flags'>) => l.flags.filter((f) => f.severity === 'red');

/** Unconfirmed red allergy flags: only a doctor can confirm these, so the pharmacist cannot approve. */
export const needsDoctorFlags = (l: Pick<PharmacyLineView, 'flags'>) => redOf(l).filter((f) => f.kind === 'allergy' && !f.confirmed);
/** Other unconfirmed red flags: the pharmacist approves with a written reason. */
export const needsReasonFlags = (l: Pick<PharmacyLineView, 'flags'>) => redOf(l).filter((f) => f.kind !== 'allergy' && !f.confirmed);
/** Amber allergy flags not yet marked reviewed. */
export const needsReviewFlags = (l: Pick<PharmacyLineView, 'flags'>) => l.flags.filter((f) => f.severity === 'amber' && f.kind === 'allergy' && !f.reviewed);

const PRIORITY_RANK: Record<PharmacyPriority, number> = { stat: 0, urgent: 1, routine: 2 };

/** The To check order: STAT first, then lines with a red flag, then urgent before routine, then the earliest due. */
export function sortForCheck(lines: PharmacyLineView[]): PharmacyLineView[] {
  const due = (l: PharmacyLineView) => (l.checkDueAt ? new Date(l.checkDueAt).getTime() : Number.MAX_SAFE_INTEGER);
  return [...lines].sort(
    (a, b) =>
      Number(b.priority === 'stat') - Number(a.priority === 'stat') ||
      Number(redOf(b).length > 0) - Number(redOf(a).length > 0) ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      due(a) - due(b)
  );
}

/** Red first, then amber; the order inside a colour is kept. */
export const sortedFlags = (flags: PharmacyFlag[]): PharmacyFlag[] => [...flags.filter((f) => f.severity === 'red'), ...flags.filter((f) => f.severity !== 'red')];
