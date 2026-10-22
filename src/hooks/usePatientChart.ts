import { useCallback, useState } from 'react';
import { ImagingStudy, LabParameter, LabTestReport, Medication, SoapNote, TimelineEvent } from '../types';
import { consultationService, imagingService, labService, medicationService, timelineService } from '../services';
import { useLoader } from './useLoader';

/** A patient's records as shown in the summary panels beside each workspace. */
export interface PatientChart {
  uhid: string;
  medications: Medication[];
  labs: LabTestReport[];
  studies: ImagingStudy[];
  events: TimelineEvent[];
  visits: SoapNote[];
}

/**
 * Loads the chart for `uhid`. `chart` is null while it loads, including while the
 * previous patient's chart is still in memory, so a panel never shows one
 * patient's records under another patient's name. `patchChart` applies a local
 * update after a successful save.
 */
export function usePatientChart(uhid: string | undefined) {
  const [chart, setChart] = useState<PatientChart | null>(null);
  useLoader(
    async () => {
      if (!uhid) return null;
      const [medications, labs, studies, events, visits] = await Promise.all([
        medicationService.getMedications(uhid),
        labService.getReports(uhid),
        imagingService.getStudies(uhid),
        timelineService.getEvents(uhid),
        consultationService.getVisits(uhid)
      ]);
      return { uhid, medications, labs, studies, events, visits };
    },
    setChart,
    [uhid]
  );
  const patchChart = useCallback((update: (chart: PatientChart) => PatientChart) => {
    setChart((current) => (current ? update(current) : current));
  }, []);
  return { chart: chart && chart.uhid === uhid ? chart : null, patchChart };
}

export type LabHighlight = LabParameter & { date: string };

/** Latest result per lab parameter (reports arrive newest first), out-of-range ones first. */
export const labHighlightsOf = (labs: LabTestReport[], limit = 4): LabHighlight[] => {
  const latest = new Map<string, LabHighlight>();
  for (const report of labs) {
    for (const group of report.groups) {
      for (const p of group.parameters) {
        if (!latest.has(p.name)) latest.set(p.name, { ...p, date: report.date });
      }
    }
  }
  return [...latest.values()].sort((a, b) => Number(a.status === 'Normal') - Number(b.status === 'Normal')).slice(0, limit);
};
