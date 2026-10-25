import React from 'react';
import type { BoardBed, BoardWard } from '../../types';
import { BedTile } from './BedTile';

interface WardTilesProps {
  ward: BoardWard;
  beds: BoardBed[];
  free: number;
  selectedId: string | null;
  onSelect: (bedId: string) => void;
}

/** A ward's header ("Ward A · 4 free of 20") and its grid of bed tiles. */
export const WardTiles: React.FC<WardTilesProps> = ({ ward, beds, free, selectedId, onSelect }) => (
  <section className="medios-card ward-card" aria-label={ward.name}>
    <div className="ward-card-head">
      <h3>
        {ward.name} · {free} free of {beds.length}
      </h3>
    </div>
    <div className="bed-grid">
      {beds.map((bed) => (
        <BedTile key={bed.id} bed={bed} selected={bed.id === selectedId} onSelect={onSelect} />
      ))}
    </div>
  </section>
);
