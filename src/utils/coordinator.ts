import type { AgentKey, Priority } from '../types';
import { AGENT_LIST } from '../types';
import { dayAndTime } from './beds';

export const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export const PRIORITY_LABELS: Record<Priority, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
/** Pill colours reuse the bed request ones. */
export const PRIORITY_PILLS: Record<Priority, string> = { critical: 'red', high: 'orange', medium: 'cyan', low: 'gray' };

export const agentName = (key: string): string => AGENT_LIST.find((a) => a.key === key)?.name ?? key;
export const agentNames = (keys: AgentKey[]): string => keys.map(agentName).join(', ');

/** "just now", "5 min ago", "3 h ago"; older than a day falls back to a date and time. */
export function ago(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const min = Math.floor((now - t) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (min < 24 * 60) return `${Math.floor(min / 60)} h ago`;
  return dayAndTime(iso);
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

/** A message type like "bed.request" read as words: "Bed request". */
export function typeLabel(type: string): string {
  const words = type.replace(/[._-]+/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : type;
}
