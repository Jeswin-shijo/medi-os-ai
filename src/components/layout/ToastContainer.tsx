import React from 'react';
import { useApp } from '../../context/appContextCore';
import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react';

const TOAST_TONES: Record<'success' | 'error' | 'info' | 'warning', { icon: LucideIcon; fg: string; bg: string; accent: string }> = {
  success: { icon: CircleCheck, fg: 'var(--green-dark)', bg: 'var(--green-light)', accent: 'var(--green-emerald)' },
  error: { icon: CircleX, fg: 'var(--red-dark)', bg: 'var(--red-light)', accent: 'var(--red-rose)' },
  warning: { icon: TriangleAlert, fg: 'var(--orange-dark)', bg: 'var(--orange-light)', accent: 'var(--orange-amber)' },
  info: { icon: Info, fg: 'var(--blue-text)', bg: 'var(--blue-light)', accent: 'var(--blue-primary)' }
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const tone = TOAST_TONES[toast.type] ?? TOAST_TONES.success;
        const Icon = tone.icon;

        return (
          <div
            key={toast.id}
            className="toast-item"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${tone.accent}`,
              padding: '10px 16px 10px 12px',
              minWidth: '300px',
              maxWidth: '460px',
              gap: '10px'
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: tone.bg,
                color: tone.fg,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon size={16} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 'var(--fs-body)', fontWeight: 500, lineHeight: 1.4 }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
