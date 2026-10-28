import React from 'react';
import type { TypeRow } from '../../types';

/** Rooms and beds by type: how many there are and how many are in use. */
export const RoomsOverview: React.FC<{ rows: TypeRow[] }> = ({ rows }) => {
  const units = rows.filter((r) => r.total > 0);
  return (
    <section className="medios-card bagent-card">
      <div className="card-header-row">
        <h3 className="card-title">Rooms overview</h3>
      </div>
      {units.length === 0 ? (
        <p className="data-empty">No beds set up yet.</p>
      ) : (
        <table className="medios-table compact avail-table">
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col" className="num">
                Total
              </th>
              <th scope="col" className="num">
                Occupied
              </th>
            </tr>
          </thead>
          <tbody>
            {units.map((r) => (
              <tr key={r.type}>
                <th scope="row">
                  <span className="avail-unit">{r.label}</span>
                </th>
                <td className="num">{r.total}</td>
                <td className="num">{r.occupied}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
