import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'wheel'] as const;

/** "30 minutes" / "1 hour" (the Settings options) → minutes; null if unrecognised. */
export const parseSessionTimeout = (label: string | undefined): number | null => {
  const m = /(\d+)\s*(minute|hour)/i.exec(label ?? '');
  if (!m) return null;
  return Number(m[1]) * (m[2].toLowerCase() === 'hour' ? 60 : 1);
};

/**
 * Calls `onIdle` once nobody has used the page for `minutes` (keyboard, pointer or
 * scrolling anywhere in it). Unattended workstations should not stay signed in.
 */
export function useIdleSignOut(minutes: number | null, onIdle: () => void) {
  const latest = useRef(onIdle);
  useEffect(() => {
    latest.current = onIdle;
  });

  useEffect(() => {
    if (!minutes) return;
    let lastActivity = Date.now();
    const bump = () => {
      lastActivity = Date.now();
    };
    // Capture phase, so scrolling inside panels counts too.
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { capture: true, passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity > minutes * 60_000) latest.current();
    }, 15_000);
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump, { capture: true }));
      window.clearInterval(timer);
    };
  }, [minutes]);
}
