import {
  SquareUserRound,
  ChartNoAxesGantt,
  FileText,
  FlaskConical,
  ImagePlay,
  Pill,
  FileSignature,
  Files,
  Activity,
  ReceiptIndianRupee,
  CalendarClock,
  type LucideIcon
} from 'lucide-react';
import { ScreenId } from '../../types';

export interface BannerTab {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Tabs that point at another module navigate there; the rest call onTabChange. */
  screen?: ScreenId;
}

/** Cross-module clinical tabs (Consultation design). Screens pass their own set when the design differs. */
export const CLINICAL_TABS: BannerTab[] = [
  { id: 'consultation', label: 'Consultation', icon: SquareUserRound, screen: 'consultation' },
  { id: 'timeline', label: 'Timeline', icon: ChartNoAxesGantt, screen: 'timeline' },
  { id: 'emr', label: 'Clinical Notes', icon: FileText, screen: 'emr' },
  { id: 'lab-reports', label: 'Lab Reports', icon: FlaskConical, screen: 'lab-reports' },
  { id: 'imaging', label: 'Imaging', icon: ImagePlay, screen: 'imaging' },
  { id: 'medications', label: 'Medications', icon: Pill, screen: 'medications' },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileSignature, screen: 'prescriptions' },
  { id: 'documents', label: 'Documents', icon: Files, screen: 'documents' },
  { id: 'vitals', label: 'Vitals', icon: Activity, screen: 'vitals' },
  { id: 'billing', label: 'Billing', icon: ReceiptIndianRupee, screen: 'billing' },
  { id: 'follow-ups', label: 'Follow-ups', icon: CalendarClock, screen: 'follow-ups' }
];
