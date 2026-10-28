import React from 'react';
import type { TypeRow } from '../../types';
import { MeterBar } from './charts/MeterBar';

interface AvailabilityTableProps {
  rows: TypeRow[];
  /** Right side of the card header, e.g. a link. */
  action?: React.ReactNode;
}

/** One row per unit type: beds in total, occupied, free, and how full it is. */
export const AvailabilityTable: React.FC<AvailabilityTableProps> = ({ rows, action }) => {
  const units = rows.filter((r) => r.total > 0);
  return (
    <section className="medios-card bagent-card">
      <div className="card-header-row">
        <h3 className="card-title">Bed availability by unit</h3>
        {action}
      </div>
      {units.length === 0 ? (
        <p className="data-empty">No beds set up yet.</p>
      ) : (
        <table className="medios-table compact avail-table">
          <thead>
            <tr>
              <th scope="col">Unit</th>
              <th scope="col" className="num">
                Occupied
              </th>
              <th scope="col" className="num">
                Free
              </th>
              <th scope="col">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {units.map((r) => (
              <tr key={r.type}>
                <th scope="row">
                  <span className="avail-unit">{r.label}</span>
                  <span className="avail-sub">
                    {r.total} {r.total === 1 ? 'bed' : 'beds'}
                    {r.cleaning + r.blocked > 0 && ` · ${r.cleaning + r.blocked} not ready`}
                  </span>
                </th>
                <td className="num">{r.occupied}</td>
                <td className="num avail-free">{r.free}</td>
                <td>
                  <span className="avail-meter">
                    <MeterBar value={r.percentFull} max={100} label={`${r.label} ${r.percentFull}% full`} />
                    <span className="avail-pct">{r.percentFull}%</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
