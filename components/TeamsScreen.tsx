'use client';

import { CONFIG, META, TEAM_COLORS, fmt } from '@/lib/config';
import { LOT_SPIN, current, iconOf, purseLeft } from '@/lib/auction';
import { useAuction } from './AuctionProvider';
import { useSpin } from './useSpin';
import Header from './Header';
import Stage from './Stage';

export default function TeamsScreen() {
  const { S, teams } = useAuction();
  const cur = current(S);
  const m = META[cur.pos] || META.MID;
  const n = CONFIG.teams.length;
  const signed = S.squad.reduce((a, b) => a + b, 0);
  const { spinning } = useSpin(S.lotDrawAt, LOT_SPIN);
  const revealed = S.lotDrawAt != null && !spinning;

  let nowText: React.ReactNode;
  if (S.done) nowText = <>Auction complete · {signed} players signed</>;
  else if (spinning) nowText = <>Drawing the next player…</>;
  else if (!revealed) nowText = <>Waiting for the next player draw</>;
  else if (S.sold && S.leader != null && S.bid != null)
    nowText = (
      <>
        {S.auto ? 'Allotted' : 'Sold'} to <b style={{ color: TEAM_COLORS[S.leader] }}>{teams[S.leader]}</b> for <b>{fmt(S.bid)}</b>
      </>
    );
  else if (S.unsold) nowText = <>Unsold</>;
  else if (S.leader != null && S.bid != null)
    nowText = (
      <>
        Current bid <b>{fmt(S.bid)}</b> · <b style={{ color: TEAM_COLORS[S.leader] }}>{teams[S.leader]}</b>
      </>
    );
  else nowText = <>Waiting for the opening bid at {fmt(CONFIG.basePrice)}</>;

  return (
    <Stage>
      <Header />

      <div className="card now">
        <div className="now-left">
          <span className="label">Now on the block</span>
          <span className="now-name cond">{S.done ? '—' : revealed ? cur.name : '?'}</span>
          {!S.done && revealed && (
            <span className="tag cond" style={{ background: m.color }}>
              {cur.pos}
            </span>
          )}
        </div>
        <div className="now-right">{nowText}</div>
      </div>

      <div className="teams" style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))` }}>
        {teams.map((t, i) => {
          const list = S.bought[i];
          const open = Math.max(0, CONFIG.squadSize - list.length);
          const leading = revealed && S.leader === i && !S.done && !S.unsold;
          return (
            <div key={t} className={`card tcard${leading ? ' lead' : ''}`}>
              <div className="t-head">
                <div className="t-name cond">
                  <span className="dot" style={{ background: TEAM_COLORS[i] }} />
                  {t}
                </div>
                {leading && <span className="t-badge">{S.sold ? 'Just signed' : 'Leading bid'}</span>}
              </div>
              {CONFIG.managers[i] && (
                <div className="t-manager">
                  Manager <b>{CONFIG.managers[i]}</b>
                </div>
              )}

              <div className="t-stats">
                <div>
                  <div className="label">Purse left</div>
                  <div className="t-big cond">{fmt(purseLeft(S, i))}</div>
                </div>
                <div>
                  <div className="label">Spent</div>
                  <div className="t-mid cond">{fmt(S.spent[i])}</div>
                </div>
                <div>
                  <div className="label">Squad</div>
                  <div className="t-mid cond">
                    {S.squad[i]} / {CONFIG.squadSize}
                  </div>
                </div>
              </div>

              <div className="t-list">
                {iconOf(S, i) ? (
                  <div className="t-row icon">
                    <span className="t-num">★</span>
                    <span className="t-player">{iconOf(S, i)}</span>
                    <span className="tag sm cond icon-tag">ICON</span>
                  </div>
                ) : (
                  <div className="t-row open">
                    <span className="t-num">★</span>
                    <span className="t-player">Icon player · to be drawn</span>
                  </div>
                )}
                {list.map((p, k) => {
                  const pm = META[p.pos];
                  return (
                    <div key={`${p.name}-${k}`} className="t-row">
                      <span className="t-num">{String(k + 1).padStart(2, '0')}</span>
                      <span className="t-player">{p.name}</span>
                      {p.pos && (
                        <span className="tag sm cond" style={{ background: pm ? pm.color : '#3A4D43' }}>
                          {p.pos}
                        </span>
                      )}
                      <span className="t-price cond">{p.price == null ? '—' : fmt(p.price)}</span>
                    </div>
                  );
                })}
                {Array.from({ length: open }, (_, k) => (
                  <div key={`open-${k}`} className="t-row open">
                    <span className="t-num">{String(list.length + k + 1).padStart(2, '0')}</span>
                    <span className="t-player">Open slot</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
}
