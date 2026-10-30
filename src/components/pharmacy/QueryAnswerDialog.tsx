import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Clock, MessageSquareQuote, Plus, Search } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { pharmacyAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useErAction } from '../er/useErAction';
import type { PharmacyAnswerInput, PharmacyCatalogue, PharmacyCatalogueMedicine, PharmacyFlag, PharmacyLineInput, PharmacyLineView } from '../../types';
import { PRIORITY_LABEL, QUERY_KIND_LABEL, answerOutcomes, doseText, dueText, type AnswerOutcome } from '../../utils/pharmacy';
import { LabDialogShell } from '../lab/LabDialogShell';
import { redAllergy, toInput, type Row } from '../../utils/pharmacyOrder';
import { LineEditor } from './NewMedicineOrderDialog';
import { PharmacyFlags } from './PharmacyFlags';

const CHECK_MS = 400;
const DEFAULT_DAYS = '5';
const MATCH_LIMIT = 6;
const CHANGED = 'This question has changed';

interface QueryAnswerDialogProps {
  lineId: string;
  onClose(): void;
  /** After the query is answered (or was already): the lists reload. */
  onDone(): void;
}

const OUTCOME_LABEL: Record<AnswerOutcome, string> = {
  change: 'Change',
  keep: 'Keep',
  cancel: 'Cancel line',
  stop: 'Stop',
  switch: 'Switch',
  wait: 'Wait'
};

const OUTCOME_HINT: Record<AnswerOutcome, string> = {
  change: 'Edit the product, dose, route, frequency or days. The new version is checked again.',
  keep: 'Keep the line as it is. Say why it is safe.',
  cancel: 'Cancel this line. Give a reason.',
  stop: 'Stop this medicine. The patient has already had it. Give a reason.',
  switch: 'Choose another medicine in its place.',
  wait: 'Keep the line and wait for stock to come in.'
};

const REASON_OUTCOMES: AnswerOutcome[] = ['keep', 'cancel', 'stop'];

const rowFromLine = (line: PharmacyLineView, catalogue: PharmacyCatalogue): Row | null => {
  const medicine = catalogue.medicines.find((m) => m.key === line.medicine);
  const product = medicine?.products.find((p) => p.key === line.product);
  if (!medicine || !product) return null;
  return {
    key: 1,
    medicine: medicine.key,
    product: product.key,
    dose: String(line.dose ?? product.strength),
    route: product.routes.includes(line.route) ? line.route : (product.routes[0] ?? line.route),
    frequency: line.frequency || 'OD',
    days: String(line.durationDays ?? DEFAULT_DAYS),
    note: '',
    known: false,
    reason: ''
  };
};

const rowFromMedicine = (m: PharmacyCatalogueMedicine): Row | null => {
  const p = m.products[0];
  return p ? { key: 2, medicine: m.key, product: p.key, dose: String(p.strength), route: p.routes[0] ?? 'oral', frequency: 'OD', days: DEFAULT_DAYS, note: '', known: false, reason: '' } : null;
};

/**
 * The doctor's answer to a pharmacy query. It loads the line, shows the question and flags, and offers only the
 * outcomes that fit (a stock query: switch, wait, cancel; an issued line: change, keep, stop; else change, keep, cancel).
 * Every answer names the query it answers, so an answer to an old question is refused and the line reloads.
 */
export const QueryAnswerDialog: React.FC<QueryAnswerDialogProps> = ({ lineId, onClose, onDone }) => {
  const uid = useId();
  const now = useNow();
  const { busy, error, setError, run } = useErAction();
  const [line, setLine] = useState<PharmacyLineView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [catalogue, setCatalogue] = useState<PharmacyCatalogue | null>(null);
  const [outcome, setOutcome] = useState<AnswerOutcome | null>(null);
  const [reason, setReason] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [medQuery, setMedQuery] = useState('');
  const noticed = useRef(false);
  const [shownSeq, setShownSeq] = useState(-1);

  const [flags, setFlags] = useState<PharmacyFlag[] | null>(null);
  const [checkedFor, setCheckedFor] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const reload = useCallback(() => setTries((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    pharmacyAgentService
      .line(lineId)
      .then((l) => {
        if (!alive) return;
        setLine(l);
        setLoadError(null);
      })
      .catch((err) => alive && setLoadError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [lineId, tries]);

  useEffect(() => {
    let alive = true;
    pharmacyAgentService
      .catalogue()
      .then((c) => alive && setCatalogue(c))
      .catch(() => {
        // Only Change and Switch need the list; their forms say so.
      });
    return () => {
      alive = false;
    };
  }, []);

  const query = line?.query ?? null;
  const answered = !!query?.answer;
  const seq = query?.seq ?? -1;
  const allowed = useMemo(() => (line && query && !query.answer ? answerOutcomes(line) : []), [line, query]);

  // An answer that was already given: say so once, and let the lists reload.
  useEffect(() => {
    if (answered && !noticed.current) {
      noticed.current = true;
      onDone();
    }
  }, [answered, onDone]);

  // A new question (or a reload that changed the query) starts the form again.
  if (seq !== shownSeq) {
    setShownSeq(seq);
    setOutcome(null);
    setReason('');
    setRow(null);
    setFlags(null);
    setCheckedFor('');
    setMedQuery('');
  }

  const hasDuration = useCallback((frequency: string) => catalogue?.frequencies.find((f) => f.key === frequency)?.hasDuration ?? frequency !== 'STAT', [catalogue]);
  const medicineOf = (key: string): PharmacyCatalogueMedicine | undefined => catalogue?.medicines.find((m) => m.key === key);

  const choose = (next: AnswerOutcome) => {
    if (!line || !catalogue) return;
    setOutcome(next);
    setError(null);
    setReason('');
    setFlags(null);
    setCheckedFor('');
    setMedQuery('');
    setRow(next === 'change' ? rowFromLine(line, catalogue) : null);
  };

  const patchRow = (patch: Partial<Row>) => {
    setError(null);
    setRow((r) => (r ? { ...r, ...patch } : r));
  };
  const changeProduct = (productKey: string) => {
    if (!row) return;
    const p = medicineOf(row.medicine)?.products.find((x) => x.key === productKey);
    if (!p) return;
    patchRow({ known: false, reason: '', product: productKey, dose: String(p.strength), route: p.routes.includes(row.route) ? row.route : (p.routes[0] ?? row.route) });
  };
  const pickMedicine = (m: PharmacyCatalogueMedicine) => {
    const r = rowFromMedicine(m);
    if (!r) return;
    setError(null);
    setRow(r);
    setMedQuery('');
  };

  const mq = medQuery.trim().toLowerCase();
  const medMatches = useMemo(() => {
    if (!catalogue || mq.length < 1) return [];
    return catalogue.medicines
      .filter((m) => m.name.toLowerCase().includes(mq) || m.key.toLowerCase().includes(mq) || (m.aliases ?? []).some((a) => a.toLowerCase().includes(mq)) || m.classLabel.toLowerCase().includes(mq) || m.products.some((p) => p.label.toLowerCase().includes(mq)))
      .slice(0, MATCH_LIMIT);
  }, [catalogue, mq]);

  // The live check of the new version (Change or Switch). The key holds everything the request needs.
  const input = row ? toInput(row, hasDuration(row.frequency)) : null;
  const checkKey = line && input && (outcome === 'change' || outcome === 'switch') ? JSON.stringify([line.patient.id, line.id, input]) : '';
  useEffect(() => {
    if (!checkKey) return;
    const [patientId, replacingLineId, one] = JSON.parse(checkKey) as [string, string, PharmacyLineInput];
    let alive = true;
    const timer = window.setTimeout(() => {
      setChecking(true);
      pharmacyAgentService
        .check({ patientId, replacingLineId, lines: [one] })
        .then((r) => {
          if (!alive) return;
          setFlags(r.lines[0]?.flags ?? []);
          setCheckedFor(checkKey);
          setCheckError(null);
        })
        .catch((err) => alive && setCheckError(errorMessage(err)))
        .finally(() => alive && setChecking(false));
    }, CHECK_MS);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [checkKey]);

  const fresh = !!checkKey && checkedFor === checkKey && !checking && !checkError && flags !== null;
  const liveFlags = fresh ? flags : undefined;
  const needsConfirm = !!row && redAllergy(liveFlags) && !(row.known && row.reason.trim());

  const isEdit = outcome === 'change' || outcome === 'switch';
  const ready =
    !!outcome &&
    (REASON_OUTCOMES.includes(outcome) ? reason.trim().length > 0 : outcome === 'wait' ? true : !!input && fresh && !needsConfirm);

  const hint = !outcome
    ? 'Choose what to do.'
    : isEdit && !row
      ? outcome === 'switch'
        ? 'Choose the medicine to switch to.'
        : ''
      : isEdit && !input
        ? 'Check the dose and the days: a dose above 0, and 1 to 90 days.'
        : isEdit && checkError
          ? 'The safety check did not finish. Change a field to try again.'
          : isEdit && !fresh
            ? 'Checking the safety rules…'
            : isEdit && needsConfirm
              ? 'Confirm the red allergy above to send this answer.'
              : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line || !query || !outcome || !ready) return;
    const body: PharmacyAnswerInput = { querySeq: query.seq, outcome };
    if (REASON_OUTCOMES.includes(outcome)) body.reason = reason.trim();
    if (isEdit && row && input) {
      const withConfirm = redAllergy(liveFlags) ? { ...input, confirm: { reason: row.reason.trim() } } : input;
      if (outcome === 'change') {
        const { medicine: _m, note: _n, ...change } = withConfirm;
        void _m;
        void _n;
        body.change = change;
      } else {
        body.switchTo = withConfirm;
      }
    }
    const ok = await run('answer', async () => {
      try {
        return await pharmacyAgentService.answer(line.id, body);
      } catch (err) {
        // An answer to an old question is refused: read the line again, the message stays on screen.
        if (errorMessage(err).includes(CHANGED)) reload();
        throw err;
      }
    });
    if (!ok) return;
    onDone();
    onClose();
  };

  const left = query ? dueText(query.dueAt, now) : null;
  const where = line ? (line.patient.location.ward ? `${line.patient.location.area} · ${line.patient.location.ward}` : line.patient.location.area) : '';

  return (
    <LabDialogShell title="Answer the pharmacy query" icon={<MessageSquareQuote size={18} color="var(--blue-text)" aria-hidden="true" />} busy={busy !== null} onClose={onClose}>
      {!line ? (
        <div className="modal-body admit-body">
          {loadError ? (
            <p className="er-error" role="alert">
              {loadError}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={reload}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading the query…</p>
          )}
        </div>
      ) : !query || answered ? (
        <>
          <div className="modal-body admit-body">
            <div className="admit-notice is-info" role="status">
              <div className="admit-notice-body">
                <p>
                  {query?.answer
                    ? `This query was already answered: ${OUTCOME_LABEL[query.answer.outcome as AnswerOutcome] ?? query.answer.outcome} by ${query.answer.by.name}${query.answer.reason ? `. ${query.answer.reason}` : '.'}`
                    : 'This line has no open query.'}
                </p>
              </div>
            </div>
          </div>
          {error && (
            <p className="admit-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={(e) => void submit(e)}>
          <div className="modal-body admit-body ph-order-body">
            <div className="ph-ask">
              <div className="ph-ask-head">
                <span className="er-name">{line.patient.name}</span>
                <span className="er-sub">{line.patient.uhid} · {where}</span>
                <span className="status-pill sm orange">{QUERY_KIND_LABEL[query.kind] ?? query.kind}</span>
                {left && (
                  <span className={`ph-due${left.late ? ' is-late' : ''}`}>
                    <Clock size={12} aria-hidden="true" />
                    {left.text}
                  </span>
                )}
              </div>
              <p className="ph-ask-med">
                <strong>{line.productLabel || line.medicineLabel}</strong> · {doseText(line)} · {PRIORITY_LABEL[line.priority]} · {line.orderNumber}
                {line.status === 'issued' ? ' · already issued' : ''}
              </p>
              <blockquote className="ph-ask-q">{query.question}</blockquote>
              <p className="er-hint">Asked by {query.by.name}.</p>
            </div>
            {!(isEdit && row) && <PharmacyFlags line={line} canExplain />}

            <fieldset className="admit-fieldset">
              <legend className="form-label">Your answer</legend>
              <div className="admit-options">
                {allowed.map((o) => (
                  <label key={o} className={`admit-option${outcome === o ? ' is-on' : ''}`}>
                    <input type="radio" name={`${uid}-outcome`} value={o} checked={outcome === o} disabled={(o === 'change' || o === 'switch') && !catalogue} onChange={() => choose(o)} />
                    {OUTCOME_LABEL[o]}
                  </label>
                ))}
              </div>
              {outcome && <p className="admit-hint">{OUTCOME_HINT[outcome]}</p>}
            </fieldset>

            {outcome && REASON_OUTCOMES.includes(outcome) && (
              <div>
                <label className="form-label" htmlFor={`${uid}-reason`}>
                  {outcome === 'keep' ? 'Why it is safe to keep' : outcome === 'cancel' ? 'Reason for cancelling' : 'Reason for stopping'}
                </label>
                <textarea id={`${uid}-reason`} className="input-field" rows={2} maxLength={300} value={reason} onChange={(e) => { setReason(e.target.value); setError(null); }} autoFocus />
                <p className="admit-hint"><span className="admit-count">{reason.length} / 300</span></p>
              </div>
            )}

            {outcome === 'switch' && (
              <div className="ph-meds">
                {query.suggestions.length > 0 && (
                  <div>
                    <span className="form-label">In stock now</span>
                    <div className="admit-options">
                      {query.suggestions.map((s) => {
                        const m = medicineOf(s.medicine);
                        return (
                          <button key={s.medicine} type="button" className={`admit-option${row?.medicine === s.medicine ? ' is-on' : ''}`} disabled={!m} onClick={() => m && pickMedicine(m)}>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <label className="form-label" htmlFor={`${uid}-med`}>{query.suggestions.length ? 'Or find any medicine' : 'Find a medicine: name or group'}</label>
                  <div className="admit-search">
                    <Search size={15} aria-hidden="true" />
                    <input id={`${uid}-med`} className="input-field" autoComplete="off" value={medQuery} onChange={(e) => setMedQuery(e.target.value)} />
                  </div>
                  {mq.length >= 1 && (
                    <div className="admit-listbox" style={{ position: 'static', marginTop: 6 }}>
                      {medMatches.length === 0 ? (
                        <p className="admit-listbox-empty">No medicine matches.</p>
                      ) : (
                        <ul>
                          {medMatches.map((m) => (
                            <li key={m.key}>
                              <button type="button" className="er-pick" onClick={() => pickMedicine(m)}>
                                <span className="admit-patient-name"><Plus size={13} aria-hidden="true" /> {m.name}</span>
                                <span className="admit-patient-detail">{m.classLabel}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isEdit && row && catalogue && (
              <>
                <LineEditor uid={`${uid}-edit`} row={row} medicine={medicineOf(row.medicine)} catalogue={catalogue} flags={liveFlags} hideNote onPatch={patchRow} onProduct={changeProduct} />
                <p className="ph-check-state" role="status" aria-live="polite">
                  {checkError ? <span className="ph-check-fail">{checkError}</span> : checking || (!!input && !fresh) ? 'Checking…' : ''}
                </p>
              </>
            )}
            {isEdit && !row && outcome === 'change' && <p className="er-error" role="alert">This line has no product on the medicine list, so it cannot be changed. Cancel it or keep it.</p>}
            {hint && <p className="admit-hint">{hint}</p>}
          </div>
          {error && (
            <p className="admit-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy !== null}>
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={!ready || busy !== null}>
              {busy ? 'Sending…' : 'Send answer'}
            </button>
          </div>
        </form>
      )}
    </LabDialogShell>
  );
};
