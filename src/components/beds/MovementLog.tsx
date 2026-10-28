import React from 'react';
import type { Movement } from '../../types';
import { tableMin } from '../../utils/layout';
import { clockOrDay } from '../../utils/beds';

interface MovementLogProps {
  movements: Movement[];
  /** Show only the newest this many. */
  limit?: number;
  action?: React.ReactNode;
}

const KIND: Record<Movement['kind'], { label: string; pill: string }> = {
  admission: { label: 'Admission', pill: 'blue' },
  transfer: { label: 'Transfer', pill: 'purple' },
  discharge: { label: 'Discharge', pill: 'green' }
};

/** Recent admissions, transfers and discharges, newest first. */
export const MovementLog: React.FC<MovementLogProps> = ({ movements, limit, action }) => {
  const shown = limit ? movements.slice(0, limit) : movements;
  return (
    <section className="medios-card bagent-card">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Bed movement log</h3>
          {shown.some((m) => m.sample) && <span className="bagent-hint">Includes sample stays</span>}
        </div>
        {action}
      </div>
      {shown.length === 0 ? (
        <p className="data-empty">No admissions, transfers or discharges yet.</p>
      ) : (
        <div className="table-scroll" style={tableMin(460)}>
          <table className="medios-table compact bagent-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Patient</th>
                <th scope="col">From</th>
                <th scope="col">To</th>
                <th scope="col">Type</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id}>
                  <td className="bagent-time">{clockOrDay(m.at)}</td>
                  <td className="bagent-name">{m.patientName}</td>
                  <td>{m.from}</td>
                  <td>{m.to}</td>
                  <td>
                    <span className={`status-pill sm ${KIND[m.kind].pill}`}>{KIND[m.kind].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
