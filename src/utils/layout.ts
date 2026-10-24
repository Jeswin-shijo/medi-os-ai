import type React from 'react';

/**
 * Inline style for a `.ws-3` workspace (index.css): the rail and side-pane widths, plus the wide layout's
 * columns when they are proportional rather than `rail | 1fr | side`.
 */
export const ws3 = (rail: string, side: string, wideColumns?: string): React.CSSProperties =>
  ({ '--ws-l': rail, '--ws-r': side, ...(wideColumns && { '--ws-cols': wideColumns }) }) as React.CSSProperties;

/** Inline style for a `.split` layout (index.css): the side panel's width beside the main pane. */
export const split = (side: string): React.CSSProperties => ({ '--split-side': side }) as React.CSSProperties;

/** Inline style for a `.table-scroll` wrapper: the width below which the table scrolls sideways. */
export const tableMin = (width: number): React.CSSProperties => ({ '--table-min': `${width}px` }) as React.CSSProperties;

/** Inline style for `.cols-3` / `.cols-4` (index.css) whose wide layout uses uneven columns. */
export const cols = (wideColumns: string): React.CSSProperties => ({ '--cols': wideColumns }) as React.CSSProperties;
