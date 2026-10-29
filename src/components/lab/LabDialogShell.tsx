import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface LabDialogShellProps {
  title: string;
  icon?: React.ReactNode;
  /** True while a request runs: Escape, the backdrop and Close do nothing then. */
  busy: boolean;
  onClose(): void;
  children: React.ReactNode;
}

/** A modal for the Lab tabs: focus trap, Escape, no close while busy, and focus back to the button that opened it. */
export const LabDialogShell: React.FC<LabDialogShellProps> = ({ title, icon, busy, onClose, children }) => {
  const uid = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  const closeGuard = useRef<() => void>(onClose);
  useEffect(() => {
    closeGuard.current = () => {
      if (!busy) onClose();
    };
  });

  useEffect(() => {
    const box = boxRef.current;
    if (box && !box.contains(document.activeElement)) box.querySelector<HTMLElement>('input, textarea, button.btn-primary')?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const box = boxRef.current;
      if (!box || e.defaultPrevented) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeGuard.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (!box.contains(at) || (e.shiftKey ? at === first || at === box : at === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const titleId = `${uid}-title`;
  return createPortal(
    <div className="modal-overlay" onClick={() => closeGuard.current()}>
      <div ref={boxRef} className="modal-content-box admit-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id={titleId} className="admit-title">
            {icon}
            {title}
          </h3>
          <button type="button" onClick={() => closeGuard.current()} disabled={busy} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};
