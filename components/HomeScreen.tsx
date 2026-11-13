'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { REACTION_BASE, TEAM_COLORS } from '@/lib/config';
import { useAuction } from './AuctionProvider';
import Countdown from './Countdown';
import Header from './Header';
import Stage from './Stage';

const API = '/api/reactions';
const POLL_MS = 3000;
/** Quick taps are gathered for this long and sent as one request. */
const SEND_MS = 400;

type Burst = { id: number; team: number; x: number };

/** Shared fire-reaction counts: polled from the server, taps shown instantly and sent in batches. */
function useReactions(n: number) {
  const [server, setServer] = useState<number[]>(() => Array.from({ length: n }, (_, i) => REACTION_BASE[i] ?? 0));
  const [pending, setPending] = useState<number[]>(() => Array(n).fill(0));
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(API, { cache: 'no-store' });
      if (r.ok) setServer((await r.json()).counts);
    } catch {}
  }, []);

  const send = useCallback(async () => {
    timer.current = null;
    const batch = pendingRef.current;
    setPending(Array(n).fill(0));
    for (const [team, k] of batch.entries()) {
      if (!k) continue;
      try {
        const r = await fetch(API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ team, n: k }),
        });
        if (r.ok) setServer((await r.json()).counts);
      } catch {}
    }
  }, [n]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const fire = (team: number) => {
    setPending((p) => p.map((v, i) => (i === team ? v + 1 : v)));
    if (!timer.current) timer.current = setTimeout(send, SEND_MS);
  };

  return { counts: server.map((v, i) => v + (pending[i] ?? 0)), fire };
}

export default function HomeScreen() {
  const { teams } = useAuction();
  const { counts, fire } = useReactions(teams.length);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);

  const tap = (team: number) => {
    fire(team);
    const b = { id: nextId.current++, team, x: Math.round(Math.random() * 80 - 40) };
    setBursts((list) => [...list, b]);
    setTimeout(() => setBursts((list) => list.filter((x) => x.id !== b.id)), 1200);
  };

  return (
    <Stage>
      <Header />
      <div className="hm">
        <Countdown big title="Countdown to kick-off" />
        <div className="hm-teams" style={{ gridTemplateColumns: `repeat(${teams.length},minmax(0,1fr))` }}>
          {teams.map((t, i) => (
            <div key={i} className="card hm-team" style={{ borderTopColor: TEAM_COLORS[i] }}>
              <span className="label">Team {i + 1}</span>
              <span className="hm-name cond" style={{ color: TEAM_COLORS[i] }}>
                {t}
              </span>
              <button
                type="button"
                className="hm-fire"
                onClick={() => tap(i)}
                aria-label={`Send a fire reaction to ${t}`}
              >
                <span className="hm-emoji" aria-hidden>
                  🔥
                </span>
                <span className="hm-count cond">{counts[i] ?? 0}</span>
                {bursts
                  .filter((b) => b.team === i)
                  .map((b) => (
                    <span
                      key={b.id}
                      className="hm-burst"
                      style={{ '--x': `${b.x}px` } as React.CSSProperties}
                      aria-hidden
                    >
                      🔥
                    </span>
                  ))}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}
