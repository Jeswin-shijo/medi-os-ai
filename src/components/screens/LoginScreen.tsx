import React, { useState } from 'react';
import { Lock, Mail, LogIn } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { errorMessage } from '../../services/api';

// Seeded by `npm run seed` in the backend; offered only in development builds.
const DEMO_LOGIN = { email: 'doctor@medios.ai', password: 'Admin@123' };

export const LoginScreen: React.FC = () => {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit} noValidate>
        <div className="login-brand">
          <img src="/logo.svg" alt="" width={44} height={44} />
          <div>
            <h1>
              MediOS <span className="brand-ai">AI</span>
            </h1>
            <p>Clinical workstation</p>
          </div>
        </div>

        <h2 className="login-title">Sign in</h2>
        <p className="login-subtitle">Use your hospital staff account.</p>

        <label className="form-label" htmlFor="login-email">Email</label>
        <div className="login-input">
          <Mail size={16} aria-hidden />
          <input
            id="login-email"
            className="input-field"
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <label className="form-label" htmlFor="login-password">Password</label>
        <div className="login-input">
          <Lock size={16} aria-hidden />
          <input
            id="login-password"
            className="input-field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary btn-lg login-submit" disabled={submitting || !email || !password}>
          <LogIn size={16} />
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        {import.meta.env.DEV && (
          <button
            type="button"
            className="login-demo"
            onClick={() => {
              setEmail(DEMO_LOGIN.email);
              setPassword(DEMO_LOGIN.password);
            }}
          >
            Use demo account ({DEMO_LOGIN.email})
          </button>
        )}
      </form>
    </div>
  );
};
