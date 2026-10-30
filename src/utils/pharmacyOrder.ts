import type { PharmacyFlag, PharmacyLineInput } from '../types';

/** One medicine line as the order and answer forms hold it (text fields, before they are checked). */
export interface Row {
  key: number;
  medicine: string;
  product: string;
  dose: string;
  route: string;
  frequency: string;
  days: string;
  note: string;
  /** The doctor knows about a red allergy on this line and says why. */
  known: boolean;
  reason: string;
}

/** The line as the API takes it, or null while a field is not yet valid (no check is sent then). */
export function toInput(r: Row, hasDuration: boolean): PharmacyLineInput | null {
  const dose = Number(r.dose);
  if (!r.dose.trim() || !Number.isFinite(dose) || dose <= 0 || dose > 100000) return null;
  const line: PharmacyLineInput = { medicine: r.medicine, product: r.product, dose, route: r.route, frequency: r.frequency };
  if (hasDuration) {
    const days = Number(r.days);
    if (!Number.isInteger(days) || days < 1 || days > 90) return null;
    line.durationDays = days;
  }
  if (r.note.trim()) line.note = r.note.trim();
  return line;
}

export const redAllergy = (flags: PharmacyFlag[] | undefined) => (flags ?? []).some((f) => f.severity === 'red' && f.kind === 'allergy');
