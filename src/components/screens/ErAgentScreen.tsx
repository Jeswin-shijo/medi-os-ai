import React, { useMemo, useState } from 'react';
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

/** The ER Agent: who is in the ER, how urgent, and whether the deadlines are being met. */
export const ErAgentScreen: React.FC = () => {
  const { user } = useApp();
  const canArrive = ER_ROLES.includes(user?.role ?? '');
  const { board, overview, complaints, error, live, reload } = useEr();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: ErVisit | null = board?.visits.find((v) => v.id === selectedId) ?? null;

  const complaintLabels = useMemo(() => Object.fromEntries((complaints?.complaints ?? []).map((c) => [c.key, c.label])), [complaints]);
  // A visit that left the board is no longer selected.
  const stillThere = board && selectedId !== null ? board.visits.some((v) => v.id === selectedId) : true;
  if (!stillThere) setSelectedId(null);

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
            // Task 11 opens the arrival form here; until then the button does nothing.
            <button type="button" className="btn-primary" onClick={() => undefined}>
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

        <div className="split er-split" style={split('minmax(280px, 320px)')}>
          <ErQueue
            visits={board?.visits ?? null}
            error={error}
            onRetry={reload}
            complaintLabels={complaintLabels}
            selectedId={selectedId}
            onSelect={(v) => setSelectedId(v.id)}
            expectedCount={board?.expected.length ?? 0}
          />
          {/* Task 11: the visit panel (triage, pathways, bay, decision) replaces this card for the selected visit. */}
          <section className="medios-card er-slot" aria-label="Visit panel">
            <h3 className="card-title">Visit</h3>
            <p className="data-empty">{selected ? `${selected.number} selected. The visit panel comes next.` : 'Select a patient to see the visit.'}</p>
          </section>
        </div>

        {/* Task 12: side cards (bays, expected arrivals, charts) go here. */}
        <div className="cols-2 bagent-grid er-side-slots">
          <section className="medios-card er-slot" aria-label="Bays">
            <h3 className="card-title">Bays</h3>
            <p className="data-empty">Comes next.</p>
          </section>
          <section className="medios-card er-slot" aria-label="Expected arrivals">
            <h3 className="card-title">Expected arrivals</h3>
            <p className="data-empty">Comes next.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
