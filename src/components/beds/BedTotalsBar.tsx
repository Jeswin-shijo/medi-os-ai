import React from 'react';
import type { BoardTotals } from '../../types';
import { RollingText } from '../common/RollingText';

export type FloorFilter = number | 'all';

const FLOORS: { value: FloorFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 0, label: 'Ground' },
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' }
];

interface BedTotalsBarProps {
  totals: BoardTotals;
  floor: FloorFilter;
  onFloor: (floor: FloorFilter) => void;
}

/** Occupied / Free / Cleaning / % full, plus the floor filter. */
export const BedTotalsBar: React.FC<BedTotalsBarProps> = ({ totals, floor, onFloor }) => {
  const stats: { label: string; value: number; suffix?: string; color: string }[] = [
    { label: 'Occupied', value: totals.occupied, color: 'var(--blue-primary)' },
    { label: 'Free', value: totals.free, color: 'var(--green-dark)' },
    { label: 'Cleaning', value: totals.cleaning, color: 'var(--orange-dark)' },
    { label: 'Full', value: totals.percentFull, suffix: '%', color: 'var(--text-primary)' }
  ];
  return (
    <div className="medios-card bed-totals">
      <div className="bed-totals-stats">
        {stats.map((s) => (
          <div key={s.label} className="bed-stat">
            <span className="bed-stat-value" style={{ color: s.color }}>
              <RollingText value={s.value} />
              {s.suffix}
            </span>
            <span className="bed-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="bed-floors" role="group" aria-label="Floor">
        {FLOORS.map((f) => (
          <button
            key={String(f.value)}
            type="button"
            className={`chip-btn${floor === f.value ? ' active' : ''}`}
            aria-pressed={floor === f.value}
            onClick={() => onFloor(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};
