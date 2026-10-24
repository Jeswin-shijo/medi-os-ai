import { useEffect, useRef } from 'react';

// USB NFC card readers act as keyboards: on a tap they type the card's serial number
// in a burst, a few milliseconds per character, and usually press Enter. People type
// far slower, so a burst is told apart by its speed.

/** Longest gap between two keystrokes from a reader. */
const MAX_GAP_MS = 50;
const MIN_LENGTH = 4;
/** For readers set up to send no Enter: the burst ends after this much quiet. */
const END_AFTER_MS = 150;

/** The serial number in one form: readers differ in separators and letter case. */
export const normalizeCardId = (raw: string) => raw.toUpperCase().replace(/[^0-9A-Z]/g, '');

/**
 * Calls `onCard` with the card number whenever a card is tapped on a USB reader.
 * Taps are ignored while a text field has focus, where the reader's keystrokes
 * belong to the field.
 */
export function useCardReader(onCard: (cardId: string) => void, enabled = true) {
  const handler = useRef(onCard);
  useEffect(() => {
    handler.current = onCard;
  });

  useEffect(() => {
    if (!enabled) return;
    let buffer = '';
    let last = 0;
    let timer: number | undefined;

    const finish = () => {
      window.clearTimeout(timer);
      const cardId = normalizeCardId(buffer);
      buffer = '';
      if (cardId.length >= MIN_LENGTH) handler.current(cardId);
      return cardId.length >= MIN_LENGTH;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      const now = performance.now();
      if (e.key === 'Enter') {
        if (buffer && now - last <= MAX_GAP_MS && finish()) e.preventDefault();
        buffer = '';
        return;
      }
      if (e.key.length !== 1) return;
      // Too slow for a reader: someone typing. Start over from this key.
      if (buffer && now - last > MAX_GAP_MS) buffer = '';
      buffer += e.key;
      last = now;
      window.clearTimeout(timer);
      timer = window.setTimeout(finish, END_AFTER_MS);
    };

    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.clearTimeout(timer);
    };
  }, [enabled]);
}
