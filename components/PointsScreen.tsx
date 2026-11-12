'use client';

import Link from 'next/link';
import { CONFIG, TEAM_COLORS } from '@/lib/config';
import { champion, finalists, leagueDone } from '@/lib/fixtures';
import { useAuction } from './AuctionProvider';
import Header from './Header';
import Stage from './Stage';
import PointsTable from './PointsTable';

function Name({ t }: { t: number }) {
  const { teams } = useAuction();
  return (
    <span className="pt-name">
      <span className="dot" style={{ background: TEAM_COLORS[t] }} />
      {teams[t]}
    </span>
  );
}

/** Display screen: standings, the final, and every league result. Results are entered on Admin. */
export default function PointsScreen() {
  const { S, teams } = useAuction();
  const T = S.tour;
  const total = T.order.length;
  const played = T.results.filter(Boolean).length;
  const done = leagueDone(T);
  const fin = finalists(T);
  const champ = champion(T);

  return (
    <Stage>
      <Header />

      <div className="pt-main">
        <div className="card fx-table pt-card">
          <div className="h-title">
            <span className="cond pt-title">Points table</span>
            <span className="count">
              {total
                ? `${played} / ${total} played · ${done ? 'League complete' : 'Top 2 go to the Final'}`
                : 'Fixtures not drawn yet'}
            </span>
          </div>
          <PointsTable tour={T} big />
          <div className="fx-note pt-key">
            Win 3 · Draw 1 · Loss 0 · Ties split by goal difference, then goals scored, then head-to-head
          </div>
        </div>

        <div className="fx-side">
          <div className={`card fx-final${champ != null ? ' won' : ''}`}>
            <div className="h-title">
              <span className="cond">Final</span>
              <span className="count">1st vs 2nd</span>
            </div>
            <div className="pt-fmatch">
              {fin ? <Name t={fin[0]} /> : <span className="fx-tbd cond">1st place</span>}
              {fin && T.final ? (
                <span className="fx-score cond">
                  <span className={champ === fin[0] ? 'win' : ''}>{T.final.h}</span>
                  <span className="fx-colon">:</span>
                  <span className={champ === fin[1] ? 'win' : ''}>{T.final.a}</span>
                </span>
              ) : (
                <span className="fx-vs cond">vs</span>
              )}
              {fin ? <Name t={fin[1]} /> : <span className="fx-tbd cond">2nd place</span>}
            </div>
            {fin && T.final && T.final.h === T.final.a && T.final.pens != null && (
              <div className="fx-note">Won on penalties by {teams[fin[T.final.pens]]}</div>
            )}
            {champ != null && (
              <div className="fx-champ">
                <span className="d-tag">Champions</span>
                <span className="fx-champ-name cond" style={{ color: TEAM_COLORS[champ] }}>
                  {teams[champ]}
                </span>
              </div>
            )}
            {!fin && total > 0 && (
              <div className="fx-note">
                Set once all {total} league matches are played ({total - played} to go)
              </div>
            )}
          </div>

          <div className="card pt-results">
            <div className="h-title">
              <span className="cond">Results</span>
              <Link href="/admin" className="fx-link">
                Enter results
              </Link>
            </div>
            {total === 0 ? (
              <div className="empty">Draw the fixtures on the Fixtures screen</div>
            ) : (
              <div className="pt-rlist">
                {T.order.map(([h, a], i) => {
                  const r = T.results[i];
                  return (
                    <div key={i} className={`pt-r${r ? '' : ' open'}`}>
                      <span className="fx-no cond">M{i + 1}</span>
                      <Name t={h} />
                      <span className="pt-rs cond">{r ? `${r.h} : ${r.a}` : 'vs'}</span>
                      <span className="pt-away">
                        <Name t={a} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Stage>
  );
}
