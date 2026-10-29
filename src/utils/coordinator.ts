import type { AgentKey, Priority } from '../types';
import { AGENT_LIST } from '../types';
import { dayAndTime } from './beds';
import { toClinicClock } from './clinicDate';

export const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export const PRIORITY_LABELS: Record<Priority, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
/** Pill colours reuse the bed request ones. */
export const PRIORITY_PILLS: Record<Priority, string> = { critical: 'red', high: 'orange', medium: 'cyan', low: 'gray' };

export const agentName = (key: string): string => AGENT_LIST.find((a) => a.key === key)?.name ?? key;
export const agentNames = (keys: AgentKey[]): string => keys.map(agentName).join(', ');

/** A real-clock time (message, clock, escalation, approval) as "Today, 10:30 AM" on the clinic's calendar. */
export const realDayAndTime = (iso: string): string => dayAndTime(toClinicClock(iso));

/** "just now", "5 min ago", "3 h ago" for a real-clock time; older than a day falls back to a date and time. */
export function ago(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const min = Math.floor((now - t) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (min < 24 * 60) return `${Math.floor(min / 60)} h ago`;
  return realDayAndTime(iso);
}

/** "12 min left", "1 h 05 min left" or "overdue by 4 min". */
export function timeLeft(dueAt: string, now: number = Date.now()): { text: string; late: boolean } {
  const ms = new Date(dueAt).getTime() - now;
  if (Number.isNaN(ms)) return { text: '', late: false };
  const late = ms < 0;
  const min = Math.max(0, Math.ceil(Math.abs(ms) / 60_000));
  const span = min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min` : `${min} min`;
  return { text: late ? `overdue by ${span}` : `${span} left`, late };
}

const ACRONYMS = new Set(['er', 'ecg', 'ct', 'icu', 'hdu']);
const CLOCK_LABELS: Record<string, string> = { 'er-triage': 'Triage', 'er-doctor': 'Doctor review' };
/** The ER pathway steps' labels, for `er-step-<step>` clocks. */
const ER_STEP_LABELS: Record<string, string> = {
  ecg: 'ECG done',
  doctor: 'Seen by a doctor',
  ct: 'CT scan done',
  'last-known-well': 'Last known well recorded',
  cultures: 'Blood cultures taken',
  antibiotics: 'Antibiotics given'
};

/** A message type like "bed.request" read as words: "Bed request". Acronyms like ER and ECG stay in capitals. */
export function typeLabel(type: string): string {
  const words = type.replace(/[._-]+/g, ' ').trim();
  if (!words) return type;
  const text = words.split(' ').map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w)).join(' ');
  return text[0].toUpperCase() + text.slice(1);
}

/** A clock's name: the ER ones read as words ("Doctor review", "ECG done"); the rest as typeLabel. */
export function clockLabel(def: string): string {
  if (CLOCK_LABELS[def]) return CLOCK_LABELS[def];
  if (def.startsWith('er-step-')) {
    const step = def.slice('er-step-'.length);
    return ER_STEP_LABELS[step] ?? typeLabel(step);
  }
  return typeLabel(def);
}
