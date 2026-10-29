import React, { useEffect, useRef } from 'react';
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
interface Layout {
  w: number;
  h: number;
  tileW: number;
  centre: Pos;
  labels: boolean;
  pos: Record<Exclude<AgentKey, 'coordinator'>, Pos>;
}
const WIDE: Layout = {
  w: 540,
  h: 420,
  tileW: 112,
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
/** Narrow cards: a tighter drawing, so the tiles stay readable and the labels are left out. */
const NARROW: Layout = {
  w: 380,
  h: 410,
  tileW: 108,
  centre: { x: 190, y: 205 },
  labels: false,
  pos: {
    scheduling: { x: 60, y: 50 },
    er: { x: 190, y: 28 },
    bed: { x: 320, y: 50 },
    discharge: { x: 56, y: 205 },
    lab: { x: 324, y: 205 },
    revenue: { x: 60, y: 360 },
    'patient-support': { x: 190, y: 384 },
    pharmacy: { x: 320, y: 360 }
  }
};
/** Cards narrower than this get the tight drawing. */
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

const LABELS: Record<Exclude<AgentKey, 'coordinator'>, string[]> = {
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

/** One dot crossing from a tile to the centre and on to the target, then it is gone. */
const Dot: React.FC<{ layout: Layout; from: AgentKey; to: AgentKey; onDone(): void }> = ({ layout, from, to, onDone }) => {
  const ref = useRef<SVGCircleElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') {
      done.current();
      return;
    }
    const pts = route(from, to).map(pointer(layout));
    const last = pts.length - 1;
    const anim = el.animate(
      pts.map((p, i) => ({ transform: `translate(${p.x}px, ${p.y}px)`, opacity: i === 0 ? 0.3 : 1, offset: i / last })),
      { duration: LEG_MS * last, easing: 'linear', fill: 'forwards' }
    );
    anim.onfinish = () => done.current();
    return () => anim.cancel();
  }, [layout, from, to]);
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
  const [finished, setFinished] = React.useState<Set<string>>(() => new Set());
  const [width, setWidth] = React.useState(WIDE_FROM);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const watch = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const layout = width < WIDE_FROM ? NARROW : WIDE;
  const { centre, tileW } = layout;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const playing = reduced ? [] : pulses.filter((p) => !finished.has(p.id));

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

        <g className="co-tile is-centre" transform={`translate(${centre.x - 62} ${centre.y - 30})`}>
          <rect width={124} height={60} rx={10} />
          <Network x={10} y={21} width={18} height={18} aria-hidden="true" />
          <text x={36} y={27} className="co-tile-name">
            Coordinator
          </text>
          <circle cx={39} cy={40} r={3} className={`co-tile-dot${byKey.get('coordinator')?.online ? ' is-on' : ''}`} />
          <text x={47} y={43} className="co-tile-state">
            {byKey.get('coordinator')?.online ? 'Online' : 'Offline'}
          </text>
        </g>

        {OUTER.map((a) => {
          const p = layout.pos[a.key as keyof Layout['pos']];
          const s = byKey.get(a.key);
          const built = s?.built ?? a.built;
          const on = !!s?.online;
          const Icon = ICONS[a.key];
          return (
            <g key={a.key} className={`co-tile${built ? '' : ' is-dim'}`} transform={`translate(${p.x - tileW / 2} ${p.y - TILE_H / 2})`}>
              <rect width={tileW} height={TILE_H} rx={8} />
              <Icon x={8} y={13} width={18} height={18} aria-hidden="true" />
              <text x={32} y={19} className="co-tile-name">
                {a.name}
              </text>
              <circle cx={35} cy={31} r={3} className={`co-tile-dot${on ? ' is-on' : ''}`} />
              <text x={42} y={34} className="co-tile-state">
                {!built ? 'Not built' : on ? 'Online' : 'Offline'}
              </text>
            </g>
          );
        })}

        {playing.map((p) => (
          <Dot key={p.id} layout={layout} from={p.from} to={p.to} onDone={() => setFinished((f) => (f.has(p.id) ? f : new Set(f).add(p.id)))} />
        ))}
      </svg>
    </div>
  );
};
