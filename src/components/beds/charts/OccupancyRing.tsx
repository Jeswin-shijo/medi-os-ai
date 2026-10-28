import React from 'react';

interface RingSegment {
  label: string;
  value: number;
  /** Any CSS colour, including a `var(--token)`. */
  color: string;
}

interface OccupancyRingProps {
  segments: RingSegment[];
  centerValue: string;
  centerLabel: string;
}

const RADIUS = 15.9155; // circumference 100, so a segment's length is its percentage

/**
 * A donut of how the beds are split, with the legend beside it (inline SVG). It sweeps in once (600 ms);
 * later changes slide (300 ms); neither moves under reduced-motion.
 */
export const OccupancyRing: React.FC<OccupancyRingProps> = ({ segments, centerValue, centerLabel }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const arcs = segments
    .filter((s) => s.value > 0)
    .reduce<Array<RingSegment & { len: number; at: number }>>((list, s) => {
      const prev = list[list.length - 1];
      return [...list, { ...s, len: (s.value / total) * 100, at: prev ? prev.at + prev.len : 0 }];
    }, []);
  const spoken = segments.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(', ');

  return (
    <div className="ring">
      <div className="ring-box" role="img" aria-label={`${centerValue} ${centerLabel}. ${spoken}.`}>
        <svg viewBox="0 0 42 42" className="ring-svg" aria-hidden="true" focusable="false">
          <circle className="ring-track" cx="21" cy="21" r={RADIUS} />
          <g className="ring-arcs">
            {arcs.map((a) => (
              <circle
                key={a.label}
                className="ring-arc"
                cx="21"
                cy="21"
                r={RADIUS}
                style={{ stroke: a.color }}
                strokeDasharray={`${Math.max(a.len - (arcs.length > 1 ? 0.6 : 0), 0.1)} ${100 - a.len + (arcs.length > 1 ? 0.6 : 0)}`}
                strokeDashoffset={-a.at}
              />
            ))}
          </g>
        </svg>
        <div className="ring-center" aria-hidden="true">
          <span className="ring-value">{centerValue}</span>
          <span className="ring-caption">{centerLabel}</span>
        </div>
      </div>
      <ul className="ring-legend">
        {segments.map((s) => (
          <li key={s.label} className="ring-legend-item">
            <span className="ring-key" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span className="ring-label">{s.label}</span>
            <span className="ring-count">{s.value}</span>
            <span className="ring-pct">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
