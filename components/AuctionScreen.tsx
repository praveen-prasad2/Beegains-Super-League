'use client';

import { CONFIG, META, TEAM_COLORS, fmt, steps } from '@/lib/config';
import { LOT_SPIN, bidBlock, current, iconOf, locked, lotCandidates, nextBid, pickLot } from '@/lib/auction';
import { useAuction } from './AuctionProvider';
import EndPanel from './EndPanel';
import Header from './Header';
import PlayerArt from './PlayerArt';
import Stage from './Stage';
import { useSpin } from './useSpin';

export default function AuctionScreen() {
  const { S, dispatch } = useAuction();
  const n = CONFIG.teams.length;

  // The player for each lot is drawn at random; bidding opens once the draw has revealed them.
  const drawn = S.lotDrawAt != null;
  const { spinning, elapsed } = useSpin(S.lotDrawAt, LOT_SPIN);
  const revealed = drawn && !spinning;
  const pot = S.queue.slice(S.idx);
  const leftInPot = pot.length - (drawn ? 1 : 0);

  const cur = current(S);
  // Players this draw picks from: one position at a time (GK → CB → RB → LB → MID → ST).
  const group = drawn
    ? pot.filter((p) => p.pos === cur.pos && p.again === cur.again)
    : lotCandidates(S).map((i) => S.queue[i]);
  const groupPos = group[0]?.pos;
  const spinLot = group[Math.floor(elapsed / 85) % Math.max(group.length, 1)] ?? cur;
  const shown = spinning ? spinLot : cur; // player name/position on screen
  const m = META[shown.pos] || META.MID;

  // While the draw is still spinning, show the lot as it was before the reveal.
  const bid = revealed ? S.bid : null;
  const leader = revealed ? S.leader : null;
  const history = revealed ? S.history : [];
  const busy = locked(S) || !revealed;

  const amount = nextBid(S);
  const placeBid = (team: number) => dispatch({ type: 'bid', team });
  const drawPlayer = () => {
    if (drawn) return;
    const pick = pickLot(S);
    if (pick != null) dispatch({ type: 'drawLot', pick, at: Date.now() });
  };

  if (S.done)
    return (
      <Stage>
        <Header />
        <EndPanel S={S} />
      </Stage>
    );

  return (
    <>
      <Stage>
        <Header />

        <div className="main">
          <div className="card player">
            <div className="art">
              {revealed ? (
                <div>
                  <PlayerArt key={cur.pos} pos={cur.pos} color={m.color} />
                </div>
              ) : (
                <div className={`mystery${spinning ? ' spinning' : ''}`}>
                  <span className="mystery-q cond">?</span>
                  <button type="button" className="draw-player cond" onClick={drawPlayer} disabled={drawn}>
                    {spinning ? 'Drawing…' : 'Draw player'}
                  </button>
                  <span className="mystery-hint">
                    {groupPos && <b>{groupPos} draw</b>} · {group.length} {groupPos ?? 'player'}
                    {group.length === 1 ? '' : 's'} left
                    {group.every((p) => p.again) && ' · second round'}
                  </span>
                </div>
              )}
              <div className="block-tag">{revealed ? 'Now on the block' : 'Player draw'}</div>
            </div>
            <div className="pinfo">
              <div>
                <div className="label">Name</div>
                <div className={`pname cond${spinning ? ' spin' : ''}`}>{drawn ? shown.name : '?'}</div>
              </div>
              <div>
                <div className="label">Position</div>
                {drawn ? (
                  <div className={`pos cond${spinning ? ' spin' : ''}`} style={{ background: m.color }}>
                    {shown.pos} · {m.label}
                  </div>
                ) : (
                  <div className="pos cond pos-unknown">Not drawn yet</div>
                )}
              </div>
              <div className="upnext">
                Left in the pot{' '}
                <span>
                  {leftInPot} player{leftInPot === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          <div className="middle">
            <div className="card history">
              <div className="h-title">
                <div className="cond">Bid history</div>
                <div className="count">{history.length ? `Last ${history.length} bids` : 'Last 5 bids'}</div>
              </div>
              {history.length ? (
                <div className="rows">
                  {history.map((h, i) => (
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
                <div className="empty">{revealed ? 'Waiting for the opening bid at base price' : 'Draw a player to open the bidding'}</div>
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
              <div className="bid cond">{fmt(bid == null ? CONFIG.basePrice : bid)}</div>
              <div className="leader">
                <div className="dot" style={{ background: leader == null ? '#3A4D43' : TEAM_COLORS[leader] }} />
                <div>
                  {leader == null ? (revealed ? 'No bids yet' : 'Waiting for the draw') : CONFIG.teams[leader]}
                  {leader != null && CONFIG.managers[leader] && (
                    <span className="mgr"> · {CONFIG.managers[leader]}</span>
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
                    disabled={busy}
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
                  const block = revealed ? bidBlock(S, i, amount) : '';
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`teambtn${leader === i ? ' lead' : ''}`}
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
                disabled={busy || S.bid == null}
                onClick={() => dispatch({ type: 'sold' })}
              >
                Sold
              </button>
              <button
                type="button"
                className="ghost"
                disabled={busy || S.bid != null}
                onClick={() => dispatch({ type: 'unsold' })}
              >
                Unsold
              </button>
              <button
                type="button"
                className="ghost"
                disabled={S.done || !revealed || !(S.sold || S.unsold)}
                onClick={() => dispatch({ type: 'next' })}
              >
                Next lot
              </button>
            </div>

            {revealed && S.sold && S.leader != null && S.bid != null && (
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
            {revealed && S.unsold && (
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
              className={`purse${leader === i ? ' lead' : ''}`}
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
