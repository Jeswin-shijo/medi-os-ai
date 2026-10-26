import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { useBedBoard } from '../../hooks/useBedBoard';
import { bedService } from '../../services';
import { errorMessage } from '../../services/api';
import { ADMIT_ROLES, groupBoard } from '../../utils/beds';
import { split } from '../../utils/layout';
import type { BoardBed } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { BedTotalsBar, type FloorFilter } from '../beds/BedTotalsBar';
import { WardTiles } from '../beds/WardTiles';
import { BedPanel } from '../beds/BedPanel';
import { AdmitDialog } from '../beds/AdmitDialog';

/** What the Admit dialog opens for: a new admission (maybe to a picked bed) or a transfer. */
type AdmitTarget = Pick<React.ComponentProps<typeof AdmitDialog>, 'preselectBedId' | 'transferFrom'>;

export const BedsScreen: React.FC = () => {
  const { user, showToast } = useApp();
  const role = user?.role ?? '';
  const { board, error, reload } = useBedBoard();
  const [floor, setFloor] = useState<FloorFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<AdmitTarget | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => (board ? groupBoard(board, floor) : []), [board, floor]);
  const selected = board?.beds.find((b) => b.id === selectedId) ?? null;
  const selectedWard = selected ? board?.wards.find((w) => w.id === selected.wardId) : undefined;

  useEffect(() => {
    if (selectedId && panelRef.current && window.matchMedia('(max-width: 1099px)').matches) {
      panelRef.current.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }, [selectedId]);

  const onAdmit = (bedId?: string) => setDialog({ preselectBedId: bedId });
  const onTransfer = async (bed: BoardBed) => {
    if (!bed.patient) return;
    try {
      // The admission's class, needs and notes (the board leaves them out): the transfer reruns the rules with them.
      const admission = await bedService.admission(bed.id);
      setDialog({ transferFrom: { bedId: bed.id, admission } });
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Beds"
        subtitle="Live view of every bed"
        actions={
          ADMIT_ROLES.includes(role) && (
            <button className="btn-primary" onClick={() => onAdmit()}>
              Admit patient
            </button>
          )
        }
      />
      {!board && <p style={{ color: error ? 'var(--red-dark)' : 'var(--text-muted)', fontSize: 13 }}>{error ?? 'Loading beds…'}</p>}
      {board && (
        <>
          {error && <p style={{ color: 'var(--red-dark)', fontSize: 12 }}>Showing the last loaded board. {error}</p>}
          <BedTotalsBar totals={board.totals} floor={floor} onFloor={setFloor} />
          <div className="split" style={{ ...split('340px'), gap: 16, marginTop: 14, alignItems: 'start' }}>
            <div className="ward-list">
              {groups.map((g) => (
                <WardTiles key={g.ward.id} ward={g.ward} beds={g.beds} free={g.free} selectedId={selectedId} onSelect={setSelectedId} />
              ))}
              {groups.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No beds on this floor.</p>}
            </div>
            <div ref={panelRef} className="bed-side">
              {selected && selectedWard ? (
                <BedPanel
                  key={selected.id}
                  bed={selected}
                  ward={selectedWard}
                  role={role}
                  onAdmit={onAdmit}
                  onTransfer={onTransfer}
                  onChanged={reload}
                />
              ) : (
                <div className="medios-card bed-hint">Select a bed to see details</div>
              )}
            </div>
          </div>
        </>
      )}
      {dialog && <AdmitDialog {...dialog} onClose={() => setDialog(null)} onDone={reload} />}
    </div>
  );
};
