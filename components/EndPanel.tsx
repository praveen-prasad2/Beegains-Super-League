'use client';

import Link from 'next/link';
import { CONFIG, TEAM_COLORS, fmt } from '@/lib/config';
import { iconOf, purseLeft, type AuctionState } from '@/lib/auction';

const CONFETTI_COLORS = ['#C8F03C', '#FF7A1A', '#4C9AFF', '#2EC4B6', '#E05BC1', '#F4D35E'];

/** Shown on the Live bid tab once every lot has been auctioned. */
export default function EndPanel({ S }: { S: AuctionState }) {
  const signed = S.squad.reduce((a, b) => a + b, 0);
  const spent = S.spent.reduce((a, b) => a + b, 0);
  const boughtNames = new Set(S.bought.flat().map((p) => p.name));
  const unsold = [...new Set(S.queue.map((q) => q.name))].filter((n) => !boughtNames.has(n));

  return (
    <div className="card end">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i * 0.23) % 4}s`,
              animationDuration: `${3.5 + ((i * 7) % 10) / 4}s`,
            }}
          />
        ))}
      </div>

      <div className="end-head">
        <div className="end-kicker">Season 2026 · Player auction</div>
        <div className="end-title cond">Bidding has ended</div>
        <div className="end-sub">
          {signed} players signed · {fmt(spent)} spent across {CONFIG.teams.length} teams
        </div>
      </div>

      <div className="end-teams" style={{ gridTemplateColumns: `repeat(${CONFIG.teams.length},minmax(0,1fr))` }}>
        {CONFIG.teams.map((t, i) => (
          <div key={t} className="end-team">
            <div className="end-team-name cond">
              <span className="dot" style={{ background: TEAM_COLORS[i] }} />
              {t}
            </div>
            {CONFIG.managers[i] && (
              <div className="end-team-mgr">
                Manager <b>{CONFIG.managers[i]}</b>
                {iconOf(S, i) && (
                  <>
                    {' '}· Icon <b>{iconOf(S, i)}</b>
                  </>
                )}
              </div>
            )}
            <div className="end-stats">
              <div>
                <div className="label">Squad</div>
                <div className="end-num cond">
                  {S.squad[i]} / {CONFIG.squadSize}
                </div>
              </div>
              <div>
                <div className="label">Spent</div>
                <div className="end-num cond">{fmt(S.spent[i])}</div>
              </div>
              <div>
                <div className="label">Purse left</div>
                <div className="end-num cond accent">{fmt(purseLeft(S, i))}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="end-foot">
        {unsold.length > 0 && (
          <div className="end-unsold">
            Unsold: <b>{unsold.join(', ')}</b>
          </div>
        )}
        <Link href="/teams" className="end-btn cond">
          View teams →
        </Link>
      </div>
    </div>
  );
}
