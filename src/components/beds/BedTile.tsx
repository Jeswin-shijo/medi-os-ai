import React from 'react';
import type { BoardBed } from '../../types';
import { BED_STATE_META } from '../../utils/beds';

interface BedTileProps {
  bed: BoardBed;
  selected: boolean;
  onSelect: (bedId: string) => void;
}

/** One bed: its number on the state colour, with an icon for cleaning, held and blocked so colour is never the only signal. */
export const BedTile: React.FC<BedTileProps> = ({ bed, selected, onSelect }) => {
  const meta = BED_STATE_META[bed.state];
  const Icon = meta.icon;
  const text = `${bed.label}: ${meta.label}`;
  const tip = bed.state === 'occupied' && bed.patient ? `${text} (${bed.patient.name})` : text;
  return (
    <button
      type="button"
      className={`bed-tile bed-${bed.state}${selected ? ' is-selected' : ''}`}
      aria-label={text}
      aria-pressed={selected}
      data-tip={tip}
      onClick={() => onSelect(bed.id)}
    >
      <span className="bed-tile-num">{bed.number}</span>
      {Icon && <Icon size={10} strokeWidth={2.25} aria-hidden="true" className="bed-tile-icon" />}
    </button>
  );
};
