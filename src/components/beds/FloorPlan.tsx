import React, { useMemo } from 'react';
import { BellRing } from 'lucide-react';
import type { BedBoard, BoardBed } from '../../types';
import { floorLabel, groupBoard, planFloors } from '../../utils/beds';
import { BedTile } from './BedTile';

interface FloorPlanProps {
  board: BedBoard;
  floor: number;
  onFloor: (floor: number) => void;
  selectedId: string | null;
  onSelect: (bedId: string) => void;
}

type Cell = { kind: 'bed'; bed: BoardBed } | { kind: 'room'; room: string; beds: BoardBed[] };

/** Beds sharing a room become one labelled sub-box; the rest stay single. Beds near the nurses come first. */
function cellsFor(beds: BoardBed[]): Cell[] {
  const byRoom = new Map<string, BoardBed[]>();
  for (const b of beds) if (b.room) byRoom.set(b.room, [...(byRoom.get(b.room) ?? []), b]);
  const done = new Set<string>();
  const cells: Cell[] = [];
  for (const b of beds) {
    const mates = b.room ? byRoom.get(b.room) : undefined;
    if (mates && mates.length > 1) {
      if (done.has(b.room!)) continue;
      done.add(b.room!);
      cells.push({ kind: 'room', room: b.room!, beds: mates });
    } else cells.push({ kind: 'bed', bed: b });
  }
  return cells;
}

const nearNurses = (cell: Cell) => (cell.kind === 'bed' ? cell.bed.features.includes('nearNurses') : cell.beds.some((b) => b.features.includes('nearNurses')));

/** A flat plan of one floor: each ward is a block of bed tiles, twin rooms boxed together, beds near the nurses beside their station. */
export const FloorPlan: React.FC<FloorPlanProps> = ({ board, floor, onFloor, selectedId, onSelect }) => {
  const floors = useMemo(() => planFloors(board), [board]);
  const groups = useMemo(() => groupBoard(board, floor), [board, floor]);
  return (
    <div className="plan">
      <div className="bed-floors" role="group" aria-label="Floor">
        {floors.map((f) => (
          <button key={f} type="button" className={`chip-btn${f === floor ? ' active' : ''}`} aria-pressed={f === floor} onClick={() => onFloor(f)}>
            {floorLabel(f)}
          </button>
        ))}
      </div>
      <div className="plan-wards">
        {groups.map(({ ward, beds, free }) => {
          const cells = cellsFor(beds);
          const near = cells.filter(nearNurses);
          const rest = cells.filter((c) => !nearNurses(c));
          const renderCell = (c: Cell) =>
            c.kind === 'bed' ? (
              <BedTile key={c.bed.id} bed={c.bed} selected={c.bed.id === selectedId} onSelect={onSelect} />
            ) : (
              <div key={c.room} className="plan-room" role="group" aria-label={`Room ${c.room}`}>
                <span className="plan-room-label">Room {c.room}</span>
                <div className="plan-room-beds">
                  {c.beds.map((b) => (
                    <BedTile key={b.id} bed={b} selected={b.id === selectedId} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            );
          return (
            <section key={ward.id} className="plan-ward" aria-label={ward.name}>
              <div className="plan-ward-head">
                <h4>{ward.name}</h4>
                <span className="plan-ward-free">
                  {free} free of {beds.length}
                </span>
              </div>
              {near.length > 0 && (
                <div className="plan-station">
                  <span className="plan-station-mark">
                    <BellRing size={12} aria-hidden="true" /> Nurses' station
                  </span>
                  <div className="plan-cells">{near.map(renderCell)}</div>
                </div>
              )}
              {rest.length > 0 && <div className="plan-cells">{rest.map(renderCell)}</div>}
            </section>
          );
        })}
        {groups.length === 0 && <p className="data-empty">No beds on this floor.</p>}
      </div>
    </div>
  );
};
