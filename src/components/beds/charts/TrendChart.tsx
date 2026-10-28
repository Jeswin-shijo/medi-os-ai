import React, { useLayoutEffect, useRef, useState } from 'react';
import type { SnapshotPoint } from '../../../types';

interface TrendSeries {
  key: 'occupied' | 'free';
  label: string;
  /** Any CSS colour, including a `var(--token)`. */
  color: string;
}

interface TrendChartProps {
  /** Oldest first, one per hour; a null count is a gap and breaks the line. */
  points: SnapshotPoint[];
  series: TrendSeries[];
}

const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 32 };
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

const pad2 = (n: number) => String(n).padStart(2, '0');
const clock = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

/** A round top for the axis, so the grid lines fall on whole numbers. */
function niceMax(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200].find((s) => max / s <= 4) ?? 500;
  return { top: Math.ceil(max / step) * step, step };
}

/**
 * Occupied and free beds over time as lines (inline SVG, pixels measured with ResizeObserver, so text never
 * stretches). Missing hours leave a gap. Hover or arrow keys read one hour in the line above the chart;
 * the lines draw in once (600 ms), with no motion under reduced-motion.
 */
export const TrendChart: React.FC<TrendChartProps> = ({ points, series }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => setWidth(Math.round(box.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const n = points.length;
  const last = n ? new Date(points[n - 1].hour).getTime() : 0;
  const span = n ? last - new Date(points[0].hour).getTime() : 0;
  const longRange = span > 2 * DAY_MS;
  const values = points.flatMap((p) => series.map((s) => p[s.key])).filter((v): v is number => v !== null);
  const { top, step } = niceMax(values.length ? Math.max(...values) : 0);

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n > 1 ? (i * plotW) / (n - 1) : plotW / 2);
  const y = (v: number) => PAD.top + (1 - v / top) * plotH;

  const when = (p: SnapshotPoint) => {
    const d = new Date(p.hour);
    if (!longRange) return clock(d);
    const ago = Math.round((last - d.getTime()) / DAY_MS);
    return `${ago === 0 ? 'Today' : `${ago} ${ago === 1 ? 'day' : 'days'} ago`}, ${clock(d)}`;
  };

  // X labels: every 4 hours over a day; once a day (at the same hour as the latest) over a week.
  const labelEvery = longRange ? 24 : 4;
  const labels: number[] = [];
  for (let i = n - 1; i >= 0; i -= labelEvery) labels.push(i);
  const maxLabels = Math.max(Math.floor(plotW / 64), 2);
  const stride = Math.ceil(labels.length / maxLabels);
  const shownLabels = labels.filter((_, k) => k % stride === 0);
  const labelFor = (i: number) => {
    if (!longRange) return clock(new Date(points[i].hour));
    const ago = Math.round((last - new Date(points[i].hour).getTime()) / DAY_MS);
    return ago === 0 ? 'Today' : `${ago}d ago`;
  };

  const runsFor = (key: TrendSeries['key']) => {
    const runs: { x: number; y: number }[][] = [];
    let run: { x: number; y: number }[] = [];
    points.forEach((p, i) => {
      const v = p[key];
      if (v === null) {
        if (run.length) runs.push(run);
        run = [];
      } else run.push({ x: x(i), y: y(v) });
    });
    if (run.length) runs.push(run);
    return runs;
  };

  const select = (clientX: number) => {
    const box = boxRef.current;
    if (!box || n === 0) return;
    const px = clientX - box.getBoundingClientRect().left;
    setActive(Math.min(Math.max(Math.round(((px - PAD.left) / plotW) * (n - 1)), 0), n - 1));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (n === 0) return;
    const delta = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(n - 1);
    else if (delta) setActive((a) => Math.min(Math.max((a ?? n) + delta, 0), n - 1));
    else return;
    e.preventDefault();
  };

  const shown = n ? points[active ?? n - 1] : null;
  const latest = n ? points[n - 1] : null;
  const summary = latest
    ? `Occupied and free beds over the last ${longRange ? '7 days' : '24 hours'}. Latest: ${series.map((s) => `${s.label} ${latest[s.key] ?? 'unknown'}`).join(', ')}.`
    : 'No bed counts recorded yet.';

  return (
    <div className="trend">
      <p className="trend-read" aria-live="polite">
        <span className="trend-when">{shown ? (active === null ? `Latest, ${when(shown)}` : when(shown)) : 'No data'}</span>
        {shown &&
          series.map((s) => (
            <span key={s.key} className="trend-val">
              <span className="trend-key" style={{ backgroundColor: s.color }} aria-hidden="true" />
              {s.label} <strong>{shown[s.key] ?? '—'}</strong>
            </span>
          ))}
      </p>
      <div
        ref={boxRef}
        className="trend-box"
        role="img"
        tabIndex={0}
        aria-label={`${summary} Use the arrow keys to read each hour.`}
        onPointerMove={(e) => select(e.clientX)}
        onPointerDown={(e) => select(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT} aria-hidden="true" focusable="false">
            {Array.from({ length: Math.floor(top / step) + 1 }, (_, k) => k * step).map((v) => (
              <g key={v}>
                <line className="trend-grid" x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />
                <text className="trend-tick" x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle">
                  {v}
                </text>
              </g>
            ))}
            {shownLabels.map((i) => (
              <text key={i} className="trend-tick" x={x(i)} y={HEIGHT - 6} textAnchor={i === n - 1 ? 'end' : i === 0 ? 'start' : 'middle'}>
                {labelFor(i)}
              </text>
            ))}
            {series.map((s) =>
              runsFor(s.key).map((run, k) =>
                run.length > 1 ? (
                  <path
                    key={`${s.key}-${k}`}
                    className="trend-line"
                    pathLength={1}
                    style={{ stroke: s.color }}
                    d={run.map((pt, j) => `${j ? 'L' : 'M'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')}
                  />
                ) : (
                  <circle key={`${s.key}-${k}`} cx={run[0].x} cy={run[0].y} r={2} style={{ fill: s.color }} />
                )
              )
            )}
            {active !== null && (
              <g>
                <line className="trend-cursor" x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} />
                {series.map((s) => {
                  const v = points[active][s.key];
                  return v === null ? null : <circle key={s.key} className="trend-dot" cx={x(active)} cy={y(v)} r={4} style={{ fill: s.color }} />;
                })}
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
};
