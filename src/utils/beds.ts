import { Ban, Clock, Sparkles, type LucideIcon } from 'lucide-react';
import type { BedBoard, BedState, BoardBed, BoardWard, Need, RoomClass } from '../types';
import { clinicNow, isoDay } from './clinicDate';

export const BED_STATE_META: Record<BedState, { label: string; color: string; icon?: LucideIcon }> = {
  free: { label: 'Free', color: 'var(--green-emerald)' },
  occupied: { label: 'Occupied', color: 'var(--blue-primary)' },
  cleaning: { label: 'Cleaning', color: 'var(--orange-amber)', icon: Sparkles },
  held: { label: 'Held', color: 'var(--purple-ai)', icon: Clock },
  blocked: { label: 'Blocked', color: 'var(--red-rose)', icon: Ban }
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

export function defaultRoomClass(age: number, needs: Need[]): RoomClass {
  if (age < 14) return 'paediatric';
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
