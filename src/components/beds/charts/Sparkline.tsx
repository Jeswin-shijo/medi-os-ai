import React, { useLayoutEffect, useRef, useState } from 'react';

interface SparklineProps {
  /** Oldest first; null where there is no value (the line breaks there). */
  points: (number | null)[];
  /** Line colour: any CSS colour, including a `var(--token)`. */
  tone: string;
  /** What the line shows, for screen readers. */
  label: string;
}

/** Room for the stroke and the end dot at the edges. */
const PAD = 3;

/**
 * A small trend line that fills its box (sized by CSS). It draws in once, left to right, and renders
 * nothing with fewer than 2 values. Drawn in pixels, measured with ResizeObserver, so it never stretches.
 */
export const Sparkline: React.FC<SparklineProps> = ({ points, tone, label }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const values = points.filter((p): p is number => p !== null);
  const drawable = values.length >= 2;

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const w = Math.round(box.clientWidth);
      const h = Math.round(box.clientHeight);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [drawable]);

  if (!drawable) return null;

  let paths: string[] = [];
  let dots: { x: number; y: number }[] = [];
  let end: { x: number; y: number } | null = null;
  if (size && size.w > PAD * 2 && size.h > PAD * 2) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const x = (i: number) => PAD + (i * (size.w - PAD * 2)) / Math.max(points.length - 1, 1);
    const y = (v: number) => (max === min ? size.h / 2 : PAD + (1 - (v - min) / (max - min)) * (size.h - PAD * 2));
    // Split at the gaps: each run of values is its own line; a lone value is a dot.
    const runs: { x: number; y: number }[][] = [];
    let run: { x: number; y: number }[] = [];
    points.forEach((p, i) => {
      if (p === null) {
        if (run.length) runs.push(run);
        run = [];
      } else {
        run.push({ x: x(i), y: y(p) });
      }
    });
    if (run.length) runs.push(run);
    paths = runs.filter((r) => r.length > 1).map((r) => r.map((pt, i) => `${i ? 'L' : 'M'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' '));
    dots = runs.filter((r) => r.length === 1).map((r) => r[0]);
    const lastRun = runs[runs.length - 1];
    end = lastRun[lastRun.length - 1];
  }

  return (
    <div ref={boxRef} className="spark" role="img" aria-label={label}>
      {size && (
        <svg width={size.w} height={size.h} aria-hidden="true" focusable="false">
          {paths.map((d, i) => (
            <path key={i} className="spark-line" d={d} pathLength={1} style={{ stroke: tone }} />
          ))}
          {dots.map((pt, i) => (
            <circle key={`dot-${i}`} className="spark-dot" cx={pt.x} cy={pt.y} r={1.5} style={{ fill: tone }} />
          ))}
          {end && <circle className="spark-end" cx={end.x} cy={end.y} r={2.5} style={{ fill: tone }} />}
        </svg>
      )}
    </div>
  );
};
