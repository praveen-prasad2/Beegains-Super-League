'use client';

import { useEffect, useState } from 'react';
import { COUNTDOWN_AT, COUNTDOWN_LABEL } from '@/lib/config';

const pad = (n: number) => String(n).padStart(2, '0');

/** Live countdown to COUNTDOWN_AT. `big` is the Home-screen size; the default fits the admin sidebar. */
export default function Countdown({ big = false, title = 'Countdown' }: { big?: boolean; title?: string }) {
  // Start empty so server and client render the same markup; tick once mounted.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = now === null ? null : Math.max(0, COUNTDOWN_AT - now);
  const s = left === null ? 0 : Math.floor(left / 1000);
  const units = [
    { v: Math.floor(s / 86400), l: 'Days' },
    { v: Math.floor(s / 3600) % 24, l: 'Hrs' },
    { v: Math.floor(s / 60) % 60, l: 'Min' },
    { v: s % 60, l: 'Sec' },
  ];

  return (
    <div className={`card sb-count${big ? ' big' : ''}`}>
      <span className="label">{title}</span>
      {left === 0 ? (
        <div className="sb-live cond">It&apos;s time!</div>
      ) : (
        <div className="sb-units">
          {units.map((u) => (
            <div key={u.l} className="sb-unit">
              <span className="sb-num cond">{left === null ? '--' : pad(u.v)}</span>
              <span className="sb-ul">{u.l}</span>
            </div>
          ))}
        </div>
      )}
      <span className="sb-when">{COUNTDOWN_LABEL}</span>
    </div>
  );
}
