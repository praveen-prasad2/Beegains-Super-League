'use client';

import Link from 'next/link';
import { CONFIG, TEAM_COLORS } from '@/lib/config';
import { FIX_STEP, champion, finalists, leagueDone } from '@/lib/fixtures';
import { useAuction } from './AuctionProvider';
import { useSpin } from './useSpin';
import Header from './Header';
import Stage from './Stage';
import PointsTable from './PointsTable';

function Team({ t, right = false }: { t: number; right?: boolean }) {
  const { teams } = useAuction();
  return (
    <span className={`fx-team cond${right ? ' right' : ''}`}>
      {!right && <span className="dot" style={{ background: TEAM_COLORS[t] }} />}
      <span className="fx-tname">{teams[t]}</span>
      {right && <span className="dot" style={{ background: TEAM_COLORS[t] }} />}
    </span>
  );
}

export default function FixturesScreen() {
  const { S, teams } = useAuction();
  const T = S.tour;
  const total = T.order.length;
  const { spinning, elapsed } = useSpin(T.drawAt, FIX_STEP * (total + 1));

  const played = T.results.filter(Boolean).length;
  const done = leagueDone(T);
  const fin = finalists(T);
  const champ = champion(T);
  const shown = (i: number) => !spinning || elapsed >= (i + 1) * FIX_STEP;

  return (
    <Stage>
      <Header />

      <div className="card draw-top">
        <div>
          <div className="draw-title cond">League fixtures</div>
          <div className="draw-sub">
            Each team plays every other team twice ({(CONFIG.teams.length - 1) * 2} matches each). Win 3 · Draw 1 · Loss
            0. Top 2 on the points table go straight to the Final.
          </div>
        </div>
        <div className="draw-actions">
          {total > 0 && (
            <>
              <span className="draw-count">
                {played} / {total} played
              </span>
            </>
          )}
        </div>
      </div>

      {total === 0 ? (
        // Updates by itself: the moment the admin draws, the fixtures are revealed here live.
        <div className="card fx-empty fx-soon">
          <span className="fx-soon-live">
            <span className="fx-soon-dot" /> Stay tuned
          </span>
          <span className="fx-soon-title cond">Fixtures will be drawn soon</span>
          <span className="fx-soon-sub">The match schedule appears here live as soon as it is drawn.</span>
          <div className="fx-soon-teams">
            {teams.map((t, i) => (
              <span key={i} className="pool-chip">
                <span className="dot" style={{ background: TEAM_COLORS[i] }} />
                {t}
              </span>
            ))}
          </div>
          <span className="d-hint">
            {CONFIG.teams.length} teams · {CONFIG.teams.length * (CONFIG.teams.length - 1)} league matches + Final
          </span>
        </div>
      ) : (
        <div className="fx-main">
          <div className="card fx-list">
            <div className="h-title">
              <span className="cond">Match schedule</span>
              <span className="count">{spinning ? 'Drawing…' : `${total} league matches`}</span>
            </div>
            <div className="fx-rows">
              {T.order.map(([h, a], i) => {
                const r = T.results[i];
                if (!shown(i))
                  return (
                    <div key={i} className="fx-row pending">
                      <span className="fx-no cond">M{i + 1}</span>
                      <span className="fx-wait cond">?</span>
                    </div>
                  );
                return (
                  <div key={i} className={`fx-row${r ? ' played' : ''}${spinning ? ' pop' : ''}`}>
                    <span className="fx-no cond">M{i + 1}</span>
                    <Team t={h} />
                    <div className="fx-mid">
                      {r ? (
                        <span className="fx-score cond">
                          <span className={r.h > r.a ? 'win' : ''}>{r.h}</span>
                          <span className="fx-colon">:</span>
                          <span className={r.a > r.h ? 'win' : ''}>{r.a}</span>
                        </span>
                      ) : (
                        <span className="fx-vs cond">vs</span>
                      )}
                    </div>
                    <Team t={a} right />
                    <span className="fx-act">
                      {!spinning && (
                        <Link href="/admin" className="fx-link">
                          {r ? 'Edit' : 'Enter result'}
                        </Link>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="fx-side">
            <div className="card fx-table">
              <div className="h-title">
                <span className="cond">Points table</span>
                <span className="count">{done ? 'League complete' : 'Top 2 → Final'}</span>
              </div>
              <PointsTable tour={T} />
            </div>

            <div className={`card fx-final${champ != null ? ' won' : ''}`}>
              <div className="h-title">
                <span className="cond">Final</span>
                <span className="count">1st vs 2nd</span>
              </div>
              <div className="fx-fmatch">
                {fin ? <Team t={fin[0]} /> : <span className="fx-tbd cond">1st place</span>}
                <div className="fx-mid">
                  {fin && T.final ? (
                    <span className="fx-score cond">
                      <span className={champ === fin[0] ? 'win' : ''}>{T.final.h}</span>
                      <span className="fx-colon">:</span>
                      <span className={champ === fin[1] ? 'win' : ''}>{T.final.a}</span>
                    </span>
                  ) : (
                    <span className="fx-vs cond">vs</span>
                  )}
                </div>
                {fin ? <Team t={fin[1]} right /> : <span className="fx-tbd cond right">2nd place</span>}
              </div>

              {!fin && (
                <div className="fx-note">
                  Finalists are set once all {total} league matches are played ({total - played} to go).
                </div>
              )}
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
            </div>
          </div>
        </div>
      )}
    </Stage>
  );
}
