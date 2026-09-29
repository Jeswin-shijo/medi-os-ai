import React, { forwardRef } from 'react';
import { createLucideIcon, Heart, TriangleAlert, type LucideProps } from 'lucide-react';

// Icons the designs use that Lucide doesn't ship. Built with createLucideIcon so
// they take the same size / color / strokeWidth props as every other icon.

const CapsulesIcon = createLucideIcon('capsules', [
  ['rect', { x: '3', y: '3', width: '8', height: '18', rx: '4', key: 'c1' }],
  ['rect', { x: '13', y: '3', width: '8', height: '18', rx: '4', key: 'c2' }],
  ['path', { d: 'M3 12h8', key: 'l1' }],
  ['path', { d: 'M13 12h8', key: 'l2' }],
]);

/** Two capsules — the "Follow-ups" navigation icon. */
export const Capsules = forwardRef<SVGSVGElement, LucideProps>((props, ref) => <CapsulesIcon ref={ref} {...props} />);
Capsules.displayName = 'Capsules';

/** Filled three-dot cluster used on "Type 2 Diabetes" badges. */
export const DiabetesDots: React.FC<{ size?: number; color?: string }> = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true">
    <circle cx="8" cy="4" r="3" />
    <circle cx="3.6" cy="11.4" r="3" />
    <circle cx="12.4" cy="11.4" r="3" />
  </svg>
);

/** Solid red tile with a heart — "Hypertension" badge icon. */
export const HypertensionIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <span
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      borderRadius: 3,
      backgroundColor: '#dc2626',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <Heart size={size - 5} color="#ffffff" fill="#ffffff" strokeWidth={2} />
  </span>
);

/** Solid warning triangle — "Allergy" badge icon. */
export const AllergyIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <TriangleAlert size={size} color="#ffffff" fill="#dc2626" strokeWidth={2.2} />
);

/** The violet four-diamond cluster that marks every AI (GPT-6 Astro) panel. */
export const AiSparkle: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 20, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className="ai-sparkle"
    style={style}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 1.8 15.2 5.6 12 9.4 8.8 5.6z" />
    <path d="M12 14.6 15.2 18.4 12 22.2 8.8 18.4z" />
    <path d="M5.6 8.8 9.4 12 5.6 15.2 1.8 12z" />
    <path d="M18.4 8.8 22.2 12 18.4 15.2 14.6 12z" />
  </svg>
);
