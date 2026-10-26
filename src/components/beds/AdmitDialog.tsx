import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, BedDouble, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { useBedBoard } from '../../hooks/useBedBoard';
import { bedService } from '../../services';
import { ApiError, errorMessage } from '../../services/api';
import type { AiRefinement, BedAdmission, Need, Patient, RoomClass, SuggestionResult } from '../../types';
import { NEED_OPTIONS, OVERRIDE_ROLES, ROOM_CLASS_OPTIONS, defaultRoomClass, offersEmergency } from '../../utils/beds';
import { AdmitStepNeeds, type AdmitForm } from './AdmitStepNeeds';
import { AdmitStepConfirm } from './AdmitStepConfirm';
import { AdmitChoiceBar, AdmitStepBed, type AiMarker, type BedOption } from './AdmitStepBed';

interface AdmitDialogProps {
  /** Admit this patient (the patient field is then fixed). */
  patient?: Patient;
  /** A free bed picked on the board: chosen in step 2 when it passes the rules. */
  preselectBedId?: string;
  /** Move an admitted patient out of this bed instead of admitting: opens on step 2 with the admission's needs. */
  transferFrom?: { bedId: string; admission: BedAdmission };
  onClose(): void;
  /** Called after a successful admit or transfer (step 3). */
  onDone(): void;
}

/** The hold and what was chosen when it was placed: step 3 and the request use this, whatever the AI says later. */
type HeldBed = { bedId: string; expiresAt: number; bed: BedOption; reason?: string; ruleOverride: boolean };

const TAKEN = 'That bed was just taken. Choose another.';
const STEPS = ['Patient & needs', 'Choose bed', 'Confirm'];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const classLabel = (value: RoomClass) => ROOM_CLASS_OPTIONS.find((o) => o.value === value)?.label ?? value;
const needLabels = (needs: Need[]) => NEED_OPTIONS.filter((o) => needs.includes(o.need)).map((o) => o.label);

/**
 * Admit (or transfer) in three steps: the patient and needs, then a bed from the rule-based
 * suggestions (refined by the AI when it answers), then confirm.
 */
export const AdmitDialog: React.FC<AdmitDialogProps> = ({ patient, preselectBedId, transferFrom, onClose, onDone }) => {
  const { patients, user, showToast, refreshPatients } = useApp();
  const { board } = useBedBoard();
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const canOverride = OVERRIDE_ROLES.includes(user?.role ?? '');

  /** The admission being moved: its class, needs and notes fill the request. */
  const moving = transferFrom?.admission;
  const [form, setForm] = useState<AdmitForm>(() =>
    moving
      ? {
          patientId: moving.patient.id,
          doctor: moving.doctor,
          department: moving.department,
          roomClass: moving.roomClass,
          needs: [...moving.needs],
          notes: moving.notes,
          stay: String(moving.expectedStayDays)
        }
      : { patientId: patient?.id ?? '', doctor: patient?.doctor ?? '', department: patient?.department ?? '', roomClass: null, needs: [], notes: '', stay: '3' }
  );
  const [step, setStep] = useState<1 | 2 | 3>(moving ? 2 : 1);
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [refinement, setRefinement] = useState<AiRefinement | null>(null);
  const [aiWaiting, setAiWaiting] = useState(false);
  const [chosenBedId, setChosenBedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [ruleOverride, setRuleOverride] = useState(false);
  const [ignoredNeeds, setIgnoredNeeds] = useState<Need[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The latest suggest failed: its beds (or none) don't match what was asked, so Confirm waits. */
  const [suggestFailed, setSuggestFailed] = useState(false);
  /** True while the hold, admit or transfer request is on its way. */
  const [working, setWorking] = useState(false);
  /** The hold on the chosen bed, from the server (null before step 3). */
  const [hold, setHold] = useState<HeldBed | null>(null);
  const holdRef = useRef(hold);
  /** False once the dialog has closed: a hold answered after that is given back. */
  const mounted = useRef(true);
  /** Why staff were sent back to step 2 (a bed taken, or a hold that ran out). */
  const [conflict, setConflict] = useState<string | null>(null);
  /** Each suggest run gets a number; answers from an older run (or after closing) are dropped. */
  const run = useRef(0);
  /** Set once staff choose a bed themselves, so the AI's answer no longer moves the choice. */
  const picked = useRef(false);
  const chosenRef = useRef<string | null>(null);
  /** The control that opened the dialog, read during the first render: before autoFocus moves focus into the dialog. */
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  const selected = patient ?? patients.find((p) => p.id === form.patientId);
  /** Unknown until a patient is chosen: no class default for age before that. */
  const age = moving?.patient.age ?? selected?.age;
  const classFor = (needs: Need[]): RoomClass =>
    form.roomClass && (form.roomClass !== 'emergency' || offersEmergency(form.department)) ? form.roomClass : defaultRoomClass(age, needs);
  const roomClass = classFor(form.needs);

  // Focus moves into the dialog on open and back to the opener on close; answers arriving after closing are dropped.
  useEffect(() => {
    const box = boxRef.current;
    const runs = run;
    mounted.current = true;
    if (box && !box.contains(document.activeElement)) (bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? box).focus();
    return () => {
      runs.current++;
      mounted.current = false;
      const held = holdRef.current;
      if (held) void bedService.release(held.bedId).catch(() => undefined); // closing gives the bed back
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  useEffect(() => {
    chosenRef.current = chosenBedId;
  }, [chosenBedId]);

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
      if (!picked.current && result.top[0]) {
        if (result.top[0].bedId !== chosenRef.current) setReason('');
        setChosenBedId(result.top[0].bedId);
      }
    } catch {
      // An AI that fails or cannot be reached leaves the rule-based cards, with no error shown.
    } finally {
      if (id === run.current) setAiWaiting(false);
    }
  };

  const keepHold = (next: HeldBed | null) => {
    holdRef.current = next;
    setHold(next);
  };

  /** Runs the rules again; true when it answered. */
  const suggest = async (needs: Need[]): Promise<boolean> => {
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
      if (id !== run.current) return false;
      const preselected = !!preselectBedId && result.eligible.some((b) => b.bedId === preselectBedId);
      picked.current = preselected;
      setSuggestion(result);
      setRefinement(null);
      setChosenBedId(preselected ? (preselectBedId ?? null) : (result.top[0]?.bedId ?? null));
      setRuleOverride(false);
      setReason('');
      setStep(2);
      setSuggestFailed(false);
      setAiWaiting(result.ai === 'pending');
      if (result.ai === 'pending') void refine(id, result.suggestionId);
      return true;
    } catch (err) {
      if (id === run.current) {
        setError(errorMessage(err));
        setSuggestFailed(true);
        setAiWaiting(false);
      }
      return false;
    } finally {
      if (id === run.current) setBusy(false);
    }
  };

  // A transfer opens on step 2: find beds for the admission's needs straight away (a request to the API,
  // once on open; Back to step 1 and Next run it again with edited needs).
  useEffect(() => {
    if (moving) void suggest(form.needs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNeed = (need: Need) => {
    const needs = [...form.needs, need];
    change({ needs });
    bodyRef.current?.focus(); // the notice and its buttons go away
    void suggest(needs).then((ok) => {
      if (ok) return;
      // The cards and suggestion still belong to the old needs: take the added need back so they agree.
      setForm((f) => ({ ...f, needs: f.needs.filter((n) => n !== need) }));
      setSuggestFailed(false);
    });
  };
  const ignoreNeed = (need: Need) => {
    setIgnoredNeeds((list) => [...list, need]);
    bodyRef.current?.focus();
  };

  const choose = (bedId: string, override: boolean) => {
    picked.current = true;
    if (bedId !== chosenBedId) setReason(''); // a reason belongs to the bed it was written for
    setChosenBedId(bedId);
    setRuleOverride(override);
  };

  const back = () => {
    run.current++; // drops an AI answer still on its way: Next makes a new suggestion
    setBusy(false);
    setAiWaiting(false);
    setError(null);
    setConflict(null);
    setSuggestFailed(false);
    setStep(1);
  };

  /** Step 3 back to step 2: gives the bed back. */
  const backToBed = () => {
    const held = holdRef.current;
    if (held) void bedService.release(held.bedId).catch(() => undefined);
    keepHold(null);
    setError(null);
    setStep(2);
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
  const canConfirm = !!chosen && !busy && !suggestFailed && !working && (!reasonRequired || !!reason.trim());

  const goConfirm = async () => {
    if (!canConfirm || !chosen || !suggestion) return;
    picked.current = true; // from here the AI no longer moves the choice
    const snapshot = { bed: chosen, reason: reasonRequired ? reason.trim() : undefined, ruleOverride };
    setWorking(true);
    setError(null);
    try {
      const held = await bedService.hold(chosen.bedId, suggestion.suggestionId);
      if (!mounted.current) {
        void bedService.release(chosen.bedId).catch(() => undefined); // closed while the hold was on its way
        return;
      }
      keepHold({ bedId: chosen.bedId, expiresAt: new Date(held.holdExpiresAt).getTime(), ...snapshot });
      setConflict(null);
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast(err.message || TAKEN, 'error');
        void suggest(form.needs); // the beds changed: ask again, staying on step 2
      } else setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const confirm = async () => {
    const held = holdRef.current;
    if (working || !held || !suggestion) return;
    setWorking(true);
    setError(null);
    const body = {
      suggestionId: suggestion.suggestionId,
      ...(held.reason && { reason: held.reason }),
      ...(held.ruleOverride && { ruleOverride: true })
    };
    try {
      if (transferFrom) await bedService.transfer(transferFrom.bedId, { toBedId: held.bedId, ...body });
      else await bedService.admit(held.bedId, body);
      keepHold(null); // the bed is theirs now: nothing to give back
      showToast(`${name} ${transferFrom ? 'transferred' : 'admitted'} to ${held.bed.label}`, 'success');
      void refreshPatients().catch(() => undefined); // the Patients list shows them as Admitted
      onDone();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(err.message);
        keepHold(null);
        setStep(2);
        void suggest(form.needs);
      } else setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2) return void goConfirm();
    if (step === 3) return void confirm();
    if (!form.patientId) return setError('Choose a patient first.');
    void suggest(form.needs);
  };

  const name = moving?.patient.name ?? selected?.name ?? '';
  const fromBed = transferFrom && board?.beds.find((b) => b.id === transferFrom.bedId);
  const fixedPatient = moving
    ? { name, detail: `${moving.patient.uhid} · ${moving.patient.age} yrs · ${moving.patient.gender}${fromBed ? ` · now in ${fromBed.label}` : ''}` }
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
            {step === 2 && conflict && (
              <div className="admit-notice is-warn" role="alert">
                <AlertTriangle size={15} aria-hidden="true" />
                <div className="admit-notice-body">
                  <p>{conflict}</p>
                </div>
              </div>
            )}
            {step === 2 && !suggestion && busy && (
              <p className="admit-hint" role="status">
                Finding beds for {name}…
              </p>
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
            {step === 3 && hold && (
              <AdmitStepConfirm
                patientName={name}
                fromLabel={fromBed?.label}
                bed={hold.bed}
                doctor={form.doctor.trim()}
                stayDays={Number(form.stay)}
                reason={hold.reason}
                ruleOverride={hold.ruleOverride}
                holdExpiresAt={hold.expiresAt}
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
            ) : step === 2 ? (
              <>
                <button type="button" className="btn-secondary" onClick={back} disabled={working}>
                  Back
                </button>
                <button type="submit" className="btn-primary" disabled={!canConfirm}>
                  {working ? 'Holding bed…' : 'Next: Confirm'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-secondary" onClick={backToBed} disabled={working}>
                  Back
                </button>
                <button type="submit" className="btn-primary" disabled={working}>
                  {working ? (transferFrom ? 'Transferring…' : 'Admitting…') : transferFrom ? 'Transfer patient' : 'Admit patient'}
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
