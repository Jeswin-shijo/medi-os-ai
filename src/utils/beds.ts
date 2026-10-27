import { Ban, Clock, Sparkles, type LucideIcon } from 'lucide-react';
import type { BedBoard, BedRequest, BedRequestPriority, BedRequestState, BedState, BoardBed, BoardWard, Need, RoomClass } from '../types';
import { bedRequestService } from '../services';
import { clinicNow, isoDay } from './clinicDate';

/** One place for what each bed state looks like: tiles, the legend, the panel and the totals all read from here. */
export interface BedStateMeta {
  label: string;
  /** Tile fill. */
  fill: string;
  border: string;
  /** Text and icon colour on the fill (AA contrast). */
  text: string;
  icon?: LucideIcon;
}

export const BED_STATE_META: Record<BedState, BedStateMeta> = {
  free: { label: 'Free', fill: 'var(--green-dark)', border: 'var(--green-dark)', text: '#ffffff' },
  occupied: { label: 'Occupied', fill: 'var(--gray-pill-bg)', border: 'var(--gray-pill-border)', text: 'var(--text-secondary)' },
  cleaning: { label: 'Cleaning', fill: 'var(--orange-amber)', border: 'var(--orange-amber)', text: 'var(--text-primary)', icon: Sparkles },
  held: { label: 'Held', fill: 'var(--blue-primary)', border: 'var(--blue-primary)', text: '#ffffff', icon: Clock },
  blocked: { label: 'Blocked', fill: 'var(--red-light)', border: 'var(--red-rose)', text: 'var(--red-dark)', icon: Ban }
};

export const NEED_OPTIONS: { need: Need; label: string }[] = [
  { need: 'oxygen', label: 'Oxygen' },
  { need: 'highFallRisk', label: 'High fall risk' },
  { need: 'isolation', label: 'Isolation' },
  { need: 'ventilator', label: 'Ventilator' },
  { need: 'monitor', label: 'Monitor' },
  { need: 'pregnant', label: 'Pregnant' }
];

/** Same labels as the backend's CLASS_LABEL. */
export const ROOM_CLASS_OPTIONS: { value: RoomClass; label: string }[] = [
  { value: 'general', label: 'General ward' },
  { value: 'twin', label: 'Twin room' },
  { value: 'private', label: 'Private room' },
  { value: 'deluxe', label: 'Deluxe suite' },
  { value: 'icu', label: 'ICU' },
  { value: 'hdu', label: 'HDU' },
  { value: 'maternity', label: 'Maternity ward' },
  { value: 'paediatric', label: 'Paediatric ward' },
  { value: 'emergency', label: 'Emergency observation' }
];

/** Emergency observation is offered only to an emergency department. */
export const offersEmergency = (department: string) => /emergency/i.test(department);

/** The class step 1 starts on; `age` is unknown until a patient is chosen. */
export function defaultRoomClass(age: number | undefined, needs: Need[]): RoomClass {
  if (age !== undefined && age < 14) return 'paediatric';
  if (needs.includes('pregnant')) return 'maternity';
  return 'general';
}

/** Wards (optionally of one floor) with their beds and how many are free; wards with no beds are left out. */
export function groupBoard(board: BedBoard, floor: number | 'all'): Array<{ ward: BoardWard; beds: BoardBed[]; free: number }> {
  return board.wards
    .filter((ward) => floor === 'all' || ward.floor === floor)
    .map((ward) => {
      const beds = board.beds.filter((bed) => bed.wardId === ward.id);
      return { ward, beds, free: beds.filter((bed) => bed.state === 'free').length };
    })
    .filter((group) => group.beds.length > 0);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** "since 10:40" for today (clinic day), otherwise "since 24 Sep". */
export function sinceLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return isoDay(d) === isoDay(clinicNow()) ? `since ${pad(d.getHours())}:${pad(d.getMinutes())}` : `since ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Same role sets as the backend: who admits, transfers and discharges, who cleans and blocks beds, and who may ignore the bed rules. */
export const ADMIT_ROLES = ['admin', 'doctor', 'nurse', 'staff'];
export const HOUSEKEEPING_ROLES = ['admin', 'nurse', 'staff'];
export const OVERRIDE_ROLES = ['admin', 'doctor'];

/** "₹1,200/day" (Indian digit grouping). */
export function formatRate(rate: number): string {
  return `₹${rate.toLocaleString('en-IN')}/day`;
}

const FLOOR_NAME = ['Ground floor', '1st floor', '2nd floor'];

export function floorLabel(floor: number): string {
  return FLOOR_NAME[floor] ?? `Floor ${floor}`;
}

/** Who may create, cancel and decide on bed requests (same as the backend's REQUEST_ROLES). */
export const REQUEST_ROLES = ['admin', 'doctor'];

/** How each request state reads in lists and badges. */
export const REQUEST_STATE_META: Record<BedRequestState, { label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  searching: { label: 'Searching', tone: 'info' },
  assigned: { label: 'Bed assigned', tone: 'success' },
  waiting: { label: 'Waiting for a bed', tone: 'warning' },
  attention: { label: 'Needs attention', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' }
};

export const PRIORITY_OPTIONS: { value: BedRequestPriority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

/** "Admission", "Transfer" or "Step-down" (a transfer out of a higher-care unit). */
export function requestTypeLabel(r: Pick<BedRequest, 'type' | 'stepDown'>): string {
  if (r.stepDown) return 'Step-down';
  return r.type === 'transfer' ? 'Transfer' : 'Admission';
}


const FOLLOW_EVERY_MS = 1000;
const FOLLOW_FOR_MS = 30_000;

/**
 * Toasts for a bed request just sent, on any screen: "finding a bed" now, then the outcome once the Bed Agent
 * moves it on from `searching`. Polls once a second and stops on any other state, or after 30 seconds.
 */
export function followRequest(
  id: string,
  deps: { showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void; refreshAlertCount: () => Promise<void> },
  name: string
): void {
  deps.showToast(`Bed Agent is finding a bed for ${name}…`, 'info');
  const until = Date.now() + FOLLOW_FOR_MS;
  const poll = async () => {
    try {
      const r = await bedRequestService.get(id);
      if (r.state === 'assigned') return deps.showToast(`${name} assigned to ${r.assignedBedLabel ?? 'a bed'}`, 'success');
      if (r.state === 'waiting' || r.state === 'attention') {
        deps.showToast(`No bed yet for ${name}. The team has been alerted.`, 'warning');
        void deps.refreshAlertCount().catch(() => undefined);
        return;
      }
      if (r.state === 'cancelled') return;
    } catch {
      // A failed check is tried again until the time is up.
    }
    if (Date.now() < until) window.setTimeout(() => void poll(), FOLLOW_EVERY_MS);
  };
  window.setTimeout(() => void poll(), FOLLOW_EVERY_MS);
}
