import { Medication, Patient } from '../types';

/**
 * Plain-language summary of what the record holds, used where the UI offers an
 * AI answer. No AI model is connected yet, so answers state facts from the record
 * and say so.
 */
export function recordSummary(patient: Patient | null, activeMeds?: Medication[]): string {
  if (!patient) return 'Select a patient to see a summary of their record.';
  const v = patient.vitals;
  const facts = [
    patient.conditions.length ? `Known conditions: ${patient.conditions.join(', ')}.` : 'No chronic conditions recorded.',
    patient.allergies.length ? `Allergies: ${patient.allergies.join(', ')}.` : 'No allergies recorded.',
    v ? `Last vitals (${v.recordedAt}): BP ${v.bpSystolic}/${v.bpDiastolic} mmHg, HR ${v.heartRate} bpm.` : 'No vitals recorded.',
    activeMeds && (activeMeds.length ? `Active medications: ${activeMeds.map((m) => m.medicine).join(', ')}.` : 'No active medications recorded.')
  ].filter(Boolean);
  return `${patient.name}: ${facts.join(' ')} (AI reasoning is not connected yet; this is a summary of the record.)`;
}
