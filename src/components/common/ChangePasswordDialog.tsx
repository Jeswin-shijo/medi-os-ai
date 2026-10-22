import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { authService } from '../../services';
import { errorMessage } from '../../services/api';

/** Mirrors the API's policy so problems show before submitting. */
const policyProblem = (password: string): string | null => {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 72) return 'Use at most 72 characters.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return 'Use both upper and lower case letters.';
  if (!/\d/.test(password)) return 'Include a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Include a symbol.';
  return null;
};

export const ChangePasswordDialog: React.FC<{ onClose: () => void; onChanged: () => void }> = ({ onClose, onChanged }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = policyProblem(next) ?? (next !== confirm ? 'The new passwords do not match.' : null);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await authService.changePassword(current, next);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} type="password" className="input-field" autoComplete={autoComplete} value={value} onChange={e => set(e.target.value)} required />
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={18} color="var(--blue-text)" />
            <span>Change password</span>
          </h3>
          <button className="icon-btn" title="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="modal-body">
            {field('pw-current', 'Current password', current, setCurrent, 'current-password')}
            {field('pw-new', 'New password', next, setNext, 'new-password')}
            {field('pw-confirm', 'Confirm new password', confirm, setConfirm, 'new-password')}
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              At least 8 characters with upper and lower case letters, a number and a symbol. Your other signed-in devices will be signed out.
            </p>
            {error && (
              <p className="login-error" role="alert" style={{ margin: 0 }}>
                {error}
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !current || !next || !confirm}>
              {saving ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
