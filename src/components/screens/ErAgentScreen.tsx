import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Clock3, HeartPulse, Plus, Siren } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { useEr } from '../../hooks/useEr';
import { COLOUR_LABEL, ER_ROLES, TRIAGE_COLOURS } from '../../utils/er';
import type { ErVisit } from '../../types';
import { split } from '../../utils/layout';
import { ScreenHeader } from '../common/ScreenHeader';
import { LivePill } from '../beds/LivePill';
import { StatCard } from '../beds/StatCard';
import { ErQueue } from '../er/ErQueue';
import { ErVisitPanel } from '../er/ErVisitPanel';
import { NewArrivalDialog } from '../er/NewArrivalDialog';
import { ErExpectedArrivals } from '../er/ErExpectedArrivals';
import { ErWorkflowDiagram } from '../er/ErWorkflowDiagram';
import { ErCapacityCard, ErEventsCard, ErPerformanceCard, ErStaffCard } from '../er/ErSideCards';

/** The ER Agent: who is in the ER, how urgent, and whether the deadlines are being met. */
export const ErAgentScreen: React.FC = () => {
  const { user } = useApp();
  const canArrive = ER_ROLES.includes(user?.role ?? '');
  const { board, overview, complaints, error, live, eventVersion, lastEvent, reload } = useEr();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** A visit just made by this person, shown until the board reload brings it in. */
  const [fresh, setFresh] = useState<ErVisit | null>(null);
  const [arriving, setArriving] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** The row or button that opened the panel: focus goes back to it when the selection clears. */
  const opener = useRef<HTMLElement | null>(null);
  const seen = useRef<string | null>(null);
  const selected: ErVisit | null = board?.visits.find((v) => v.id === selectedId) ?? (fresh && fresh.id === selectedId ? fresh : null);

  const select = useCallback((id: string) => {
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setSelectedId(id);
  }, []);

  const complaintLabels = useMemo(() => Object.fromEntries((complaints?.complaints ?? []).map((c) => [c.key, c.label])), [complaints]);
  // A visit that left the board is no longer selected (one just made waits for the board to show it).
  useEffect(() => {
    if (!board || selectedId === null) return;
    if (board.visits.some((v) => v.id === selectedId)) {
      seen.current = selectedId;
      return;
    }
    if (fresh?.id === selectedId && seen.current !== selectedId) return;
    setSelectedId(null);
    setFresh(null);
  }, [board, selectedId, fresh]);

  // A selected visit takes focus; on a stacked layout the panel sits below the queue, so bring it into view.
  const panelOpen = selected !== null;
  useEffect(() => {
    if (selectedId === null) {
      const back = opener.current;
      opener.current = null;
      if (back?.isConnected) back.focus({ preventScroll: true });
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 1100px)').matches) panelRef.current?.scrollIntoView({ block: 'start' });
      headingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId, panelOpen]);

  const cards = overview?.cards;
  const perf = overview?.performance;

  return (
    <div className="page-scroll-body bagent er-screen">
      <ScreenHeader
        title="ER Agent"
        badge={<LivePill live={live} />}
        subtitle="Handles emergency triage, prioritises cases, coordinates care and keeps fast-track pathways on time."
        actions={
          canArrive && (
            <button type="button" className="btn-primary" onClick={() => setArriving(true)}>
              <Plus size={15} aria-hidden="true" />
              New arrival
            </button>
          )
        }
      />

      <div className="bagent-overview er-body">
        {error && overview && (
          <p className="bagent-banner" role="alert">
            Showing the last figures loaded. {error}
          </p>
        )}
        {cards ? (
          <div className="cols-4 bagent-grid">
            <StatCard icon={Siren} tone="blue" title="Patients in ER" data={cards.patientsInEr} />
            <StatCard icon={HeartPulse} tone="red" title="Critical" data={cards.critical} goodWhenUp={false} />
            <StatCard
              icon={Clock3}
              tone="amber"
              title="Avg triage time"
              data={cards.avgTriageMin}
              goodWhenUp={false}
              display={perf?.avgTriageMin == null ? '—' : undefined}
              unit="min"
            />
            <StatCard icon={Activity} tone="green" title="On-time response" data={cards.onTimePct} display={perf?.onTimePct == null ? '—' : undefined} unit="%" />
          </div>
        ) : (
          // The first-load error shows once, in the queue below.
          !error && <div className="medios-card data-empty">Loading the ER…</div>
        )}

        {overview && (
          <section className="cols-4 bagent-grid er-colours" aria-label="Triage colours">
            {TRIAGE_COLOURS.map((c) => {
              const row = overview.colours.find((r) => r.colour === c);
              return (
                <div key={c} className={`medios-card er-colour ${c}`}>
                  <span className={`tri-pill ${c}`}>{COLOUR_LABEL[c]}</span>
                  <p className="er-colour-count">{row?.count ?? 0}</p>
                  <p className="er-colour-meta">
                    Doctor within {row?.targetMin ?? '—'} min
                    <br />
                    Avg wait {row?.avgWaitMin == null ? '—' : `${row.avgWaitMin} min`}
                  </p>
                </div>
              );
            })}
          </section>
        )}

        <ErExpectedArrivals expected={board?.expected ?? []} canAdd={canArrive} onChanged={reload} />

        <div className="split er-split" style={split('minmax(320px, 380px)')}>
          <ErQueue
            visits={board?.visits ?? null}
            error={error}
            onRetry={reload}
            complaintLabels={complaintLabels}
            selectedId={selectedId}
            onSelect={(v) => select(v.id)}
            expectedCount={board?.expected.length ?? 0}
          />
          <section ref={panelRef} className="medios-card er-panel" aria-label="Visit panel">
            {selected ? (
              <ErVisitPanel key={selected.id} visit={selected} complaints={complaints} role={user?.role ?? ''} headingRef={headingRef} onChanged={reload} />
            ) : (
              <>
                <h3 className="card-title">Visit</h3>
                <p className="data-empty">Select a patient to see the visit.</p>
              </>
            )}
          </section>
        </div>

        <div className="cols-2 bagent-grid er-lower">
          <section className="medios-card bagent-card er-side" aria-label="Workflow">
            <div className="card-header-row">
              <h3 className="card-title">ER workflow</h3>
            </div>
            <ErWorkflowDiagram lastEvent={lastEvent} />
          </section>
          <ErPerformanceCard performance={perf} />
        </div>
        <div className="cols-3 bagent-grid er-lower">
          <ErCapacityCard refreshKey={eventVersion} />
          <ErStaffCard refreshKey={eventVersion} />
          <ErEventsCard refreshKey={eventVersion} />
        </div>
      </div>
      {arriving && (
        <NewArrivalDialog
          complaints={complaints}
          expected={board?.expected ?? []}
          knownVisitIds={board?.visits.map((v) => v.id) ?? []}
          onClose={() => setArriving(false)}
          onArrived={(visit) => {
            setFresh(visit);
            select(visit.id);
            reload();
          }}
        />
      )}
    </div>
  );
};
