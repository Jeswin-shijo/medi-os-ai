import {
  Activity,
  Baby,
  Bandage,
  Bean,
  Brain,
  Droplets,
  HeartPulse,
  Thermometer,
  TriangleAlert,
  Wind,
  type LucideIcon
} from 'lucide-react';

export type ConditionTone = 'red' | 'orange' | 'blue' | 'purple' | 'green' | 'amber' | 'pink' | 'gray';

export const CONDITION_TONES: Record<ConditionTone, { bg: string; fg: string }> = {
  red: { bg: 'var(--red-light)', fg: 'var(--red-dark)' },
  orange: { bg: 'var(--orange-light)', fg: 'var(--orange-dark)' },
  blue: { bg: 'var(--blue-light)', fg: 'var(--blue-text)' },
  purple: { bg: 'var(--purple-light)', fg: 'var(--purple-dark)' },
  green: { bg: 'var(--green-light)', fg: 'var(--green-dark)' },
  amber: { bg: '#fdf3cf', fg: '#8a6100' },
  pink: { bg: '#fde6f3', fg: '#b0186f' },
  gray: { bg: 'var(--gray-pill-bg)', fg: 'var(--gray-pill-text)' }
};

/** Tone + icon per clinical condition, as used by the condition chips in the designs. */
export const conditionStyle = (condition: string): { tone: ConditionTone; icon: LucideIcon } => {
  const c = condition.toLowerCase();
  if (c.includes('hypertension')) return { tone: 'red', icon: HeartPulse };
  if (c.includes('type 2 diabetes')) return { tone: 'red', icon: Droplets };
  if (c.includes('diabet')) return { tone: 'green', icon: Droplets };
  if (c.includes('thyroid')) return { tone: 'orange', icon: Activity };
  if (c.includes('asthma')) return { tone: 'blue', icon: Wind };
  if (c.includes('allerg')) return { tone: 'red', icon: TriangleAlert };
  if (c.includes('pregnan')) return { tone: 'red', icon: Baby };
  if (c.includes('surgery')) return { tone: 'purple', icon: Bandage };
  if (c.includes('chest')) return { tone: 'red', icon: HeartPulse };
  if (c.includes('migraine')) return { tone: 'amber', icon: Brain };
  if (c.includes('kidney')) return { tone: 'purple', icon: Bean };
  if (c.includes('fever')) return { tone: 'pink', icon: Thermometer };
  return { tone: 'gray', icon: Activity };
};
