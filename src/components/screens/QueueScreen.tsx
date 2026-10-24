import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { appointmentService, queueService, settingsService } from '../../services';
import { ApiError, errorMessage } from '../../services/api';
import { useLoader } from '../../hooks/useLoader';
import { useCardReader } from '../../hooks/useCardReader';
import { Appointment, QueueBoard, QueueDeviceKind, QueueDisplayDevice, QueueSettings, QueueToken } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { Avatar } from '../common/Avatar';
import { AgentNotice } from '../common/callAgentUi';
import { LinkCardDialog } from '../common/LinkCardDialog';
import { TOKEN_STATUS_META, clockOf, displayLink, kioskLink, minutesSince, printTokenSlip, slipFor } from '../../utils/queue';
import { clockMinutes } from '../../utils/clinicDate';
import {
  Ticket,
  Megaphone,
  SkipForward,
  Check,
  RotateCcw,
  X,
  Search,
  Monitor,
  Copy,
  Plus,
  Trash,
  Hourglass,
  Users,
  DoorOpen,
  Clock,
  ExternalLink,
  Star,
  Printer,
  UserRoundCheck,
  CircleCheck,
  CreditCard,
  Nfc,
  type LucideIcon
} from 'lucide-react';

const TABS = ['Queue', 'Displays & Settings'] as const;
type Tab = (typeof TABS)[number];

/** How often the board refreshes while the screen is visible. */
const POLL_MS = 5000;
const ROOM_KEY = 'medios.queue.room';
/** Roles that check patients in and call them (the API enforces the same). */
const OPERATORS = ['admin', 'doctor', 'nurse', 'staff'];

const TINT = {
  blue: { tile: '#dadffc', icon: '#1f4fe0' },
  green: { tile: '#d2f2e6', icon: '#139a63' },
  purple: { tile: '#ecd9fd', icon: '#a12fd6' },
  orange: { tile: '#fde6cc', icon: '#e8590c' },
  sky: { tile: '#d2e3fc', icon: '#1a5ce6' }
} as const;

const readRoom = () => {
  try {
    return localStorage.getItem(ROOM_KEY) ?? '';
  } catch {
    return '';
  }
};

export const QueueScreen: React.FC = () => {
  const { user, showToast, patients } = useApp();
  const [tab, setTab] = useState<Tab>('Queue');
  const [board, setBoard] = useState<QueueBoard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [storedRoom, setStoredRoom] = useState(readRoom);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastIssued, setLastIssued] = useState<{ token: QueueToken; existing: boolean } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [hospitalName, setHospitalName] = useState('');
  /** Linking a card: to a chosen patient, or (an unknown card tapped at the desk) to a patient still to choose. */
  const [cardDialog, setCardDialog] = useState<{ patient?: { uhid: string; name: string }; cardId?: string } | null>(null);
  useLoader(() => settingsService.getSettings(), (s) => setHospitalName(s.hospital?.name ?? ''), []);

  const canOperate = OPERATORS.includes(user?.role ?? '');
  const canManage = user?.role === 'admin' || user?.role === 'doctor';

  // Polled quietly: a failure shows as a notice, not a toast every few seconds.
  const loadBoard = useCallback(
    () =>
      queueService.getBoard().then(
        (next) => {
          setBoard(next);
          setLoadError(null);
          setNow(Date.now());
        },
        (err) => setLoadError(errorMessage(err))
      ),
    []
  );

  useEffect(() => {
    loadBoard();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadBoard();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadBoard]);

  const day = board?.date;
  const { reload: reloadAppointments } = useLoader(
    () => (day ? appointmentService.getAppointments({ date: day }) : Promise.resolve([])),
    setAppointments,
    [day]
  );

  const settings = board?.settings;
  const rooms = settings?.counters ?? [];
  const room = rooms.includes(storedRoom) ? storedRoom : (rooms[0] ?? '');
  const chooseRoom = (value: string) => {
    setStoredRoom(value);
    try {
      localStorage.setItem(ROOM_KEY, value);
    } catch {
      // Storage blocked: the choice lasts until the page reloads.
    }
  };

  const tokens = useMemo(() => board?.tokens ?? [], [board]);
  const waiting = tokens.filter((t) => t.status === 'waiting').sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const called = tokens.filter((t) => t.status === 'called');
  const current = called.find((t) => t.counter === room) ?? null;
  const skipped = tokens.filter((t) => t.status === 'skipped');
  const seen = tokens.filter((t) => t.status === 'completed').reverse();
  const heldBy = useMemo(() => new Map(tokens.filter((t) => ['waiting', 'called', 'skipped'].includes(t.status)).map((t) => [t.uhid, t])), [tokens]);

  /** Runs a queue action, reports a failure, and refreshes the board and today's appointments. */
  const act = async <T,>(key: string, run: () => Promise<T>, onDone?: (result: T) => void) => {
    if (busy) return;
    setBusy(key);
    try {
      onDone?.(await run());
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setBusy(null);
      loadBoard();
      reloadAppointments();
    }
  };

  const issue = (key: string, request: Parameters<typeof queueService.issue>[0]) =>
    act(key, () => queueService.issue(request), (result) => {
      setLastIssued(result);
      showToast(
        result.existing ? `${result.token.patientName} already holds token ${result.token.label}` : `Token ${result.token.label} issued to ${result.token.patientName}`,
        result.existing ? 'info' : 'success'
      );
    });

  /** A card tapped on the desk's USB reader checks its patient in; an unknown card opens linking. */
  const tapCard = async (cardId: string) => {
    try {
      const result = await queueService.tapCard(cardId);
      setLastIssued(result);
      showToast(
        result.existing ? `${result.token.patientName} already holds token ${result.token.label}` : `Card tapped: token ${result.token.label} issued to ${result.token.patientName}`,
        result.existing ? 'info' : 'success'
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setCardDialog({ cardId });
      else showToast(errorMessage(err), 'error');
    } finally {
      loadBoard();
      reloadAppointments();
    }
  };
  useCardReader(tapCard, tab === 'Queue' && canOperate && !cardDialog);

  const callNext = () =>
    act('next', () => queueService.callNext(room, current?.id), (r) => {
      if (r.called) showToast(`Token ${r.called.label} called to ${room}`, 'success');
      else showToast(r.completed ? `Token ${r.completed.label} done. No one else is waiting.` : 'No one is waiting', 'info');
    });

  const callOutOfTurn = (token: QueueToken) =>
    act(`call-${token.id}`, () => queueService.callToken(token.id, room, current?.id), (r) => {
      if (r.called) showToast(`Token ${r.called.label} called to ${room}`, 'success');
    });

  const kpis: { label: string; value: React.ReactNode; sub: string; icon: LucideIcon; tint: keyof typeof TINT }[] = [
    { label: 'Waiting', value: board?.stats.waiting ?? '—', sub: waiting.some((t) => t.priority) ? `${waiting.filter((t) => t.priority).length} priority` : 'in line now', icon: Hourglass, tint: 'orange' },
    { label: 'With Doctor', value: board?.stats.called ?? '—', sub: `${rooms.length} room${rooms.length === 1 ? '' : 's'}`, icon: DoorOpen, tint: 'blue' },
    { label: 'Seen Today', value: board?.stats.completed ?? '—', sub: board ? `${board.stats.issued} tokens issued` : '', icon: CircleCheck, tint: 'green' },
    { label: 'Skipped', value: board?.stats.skipped ?? '—', sub: 'called, did not come', icon: SkipForward, tint: 'purple' },
    { label: 'Average Wait', value: board?.stats.averageWaitMinutes != null ? `${board.stats.averageWaitMinutes} min` : '—', sub: 'check-in to call', icon: Clock, tint: 'sky' }
  ];

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Token Queue"
        subtitle="Check patients in with a token, call them to a room, and show the queue on the waiting-room screen."
        actions={
          <>
            {rooms.length > 1 && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                My room
                <select className="form-select" aria-label="My room" style={{ height: 34, width: 190, fontSize: 'var(--fs-sm)' }} value={room} onChange={(e) => chooseRoom(e.target.value)}>
                  {rooms.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            )}
            {canManage && (
              <button className="btn-outline-blue" style={{ borderColor: 'var(--border-strong)', padding: '0 16px' }} onClick={() => setTab('Displays & Settings')}>
                <Monitor size={15} />
                <span>Displays & kiosks</span>
              </button>
            )}
          </>
        }
      />

      {loadError && (
        <AgentNotice tone="red">
          <span>
            <strong>Queue not updating:</strong> {loadError}
          </span>
        </AgentNotice>
      )}

      <div className="stat-cards-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
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

      {canManage && (
        <div className="page-tabs">
          {TABS.map((t) => (
            <button key={t} className={`page-tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === 'Queue' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 12, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <NowServing
              room={room}
              current={current}
              next={waiting[0] ?? null}
              otherRooms={called.filter((t) => t.counter !== room)}
              canOperate={canOperate}
              busy={busy}
              now={now}
              onNext={callNext}
              onRecall={(t) => act(`recall-${t.id}`, () => queueService.recall(t.id), () => showToast(`Token ${t.label} announced again`, 'info'))}
              onSkip={(t) => act(`skip-${t.id}`, () => queueService.skip(t.id), () => showToast(`Token ${t.label} skipped. Put it back when the patient returns.`, 'info'))}
              onDone={(t) => act(`done-${t.id}`, () => queueService.complete(t.id), () => showToast(`Token ${t.label} done`, 'success'))}
            />

            <div className="medios-card" style={{ padding: '12px 12px 6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700 }}>Waiting ({waiting.length})</h3>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Priority tokens first, then by number</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th style={{ width: 70 }}>Token</th>
                    <th>Patient</th>
                    <th>Visit</th>
                    <th>Arrived</th>
                    {canOperate && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {waiting.map((t) => (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{t.position}</td>
                      <td>
                        <TokenLabel token={t} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.patientName}</div>
                        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                          {t.uhid}
                          {t.note ? ` · ${t.note}` : ''}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{t.appointmentTime ? `Appt ${t.appointmentTime}` : 'Walk-in'}</td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {clockOf(t.createdAt)}
                        {minutesSince(t.createdAt, now) && <span style={{ color: 'var(--text-muted)' }}> · {minutesSince(t.createdAt, now)}</span>}
                      </td>
                      {canOperate && (
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn-outline-blue btn-sm"
                            style={{ borderColor: 'var(--border-strong)' }}
                            disabled={!!busy || !room}
                            onClick={() => callOutOfTurn(t)}
                            title={current ? `Finishes ${current.label} and calls ${t.label} to ${room}` : `Calls ${t.label} to ${room}`}
                          >
                            <Megaphone size={13} />
                            Call now
                          </button>
                          <button
                            className="icon-btn"
                            style={{ width: 30, height: 30, marginLeft: 6, display: 'inline-flex' }}
                            disabled={!!busy}
                            onClick={() => act(`cancel-${t.id}`, () => queueService.cancel(t.id), () => showToast(`Token ${t.label} cancelled`, 'info'))}
                            title="Cancel token"
                            aria-label={`Cancel token ${t.label}`}
                          >
                            <X size={14} color="var(--red-dark)" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!waiting.length && (
                    <tr>
                      <td colSpan={canOperate ? 6 : 5} style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {board ? 'No one is waiting. Check patients in from the panel on the right.' : 'Loading the queue…'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {skipped.length > 0 && (
              <div className="medios-card" style={{ padding: 12 }}>
                <h3 style={{ fontSize: 'var(--fs-h4)', fontWeight: 700, marginBottom: 8 }}>Skipped: called, did not come ({skipped.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {skipped.map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--fs-sm)' }}>
                      <TokenLabel token={t} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong>{t.patientName}</strong> <span style={{ color: 'var(--text-muted)' }}>· called {clockOf(t.calledAt)} to {t.counter}</span>
                      </span>
                      {canOperate && (
                        <>
                          <button className="btn-outline-blue btn-sm" style={{ borderColor: 'var(--border-strong)' }} disabled={!!busy} onClick={() => act(`requeue-${t.id}`, () => queueService.requeue(t.id), () => showToast(`Token ${t.label} is back in the queue`, 'success'))}>
                            <RotateCcw size={13} />
                            Back in queue
                          </button>
                          <button className="btn-secondary btn-sm" disabled={!!busy || !room} onClick={() => callOutOfTurn(t)}>
                            Call now
                          </button>
                          <button className="btn-danger-soft btn-sm" disabled={!!busy} onClick={() => act(`cancel-${t.id}`, () => queueService.cancel(t.id), () => showToast(`Token ${t.label} cancelled`, 'info'))}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {seen.length > 0 && (
              <details className="medios-card" style={{ padding: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Seen today ({seen.length})</summary>
                <table className="data-table" style={{ marginTop: 8 }}>
                  <tbody>
                    {seen.map((t) => (
                      <tr key={t.id}>
                        <td style={{ width: 70 }}>
                          <TokenLabel token={t} />
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.patientName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{t.counter}</td>
                        <td style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>done {clockOf(t.completedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>

          {canOperate ? (
            <CheckInPanel
              appointments={appointments}
              patients={patients}
              heldBy={heldBy}
              busy={busy}
              lastIssued={lastIssued}
              onIssue={issue}
              onPrint={(t) => printTokenSlip(slipFor(t, hospitalName))}
              onCards={(patient) => setCardDialog({ patient })}
            />
          ) : (
            <div className="medios-card" style={{ padding: 18, fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              The front desk, nurses and doctors check patients in and call tokens. You can follow the queue here.
            </div>
          )}
        </div>
      )}

      {tab === 'Displays & Settings' && canManage && settings && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
          <QueueSettingsPanel
            key={JSON.stringify(settings)}
            settings={settings}
            occupiedRooms={called.map((t) => t.counter ?? '')}
            onSave={async (patch) => {
              try {
                await settingsService.saveQueue(patch);
                showToast('Queue settings saved', 'success');
                loadBoard();
                return true;
              } catch (err) {
                showToast(`Settings not saved: ${errorMessage(err)}`, 'error');
                return false;
              }
            }}
          />
          <DisplaysPanel />
        </div>
      )}

      {cardDialog && (
        <LinkCardDialog
          patient={cardDialog.patient}
          cardId={cardDialog.cardId}
          onClose={() => setCardDialog(null)}
          // The card was tapped by a patient standing at the desk: check them in now.
          onLinked={cardDialog.cardId ? (card) => tapCard(card.cardId) : undefined}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------- pieces

const TokenLabel: React.FC<{ token: QueueToken; size?: number }> = ({ token, size = 15 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: size, fontWeight: 600, color: 'var(--text-primary)' }}>
    {token.label}
    {token.priority && <Star size={12} fill="var(--orange-amber)" color="var(--orange-amber)" aria-label="Priority" />}
  </span>
);

interface NowServingProps {
  room: string;
  current: QueueToken | null;
  next: QueueToken | null;
  otherRooms: QueueToken[];
  canOperate: boolean;
  busy: string | null;
  now: number;
  onNext: () => void;
  onRecall: (token: QueueToken) => void;
  onSkip: (token: QueueToken) => void;
  onDone: (token: QueueToken) => void;
}

const NowServing: React.FC<NowServingProps> = ({ room, current, next, otherRooms, canOperate, busy, now, onNext, onRecall, onSkip, onDone }) => (
  <div className="medios-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700 }}>Now serving · {room || 'no room set up'}</h3>
      {otherRooms.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {otherRooms.map((t) => (
            <span key={t.id} className="badge-pill" style={{ backgroundColor: 'var(--bg-tab)', color: 'var(--text-secondary)' }} title={t.patientName}>
              {t.counter}: <strong style={{ fontFamily: 'var(--font-mono)' }}>{t.label}</strong>
            </span>
          ))}
        </div>
      )}
    </div>

    {current ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            minWidth: 116,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--blue-light)',
            border: '1px solid var(--blue-border)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--blue-text)' }}>Token</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 600, lineHeight: 1.1, color: 'var(--blue-text)' }}>{current.label}</div>
        </div>
        <Avatar name={current.patientName} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{current.patientName}</span>
            {current.priority && (
              <span className="badge-pill" style={{ backgroundColor: 'var(--orange-light)', color: 'var(--orange-dark)' }}>
                Priority
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>
            {current.uhid} · {current.appointmentTime ? `Appointment ${current.appointmentTime}` : 'Walk-in'}
            {current.note ? ` · ${current.note}` : ''}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            Called {clockOf(current.calledAt)}
            {minutesSince(current.calledAt, now) ? ` (${minutesSince(current.calledAt, now)} ago)` : ''}
            {current.recalls > 0 ? ` · announced again ${current.recalls}×` : ''}
          </div>
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 2px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
        <UserRoundCheck size={22} color="var(--text-muted)" />
        <span>
          {room ? `${room} is free.` : 'Add a room in Displays & Settings.'}{' '}
          {next ? (
            <>
              Next in line: <strong style={{ fontFamily: 'var(--font-mono)' }}>{next.label}</strong> {next.patientName}
            </>
          ) : (
            'No one is waiting.'
          )}
        </span>
      </div>
    )}

    {canOperate && room && (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ padding: '0 18px' }} disabled={!!busy || (!current && !next)} onClick={onNext}>
          <Megaphone size={15} />
          <span>{current ? (next ? 'Done, call next' : 'Done') : 'Call next'}</span>
        </button>
        {current && (
          <>
            <button className="btn-outline-blue" style={{ borderColor: 'var(--border-strong)', padding: '0 14px' }} disabled={!!busy} onClick={() => onRecall(current)}>
              <RotateCcw size={14} />
              <span>Announce again</span>
            </button>
            <button className="btn-outline-blue" style={{ borderColor: 'var(--border-strong)', padding: '0 14px' }} disabled={!!busy} onClick={() => onSkip(current)}>
              <SkipForward size={14} />
              <span>Did not come</span>
            </button>
            {next && (
              <button className="btn-secondary" style={{ padding: '0 14px' }} disabled={!!busy} onClick={() => onDone(current)} title="Finish without calling anyone">
                <Check size={14} />
                <span>Done only</span>
              </button>
            )}
          </>
        )}
      </div>
    )}
  </div>
);

interface CheckInPanelProps {
  appointments: Appointment[];
  patients: { uhid: string; name: string; phone: string; age: number; gender: string }[];
  heldBy: Map<string, QueueToken>;
  busy: string | null;
  lastIssued: { token: QueueToken; existing: boolean } | null;
  onIssue: (key: string, request: { uhid?: string; appointmentId?: string; priority?: boolean; note?: string }) => void;
  onPrint: (token: QueueToken) => void;
  onCards: (patient: { uhid: string; name: string }) => void;
}

const CheckInPanel: React.FC<CheckInPanelProps> = ({ appointments, patients, heldBy, busy, lastIssued, onIssue, onPrint, onCards }) => {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState(false);
  const [note, setNote] = useState('');

  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, '');
  const matches =
    q.length < 2
      ? []
      : patients
          .filter((p) => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || (digits.length >= 4 && p.phone.replace(/\D/g, '').includes(digits)))
          .slice(0, 6);
  const todayFor = (uhid: string) => appointments.find((a) => a.uhid === uhid && ['Scheduled', 'Checked In', 'Waiting'].includes(a.status));
  const expected = appointments.filter((a) => a.status === 'Scheduled' && !heldBy.has(a.uhid)).sort((a, b) => clockMinutes(a.time) - clockMinutes(b.time));

  const issue = (key: string, request: { uhid?: string; appointmentId?: string }) => {
    onIssue(key, { ...request, priority, note: note.trim() || undefined });
    setPriority(false);
    setNote('');
    setQuery('');
  };

  return (
    <div className="medios-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ticket size={18} color="var(--blue-text)" />
          Check in
        </h3>
        <span
          className="badge-pill"
          style={{ backgroundColor: 'var(--blue-light)', color: 'var(--blue-text)' }}
          title="A USB card reader on this computer checks patients in when they tap their card. Click outside text boxes first."
        >
          <Nfc size={13} />
          Card tap ready
        </span>
      </div>

      {lastIssued && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: lastIssued.existing ? 'var(--orange-light)' : 'var(--green-light)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 600, color: lastIssued.existing ? 'var(--orange-dark)' : 'var(--green-dark)' }}>{lastIssued.token.label}</div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 'var(--fs-sm)' }}>
            <div style={{ fontWeight: 600 }}>{lastIssued.token.patientName}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{lastIssued.existing ? 'Already had this token today' : 'Tell the patient their number'}</div>
          </div>
          <button className="icon-btn" title="Print token slip" aria-label="Print token slip" onClick={() => onPrint(lastIssued.token)}>
            <Printer size={15} color="var(--blue-text)" />
          </button>
        </div>
      )}

      <div>
        <label className="form-label" htmlFor="q-search">
          Patient (walk-in or any registered patient)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', height: 36, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 10px', gap: 8 }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            id="q-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, UHID or phone"
            autoComplete="off"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--fs-sm)' }}
          />
        </div>
        {q.length >= 2 && (
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {matches.map((p) => {
              const held = heldBy.get(p.uhid);
              const appt = todayFor(p.uhid);
              return (
                <div key={p.uhid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                  <Avatar name={p.name} size={30} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 'var(--fs-sm)' }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                      {p.uhid} · {appt ? `Appt ${appt.time}` : 'Walk-in'}
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    style={{ width: 30, height: 30 }}
                    onClick={() => onCards({ uhid: p.uhid, name: p.name })}
                    title="Link or manage hospital cards"
                    aria-label={`Cards for ${p.name}`}
                  >
                    <CreditCard size={14} color="var(--blue-text)" />
                  </button>
                  {held ? (
                    <span className="badge-pill" style={{ backgroundColor: 'var(--bg-tab)', color: 'var(--text-secondary)' }} title={TOKEN_STATUS_META[held.status].label}>
                      Token {held.label}
                    </span>
                  ) : (
                    <button className="btn-primary btn-sm" disabled={!!busy} onClick={() => issue(`issue-${p.uhid}`, { uhid: p.uhid })}>
                      Issue token
                    </button>
                  )}
                </div>
              );
            })}
            {!matches.length && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', padding: '4px 2px' }}>No registered patient matches. Register them in Patients first.</p>}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, alignItems: 'center' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
          <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
          Priority
        </label>
        <input className="input-field" style={{ height: 32, fontSize: 'var(--fs-sm)' }} maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for staff (optional), e.g. wheelchair" aria-label="Note for staff" />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Expected today ({expected.length})</span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>not arrived yet</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 360, overflowY: 'auto' }}>
          {expected.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ width: 62, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', flexShrink: 0 }}>{a.time}</span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 'var(--fs-sm)' }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.patientName}</div>
                <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                  {a.uhid} · {a.type}
                </div>
              </div>
              <button className="btn-outline-blue btn-sm" style={{ borderColor: 'var(--border-strong)' }} disabled={!!busy} onClick={() => issue(`appt-${a.id}`, { appointmentId: a.id })}>
                <Users size={13} />
                Check in
              </button>
            </div>
          ))}
          {!expected.length && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', padding: '6px 2px' }}>Everyone booked for today has arrived.</p>}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- settings and displays

const Field: React.FC<{ label: string; hint?: string; htmlFor?: string; children: React.ReactNode }> = ({ label, hint, htmlFor, children }) => (
  <div>
    <label className="form-label" htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {hint && <p style={{ marginTop: 4, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>{hint}</p>}
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; title: string; detail: string }> = ({ checked, onChange, title, detail }) => (
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
    <span className="switch-label" style={{ flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={title} />
      <span className="switch-slider" />
    </span>
    <span>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{title}</span>
      <span style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>{detail}</span>
    </span>
  </label>
);

const QueueSettingsPanel: React.FC<{ settings: QueueSettings; occupiedRooms: string[]; onSave: (patch: QueueSettings) => Promise<boolean> }> = ({ settings, occupiedRooms, onSave }) => {
  const [draft, setDraft] = useState(settings);
  const [newRoom, setNewRoom] = useState('');
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof QueueSettings>(key: K, value: QueueSettings[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const addRoom = () => {
    const name = newRoom.trim();
    if (!name || draft.counters.includes(name)) return;
    set('counters', [...draft.counters, name]);
    setNewRoom('');
  };

  return (
    <div className="medios-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Queue settings</h3>
      <Field label="Rooms tokens are called to" hint="Consultation rooms, doctors' cabins or counters. Each person calling picks theirs on the queue screen.">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {draft.counters.map((r) => (
            <span key={r} className="badge-pill" style={{ backgroundColor: 'var(--blue-light)', color: 'var(--blue-text)', height: 28, gap: 6 }}>
              {r}
              <button
                type="button"
                onClick={() => set('counters', draft.counters.filter((x) => x !== r))}
                disabled={draft.counters.length === 1 || occupiedRooms.includes(r)}
                title={occupiedRooms.includes(r) ? 'A patient is in this room now' : `Remove ${r}`}
                aria-label={`Remove ${r}`}
                style={{ display: 'inline-flex', border: 'none', background: 'transparent', padding: 0, color: 'inherit', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input-field"
            maxLength={30}
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRoom()}
            placeholder="e.g. Room 2, Dr. Priya's cabin"
            aria-label="New room name"
          />
          <button className="btn-secondary" style={{ padding: '0 14px' }} onClick={addRoom} disabled={!newRoom.trim() || draft.counters.length >= 12}>
            <Plus size={14} />
            Add
          </button>
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Token prefix" htmlFor="q-prefix" hint='Up to 4 letters or digits: "A" gives A1, A2…'>
          <input id="q-prefix" className="input-field" maxLength={4} value={draft.tokenPrefix} onChange={(e) => set('tokenPrefix', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} />
        </Field>
        <Field label="Tokens listed as next on the display" htmlFor="q-upcoming">
          <select id="q-upcoming" className="form-select" value={draft.upcomingOnDisplay} onChange={(e) => set('upcomingOnDisplay', Number(e.target.value))}>
            {[0, 3, 4, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'None' : n}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Toggle checked={draft.announce} onChange={(v) => set('announce', v)} title="Announce calls on the display" detail={'A chime, then "Token 12, please go to Consultation Room" in the display browser\'s voice.'} />
      <Toggle
        checked={draft.showNamesOnDisplay}
        onChange={(v) => set('showNamesOnDisplay', v)}
        title="Show short names on the display"
        detail={'Adds "Priya S." beside each token. Leave it off where other patients and visitors can see the screen.'}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn-secondary" onClick={() => setDraft(settings)} disabled={!dirty || saving}>
          Discard
        </button>
        <button
          className="btn-primary"
          style={{ padding: '0 18px' }}
          disabled={!dirty || saving}
          onClick={async () => {
            setSaving(true);
            await onSave(draft);
            setSaving(false);
          }}
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};

const DEVICE_NAMES: Record<QueueDeviceKind, string> = { display: 'Waiting room TV', kiosk: 'Check-in kiosk' };

const DisplaysPanel: React.FC = () => {
  const { showToast } = useApp();
  const [displays, setDisplays] = useState<QueueDisplayDevice[]>([]);
  const [kind, setKind] = useState<QueueDeviceKind>('display');
  const [name, setName] = useState(DEVICE_NAMES.display);
  const [printSlips, setPrintSlips] = useState(true);
  const [created, setCreated] = useState<{ name: string; kind: QueueDeviceKind; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { reload } = useLoader(() => queueService.getDisplays(), setDisplays, []);

  const chooseKind = (next: QueueDeviceKind) => {
    if (name === DEVICE_NAMES[kind]) setName(DEVICE_NAMES[next]);
    setKind(next);
  };
  const add = async () => {
    try {
      const { display, key } = await queueService.addDisplay(name.trim(), kind, kind === 'kiosk' && printSlips);
      setCreated({ name: display.name, kind, link: kind === 'kiosk' ? kioskLink(key) : displayLink(key) });
      setCopied(false);
      reload();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };
  const copy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      showToast('Copy blocked by the browser. Select the link and copy it.', 'warning');
    }
  };
  const setPrinting = async (d: QueueDisplayDevice, on: boolean) => {
    try {
      await queueService.updateDisplay(d.id, { printSlips: on });
      showToast(on ? `${d.name} prints a slip after each tap` : `${d.name} no longer prints slips`, 'success');
      reload();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="medios-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Displays and check-in kiosks</h3>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        These run full screen without anyone signing in. A <strong>display</strong> shows token numbers and rooms on a TV. A <strong>kiosk</strong> runs on the computer the USB card reader is
        plugged into: patients tap their card and get a token. Add one, then open its link on that screen.
      </p>

      {created && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--green-light)', border: '1px solid var(--green-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--green-dark)' }}>Link for {created.name}. It is shown only now; keep it private.</div>
          <input className="input-field" readOnly value={created.link} onFocus={(e) => e.target.select()} aria-label="Device link" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }} />
          {created.kind === 'kiosk' && (
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--green-dark)', lineHeight: 1.5 }}>
              On the kiosk computer, open this link in Chrome started with <code>--kiosk --kiosk-printing</code>. Chrome then stays full screen and prints slips straight to the default printer
              with no dialog, so make the receipt printer the default. Without a printer, switch printing off in the list below.
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary btn-sm" onClick={() => copy(created.link)}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <a className="btn-secondary btn-sm" href={created.link} target="_blank" rel="noreferrer">
              <ExternalLink size={13} />
              Open on this screen
            </a>
            <button className="btn-secondary btn-sm" onClick={() => setCreated(null)} style={{ marginLeft: 'auto' }}>
              Done
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {displays.map((d) => {
          const isKiosk = d.kind === 'kiosk';
          const Icon = isKiosk ? Nfc : Monitor;
          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '1px solid var(--border-subtle)' }}>
              <Icon size={18} color="var(--text-muted)" />
              <div style={{ flex: 1, minWidth: 0, fontSize: 'var(--fs-sm)' }}>
                <div style={{ fontWeight: 600 }}>
                  {d.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>· {isKiosk ? 'Kiosk' : 'Display'}</span>
                </div>
                <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                  Key …{d.keyHint} · added by {d.createdBy || '—'} · {d.lastSeenAt ? `last seen ${new Date(d.lastSeenAt).toLocaleString()}` : 'not opened yet'}
                </div>
              </div>
              {isKiosk && (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', cursor: 'pointer' }} title="Print a token slip after each tap">
                  <Printer size={13} color="var(--text-muted)" />
                  <span className="switch-label" style={{ flexShrink: 0 }}>
                    <input type="checkbox" checked={!!d.printSlips} onChange={(e) => setPrinting(d, e.target.checked)} aria-label={`Print slips at ${d.name}`} />
                    <span className="switch-slider" />
                  </span>
                </label>
              )}
              <button
                className="btn-danger-soft btn-sm"
                onClick={async () => {
                  if (!window.confirm(`Remove ${d.name}? Its link stops working.`)) return;
                  try {
                    await queueService.removeDisplay(d.id);
                    showToast(`${d.name} removed`, 'info');
                    reload();
                  } catch (err) {
                    showToast(errorMessage(err), 'error');
                  }
                }}
              >
                <Trash size={13} />
                Remove
              </button>
            </div>
          );
        })}
        {!displays.length && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>No displays or kiosks yet.</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: 8 }}>
        <select className="form-select" aria-label="Device type" value={kind} onChange={(e) => chooseKind(e.target.value as QueueDeviceKind)}>
          <option value="display">Display (TV)</option>
          <option value="kiosk">Check-in kiosk</option>
        </select>
        <input className="input-field" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Device name" />
        <button className="btn-primary" style={{ padding: '0 16px', whiteSpace: 'nowrap' }} onClick={add} disabled={!name.trim()}>
          <Plus size={14} />
          Add device
        </button>
      </div>
      {kind === 'kiosk' && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
          <input type="checkbox" checked={printSlips} onChange={(e) => setPrintSlips(e.target.checked)} />
          Print a token slip after each tap (a receipt printer is connected)
        </label>
      )}
    </div>
  );
};
