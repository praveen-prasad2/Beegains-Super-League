'use client';

import { useState } from 'react';
import { CONFIG, TEAM_COLORS } from '@/lib/config';
import { type Score, FIX_STEP, champion, drawFixtures, finalists, leagueDone } from '@/lib/fixtures';
import { useAuction } from './AuctionProvider';
import { useSpin } from './useSpin';
import Header from './Header';
import Stage from './Stage';
import PointsTable from './PointsTable';

const Team = ({ t, right = false }: { t: number; right?: boolean }) => (
  <span className={`fx-team cond${right ? ' right' : ''}`}>
    {!right && <span className="dot" style={{ background: TEAM_COLORS[t] }} />}
    <span className="fx-tname">{CONFIG.teams[t]}</span>
    {right && <span className="dot" style={{ background: TEAM_COLORS[t] }} />}
  </span>
);

/** Two goal boxes + save/cancel. */
function ScoreEdit({ init, onSave, onCancel }: { init: Score | null; onSave: (s: Score) => void; onCancel?: () => void }) {
  const [h, setH] = useState(init ? String(init.h) : '');
  const [a, setA] = useState(init ? String(init.a) : '');
  const ok = (v: string) => /^\d{1,2}$/.test(v);
  const valid = ok(h) && ok(a);
  const save = () => valid && onSave({ h: Number(h), a: Number(a) });
  const box = (v: string, set: (x: string) => void, label: string) => (
    <input
      className="fx-input cond"
      inputMode="numeric"
      aria-label={label}
      value={v}
      placeholder="–"
      onChange={(e) => set(e.target.value.replace(/\D/g, '').slice(0, 2))}
      onKeyDown={(e) => e.key === 'Enter' && save()}
    />
  );
  return (
    <div className="fx-edit">
      {box(h, setH, 'Home goals')}
      <span className="fx-colon">:</span>
      {box(a, setA, 'Away goals')}
      <button type="button" className="fx-save" onClick={save} disabled={!valid}>
        Save
      </button>
      {onCancel && (
        <button type="button" className="fx-link" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}

export default function FixturesScreen() {
  const { S, dispatch } = useAuction();
  const T = S.tour;
  const total = T.order.length;
  const { spinning, elapsed } = useSpin(T.drawAt, FIX_STEP * (total + 1));
  const [editing, setEditing] = useState<number | 'final' | null>(null);

  const played = T.results.filter(Boolean).length;
  const done = leagueDone(T);
  const fin = finalists(T);
  const champ = champion(T);
  const shown = (i: number) => !spinning || elapsed >= (i + 1) * FIX_STEP;

  const onDraw = () => dispatch({ type: 'drawFixtures', order: drawFixtures(T.prevOrder), at: Date.now() });
  const onReset = () => {
    if (spinning) return;
    const msg = played
      ? 'Reset the fixtures? All entered results, the points table and the final will be cleared, and the fixtures must be drawn again.'
      : 'Reset the fixtures? They will need to be drawn again (the new draw will be different).';
    if (confirm(msg)) {
      setEditing(null);
      dispatch({ type: 'clearFixtures' });
    }
  };
  const saveResult = (match: number, score: Score | null) => {
    dispatch({ type: 'result', match, score });
    setEditing(null);
  };

  return (
    <Stage>
      <Header />

      <div className="card draw-top">
        <div>
          <div className="draw-title cond">League fixtures</div>
          <div className="draw-sub">
            Each team plays every other team twice ({(CONFIG.teams.length - 1) * 2} matches each). Win 3 · Draw 1 · Loss 0.
            Top 2 on the points table go straight to the Final.
          </div>
        </div>
        <div className="draw-actions">
          {total > 0 && (
            <>
              <span className="draw-count">
                {played} / {total} played
              </span>
              <button type="button" className="redraw-btn" onClick={onReset} disabled={spinning}>
                Reset fixtures
              </button>
            </>
          )}
        </div>
      </div>

      {total === 0 ? (
        <div className="card fx-empty">
          <span className="d-q cond">?</span>
          <button type="button" className="draw-btn cond" onClick={onDraw}>
            Draw fixtures
          </button>
          <span className="d-hint">
            {CONFIG.teams.length} teams · {(CONFIG.teams.length * (CONFIG.teams.length - 1))} league matches + Final
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
                const isEdit = editing === i;
                return (
                  <div key={i} className={`fx-row${r ? ' played' : ''}${spinning ? ' pop' : ''}`}>
                    <span className="fx-no cond">M{i + 1}</span>
                    <Team t={h} />
                    <div className="fx-mid">
                      {isEdit || (!r && !spinning) ? (
                        <ScoreEdit
                          init={r}
                          onSave={(s) => saveResult(i, s)}
                          onCancel={r ? () => setEditing(null) : undefined}
                        />
                      ) : r ? (
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
                      {r && !isEdit && (
                        <>
                          <button type="button" className="fx-link" onClick={() => setEditing(i)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="fx-link"
                            onClick={() => confirm(`Clear the result of M${i + 1}?`) && saveResult(i, null)}
                          >
                            Clear
                          </button>
                        </>
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
                  {fin && (editing === 'final' || !T.final) ? (
                    <ScoreEdit
                      init={T.final}
                      onSave={(s) => {
                        dispatch({ type: 'finalResult', score: { ...s, pens: null } });
                        setEditing(null);
                      }}
                      onCancel={T.final ? () => setEditing(null) : undefined}
                    />
                  ) : fin && T.final ? (
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
              {fin && T.final && T.final.h === T.final.a && editing !== 'final' && (
                <div className="fx-pens">
                  <span className="label">Level · penalties won by</span>
                  {fin.map((t, side) => (
                    <button
                      key={t}
                      type="button"
                      className={`fx-pen${T.final?.pens === side ? ' on' : ''}`}
                      onClick={() => T.final && dispatch({ type: 'finalResult', score: { ...T.final, pens: side as 0 | 1 } })}
                    >
                      <span className="dot" style={{ background: TEAM_COLORS[t] }} />
                      {CONFIG.teams[t]}
                    </button>
                  ))}
                </div>
              )}
              {champ != null ? (
                <div className="fx-champ">
                  <span className="d-tag">Champions</span>
                  <span className="fx-champ-name cond" style={{ color: TEAM_COLORS[champ] }}>
                    {CONFIG.teams[champ]}
                  </span>
                  <button type="button" className="fx-link" onClick={() => setEditing('final')}>
                    Edit final
                  </button>
                </div>
              ) : (
                fin &&
                T.final &&
                editing !== 'final' && (
                  <button type="button" className="fx-link" onClick={() => setEditing('final')}>
                    Edit final
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </Stage>
  );
}
