import React, { useState } from 'react';

interface RollingTextProps {
  value: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A live value (token number, queue count) that rolls up through a slot when it changes: the old value
 * leaves upward and the new one rises in. The first render shows the value without animating.
 */
export const RollingText: React.FC<RollingTextProps> = ({ value, className, style }) => {
  const [roll, setRoll] = useState<{ current: string | number; previous: string | number | null; step: number }>({
    current: value,
    previous: null,
    step: 0
  });
  if (roll.current !== value) setRoll({ current: value, previous: roll.current, step: roll.step + 1 });

  return (
    <span className={`roll${className ? ` ${className}` : ''}`} style={style}>
      {roll.previous !== null && (
        <span
          key={`out-${roll.step}`}
          className="roll-out"
          aria-hidden="true"
          onAnimationEnd={() => setRoll((r) => (r.step === roll.step ? { ...r, previous: null } : r))}
        >
          {roll.previous}
        </span>
      )}
      <span key={`in-${roll.step}`} className={roll.step ? 'roll-in' : undefined}>
        {roll.current}
      </span>
    </span>
  );
};
