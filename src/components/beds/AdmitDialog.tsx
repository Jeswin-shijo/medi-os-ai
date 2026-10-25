import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BedDouble, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { useBedBoard } from '../../hooks/useBedBoard';
import { bedService } from '../../services';
import { errorMessage } from '../../services/api';
import type { AiRefinement, Need, Patient, RoomClass, SuggestionResult } from '../../types';
import { NEED_OPTIONS, OVERRIDE_ROLES, ROOM_CLASS_OPTIONS, defaultRoomClass, offersEmergency } from '../../utils/beds';
import { AdmitStepNeeds, type AdmitForm } from './AdmitStepNeeds';
import { AdmitChoiceBar, AdmitStepBed, type AiMarker, type BedOption } from './AdmitStepBed';

interface AdmitDialogProps {
  /** Admit this patient (the patient field is then fixed). */
  patient?: Patient;
  /** A free bed picked on the board: chosen in step 2 when it passes the rules. */
  preselectBedId?: string;
  /** Move an admitted patient out of this bed instead of admitting. */
  transferFrom?: { bedId: string; patient: { id: string; name: string; age: number; gender: string } };
  onClose(): void;
  /** Called after a successful admit or transfer (step 3). */
  onDone(): void;
}

const STEPS = ['Patient & needs', 'Choose bed', 'Confirm'];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const classLabel = (value: RoomClass) => ROOM_CLASS_OPTIONS.find((o) => o.value === value)?.label ?? value;
const needLabels = (needs: Need[]) => NEED_OPTIONS.filter((o) => needs.includes(o.need)).map((o) => o.label);

/**
 * Admit (or transfer) in three steps: the patient and needs, then a bed from the rule-based
 * suggestions (refined by the AI when it answers), then confirm.
 */
export const AdmitDialog: React.FC<AdmitDialogProps> = ({ patient, preselectBedId, transferFrom, onClose }) => {
  const { patients, user, showToast } = useApp();
  const { board } = useBedBoard();
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const canOverride = OVERRIDE_ROLES.includes(user?.role ?? '');

  const record = patient ?? (transferFrom ? patients.find((p) => p.id === transferFrom.patient.id) : undefined);
  const [form, setForm] = useState<AdmitForm>(() => ({
    patientId: patient?.id ?? transferFrom?.patient.id ?? '',
    doctor: record?.doctor ?? '',
    department: record?.department ?? '',
    roomClass: null,
    needs: [],
    notes: '',
    stay: '3'
  }));
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [refinement, setRefinement] = useState<AiRefinement | null>(null);
  const [aiWaiting, setAiWaiting] = useState(false);
  const [chosenBedId, setChosenBedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [ruleOverride, setRuleOverride] = useState(false);
  const [ignoredNeeds, setIgnoredNeeds] = useState<Need[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Each suggest run gets a number; answers from an older run (or after closing) are dropped. */
  const run = useRef(0);
  /** Set once staff choose a bed themselves, so the AI's answer no longer moves the choice. */
  const picked = useRef(false);

  const selected = patient ?? patients.find((p) => p.id === form.patientId);
  const age = transferFrom?.patient.age ?? selected?.age ?? 0;
  const classFor = (needs: Need[]): RoomClass =>
    form.roomClass && (form.roomClass !== 'emergency' || offersEmergency(form.department)) ? form.roomClass : defaultRoomClass(age, needs);
  const roomClass = classFor(form.needs);

  // Focus moves into the dialog on open and back to where it was on close; answers arriving after closing are dropped.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const box = boxRef.current;
    const runs = run;
    if (box && !box.contains(document.activeElement)) (bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? box).focus();
    return () => {
      runs.current++;
      before?.focus?.();
    };
  }, []);

  // A new step starts at its top, with focus on it.
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    bodyRef.current?.scrollTo({ top: 0 });
    bodyRef.current?.focus();
  }, [step]);

  // Esc closes; Tab cycles inside the dialog. On the document, so keys still work after the focused control goes away.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const box = boxRef.current;
      if (!box || e.defaultPrevented) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (!box.contains(at) || (e.shiftKey ? at === first || at === box : at === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const change = (patch: Partial<AdmitForm>) => {
    setError(null);
    setForm((f) => ({ ...f, ...patch }));
  };
  const pickPatient = (p: Patient) => change({ patientId: p.id, doctor: p.doctor, department: p.department, roomClass: null });

  const refine = async (id: number, suggestionId: string) => {
    try {
      const result = await bedService.refine(suggestionId);
      if (id !== run.current || result.status !== 'ok') return;
      setRefinement(result);
      if (!picked.current && result.top[0]) setChosenBedId(result.top[0].bedId);
    } catch {
      // An AI that fails or cannot be reached leaves the rule-based cards, with no error shown.
    } finally {
      if (id === run.current) setAiWaiting(false);
    }
  };

  const suggest = async (needs: Need[]) => {
    const id = ++run.current;
    setBusy(true);
    setError(null);
    try {
      const result = await bedService.suggest({
        patientId: form.patientId,
        roomClass: classFor(needs),
        needs,
        department: form.department.trim(),
        doctor: form.doctor.trim(),
        expectedStayDays: Number(form.stay),
        notes: form.notes,
        ...(transferFrom && { currentBedId: transferFrom.bedId })
      });
      if (id !== run.current) return;
      const preselected = !!preselectBedId && result.eligible.some((b) => b.bedId === preselectBedId);
      picked.current = preselected;
      setSuggestion(result);
      setRefinement(null);
      setChosenBedId(preselected ? (preselectBedId ?? null) : (result.top[0]?.bedId ?? null));
      setRuleOverride(false);
      setReason('');
      setStep(2);
      setAiWaiting(result.ai === 'pending');
      if (result.ai === 'pending') void refine(id, result.suggestionId);
    } catch (err) {
      if (id === run.current) setError(errorMessage(err));
    } finally {
      if (id === run.current) setBusy(false);
    }
  };

  const addNeed = (need: Need) => {
    const needs = [...form.needs, need];
    change({ needs });
    bodyRef.current?.focus(); // the notice and its buttons go away
    void suggest(needs);
  };
  const ignoreNeed = (need: Need) => {
    setIgnoredNeeds((list) => [...list, need]);
    bodyRef.current?.focus();
  };

  const choose = (bedId: string, override: boolean) => {
    picked.current = true;
    setChosenBedId(bedId);
    setRuleOverride(override);
  };

  const back = () => {
    run.current++; // drops an AI answer still on its way: Next makes a new suggestion
    setBusy(false);
    setAiWaiting(false);
    setError(null);
    setStep(1);
  };

  const aiOk = refinement?.status === 'ok' ? refinement : null;
  const top = aiOk?.top ?? suggestion?.top ?? [];
  const aiMarker: AiMarker = aiWaiting ? 'pending' : aiOk ? (aiOk.sample ? 'sample' : 'ai') : 'none';
  const extraNeeds = aiOk ? aiOk.extraNeeds.filter((e) => !form.needs.includes(e.need) && !ignoredNeeds.includes(e.need)) : [];

  const overrideBeds = useMemo((): BedOption[] | null => {
    if (!canOverride || !suggestion) return [];
    if (!board) return null;
    const eligible = new Set(suggestion.eligible.map((b) => b.bedId));
    const wards = new Map(board.wards.map((w) => [w.id, w]));
    return board.beds.flatMap((bed) => {
      const ward = wards.get(bed.wardId);
      if (!ward || bed.state !== 'free' || eligible.has(bed.id) || bed.id === transferFrom?.bedId) return [];
      return [{ bedId: bed.id, label: bed.label, wardName: ward.name, floor: ward.floor, ratePerDay: ward.ratePerDay }];
    });
  }, [canOverride, suggestion, board, transferFrom?.bedId]);

  const preselectNotice = useMemo(() => {
    if (!preselectBedId || !suggestion || suggestion.eligible.some((b) => b.bedId === preselectBedId)) return undefined;
    const bed = board?.beds.find((b) => b.id === preselectBedId);
    const name = bed?.label ?? 'The bed you picked';
    if (bed && bed.state !== 'free') return `${name} is no longer free, so it isn't offered.`;
    const rules = suggestion.appliedRules.slice(1).join(', ');
    return `${name} doesn't fit this patient's bed rules${rules ? ` (${rules})` : ''}, so it isn't offered.`;
  }, [preselectBedId, suggestion, board]);

  const chosen = [...top, ...(suggestion?.eligible ?? []), ...(overrideBeds ?? [])].find((b) => b.bedId === chosenBedId);
  // Either top pick needs no reason: the rules' first bed (shown at once) or the AI's (once it answers).
  const ruleTopId = suggestion?.top[0]?.bedId;
  const aiTopId = aiOk?.top[0]?.bedId;
  const reasonRequired = !!chosenBedId && (ruleOverride || (chosenBedId !== ruleTopId && chosenBedId !== aiTopId));
  const canConfirm = !!chosen && !busy && (!reasonRequired || !!reason.trim());

  const goConfirm = () => {
    if (!canConfirm) return;
    showToast('The confirm step is coming next.', 'info'); // Task 13: hold the bed and move to step 3
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2) return goConfirm();
    if (!form.patientId) return setError('Choose a patient first.');
    void suggest(form.needs);
  };

  const name = transferFrom?.patient.name ?? selected?.name ?? '';
  const fromBed = transferFrom && board?.beds.find((b) => b.id === transferFrom.bedId);
  const fixedPatient = transferFrom
    ? { name, detail: `${transferFrom.patient.age} yrs · ${transferFrom.patient.gender}${fromBed ? ` · now in ${fromBed.label}` : ''}` }
    : patient
      ? { name: patient.name, detail: `${patient.uhid} · ${patient.age} yrs · ${patient.gender}` }
      : undefined;
  const needsText = needLabels(form.needs).join(', ') || 'No special needs';
  const summary = (
    <>
      <strong>{name}</strong> · {classLabel(roomClass)} · {needsText} · {form.stay} {Number(form.stay) === 1 ? 'day' : 'days'}
    </>
  );

  // Rendered on <body>, like the app's global modals: inside the screen, the header and sidebar would sit above it.
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={boxRef}
        className="modal-content-box admit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId} className="admit-title">
            <BedDouble size={18} color="var(--blue-text)" aria-hidden="true" />
            {transferFrom ? 'Transfer patient' : 'Admit patient'}
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <ol className="admit-steps" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li key={label} className={step === i + 1 ? 'is-current' : step > i + 1 ? 'is-done' : undefined} aria-current={step === i + 1 ? 'step' : undefined}>
              <span className="admit-step-num">{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <form onSubmit={submit}>
          <div ref={bodyRef} className="modal-body admit-body" tabIndex={-1} aria-label={`Step ${step} of 3: ${STEPS[step - 1]}`} role="group">
            {step === 1 && (
              <AdmitStepNeeds form={form} onChange={change} roomClass={roomClass} fixedPatient={fixedPatient} patients={patients} onPickPatient={pickPatient} />
            )}
            {step === 2 && suggestion && (
              <AdmitStepBed
                summary={summary}
                suggestion={suggestion}
                top={top}
                ai={aiMarker}
                extraNeeds={extraNeeds}
                onAddNeed={addNeed}
                onIgnoreNeed={ignoreNeed}
                preselectNotice={preselectNotice}
                chosenBedId={chosenBedId}
                onChoose={choose}
                canOverride={canOverride}
                overrideBeds={overrideBeds}
                busy={busy}
              />
            )}
          </div>
          {step === 2 && <AdmitChoiceBar chosen={chosen} ruleOverride={ruleOverride} reasonRequired={reasonRequired} reason={reason} onReason={setReason} />}
          {error && (
            <p className="admit-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            {step === 1 ? (
              <>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? 'Finding beds…' : 'Next: Choose bed'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-secondary" onClick={back}>
                  Back
                </button>
                <button type="submit" className="btn-primary" disabled={!canConfirm}>
                  Next: Confirm
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
