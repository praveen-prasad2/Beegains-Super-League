'use client';

import { useEffect, useState } from 'react';
import { CONFIG, TEAM_COLORS } from '@/lib/config';
import { DRAW_SPIN, iconOf, pickIcon } from '@/lib/auction';
import { useAuction } from './AuctionProvider';
import Header from './Header';
import Stage from './Stage';

export default function DrawScreen() {
  const { S, dispatch } = useAuction();
  const [now, setNow] = useState<number | null>(null);
  const pool = CONFIG.iconPlayers;
  const lastDraw = Math.max(0, ...S.drawTimes.map((x) => x ?? 0));

  // Tick while the latest draw spins. Driven by drawTimes, so every open screen animates in sync.
  useEffect(() => {
    if (!lastDraw) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t - lastDraw < DRAW_SPIN) timer = setTimeout(tick, 70);
    };
    tick();
    return () => clearTimeout(timer);
  }, [lastDraw]);

  const elapsed = (t: number) => {
    const at = S.drawTimes[t];
    if (S.icons[t] == null || at == null) return null;
    return now == null ? Infinity : Math.max(0, now - at);
  };
  const isSpinning = (t: number) => {
    const e = elapsed(t);
    return e != null && e < DRAW_SPIN;
  };
  const isRevealed = (t: number) => {
    const e = elapsed(t);
    return e != null && e >= DRAW_SPIN;
  };

  const teamIdx = CONFIG.teams.map((_, t) => t);
  const anySpinning = teamIdx.some(isSpinning);
  const drawnCount = S.icons.filter((x) => x != null).length;
  const potEmpty = drawnCount >= pool.length;

  const onDraw = (team: number) => {
    if (anySpinning || S.icons[team] != null) return;
    const icon = pickIcon(S, team);
    if (icon == null) return;
    dispatch({ type: 'drawTeam', team, icon, at: Date.now() });
  };

  const onRedraw = () => {
    if (anySpinning) return;
    if (!confirm('Redraw the icon players? The current draw is cleared and every team will get a different icon player next time.'))
      return;
    dispatch({ type: 'redraw' });
  };

  return (
    <Stage>
      <Header />

      <div className="card draw-top">
        <div>
          <div className="draw-title cond">Icon player draw</div>
          <div className="draw-sub">
            Each manager draws their team&apos;s icon player. Icon players are free and sit outside the{' '}
            {CONFIG.squadSize}-player auction squad.          </div>
        </div>
        <div className="draw-actions">
          <span className="draw-count">
            {drawnCount} / {Math.min(CONFIG.teams.length, pool.length)} drawn
          </span>
          {drawnCount > 0 && (
            <button type="button" className="redraw-btn" onClick={onRedraw} disabled={anySpinning}>
              Redraw
            </button>
          )}
        </div>
      </div>

      <div className="draw-grid" style={{ gridTemplateColumns: `repeat(${CONFIG.teams.length},minmax(0,1fr))` }}>
        {CONFIG.teams.map((t, i) => {
          const revealed = isRevealed(i);
          const spinning = isSpinning(i);
          const undrawn = S.icons[i] == null;
          const e = elapsed(i) ?? 0;
          const spinName = pool[(Math.floor(e / 90) + i) % pool.length];
          return (
            <div key={t} className={`card dcard${revealed ? ' done' : ''}${spinning ? ' spinning' : ''}`}>
              <div className="t-name cond">
                <span className="dot" style={{ background: TEAM_COLORS[i] }} />
                {t}
              </div>
              {CONFIG.managers[i] && (
                <div className="t-manager">
                  Manager <b>{CONFIG.managers[i]}</b>
                </div>
              )}
              <div className="d-slot">
                {undrawn && (
                  <div className="d-wait">
                    <span className="d-q cond">?</span>
                    <button
                      type="button"
                      className="draw-btn cond"
                      onClick={() => onDraw(i)}
                      disabled={anySpinning || potEmpty}
                    >
                      Draw
                    </button>
                    <span className="d-hint">
                      {potEmpty
                        ? 'No icon players left'
                        : `${CONFIG.managers[i] || t} to draw`}
                    </span>
                  </div>
                )}
                {spinning && <span className="d-name spin cond">{spinName}</span>}
                {revealed && (
                  <div className="d-reveal" key={S.drawTimes[i] ?? 0}>
                    <span className="d-tag">Icon player</span>
                    <span className="d-name cond">{iconOf(S, i)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pool">
        <span className="label">Icon players</span>
        {pool.map((p, k) => {
          const team = S.icons.indexOf(k);
          const shown = team >= 0 && isRevealed(team);
          return (
            <span key={p} className={`pool-chip${shown ? ' taken' : ''}`}>
              {shown && <span className="dot" style={{ background: TEAM_COLORS[team] }} />}
              {p}
              {shown && <span className="pool-team">→ {CONFIG.teams[team]}</span>}
            </span>
          );
        })}
      </div>
    </Stage>
  );
}
