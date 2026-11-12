'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Stage from './Stage';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (r.ok) {
        setPassword('');
        router.refresh(); // server re-renders /admin with the panel
        return;
      }
      setError((await r.json().catch(() => null))?.error ?? 'Login failed');
    } catch {
      setError('Could not reach the server');
    }
    setBusy(false);
  };

  return (
    <Stage>
      <Header />
      <div className="card lg-wrap">
        <form className="lg-form" onSubmit={submit}>
          <div className="draw-title cond">Admin login</div>
          <div className="draw-sub">Sign in to draw fixtures, enter results and rename teams.</div>
          <label className="lg-field">
            <span className="label">Email</span>
            <input
              className="ad-input lg-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="lg-field">
            <span className="label">Password</span>
            <input
              className="ad-input lg-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="lg-error">{error}</div>}
          <button type="submit" className="sold-btn" disabled={busy || !email || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </Stage>
  );
}
