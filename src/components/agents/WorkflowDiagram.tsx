import React, { useEffect, useRef, useState } from 'react';
import { BedDouble, CalendarDays, ClipboardCheck, FlaskConical, Headset, Network, Pill, Receipt, Siren, type LucideIcon } from 'lucide-react';
import { AGENT_LIST, type AgentKey, type AgentStatus } from '../../types';

export interface DiagramPulse {
  id: string;
  from: AgentKey;
  to: AgentKey;
}

/** How long a dot takes to cross one edge. */
export const LEG_MS = 300;
const TILE_H = 44;

/** Tile centres. Wide cards also get the short edge labels from the client's design. */
type Pos = { x: number; y: number };
type OuterKey = Exclude<AgentKey, 'coordinator'>;
interface Layout {
  w: number;
  h: number;
  tileW: number;
  /** Width of the centre tile. */
  hubW: number;
  centre: Pos;
  labels: boolean;
  pos: Record<OuterKey, Pos>;
}
const WIDE: Layout = {
  w: 540,
  h: 420,
  tileW: 112,
  hubW: 124,
  centre: { x: 270, y: 210 },
  labels: true,
  pos: {
    scheduling: { x: 84, y: 56 },
    er: { x: 270, y: 32 },
    bed: { x: 456, y: 56 },
    discharge: { x: 66, y: 210 },
    lab: { x: 474, y: 210 },
    revenue: { x: 84, y: 364 },
    'patient-support': { x: 270, y: 388 },
    pharmacy: { x: 456, y: 364 }
  }
};
/**
 * Narrow cards: the drawing is as wide as the card (one SVG unit = one CSS pixel), so the text stays
 * at its real size. The edge labels move to a legend below.
 */
const NARROW_TILE = 100;
const narrowLayout = (width: number): Layout => {
  const w = Math.max(260, Math.floor(width));
  const left = NARROW_TILE / 2 + 2;
  const right = w - left;
  const mid = w / 2;
  return {
    w,
    h: 346,
    tileW: NARROW_TILE,
    hubW: 124,
    centre: { x: mid, y: 196 },
    labels: false,
    pos: {
      er: { x: mid, y: 24 },
      scheduling: { x: left, y: 76 },
      bed: { x: right, y: 76 },
      discharge: { x: left, y: 132 },
      lab: { x: right, y: 132 },
      revenue: { x: left, y: 252 },
      pharmacy: { x: right, y: 252 },
      'patient-support': { x: mid, y: 318 }
    }
  };
};
/** Cards narrower than this get the narrow drawing. */
const WIDE_FROM = 520;

const ICONS: Record<AgentKey, LucideIcon> = {
  coordinator: Network,
  er: Siren,
  bed: BedDouble,
  lab: FlaskConical,
  pharmacy: Pill,
  discharge: ClipboardCheck,
  scheduling: CalendarDays,
  revenue: Receipt,
  'patient-support': Headset
};

const LABELS: Record<OuterKey, string[]> = {
  scheduling: ['Appointments', '& OT schedules'],
  er: ['Emergency triage', '& patient flow'],
  bed: ['Bed availability', '& room transfer'],
  discharge: ['Discharge plan', '& follow-up'],
  lab: ['Lab orders', '& results'],
  revenue: ['Billing & insurance', 'coordination'],
  'patient-support': ['Calls & updates'],
  pharmacy: ['Medication check', '& dispensing']
};
const OUTER = AGENT_LIST.filter((a) => a.key !== 'coordinator');


const route = (from: AgentKey, to: AgentKey): AgentKey[] =>
  from === 'coordinator' ? ['coordinator', to] : to === 'coordinator' || to === from ? [from, 'coordinator'] : [from, 'coordinator', to];

const pointer = (layout: Layout) => (key: AgentKey): Pos => (key === 'coordinator' ? layout.centre : layout.pos[key]);

/** One dot crossing from a tile to the centre and on to the target; it removes itself when it arrives. */
const Dot: React.FC<{ layout: Layout; from: AgentKey; to: AgentKey }> = ({ layout, from, to }) => {
  const ref = useRef<SVGCircleElement>(null);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') return;
    const pts = route(from, to).map(pointer(layout));
    const last = pts.length - 1;
    const anim = el.animate(
      pts.map((p, i) => ({ transform: `translate(${p.x}px, ${p.y}px)`, opacity: i === 0 ? 0.3 : 1, offset: i / last })),
      { duration: LEG_MS * last, easing: 'linear', fill: 'forwards' }
    );
    anim.onfinish = () => setGone(true);
    return () => anim.cancel();
  }, [layout, from, to]);
  if (gone) return null;
  const start = pointer(layout)(from);
  return <circle ref={ref} className="co-dotpulse" r={5} style={{ transform: `translate(${start.x}px, ${start.y}px)` }} />;
};

interface WorkflowDiagramProps {
  agents: AgentStatus[];
  /** Messages that just arrived; each plays once (from -> Coordinator -> to). Nothing plays under reduced motion. */
  pulses: DiagramPulse[];
}

/** The Coordinator in the centre and the other eight agents around it, scaled to the card with no overflow. */
export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ agents, pulses }) => {
  const byKey = new Map(agents.map((a) => [a.key, a]));
  const online = AGENT_LIST.filter((a) => byKey.get(a.key)?.online).length;
  // Measured before the first paint (a ResizeObserver reports before it), so the right drawing is used from the start.
  const [width, setWidth] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const watch = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const layout = width >= WIDE_FROM || width === 0 ? WIDE : narrowLayout(width);
  const { centre, tileW } = layout;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const known = (k: AgentKey) => k === 'coordinator' || k in layout.pos;
  const playing = reduced ? [] : pulses.filter((p) => known(p.from) && known(p.to));
  const ordered = [...OUTER].sort((x, y) => Number(byKey.get(y.key)?.built ?? y.built) - Number(byKey.get(x.key)?.built ?? x.built));

  return (
    <div className="co-diagram" ref={box}>
      <svg viewBox={`0 0 ${layout.w} ${layout.h}`} role="img" aria-label={`Agent network: ${online} of ${AGENT_LIST.length} agents online`} className="co-diagram-svg">
        {OUTER.map((a) => {
          const p = layout.pos[a.key as keyof Layout['pos']];
          const live = !!byKey.get(a.key)?.online;
          return <line key={a.key} x1={centre.x} y1={centre.y} x2={p.x} y2={p.y} className={`co-edge${live ? ' is-live' : ''}`} />;
        })}
        {layout.labels &&
          OUTER.map((a) => {
            const key = a.key as keyof Layout['pos'];
            const p = layout.pos[key];
            const label = LABELS[key];
            const mx = (centre.x + p.x) / 2;
            const my = (centre.y + p.y) / 2;
            return (
              <text key={a.key} className="co-edge-label" x={mx} y={my - (label.length - 1) * 5.5} textAnchor="middle">
                {label.map((line, i) => (
                  <tspan key={line} x={mx} dy={i === 0 ? 0 : 11}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}

        <g className="co-tile is-centre" transform={`translate(${centre.x - layout.hubW / 2} ${centre.y - 28})`}>
          <title>{`Coordinator: routes work between the agents (${byKey.get('coordinator')?.online ? 'Online' : 'Offline'})`}</title>
          <rect width={layout.hubW} height={56} rx={10} />
          <text x={layout.hubW / 2} y={25} textAnchor="middle" className="co-tile-name">
            Coordinator
          </text>
          <circle cx={layout.hubW / 2 - 20} cy={39} r={3} className={`co-tile-dot${byKey.get('coordinator')?.online ? ' is-on' : ''}`} />
          <text x={layout.hubW / 2 - 13} y={42} className="co-tile-state">
            {byKey.get('coordinator')?.online ? 'Online' : 'Offline'}
          </text>
        </g>

        {OUTER.map((a) => {
          const p = layout.pos[a.key as keyof Layout['pos']];
          const s = byKey.get(a.key);
          const built = s?.built ?? a.built;
          const on = !!s?.online;
          const Icon = ICONS[a.key];
          const w = a.key === 'patient-support' && !layout.labels ? 124 : tileW;
          const state = !built ? 'Not built' : on ? 'Online' : 'Offline';
          return (
            <g key={a.key} className={`co-tile${built ? '' : ' is-dim'}`} transform={`translate(${p.x - w / 2} ${p.y - TILE_H / 2})`}>
              <title>{`${a.name}: ${LABELS[a.key as OuterKey].join(' ')} (${state})`}</title>
              <rect width={w} height={TILE_H} rx={8} />
              <Icon x={8} y={13} width={18} height={18} aria-hidden="true" />
              <text x={32} y={19} className="co-tile-name">
                {a.name}
              </text>
              <circle cx={35} cy={31} r={3} className={`co-tile-dot${on ? ' is-on' : ''}`} />
              <text x={42} y={34} className="co-tile-state">
                {state}
              </text>
            </g>
          );
        })}

        {playing.map((p) => (
          <Dot key={p.id} layout={layout} from={p.from} to={p.to} />
        ))}
      </svg>
      {!layout.labels && width > 0 && (
        <ul className="co-legend" aria-label="What each agent exchanges with the Coordinator">
          {ordered.map((a) => (
            <li key={a.key}>
              <strong>{a.name}</strong> — {LABELS[a.key as OuterKey].join(' ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
