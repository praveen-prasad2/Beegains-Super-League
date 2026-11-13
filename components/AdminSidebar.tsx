'use client';

import { useState } from 'react';
import Countdown from './Countdown';

/** Screens the admin panel can show on its right side, embedded live. */
export const SCREENS = [
  { id: 'home', href: '/', label: 'Home', group: 'Screens' },
  { id: 'teams', href: '/teams?view=admin', label: 'Teams', group: 'Screens' },
  { id: 'fixtures', href: '/fixtures', label: 'Fixtures', group: 'Screens' },
  { id: 'points', href: '/points', label: 'Points', group: 'Screens' },
  { id: 'stats', href: '/stats', label: 'Stats', group: 'Screens' },
  { id: 'draw', href: '/draw', label: 'Icon draw', group: 'Auction' },
  { id: 'live', href: '/live', label: 'Live bid', group: 'Auction' },
] as const;

/** 'results' is the admin's own result-entry view; the rest are embedded screens. */
export type AdminView = 'results' | (typeof SCREENS)[number]['id'];

const GROUPS = ['Screens', 'Auction'] as const;

/** Admin panel's left sidebar: picks what the right side shows, then the countdown. */
export default function AdminSidebar({ view, onView }: { view: AdminView; onView: (v: AdminView) => void }) {
  const [msg, setMsg] = useState('');

  const resetReactions = async () => {
    if (!confirm('Reset the fire reactions of every team to 0?')) return;
    const r = await fetch('/api/reactions', { method: 'DELETE' }).catch(() => null);
    setMsg(r?.ok ? 'Reactions reset' : 'Reset failed');
    setTimeout(() => setMsg(''), 3000);
  };
  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    location.reload(); // /admin re-renders as the login screen
  };

  const item = (id: AdminView, label: string) => (
    <button
      key={id}
      type="button"
      className={`sb-link cond${view === id ? ' on' : ''}`}
      aria-current={view === id ? 'page' : undefined}
      onClick={() => onView(id)}
    >
      {label}
    </button>
  );

  return (
    <aside className="sb">
      <nav className="card sb-nav" aria-label="Admin views">
        <span className="label">Manage</span>
        {item('results', 'Results')}
        {GROUPS.map((g) => (
          <div key={g} className="sb-sec">
            <span className="label sb-group">{g}</span>
            {SCREENS.filter((x) => x.group === g).map((x) => item(x.id, x.label))}
          </div>
        ))}
        <div className="sb-sec">
          <span className="label sb-group">Admin</span>
          <button type="button" className="sb-link cond" onClick={resetReactions}>
            Reset reactions
          </button>
          <button type="button" className="sb-link sb-out cond" onClick={logout}>
            Log out
          </button>
          {msg && <span className={`ad-msg${msg === 'Reactions reset' ? ' ok' : ''}`}>{msg}</span>}
        </div>
      </nav>
      <Countdown />
    </aside>
  );
}
