import React from 'react';
import type { TypeRow } from '../../types';
import { MeterBar } from './charts/MeterBar';

interface UnitStatusCardsProps {
  rows: TypeRow[];
  /** A card opens the bed map on that unit's floor. */
  onOpen(row: TypeRow): void;
}

/** One card per unit type: free of total beds, and how full it is. */
export const UnitStatusCards: React.FC<UnitStatusCardsProps> = ({ rows, onOpen }) => {
  const units = rows.filter((r) => r.total > 0);
  return (
    <section className="medios-card bagent-card">
      <div className="card-header-row">
        <h3 className="card-title">Unit status</h3>
        <span className="bagent-hint">Select a unit to see its beds</span>
      </div>
      {units.length === 0 ? (
        <p className="data-empty">No beds set up yet.</p>
      ) : (
        <div className="unit-grid">
          {units.map((r) => (
            <button key={r.type} type="button" className="unit-card" onClick={() => onOpen(r)} aria-label={`${r.label}: ${r.free} of ${r.total} beds free. Show on the bed map.`}>
              <span className="unit-name">{r.label}</span>
              <span className="unit-free">
                <strong>{r.free}</strong> / {r.total} free
              </span>
              <MeterBar value={r.percentFull} max={100} label={`${r.label} ${r.percentFull}% full`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
