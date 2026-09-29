import React from 'react';

interface StudyThumbProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Small radiology study thumbnail used by the "Recent Imaging" cards. */
export const StudyThumb: React.FC<StudyThumbProps> = ({ src, alt, width = 58, height = 56 }) => (
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    style={{ width, height, borderRadius: 'var(--radius-xs)', objectFit: 'cover', background: '#0b0f1a', flexShrink: 0 }}
  />
);
