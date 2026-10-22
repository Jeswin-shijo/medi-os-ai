import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { authService, UserSession } from '../../services';
import { errorMessage } from '../../services/api';
import { useLoader } from '../../hooks/useLoader';

/** "Chrome on macOS" from a user-agent string. */
const describeDevice = (ua: string) => {
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : '';
  return ua ? `${browser}${os ? ` on ${os}` : ''}` : 'Unknown device';
};

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** The signed-in user's devices, with per-device and all-device sign-out. */
export const ActiveSessions: React.FC = () => {
  const { showToast, signOut } = useApp();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const { loading, reload } = useLoader(() => authService.getSessions(), setSessions, []);

  const revoke = async (s: UserSession) => {
    try {
      await authService.revokeSession(s.id);
      if (s.current) {
        signOut();
        return;
      }
      showToast(`Signed out ${describeDevice(s.userAgent)}`);
      reload();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  const revokeAll = async () => {
    try {
      await authService.logoutAll();
      signOut();
      showToast('Signed out on every device', 'info');
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontSize: 'var(--fs-h4)', fontWeight: 700, color: 'var(--text-primary)' }}>Active Sessions</h3>
        <button className="btn-danger-soft btn-sm" onClick={revokeAll} disabled={!sessions.length}>
          Sign out all devices
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Last active</th>
            <th>Device / Browser</th>
            <th>IP Address</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.id}>
              <td style={{ fontWeight: 500 }}>{when(s.lastActiveAt)}</td>
              <td style={{ color: 'var(--text-secondary)' }} title={s.userAgent}>{describeDevice(s.userAgent)}</td>
              <td style={{ color: 'var(--text-muted)' }}>{s.ip || '—'}</td>
              <td>
                <span className={`badge-pill ${s.current ? 'badge-blue' : 'badge-green'}`}>{s.current ? 'This device' : 'Active'}</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <button className="text-link" onClick={() => revoke(s)}>
                  Sign out
                </button>
              </td>
            </tr>
          ))}
          {!sessions.length && (
            <tr>
              <td colSpan={5} style={{ color: 'var(--text-muted)' }}>
                {loading ? 'Loading sessions…' : 'No active sessions.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
