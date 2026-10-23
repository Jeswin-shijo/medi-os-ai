import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { callAgentService, settingsService } from '../../services';
import { errorMessage } from '../../services/api';
import { useLoader } from '../../hooks/useLoader';
import { useCallRunner } from '../../hooks/useCallRunner';
import { AgentCall, AgentScript, CallAgentConfig, CallAgentSettings, CallOutcome, CallPurpose, CallStats, SimulatedResponse } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { Avatar } from '../common/Avatar';
import { BookByCallDialog } from '../common/BookByCallDialog';
import { AgentNotice, CallResultBadge, PurposeBadge, Transcript } from '../common/callAgentUi';
import { OUTCOME_OPTIONS, callDuration, callTime, isLive } from '../../utils/callAgent';
import {
  PhoneCall,
  PhoneForwarded,
  CalendarCheck,
  CalendarPlus,
  CalendarClock,
  TriangleAlert,
  RadioTower,
  Play,
  Search,
  Copy,
  Check,
  Save,
  RefreshCw,
  type LucideIcon
} from 'lucide-react';

const TABS = ['Call Log', 'Automation', 'Agent Scripts'] as const;
type Tab = (typeof TABS)[number];

const POLL_MS = 3000;

const SIMULATED_RESPONSES: { value: SimulatedResponse; label: string }[] = [
  { value: 'random', label: 'Random (realistic mix)' },
  { value: 'positive', label: 'Confirms / books the first slot' },
  { value: 'reschedule', label: 'Picks the other slot' },
  { value: 'callback', label: 'Asks to be called back' },
  { value: 'cancel', label: 'Cancels / declines' },
  { value: 'no_answer', label: 'Does not answer' },
  { value: 'escalate', label: 'Reports symptoms (needs staff)' },
  { value: 'do_not_call', label: 'Asks not to be called' }
];

const TINT = {
  blue: { tile: '#dadffc', icon: '#1f4fe0' },
  green: { tile: '#d2f2e6', icon: '#139a63' },
  purple: { tile: '#ecd9fd', icon: '#a12fd6' },
  orange: { tile: '#fde6cc', icon: '#e8590c' },
  red: { tile: '#fcdce3', icon: '#dc2238' },
  sky: { tile: '#d2e3fc', icon: '#1a5ce6' }
} as const;

const PROVIDER_LABEL: Record<CallAgentConfig['provider'], string> = {
  snapserve: 'SnapServe · live calls',
  simulated: 'Simulated calls',
  none: 'Not configured'
};

export const CallAgentScreen: React.FC = () => {
  const { user, showToast, patients, refreshPatients, setActiveScreen, setActivePatient } = useApp();
  const [tab, setTab] = useState<Tab>('Call Log');
  const [config, setConfig] = useState<CallAgentConfig | null>(null);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [calls, setCalls] = useState<AgentCall[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AgentCall | null>(null);
  const [purposeFilter, setPurposeFilter] = useState<CallPurpose | ''>('');
  const [outcomeFilter, setOutcomeFilter] = useState<CallOutcome | ''>('');
  const [search, setSearch] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);
  const runCall = useCallRunner(() => {
    refresh();
    refreshPatients().catch(() => undefined);
  });

  const { reload: reloadConfig } = useLoader(() => callAgentService.getConfig(), setConfig, []);
  const { loading } = useLoader(
    () => Promise.all([callAgentService.getCalls({ purpose: purposeFilter || undefined, outcome: outcomeFilter || undefined, limit: 100 }), callAgentService.getStats()]),
    ([list, s]) => {
      setCalls(list);
      setStats(s);
    },
    [purposeFilter, outcomeFilter, tick]
  );

  // Follow live calls until they finish.
  const anyLive = calls.some(isLive);
  useEffect(() => {
    if (!anyLive) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), POLL_MS);
    return () => window.clearInterval(timer);
  }, [anyLive]);

  const q = search.trim().toLowerCase();
  const shown = q ? calls.filter((c) => c.patientName.toLowerCase().includes(q) || c.uhid.toLowerCase().includes(q)) : calls;
  const selectedRow = shown.find((c) => c.id === selectedId) ?? shown[0];
  const selectedKey = selectedRow ? `${selectedRow.id}:${selectedRow.status}:${selectedRow.outcome ?? ''}` : '';
  useLoader(() => (selectedRow ? callAgentService.getCall(selectedRow.id) : Promise.resolve(null)), setDetail, [selectedKey]);
  const shownDetail = detail && detail.id === selectedRow?.id ? detail : null;

  const canRunScheduler = user?.role === 'admin' || user?.role === 'doctor';
  const runDue = async () => {
    try {
      const r = await callAgentService.runDue();
      showToast(
        r.withinCallingHours
          ? `Scheduler ran: ${r.queued} confirmation call${r.queued === 1 ? '' : 's'} queued, ${r.placed} placed.`
          : `Outside calling hours: ${r.queued} queued, none placed until the window opens.`,
        'info'
      );
      refresh();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  const saveAgentSettings = async (patch: Partial<CallAgentSettings>, message?: string) => {
    try {
      await settingsService.saveCallAgent(patch);
      reloadConfig();
      if (message) showToast(message, 'success');
      return true;
    } catch (err) {
      showToast(`Settings not saved: ${errorMessage(err)}`, 'error');
      return false;
    }
  };

  const kpis: { label: string; value: React.ReactNode; sub: string; icon: LucideIcon; tint: keyof typeof TINT }[] = [
    {
      label: 'Calls Today',
      value: stats?.callsToday ?? '—',
      sub: stats ? `${stats.answeredToday} answered${stats.contactRate != null ? ` (${stats.contactRate}%)` : ''}` : '',
      icon: PhoneCall,
      tint: 'blue'
    },
    { label: 'Confirmed Today', value: stats?.confirmedToday ?? '—', sub: stats ? `${stats.cancelledToday} cancelled` : '', icon: CalendarCheck, tint: 'green' },
    { label: 'Booked by Phone', value: stats?.bookedToday ?? '—', sub: 'today', icon: CalendarPlus, tint: 'purple' },
    { label: 'Unconfirmed', value: stats?.upcomingUnconfirmed ?? '—', sub: 'today & tomorrow', icon: CalendarClock, tint: 'sky' },
    { label: 'Needs Attention', value: stats?.needsAttention ?? '—', sub: stats?.escalatedToday ? `${stats.escalatedToday} urgent today` : 'to call manually', icon: TriangleAlert, tint: 'orange' },
    { label: 'Live Calls', value: stats?.active ?? '—', sub: 'queued or on a call', icon: RadioTower, tint: 'red' }
  ];

  const patientOf = (uhid: string) => patients.find((p) => p.uhid === uhid);
  const callAgain = (call: AgentCall) =>
    runCall(() =>
      call.purpose === 'confirmation' && call.appointmentId
        ? callAgentService.confirmAppointment(call.appointmentId)
        : callAgentService.bookAppointment({ uhid: call.uhid, visitReason: call.visitReason, appointmentType: call.appointmentType, followUpId: call.followUpId })
    );

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="AI Call Agent"
        subtitle="Phones patients to confirm appointments and to book visits. Every call is logged with what was said and what changed."
        actions={
          <>
            {config && (
              <span
                className="badge-pill"
                style={{
                  height: 30,
                  padding: '0 12px',
                  backgroundColor: config.provider === 'snapserve' ? 'var(--green-light)' : config.provider === 'simulated' ? 'var(--orange-light)' : 'var(--red-light)',
                  color: config.provider === 'snapserve' ? 'var(--green-dark)' : config.provider === 'simulated' ? 'var(--orange-dark)' : 'var(--red-dark)'
                }}
              >
                <RadioTower size={13} />
                {PROVIDER_LABEL[config.provider]}
              </span>
            )}
            {canRunScheduler && (
              <button className="btn-outline-blue" style={{ borderColor: 'var(--border-strong)', padding: '0 16px' }} onClick={runDue} disabled={config?.provider === 'none'}>
                <Play size={15} />
                <span>Run due calls</span>
              </button>
            )}
            <button className="btn-primary" style={{ padding: '0 20px' }} onClick={() => setBookingOpen(true)} disabled={config?.provider === 'none'}>
              <PhoneForwarded size={16} />
              <span>Book by AI Call</span>
            </button>
          </>
        }
      />

      {config?.provider === 'simulated' && (
        <AgentNotice tone="orange">
          <span>
            <strong>Simulated calls:</strong> no phone rings and outcomes are invented for testing. Set <code>CALL_PROVIDER=snapserve</code> on the server for real calls.
          </span>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto', fontWeight: 500 }}>
            Simulated patient
            <select
              className="form-select"
              aria-label="Simulated patient response"
              style={{ height: 30, width: 240, fontSize: 'var(--fs-sm)' }}
              value={config.settings.simulatedResponse}
              onChange={(e) => saveAgentSettings({ simulatedResponse: e.target.value as SimulatedResponse })}
            >
              {SIMULATED_RESPONSES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </AgentNotice>
      )}
      {config?.provider === 'none' && (
        <AgentNotice tone="red">
          <span>
            <strong>The call agent is off.</strong> Set <code>CALL_PROVIDER</code> and the provider's credentials on the server (see the backend README), then restart the API.
          </span>
        </AgentNotice>
      )}

      <div className="stat-cards-grid">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`stat-card-item tint-${k.tint}`} style={{ height: 90, padding: '0 10px 0 14px', gap: 14 }}>
              <div className="stat-icon-wrapper" style={{ backgroundColor: TINT[k.tint].tile, color: TINT[k.tint].icon }}>
                <Icon size={24} strokeWidth={2.1} />
              </div>
              <div className="stat-data-box" style={{ minWidth: 0 }}>
                <span className="stat-label">{k.label}</span>
                <span className="stat-number">{k.value}</span>
                <span className="stat-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={k.sub}>
                  {k.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="page-tabs">
        {TABS.map((t) => (
          <button key={t} className={`page-tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Call Log' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 410px', gap: 12, alignItems: 'start' }}>
          <div className="medios-card" style={{ padding: '12px 12px 6px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', height: 34, flex: '1 1 200px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 10px', gap: 8 }}>
                <Search size={14} color="var(--text-muted)" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient or UHID"
                  aria-label="Search calls"
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--fs-sm)' }}
                />
              </div>
              <select className="form-select" aria-label="Purpose" style={{ height: 34, width: 150, fontSize: 'var(--fs-sm)' }} value={purposeFilter} onChange={(e) => setPurposeFilter(e.target.value as CallPurpose | '')}>
                <option value="">All purposes</option>
                <option value="confirmation">Confirmation</option>
                <option value="booking">Booking</option>
              </select>
              <select className="form-select" aria-label="Outcome" style={{ height: 34, width: 160, fontSize: 'var(--fs-sm)' }} value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value as CallOutcome | '')}>
                <option value="">All outcomes</option>
                {OUTCOME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button className="icon-btn" title="Refresh" aria-label="Refresh" onClick={refresh}>
                <RefreshCw size={15} color="var(--blue-text)" />
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Purpose</th>
                  <th>Try</th>
                  <th>Result</th>
                  <th style={{ textAlign: 'right' }}>Length</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id} className={c.id === selectedRow?.id ? 'selected' : undefined} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(c.id)}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{callTime(c.status === 'scheduled' ? c.scheduledFor : c.startedAt ?? c.createdAt)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.patientName}</div>
                      <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>{c.uhid}</div>
                    </td>
                    <td>
                      <PurposeBadge purpose={c.purpose} />
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.attempt}</td>
                    <td>
                      <CallResultBadge call={c} />
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{callDuration(c.durationSec)}</td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {loading && !calls.length
                        ? 'Loading calls…'
                        : calls.length
                          ? 'No calls match the filters.'
                          : 'No calls yet. Use "Call to confirm" on an appointment, or Book by AI Call.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <CallDetail
            call={shownDetail}
            summary={selectedRow}
            blocked={selectedRow ? !!patientOf(selectedRow.uhid)?.doNotCall : false}
            onCancel={async (c) => {
              try {
                await callAgentService.cancelCall(c.id);
                showToast(`Call to ${c.patientName} canceled`, 'info');
                refresh();
              } catch (err) {
                showToast(errorMessage(err), 'error');
              }
            }}
            onCallAgain={callAgain}
            onAllowCalls={async (c) => {
              try {
                await callAgentService.allowCalls(c.uhid);
                await refreshPatients();
                showToast(`The agent may call ${c.patientName} again`, 'success');
              } catch (err) {
                showToast(errorMessage(err), 'error');
              }
            }}
            onOpenPatient={(c) => {
              const p = patientOf(c.uhid);
              if (p) setActivePatient(p);
              setActiveScreen('appointments');
            }}
          />
        </div>
      )}

      {tab === 'Automation' && config && <AutomationPanel key={JSON.stringify(config.settings)} settings={config.settings} simulated={config.provider === 'simulated'} onSave={saveAgentSettings} />}
      {tab === 'Agent Scripts' && <ScriptsPanel provider={config?.provider} />}

      {bookingOpen && <BookByCallDialog onClose={() => setBookingOpen(false)} onSubmit={runCall} />}
    </div>
  );
};

// ---------------------------------------------------------------- call detail

interface CallDetailProps {
  call: AgentCall | null;
  summary?: AgentCall;
  blocked: boolean;
  onCancel: (call: AgentCall) => void;
  onCallAgain: (call: AgentCall) => void;
  onAllowCalls: (call: AgentCall) => void;
  onOpenPatient: (call: AgentCall) => void;
}

const sectionTitle: React.CSSProperties = { fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 };

const CallDetail: React.FC<CallDetailProps> = ({ call, summary, blocked, onCancel, onCallAgain, onAllowCalls, onOpenPatient }) => {
  if (!summary) {
    return (
      <div className="medios-card" style={{ padding: 24, color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
        Select a call to see the conversation and what the agent did.
      </div>
    );
  }
  const c = call ?? summary;
  const chosen = c.result?.chosenSlot;
  const finished = !isLive(c);
  const facts: [string, string][] = [
    ['Requested by', `${c.requestedBy || '—'} (${c.trigger})`],
    [c.status === 'scheduled' ? 'Will call at' : 'Started', callTime(c.status === 'scheduled' ? c.scheduledFor : c.startedAt)],
    ['Length', callDuration(c.durationSec)],
    ['Phone', c.phone],
    ['Provider', c.provider]
  ];

  return (
    <div className="medios-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name={c.patientName} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{c.patientName}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
            <span>{c.uhid}</span>
            <PurposeBadge purpose={c.purpose} />
            <span>Attempt {c.attempt}</span>
          </div>
        </div>
        <CallResultBadge call={c} />
      </div>

      {(c.actionTaken || c.error) && (
        <div style={{ padding: '9px 11px', borderRadius: 'var(--radius-md)', backgroundColor: c.error ? 'var(--red-light)' : 'var(--bg-subtle)', border: `1px solid ${c.error ? 'var(--red-border)' : 'var(--border-subtle)'}` }}>
          <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-muted)', marginBottom: 2 }}>What happened</div>
          {c.error && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--red-dark)', marginBottom: 2 }}>{c.error}</div>}
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', lineHeight: 1.45 }}>{c.actionTaken}</div>
        </div>
      )}
      {c.status === 'calling' && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--blue-text)' }}>The agent is on the call. This updates by itself when it ends.</p>}

      {c.summary && (
        <div>
          <div style={sectionTitle}>Summary</div>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.summary}</p>
          {c.result?.notes && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Note: {c.result.notes}</p>}
        </div>
      )}

      {c.offeredSlots.length > 0 && (
        <div>
          <div style={sectionTitle}>{c.purpose === 'booking' ? 'Slots offered' : 'Alternatives offered'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {c.offeredSlots.map((s, i) => {
              const picked = chosen === i + 1;
              return (
                <div
                  key={`${s.date} ${s.time}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 'var(--fs-sm)',
                    padding: '5px 9px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: picked ? 'var(--green-light)' : 'transparent',
                    color: picked ? 'var(--green-dark)' : 'var(--text-secondary)',
                    fontWeight: picked ? 600 : 400
                  }}
                >
                  <span style={{ width: 16 }}>{picked ? <Check size={14} /> : `${i + 1}.`}</span>
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {call && finished && c.status !== 'canceled' && (
        <div>
          <div style={sectionTitle}>Conversation</div>
          <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
            <Transcript lines={call.transcript ?? []} agentName={call.variables?.agent_name} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 14, rowGap: 4, fontSize: 'var(--fs-xs)' }}>
        {facts.map(([k, v]) => (
          <React.Fragment key={k}>
            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ color: 'var(--text-primary)' }}>{v}</span>
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {c.status === 'scheduled' && (
          <button className="btn-danger-soft btn-sm" onClick={() => onCancel(c)}>
            Cancel call
          </button>
        )}
        {finished && !blocked && c.status !== 'scheduled' && (
          <button className="btn-outline-blue btn-sm" style={{ borderColor: 'var(--border-strong)' }} onClick={() => onCallAgain(c)}>
            <PhoneCall size={13} />
            Call again
          </button>
        )}
        {blocked && (
          <button className="btn-outline-blue btn-sm" style={{ borderColor: 'var(--border-strong)' }} onClick={() => onAllowCalls(c)} title="Only after fixing the number, or with the patient's agreement">
            Allow calls again
          </button>
        )}
        <button className="btn-secondary btn-sm" onClick={() => onOpenPatient(c)}>
          Open in Appointments
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- automation settings

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LANGUAGES = ['English', 'Tamil', 'Malayalam', 'Hindi', 'Kannada', 'Telugu'];

const Field: React.FC<{ label: string; hint?: string; htmlFor?: string; children: React.ReactNode }> = ({ label, hint, htmlFor, children }) => (
  <div>
    <label className="form-label" htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {hint && <p style={{ marginTop: 4, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>{hint}</p>}
  </div>
);

const AutomationPanel: React.FC<{ settings: CallAgentSettings; simulated: boolean; onSave: (patch: Partial<CallAgentSettings>, message?: string) => Promise<boolean> }> = ({
  settings,
  simulated,
  onSave
}) => {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof CallAgentSettings>(key: K, value: CallAgentSettings[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const save = async () => {
    setSaving(true);
    await onSave(draft, 'Call agent settings saved');
    setSaving(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
      <div className="medios-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Automatic confirmation calls</h3>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <span className="switch-label" style={{ flexShrink: 0 }}>
            <input type="checkbox" checked={draft.autoConfirm} onChange={(e) => set('autoConfirm', e.target.checked)} aria-label="Call patients automatically" />
            <span className="switch-slider" />
          </span>
          <span>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>Call patients automatically before their appointment</span>
            <span style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>
              Each unconfirmed appointment gets one call, then retries if unanswered. Staff are alerted to anything the agent cannot settle.
            </span>
          </span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Call this many hours before" htmlFor="ca-hours" hint="2 to 72. 24 means the day before.">
            <input id="ca-hours" type="number" min={2} max={72} className="input-field" value={draft.confirmHoursBefore} onChange={(e) => set('confirmHoursBefore', Number(e.target.value))} />
          </Field>
          <Field label="Attempts when unanswered" htmlFor="ca-attempts">
            <select id="ca-attempts" className="form-select" value={draft.maxAttempts} onChange={(e) => set('maxAttempts', Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Calling hours start" htmlFor="ca-start" hint="No call is placed outside these hours; it waits for the next window.">
            <input id="ca-start" type="time" className="input-field" value={draft.callingHoursStart} onChange={(e) => set('callingHoursStart', e.target.value)} />
          </Field>
          <Field label="Calling hours end" htmlFor="ca-end">
            <input id="ca-end" type="time" className="input-field" value={draft.callingHoursEnd} onChange={(e) => set('callingHoursEnd', e.target.value)} />
          </Field>
          <Field label="Minutes before a retry" htmlFor="ca-retry" hint={`Each retry waits longer: ${draft.retryMinutes} min, then ${draft.retryMinutes * 2} min.`}>
            <input id="ca-retry" type="number" min={10} max={240} className="input-field" value={draft.retryMinutes} onChange={(e) => set('retryMinutes', Number(e.target.value))} />
          </Field>
        </div>
      </div>

      <div className="medios-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Agent and bookable slots</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Agent name" htmlFor="ca-name" hint="The agent always says it is an AI assistant.">
            <input id="ca-name" className="input-field" maxLength={24} value={draft.agentName} onChange={(e) => set('agentName', e.target.value)} />
          </Field>
          <Field label="Language" htmlFor="ca-lang" hint="Set the matching voice in the provider too.">
            <select id="ca-lang" className="form-select" value={draft.language} onChange={(e) => set('language', e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Bookable sessions" htmlFor="ca-sessions" hint='24-hour times, comma separated: "09:00-13:00, 14:00-17:00".'>
            <input id="ca-sessions" className="input-field" value={draft.clinicSessions} onChange={(e) => set('clinicSessions', e.target.value)} />
          </Field>
          <Field label="Slot length" htmlFor="ca-slot">
            <select id="ca-slot" className="form-select" value={draft.slotMinutes} onChange={(e) => set('slotMinutes', Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Closed days (no slots offered)">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {WEEKDAYS.map((d) => {
              const closed = draft.closedDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={closed}
                  onClick={() => set('closedDays', closed ? draft.closedDays.filter((x) => x !== d) : [...draft.closedDays, d])}
                  style={{
                    height: 30,
                    minWidth: 46,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${closed ? 'var(--red-border)' : 'var(--border-color)'}`,
                    backgroundColor: closed ? 'var(--red-light)' : '#ffffff',
                    color: closed ? 'var(--red-dark)' : 'var(--text-secondary)',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: closed ? 600 : 400
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </Field>
        {simulated && (
          <Field label="Simulated patient response" htmlFor="ca-sim" hint="Development only: how the pretend patient answers.">
            <select id="ca-sim" className="form-select" value={draft.simulatedResponse} onChange={(e) => set('simulatedResponse', e.target.value as SimulatedResponse)}>
              {SIMULATED_RESPONSES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn-secondary" disabled={!dirty || saving} onClick={() => setDraft(settings)}>
          Discard changes
        </button>
        <button className="btn-primary" disabled={!dirty || saving} onClick={save}>
          {saving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
          Save settings
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- scripts

const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="text-link"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)' }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked: the text is still selectable.
        }
      }}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const pre: React.CSSProperties = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-subtle)',
  border: '1px solid var(--border-subtle)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11.5,
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
  color: 'var(--text-primary)'
};

const ScriptsPanel: React.FC<{ provider?: CallAgentConfig['provider'] }> = ({ provider }) => {
  const [scripts, setScripts] = useState<AgentScript[]>([]);
  useLoader(() => callAgentService.getScripts(), setScripts, []);
  const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <AgentNotice tone="blue">
        <span>
          These scripts run on the voice provider. For SnapServe, create one agent per script, paste the welcome line and instructions, add the variables, outcomes and data fields exactly as
          named, and set its post-call notify URL to <code>{apiUrl}/calls/webhook/snapserve?token=CALL_WEBHOOK_SECRET</code>
          {provider === 'snapserve' ? '.' : ' (once CALL_PROVIDER=snapserve).'}
        </span>
      </AgentNotice>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        {scripts.map((s) => (
          <div key={s.purpose} className="medios-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700 }}>{s.title} agent</h3>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{s.goal}</p>
            </div>
            <div>
              <div style={sectionTitle}>Variables</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {s.variables.map((v) => (
                  <code key={v} className="badge-pill badge-blue" style={{ fontSize: 11 }}>
                    {v}
                  </code>
                ))}
              </div>
            </div>
            <div>
              <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between' }}>
                Welcome line <CopyButton text={s.welcome} label={`${s.title} welcome line`} />
              </div>
              <pre style={pre}>{s.welcome}</pre>
            </div>
            <div>
              <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between' }}>
                Instructions <CopyButton text={s.instructions} label={`${s.title} instructions`} />
              </div>
              <pre style={{ ...pre, maxHeight: 300, overflowY: 'auto' }}>{s.instructions}</pre>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={sectionTitle}>Outcomes</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 'var(--fs-xs)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {s.outcomes.map((o) => (
                    <li key={o.label}>
                      <strong style={{ color: 'var(--text-primary)' }}>{o.label}</strong> → {o.outcome}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={sectionTitle}>Data fields</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 'var(--fs-xs)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {s.dataFields.map((f) => (
                    <li key={f.name} style={{ marginBottom: 4 }}>
                      <code style={{ color: 'var(--text-primary)' }}>{f.name}</code>: {f.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
