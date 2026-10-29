import React, { useId, useState } from 'react';
import type { ErVisit } from '../../types';
import { erService } from '../../services';
import { SampleBadge } from '../common/SampleBadge';
import { useErAction } from './useErAction';

const NOTE_MAX = 2000;

interface ErHandoverProps {
  visit: ErVisit;
  canEdit: boolean;
  onChanged(): void;
}

/** The handover note: written by hand, or drafted by the AI from the visit and then edited. */
export const ErHandover: React.FC<ErHandoverProps> = ({ visit, canEdit, onChanged }) => {
  const id = useId();
  const { busy, error, run } = useErAction();
  const saved = visit.handoverNote ?? '';
  // null: show the saved note; a string once the person types or a draft arrives.
  const [edited, setEdited] = useState<string | null>(null);
  const [sample, setSample] = useState(false);
  const text = edited ?? saved;
  const dirty = edited !== null;
  const closed = visit.status === 'left';

  const [replacing, setReplacing] = useState(false);

  const draft = async () => {
    setReplacing(false);
    const d = await run('draft', () => erService.handoverDraft(visit.id));
    if (d) {
      setEdited(d.text.slice(0, NOTE_MAX));
      setSample(d.sample);
    }
  };
  const save = async () => {
    const v = await run('save', () => erService.saveHandover(visit.id, text));
    if (v) {
      setEdited(null);
      onChanged();
    }
  };

  return (
    <section className="er-section" aria-label="Handover">
      <div className="er-section-head">
        <h4 className="er-section-title">Handover note</h4>
        {sample && <SampleBadge />}
        {canEdit && !closed && (
          <button type="button" className="btn-secondary btn-sm er-push" onClick={() => (dirty && text.trim() ? setReplacing(true) : void draft())} disabled={busy !== null}>
            {busy === 'draft' ? 'Drafting…' : 'Draft with AI'}
          </button>
        )}
      </div>
      {replacing && (
        <div className="er-inline-form" role="alert">
          <p style={{ margin: 0 }}>Replace your note with the AI draft?</p>
          <div className="er-actions">
            <button type="button" className="btn-secondary btn-sm" onClick={() => setReplacing(false)}>
              Keep my note
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={() => void draft()}>
              Replace
            </button>
          </div>
        </div>
      )}
      {canEdit && !closed ? (
        <>
          <label className="form-label sr-only" htmlFor={id}>Handover note</label>
          <textarea
            id={id}
            className="input-field"
            rows={4}
            maxLength={NOTE_MAX}
            value={text}
            onChange={(e) => setEdited(e.target.value)}
            placeholder="What the next team needs to know."
          />
          <div className="er-actions er-between">
            <span className="er-hint">{text.length}/{NOTE_MAX}</span>
            <button type="button" className="btn-primary btn-sm" onClick={() => void save()} disabled={busy !== null || !dirty}>
              {busy === 'save' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      ) : (
        <p className="er-note">{saved || <span className="er-hint">No handover note.</span>}</p>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};
