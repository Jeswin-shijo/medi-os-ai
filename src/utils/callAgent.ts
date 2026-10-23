import { AgentCall, CallOutcome } from '../types';

// AI call agent helpers shared by the call log, the appointment panel and the
// call runner. Components live in components/common/callAgentUi.tsx.

export type Tone = 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'purple';

export const OUTCOME_META: Record<CallOutcome, { label: string; tone: Tone }> = {
  confirmed: { label: 'Confirmed', tone: 'green' },
  rescheduled: { label: 'Rescheduled', tone: 'blue' },
  reschedule_requested: { label: 'Wants new time', tone: 'orange' },
  cancelled: { label: 'Cancelled', tone: 'red' },
  booked: { label: 'Booked', tone: 'green' },
  slot_taken: { label: 'Slot taken', tone: 'orange' },
  callback: { label: 'Call back', tone: 'purple' },
  declined: { label: 'Declined', tone: 'gray' },
  no_answer: { label: 'No answer', tone: 'gray' },
  busy: { label: 'Busy', tone: 'gray' },
  wrong_number: { label: 'Wrong number', tone: 'red' },
  do_not_call: { label: 'Do not call', tone: 'red' },
  escalated: { label: 'Needs staff', tone: 'red' },
  failed: { label: 'Failed', tone: 'red' }
};

export const OUTCOME_OPTIONS = Object.entries(OUTCOME_META).map(([value, m]) => ({ value: value as CallOutcome, label: m.label }));

export const isLive = (call: Pick<AgentCall, 'status'>) => call.status === 'scheduled' || call.status === 'calling';

/** "2:05 PM" today, "27 Sep, 9:00 AM" otherwise. */
export const callTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? time : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
};

export const callDuration = (sec?: number) => (sec == null ? '—' : sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`);
