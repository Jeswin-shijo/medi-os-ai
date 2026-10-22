import React from 'react';

/**
 * Marks AI panels that still show canned demo text. No AI model is connected yet,
 * so their content is not derived from the open patient's record.
 */
export const SampleBadge: React.FC = () => (
  <span
    className="status-pill purple"
    title="Canned demo content — not generated from this patient's record. AI is not connected yet."
    style={{ height: 18, padding: '0 6px', fontSize: 9.5, fontWeight: 600 }}
  >
    SAMPLE
  </span>
);
