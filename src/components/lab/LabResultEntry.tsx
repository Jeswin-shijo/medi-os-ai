import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ClipboardPen } from 'lucide-react';
import { labAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useErAction } from '../er/useErAction';
import type { LabCatalogueTest, LabLimit, LabResultRow } from '../../types';
import { flagLabel, flagTone, flagValue, unitText } from '../../utils/lab';
import { LabDialogShell } from './LabDialogShell';

export interface EntryLine {
  lineId: string;
  test: string;
  label: string;
  requestNumber: string;
  patientUhid: string;
  /** Values already on the line: a sent-back entry or the released result being amended. */
  initial?: LabResultRow[];
  /** Why the validator sent it back. */
  sentBackReason?: string;
}

interface LabResultEntryProps {
  line: EntryLine;
  /** An amendment of a released result: a reason is required and a second person validates again. */
  amend?: boolean;
  onClose(): void;
  onSaved(): void;
}

/** Enter (or amend) the results of one test: one field per parameter, with its unit, its range and a live flag. */
export const LabResultEntry: React.FC<LabResultEntryProps> = ({ line, amend = false, onClose, onSaved }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [def, setDef] = useState<LabCatalogueTest | null>(null);
  const [limits, setLimits] = useState<Record<string, LabLimit>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries((line.initial ?? []).map((r) => [r.param, String(r.value)])));
  const [reason, setReason] = useState('');
  // An optional note for a text result (blood culture: the organism), keyed by the text parameter.
  const [comments, setComments] = useState<Record<string, string>>(() => Object.fromEntries((line.initial ?? []).filter((r) => r.comment).map((r) => [r.param, r.comment as string])));
  const listRef = useRef<HTMLUListElement>(null);
  /** Only a blood culture's text result takes an organism / comment. */
  const hasComment = (p: { text: boolean }): boolean => p.text && line.test === 'blood-culture';

  // Focus goes to the first field once the fields have loaded (the dialog's own focus trap stays).
  useEffect(() => {
    if (def) listRef.current?.querySelector<HTMLElement>('input, select')?.focus();
  }, [def]);

  useEffect(() => {
    let alive = true;
    Promise.all([labAgentService.catalogue(), labAgentService.limits()])
      .then(([catalogue, l]) => {
        if (!alive) return;
        const found = catalogue.tests.find((t) => t.key === line.test) ?? null;
        setDef(found);
        setLimits(l.limits);
        setLoadError(found ? null : 'This test is not in the catalogue.');
      })
      .catch((err) => alive && setLoadError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [line.test, tries]);

  const flags = useMemo(() => {
    const out: Record<string, { flag: ReturnType<typeof flagValue>['flag']; critical: boolean } | null> = {};
    for (const p of def?.parameters ?? []) {
      const raw = (values[p.name] ?? '').trim();
      if (!raw || (!p.text && !Number.isFinite(Number(raw)))) {
        out[p.name] = null;
        continue;
      }
      out[p.name] = flagValue(line.test, p, p.text ? raw : Number(raw), limits);
    }
    return out;
  }, [def, values, limits, line.test]);

  const complete = !!def && def.parameters.every((p) => flags[p.name] !== null);
  const reasonOk = !amend || reason.trim().length > 0;
  const anyCritical = Object.values(flags).some((f) => f?.critical);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!def || !complete || !reasonOk) return;
    const payload: Record<string, number | string> = {};
    for (const p of def.parameters) payload[p.name] = p.text ? values[p.name].trim() : Number(values[p.name]);
    const notes: Record<string, string> = {};
    for (const p of def.parameters) if (hasComment(p) && comments[p.name]?.trim()) notes[p.name] = comments[p.name].trim();
    const extra = Object.keys(notes).length ? notes : undefined;
    const ok = await run('save', () => (amend ? labAgentService.amend(line.lineId, payload, reason.trim(), extra) : labAgentService.enterResults(line.lineId, payload, extra)));
    if (!ok) return;
    onSaved();
    onClose();
  };

  return (
    <LabDialogShell title={amend ? `Amend ${line.label}` : `Enter results: ${line.label}`} icon={<ClipboardPen size={18} color="var(--blue-text)" aria-hidden="true" />} busy={busy !== null} onClose={onClose}>
      <form onSubmit={(e) => void submit(e)}>
        <div className="modal-body admit-body">
          <p className="er-hint">
            <span className="lab-num">{line.requestNumber}</span> · {line.patientUhid}
          </p>
          {line.sentBackReason && (
            <div className="admit-notice is-warn" role="status">
              <div className="admit-notice-body">
                <p>
                  <strong>Sent back:</strong> {line.sentBackReason}
                </p>
              </div>
            </div>
          )}
          {amend && <p className="admit-hint">A released result is changed here. A second person must validate the new values before they are released again.</p>}
          {!def ? (
            loadError ? (
              <p className="er-error" role="alert">
                {loadError}{' '}
                <button type="button" className="btn-secondary btn-sm" onClick={() => setTries((n) => n + 1)}>
                  Try again
                </button>
              </p>
            ) : (
              <p className="data-empty">Loading the test…</p>
            )
          ) : (
            <ul ref={listRef} className="lab-entry">
              {def.parameters.map((p) => {
                const f = flags[p.name];
                const unit = unitText(p.unit);
                const id = `${uid}-${p.name}`;
                return (
                  <li key={p.name} className={`lab-entry-row${f?.critical ? ' is-critical' : ''}`}>
                    <label className="form-label lab-entry-name" htmlFor={id}>
                      {p.name}
                    </label>
                    <div className="lab-entry-field">
                      {p.text && p.options?.length ? (
                        <select
                          id={id}
                          className="form-select"
                          value={p.options.find((o) => o.toLowerCase() === (values[p.name] ?? '').trim().toLowerCase()) ?? ''}
                          aria-describedby={`${id}-info`}
                          onChange={(e) => {
                            setError(null);
                            setValues((v) => ({ ...v, [p.name]: e.target.value }));
                          }}
                        >
                          <option value="">Choose…</option>
                          {p.options.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={id}
                          className="input-field"
                          type={p.text ? 'text' : 'number'}
                          inputMode={p.text ? 'text' : 'decimal'}
                          step={p.text ? undefined : 'any'}
                          maxLength={p.text ? 200 : undefined}
                          autoComplete="off"
                          value={values[p.name] ?? ''}
                          aria-describedby={`${id}-info`}
                          onChange={(e) => {
                            setError(null);
                            setValues((v) => ({ ...v, [p.name]: e.target.value }));
                          }}
                        />
                      )}
                      {unit && <span className="lab-entry-unit">{unit}</span>}
                    </div>
                    <div id={`${id}-info`} className="lab-entry-info">
                      <span className="er-hint">{p.text ? `${p.range || 'Nil'} is normal` : p.range ? `Range ${p.range}` : ''}</span>
                      <span aria-live="polite">{f && <span className={`status-pill sm ${flagTone(f.flag, f.critical)}`}>{flagLabel(f.flag, f.critical)}</span>}</span>
                    </div>
                    {hasComment(p) && (
                      <div className="lab-entry-comment">
                        <label className="form-label" htmlFor={`${id}-comment`}>
                          Organism / comment (optional)
                        </label>
                        <input
                          id={`${id}-comment`}
                          className="input-field"
                          maxLength={200}
                          autoComplete="off"
                          placeholder="For example: E. coli"
                          value={comments[p.name] ?? ''}
                          onChange={(e) => setComments((c) => ({ ...c, [p.name]: e.target.value }))}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {anyCritical && (
            <p className="lab-crit-note" role="status">
              A critical value goes to the duty doctor as soon as it is released.
            </p>
          )}
          {amend && (
            <div>
              <label className="form-label" htmlFor={`${uid}-reason`}>
                Reason for the amendment
              </label>
              <textarea id={`${uid}-reason`} className="input-field" rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
              <p className="admit-hint">
                <span className="admit-count">{reason.length} / 300</span>
              </p>
            </div>
          )}
        </div>
        {error && (
          <p className="admit-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy !== null}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!complete || !reasonOk || busy !== null}>
            {busy ? 'Saving…' : amend ? 'Save amendment for validation' : 'Save for validation'}
          </button>
        </div>
      </form>
    </LabDialogShell>
  );
};
