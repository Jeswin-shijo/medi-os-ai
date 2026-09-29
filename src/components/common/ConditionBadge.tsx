import React from 'react';
import { DiabetesDots, HypertensionIcon } from './icons';
import { CONDITION_TONES, conditionStyle } from './conditionStyles';

/** Patient condition badge (banner / patient panels): Hypertension and Diabetes use the design's filled icons. */
export const ConditionBadge: React.FC<{ condition: string }> = ({ condition }) => {
  const c = condition.toLowerCase();
  if (c.includes('diabet')) {
    return (
      <span className="badge-tag diabetes">
        <DiabetesDots />
        <span>{condition}</span>
      </span>
    );
  }
  if (c.includes('hypertension')) {
    return (
      <span className="badge-tag hypertension">
        <HypertensionIcon />
        <span>{condition}</span>
      </span>
    );
  }
  const { tone, icon: Icon } = conditionStyle(condition);
  return (
    <span className="badge-tag" style={{ background: CONDITION_TONES[tone].bg, color: CONDITION_TONES[tone].fg }}>
      <Icon size={13} strokeWidth={2.2} />
      <span>{condition}</span>
    </span>
  );
};
