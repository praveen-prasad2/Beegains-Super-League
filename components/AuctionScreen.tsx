'use client';

import { CONFIG, META, TEAM_COLORS, fmt, steps } from '@/lib/config';
import { bidBlock, current, iconOf, locked, nextBid } from '@/lib/auction';
import { useAuction } from './AuctionProvider';
import Header from './Header';
import PlayerArt from './PlayerArt';
import Stage from './Stage';

export default function AuctionScreen() {
  const { S, dispatch } = useAuction();
  const cur = current(S);
  const m = META[cur.pos] || META.MID;
  const nxt = S.queue[S.idx + 1];
  const n = CONFIG.teams.length;

  const amount = nextBid(S);
  const placeBid = (team: number) => dispatch({ type: 'bid', team });

  return (
    <>
      <Stage>
        <Header />

        <div className="main">
          <div className="card player">
            <div className="art">
              <div>
                <PlayerArt pos={cur.pos} color={m.color} />
              </div>
              <div className="block-tag">Now on the block</div>
            </div>
            <div className="pinfo">
              <div>
                <div className="label">Name</div>
                <div className="pname cond">{cur.name}</div>
              </div>
              <div>
                <div className="label">Position</div>
                <div className="pos cond" style={{ background: m.color }}>
                  {cur.pos} · {m.label}
                </div>
              </div>
              <div className="upnext">
                Up next <span>{S.done ? 'None' : nxt ? `${nxt.name} · ${nxt.pos}` : 'Last player'}</span>
              </div>
            </div>
          </div>

          <div className="middle">
            <div className="card history">
              <div className="h-title">
                <div className="cond">Bid history</div>
                <div className="count">{S.history.length ? `Last ${S.history.length} bids` : 'Last 5 bids'}</div>
              </div>
              {S.history.length ? (
                <div className="rows">
                  {S.history.map((h, i) => (
                    <div key={`${S.idx}-${h.value}`} className={`row${i === 0 ? ' top' : ''}`}>
                      <div className="team">
                        <div className="dot" style={{ background: TEAM_COLORS[h.team] }} />
                        {CONFIG.teams[h.team]}
                      </div>
                      <div className="amt cond">{fmt(h.value)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">Waiting for the opening bid at base price</div>
              )}
            </div>
          </div>

          <div className="card bidpanel">
            <div className="base">
              <div className="label">Base price</div>
              <div className="cond">{fmt(CONFIG.basePrice)}</div>
            </div>
            <div>
              <div className="cur-label">Current bid</div>
              <div className="bid cond">{fmt(S.bid == null ? CONFIG.basePrice : S.bid)}</div>
              <div className="leader">
                <div className="dot" style={{ background: S.leader == null ? '#3A4D43' : TEAM_COLORS[S.leader] }} />
                <div>
                  {S.leader == null ? 'No bids yet' : CONFIG.teams[S.leader]}
                  {S.leader != null && CONFIG.managers[S.leader] && (
                    <span className="mgr"> · {CONFIG.managers[S.leader]}</span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="small-label split">
                <span>Raise by</span>
                <span className="next-amt">
                  Next bid <b>{fmt(amount)}</b>
                </span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
                {steps().map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`step${S.step === i ? ' on' : ''}`}
                    disabled={locked(S)}
                    onClick={() => dispatch({ type: 'step', step: i })}
                  >
                    + {fmt(v)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="small-label">Tap a team to place its bid</div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(n, 4)},minmax(0,1fr))` }}>
                {CONFIG.teams.map((t, i) => {
                  const block = bidBlock(S, i, amount);
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`teambtn${S.leader === i ? ' lead' : ''}`}
                      disabled={block !== null}
                      title={block || undefined}
                      onClick={() => placeBid(i)}
                    >
                      <span className="tb-main">
                        <span className="dot" style={{ background: TEAM_COLORS[i] }} />
                        <span className="tb-name">{t}</span>
                      </span>
                      {block && <span className="tb-why">{block}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="actions">
              <button
                type="button"
                className="sold-btn cond"
                disabled={locked(S) || S.bid == null}
                onClick={() => dispatch({ type: 'sold' })}
              >
                Sold
              </button>
              <button
                type="button"
                className="ghost"
                disabled={locked(S) || S.bid != null}
                onClick={() => dispatch({ type: 'unsold' })}
              >
                Unsold
              </button>
              <button
                type="button"
                className="ghost"
                disabled={S.done || !(S.sold || S.unsold)}
                onClick={() => dispatch({ type: 'next' })}
              >
                Next lot
              </button>
            </div>

            {S.sold && S.leader != null && S.bid != null && (
              <div className="stamp-wrap" style={{ top: 150 }}>
                <div className="stamp" style={{ borderColor: '#FF7A1A', color: '#FF7A1A' }}>
                  <div className="big cond" style={S.auto ? { fontSize: 76 } : undefined}>
                    {S.auto ? 'ALLOTTED' : 'SOLD'}
                  </div>
                  <div className="small">
                    to {CONFIG.teams[S.leader]} · {fmt(S.bid)}
                    {S.auto && ' (base price)'}
                  </div>
                </div>
              </div>
            )}
            {S.unsold && (
              <div className="stamp-wrap" style={{ top: 170 }}>
                <div className="stamp" style={{ borderColor: '#9AAAA1', color: '#9AAAA1' }}>
                  <div className="big cond" style={{ fontSize: 88 }}>
                    UNSOLD
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="purses" style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))` }}>
          {CONFIG.teams.map((t, i) => (
            <div
              key={t}
              className={`purse${S.leader === i ? ' lead' : ''}`}
              title={S.bought[i].map((p) => p.name).join(', ')}
            >
              <div className="n">
                <div className="dot" style={{ background: TEAM_COLORS[i] }} />
                <span>{t}</span>
                {CONFIG.managers[i] && <span className="mgr">· {CONFIG.managers[i]}</span>}
              </div>
              <div className="left cond">{fmt(CONFIG.totalPurse - S.spent[i])}</div>
              <div className="sq">
                {S.squad[i]} / {CONFIG.squadSize} players
                {iconOf(S, i) && <> · Icon {iconOf(S, i)}</>}
              </div>
            </div>
          ))}
        </div>
      </Stage>
    </>
  );
}
