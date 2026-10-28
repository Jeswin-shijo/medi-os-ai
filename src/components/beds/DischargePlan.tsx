import React from 'react';
import type { DischargeItem } from '../../types';
import { tableMin } from '../../utils/layout';
import { dayAndTime, isClinicToday } from '../../utils/beds';

interface DischargePlanProps {
  items: DischargeItem[];
  /** Show only the first this many (soonest first). */
  limit?: number;
  /** Shows "View all" in the header when some items are left out. */
  onViewAll?: () => void;
}

const status = (item: DischargeItem): { label: string; pill: string } => {
  if (item.overdue) return { label: 'Overdue', pill: 'red' };
  if (isClinicToday(item.dueAt)) return { label: 'Due today', pill: 'orange' };
  return { label: 'Tomorrow', pill: 'gray' };
};

/** Patients expected to leave within 24 hours, overdue stays first, with their bed and expected time. */
export const DischargePlan: React.FC<DischargePlanProps> = ({ items, limit, onViewAll }) => {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <section className="medios-card bagent-card">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Discharge planning ({items.length})</h3>
          {items.some((i) => i.sample) && <span className="bagent-hint">Includes sample stays</span>}
        </div>
        {onViewAll && shown.length < items.length && (
          <button type="button" className="text-link bagent-link" onClick={onViewAll}>
            View all
          </button>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="data-empty">No discharges expected in the next 24 hours.</p>
      ) : (
        <div className="table-scroll" style={tableMin(440)}>
          <table className="medios-table compact bagent-table">
            <thead>
              <tr>
                <th scope="col">Patient</th>
                <th scope="col">Current bed</th>
                <th scope="col">Expected discharge</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => {
                const s = status(item);
                return (
                  <tr key={item.admissionId}>
                    <td className="bagent-name">{item.patientName}</td>
                    <td>{item.bedLabel}</td>
                    <td className="bagent-time">{dayAndTime(item.dueAt)}</td>
                    <td>
                      <span className={`status-pill sm ${s.pill}`}>{s.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
