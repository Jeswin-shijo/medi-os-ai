import React, { useState } from 'react';
import { BrushCleaning } from 'lucide-react';
import type { BedBoard } from '../../types';
import { HOUSEKEEPING_ROLES } from '../../utils/beds';
import { bedService } from '../../services';
import { errorMessage } from '../../services/api';
import { useApp } from '../../context/appContextCore';

/** A bed is "late" once it has waited this long (the backend's cleaning limit). */
export const CLEANING_LATE_MIN = 30;

interface CleaningListProps {
  board: BedBoard;
  role: string;
  /** A row opens that bed on the bed map. */
  onOpen(bedId: string): void;
}

/** Beds waiting to be cleaned, longest wait first. Minutes come from the board's own clock, so they match the tiles. */
export const CleaningList: React.FC<CleaningListProps> = ({ board, role, onOpen }) => {
  const { showToast } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const canClean = HOUSEKEEPING_ROLES.includes(role);
  const now = new Date(board.updatedAt).getTime();
  const rows = board.beds
    .filter((b) => b.state === 'cleaning')
    .map((b) => ({
      bed: b,
      ward: board.wards.find((w) => w.id === b.wardId),
      minutes: Math.max(0, Math.floor((now - new Date(b.since).getTime()) / 60_000)) || 0
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const clean = async (bedId: string) => {
    setBusy(bedId);
    try {
      await bedService.clean(bedId);
      // The board's live stream brings the new state; nothing to set here.
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="medios-card bagent-card">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Cleaning</h3>
          <span className="bagent-hint">{rows.length ? `${rows.length} waiting` : 'None waiting'}</span>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="data-empty">Every bed is clean.</p>
      ) : (
        <ul className="clean-list">
          {rows.map(({ bed, ward, minutes }) => {
            const late = minutes > CLEANING_LATE_MIN;
            return (
              <li key={bed.id} className="clean-row">
                <button type="button" className="clean-main" onClick={() => onOpen(bed.id)} aria-label={`${bed.label}, ${ward?.shortName ?? ''}, waiting ${minutes} minutes. Show on the bed map.`}>
                  <span className="clean-icon" aria-hidden="true">
                    <BrushCleaning size={16} strokeWidth={2} />
                  </span>
                  <span className="clean-text">
                    <span className="clean-bed">{bed.label}</span>
                    <span className="clean-ward">{ward?.shortName ?? ward?.name}</span>
                  </span>
                  <span className={`clean-wait${late ? ' is-late' : ''}`}>
                    {minutes} min{late && <span className="status-pill sm red">Late</span>}
                  </span>
                </button>
                {canClean && (
                  <button type="button" className="btn-outline-blue btn-sm" disabled={busy === bed.id} onClick={() => void clean(bed.id)}>
                    {busy === bed.id ? 'Saving…' : 'Mark cleaned'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
