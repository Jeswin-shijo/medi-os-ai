import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * One tooltip for the whole app. It reads what is already in the markup, so most controls need nothing extra:
 * - `data-tip`: an explicit tooltip (skipped while the same words are visible on the control);
 * - `title`: shown styled instead of the slow native tooltip;
 * - an icon-only control's `aria-label` (a count badge beside the icon is allowed);
 * - text cut short by an ellipsis or a line clamp, shown in full.
 * Mouse hover and keyboard focus show it; touch does not. Escape, scrolling or a press hides it.
 */

const SHOW_DELAY = 450;
/** Moving straight on to the next control shows its tooltip at once. */
const WARM_WINDOW = 500;
const GAP = 8;

interface Tip {
  text: string;
  anchor: HTMLElement;
}

const CONTROL = 'button, a[href], [role="button"], [role="tab"], select, summary';

const visibleText = (el: HTMLElement) => el.innerText.replace(/\s+/g, ' ').trim();

/** Ellipsis or line-clamped text near the pointer whose full text is hidden. */
const truncatedText = (start: Element): string | null => {
  let el: Element | null = start;
  for (let depth = 0; el instanceof HTMLElement && depth < 3; el = el.parentElement, depth++) {
    const st = getComputedStyle(el);
    const clippedX = st.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1;
    const clamp = st.getPropertyValue('-webkit-line-clamp');
    const clippedY = clamp !== '' && clamp !== 'none' && el.scrollHeight > el.clientHeight + 1;
    if (clippedX || clippedY) return visibleText(el) || null;
  }
  return null;
};

const findTip = (target: Element, viaFocus: boolean): Tip | null => {
  const explicit = target.closest<HTMLElement>('[data-tip]');
  if (explicit) {
    const text = explicit.dataset.tip ?? '';
    if (text && !visibleText(explicit).includes(text)) return { text, anchor: explicit };
  }
  const titled = target.closest<HTMLElement>('[title], [data-tip-title]');
  if (titled) {
    const text = titled.dataset.tipTitle ?? titled.getAttribute('title') ?? '';
    if (text && visibleText(titled) !== text) {
      // Hide the native tooltip while ours shows; it comes back when ours hides. Focus leaves it alone.
      if (!viaFocus && titled.hasAttribute('title')) {
        titled.dataset.tipTitle = text;
        titled.removeAttribute('title');
      }
      return { text, anchor: titled };
    }
  }
  // Icon-only controls; a count badge alone (the bell's "6") still counts as icon-only.
  const control = target.closest<HTMLElement>(CONTROL);
  const label = control?.getAttribute('aria-label');
  if (control && label && !/\p{L}/u.test(visibleText(control))) return { text: label, anchor: control };
  if (!viaFocus) {
    const full = truncatedText(target);
    if (full) return { text: full, anchor: target as HTMLElement };
  }
  return null;
};

const restoreTitle = (el: HTMLElement) => {
  const saved = el.dataset.tipTitle;
  if (saved === undefined) return;
  delete el.dataset.tipTitle;
  if (!el.hasAttribute('title')) el.setAttribute('title', saved);
};

export const TooltipLayer: React.FC = () => {
  const [tip, setTip] = useState<Tip | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const lastHidden = useRef(0);
  const current = useRef<Tip | null>(null);

  useEffect(() => {
    const hide = () => {
      window.clearTimeout(timer.current);
      if (current.current) {
        restoreTitle(current.current.anchor);
        lastHidden.current = Date.now();
      }
      current.current = null;
      setTip(null);
    };

    const show = (next: Tip, immediate: boolean) => {
      window.clearTimeout(timer.current);
      if (current.current && current.current.anchor !== next.anchor) restoreTitle(current.current.anchor);
      current.current = next;
      const warm = Date.now() - lastHidden.current < WARM_WINDOW;
      if (immediate || warm) setTip(next);
      else timer.current = window.setTimeout(() => current.current === next && setTip(next), SHOW_DELAY);
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !(e.target instanceof Element)) return;
      if (current.current?.anchor.contains(e.target)) return;
      const next = findTip(e.target, false);
      if (next) show(next, false);
      else if (current.current) hide();
    };
    const onOut = (e: PointerEvent) => {
      const anchor = current.current?.anchor;
      if (anchor && !(e.relatedTarget instanceof Node && anchor.contains(e.relatedTarget))) hide();
    };
    const onFocus = (e: FocusEvent) => {
      if (!(e.target instanceof HTMLElement) || !e.target.matches(':focus-visible')) return;
      const next = findTip(e.target, true);
      if (next) show(next, true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && current.current) hide();
    };

    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', hide, true);
    window.addEventListener('blur', hide);
    return () => {
      hide();
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', hide, true);
      window.removeEventListener('blur', hide);
    };
  }, []);

  useLayoutEffect(() => {
    if (!tip || !boxRef.current) {
      setPos(null);
      return;
    }
    const r = tip.anchor.getBoundingClientRect();
    const box = boxRef.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const below = r.top - box.height - GAP < 4;
    const top = below ? r.bottom + GAP : r.top - box.height - GAP;
    const left = Math.min(Math.max(r.left + r.width / 2 - box.width / 2, 8), vw - box.width - 8);
    setPos({ top, left, below });
  }, [tip]);

  if (!tip) return null;
  return (
    <div
      ref={boxRef}
      className={`app-tooltip${pos ? ' is-placed' : ''}${pos?.below ? ' is-below' : ''}`}
      role="tooltip"
      style={pos ? { top: pos.top, left: pos.left } : undefined}
    >
      {tip.text}
    </div>
  );
};
