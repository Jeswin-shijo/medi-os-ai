import React, { useLayoutEffect, useRef } from 'react';

/** Textarea that grows with its content, so note text is never clipped. */
export const AutoTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label: string;
  style?: React.CSSProperties;
}> = ({ value, onChange, label, style }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const resize = () => {
      const el = ref.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    document.fonts?.ready.then(resize);
    return () => window.removeEventListener('resize', resize);
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        display: 'block',
        width: '100%',
        border: 'none',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        background: 'transparent',
        padding: 0,
        fontSize: 11,
        lineHeight: '14px',
        color: 'var(--text-primary)',
        ...style
      }}
    />
  );
};
