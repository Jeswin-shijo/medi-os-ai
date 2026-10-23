import React from 'react';
import { PhoneCall, PhoneOff, PhoneMissed, CalendarCheck, CalendarClock, CircleAlert } from 'lucide-react';
import { AgentCall, AppointmentConfirmation, CallStatus } from '../../types';
import { OUTCOME_META, Tone } from '../../utils/callAgent';

// Shared presentation for the AI call agent: outcome badges, the appointment
// confirmation chip and the call transcript.

const TONES: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: 'var(--green-light)', fg: 'var(--green-dark)' },
  blue: { bg: 'var(--blue-light)', fg: 'var(--blue-text)' },
  orange: { bg: 'var(--orange-light)', fg: 'var(--orange-dark)' },
  red: { bg: 'var(--red-light)', fg: 'var(--red-dark)' },
  gray: { bg: 'var(--bg-tab)', fg: 'var(--text-secondary)' },
  purple: { bg: 'var(--purple-light)', fg: 'var(--purple-dark)' }
};

const STATUS_META: Record<Exclude<CallStatus, 'completed'>, { label: string; tone: Tone }> = {
  scheduled: { label: 'Scheduled', tone: 'purple' },
  calling: { label: 'Calling…', tone: 'blue' },
  failed: { label: 'Not placed', tone: 'red' },
  canceled: { label: 'Canceled', tone: 'gray' }
};

const Pill: React.FC<{ tone: Tone; children: React.ReactNode; title?: string }> = ({ tone, children, title }) => (
  <span className="badge-pill" title={title} style={{ backgroundColor: TONES[tone].bg, color: TONES[tone].fg, whiteSpace: 'nowrap' }}>
    {children}
  </span>
);

/** The call's result, or where it is in its life if it has none yet. */
export const CallResultBadge: React.FC<{ call: Pick<AgentCall, 'status' | 'outcome' | 'error'> }> = ({ call }) => {
  if (call.outcome && call.status !== 'scheduled' && call.status !== 'calling') {
    const m = OUTCOME_META[call.outcome];
    return <Pill tone={m.tone}>{m.label}</Pill>;
  }
  const m = STATUS_META[call.status as Exclude<CallStatus, 'completed'>] ?? STATUS_META.failed;
  return (
    <Pill tone={m.tone} title={call.error || undefined}>
      {call.status === 'calling' && <span className="call-pulse" />}
      {m.label}
    </Pill>
  );
};

export const PurposeBadge: React.FC<{ purpose: AgentCall['purpose'] }> = ({ purpose }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-xs)', fontWeight: 600, color: purpose === 'booking' ? 'var(--purple-dark)' : 'var(--blue-text)' }}>
    {purpose === 'booking' ? <CalendarClock size={13} /> : <CalendarCheck size={13} />}
    {purpose === 'booking' ? 'Booking' : 'Confirmation'}
  </span>
);

const CONFIRMATION_META: Record<AppointmentConfirmation, { label: string; tone: Tone; icon: typeof PhoneCall }> = {
  Unconfirmed: { label: 'Unconfirmed', tone: 'gray', icon: PhoneCall },
  Confirmed: { label: 'Confirmed', tone: 'green', icon: CalendarCheck },
  'Reschedule Requested': { label: 'Wants new time', tone: 'orange', icon: CalendarClock },
  'Cancelled by Patient': { label: 'Cancelled by patient', tone: 'red', icon: PhoneOff },
  Unreachable: { label: 'Unreachable', tone: 'orange', icon: PhoneMissed }
};

/** Whether the patient has said they will come. `compact` is an icon (with tooltip) for dense lists. */
export const ConfirmationChip: React.FC<{ value?: AppointmentConfirmation; compact?: boolean }> = ({ value = 'Unconfirmed', compact }) => {
  const m = CONFIRMATION_META[value] ?? CONFIRMATION_META.Unconfirmed;
  const Icon = m.icon;
  if (compact) {
    return (
      <span role="img" aria-label={`Confirmation: ${m.label}`} title={`Confirmation: ${m.label}`} style={{ display: 'inline-flex', color: TONES[m.tone].fg }}>
        <Icon size={13} strokeWidth={2.3} />
      </span>
    );
  }
  return (
    <Pill tone={m.tone}>
      <Icon size={12} strokeWidth={2.2} />
      {m.label}
    </Pill>
  );
};

/** The conversation as chat bubbles: agent on the left, patient on the right. */
export const Transcript: React.FC<{ lines: NonNullable<AgentCall['transcript']>; agentName?: string }> = ({ lines, agentName = 'Agent' }) => {
  if (!lines.length) return <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>No conversation: the call was not answered.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lines.map((line, i) => {
        const agent = line.speaker === 'agent';
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: agent ? 'flex-start' : 'flex-end' }}>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', margin: '0 6px 2px' }}>{agent ? `${agentName} (AI)` : 'Patient'}</span>
            <span
              style={{
                maxWidth: '86%',
                padding: '8px 11px',
                borderRadius: agent ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                fontSize: 'var(--fs-sm)',
                lineHeight: 1.45,
                backgroundColor: agent ? 'var(--bg-tab)' : 'var(--blue-primary)',
                color: agent ? 'var(--text-primary)' : '#ffffff'
              }}
            >
              {line.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** A notice strip, e.g. "simulated calls" or "agent not configured". */
export const AgentNotice: React.FC<{ tone: 'orange' | 'red' | 'blue'; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 14px',
      borderRadius: 'var(--radius-md)',
      backgroundColor: TONES[tone].bg,
      color: TONES[tone].fg,
      border: `1px solid var(--${tone}-border)`,
      fontSize: 'var(--fs-sm)'
    }}
  >
    <CircleAlert size={16} style={{ flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{children}</div>
  </div>
);
