'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CONFIG, TEAM_COLORS } from '@/lib/config';
import { iconOf } from '@/lib/auction';
import {
  type Goal,
  type Pair,
  type Score,
  FIX_STEP,
  allMatches,
  drawFixtures,
  topAssists,
  topScorers,
} from '@/lib/fixtures';
import { useAuction } from './AuctionProvider';
import Header from './Header';
import AdminSidebar from './AdminSidebar';
import { useSpin } from './useSpin';
import Stage from './Stage';

type Key = number | 'final';

const Dot = ({ t }: { t: number }) => <span className="dot" style={{ background: TEAM_COLORS[t] }} />;

/** Add-a-goal form for one side of the match. */
function GoalForm({
  squad,
  oppSquad,
  onAdd,
  id,
}: {
  squad: string[];
  oppSquad: string[];
  onAdd: (g: Omit<Goal, 'side'>) => void;
  id: string;
}) {
  const [scorer, setScorer] = useState('');
  const [assist, setAssist] = useState('');
  const [og, setOg] = useState(false);
  const add = () => {
    if (!scorer.trim()) return;
    onAdd({ scorer: scorer.trim(), assist: og || !assist.trim() ? null : assist.trim(), og: og || undefined });
    setScorer('');
    setAssist('');
    setOg(false);
  };
  const names = og ? oppSquad : squad;
  return (
    <div className="ad-form">
      <datalist id={`${id}-sc`}>
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id={`${id}-as`}>
        {squad
          .filter((n) => n !== scorer)
          .map((n) => (
            <option key={n} value={n} />
          ))}
      </datalist>
      <input
        className="ad-input"
        list={`${id}-sc`}
        placeholder={og ? 'Own goal by (opponent)' : 'Scorer'}
        value={scorer}
        onChange={(e) => setScorer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
      />
      <input
        className="ad-input"
        list={`${id}-as`}
        placeholder={og ? 'No assist on own goal' : 'Assist (optional)'}
        value={og ? '' : assist}
        disabled={og}
        onChange={(e) => setAssist(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
      />
      <div className="ad-form-row">
        <label className="ad-og">
          <input type="checkbox" checked={og} onChange={(e) => setOg(e.target.checked)} /> Own goal
        </label>
        <button type="button" className="ad-add" onClick={add} disabled={!scorer.trim()}>
          + Add goal
        </button>
      </div>
    </div>
  );
}

/** Edits one match as a draft; nothing is saved until "Save result". */
function MatchEditor({
  mkey,
  label,
  pair,
  saved,
  savedPens,
}: {
  mkey: Key;
  label: string;
  pair: Pair;
  saved: Score | null;
  savedPens: 0 | 1 | null;
}) {
  const { S, dispatch, teams } = useAuction();
  const [goals, setGoals] = useState<Goal[]>(saved?.goals ?? []);
  const [pens, setPens] = useState<0 | 1 | null>(savedPens);
  const [dirty, setDirty] = useState(false);
  const isFinal = mkey === 'final';

  const squad = (t: number) => [iconOf(S, t), ...S.bought[t].map((p) => p.name)].filter((n): n is string => !!n);
  const h = goals.filter((g) => g.side === 0).length;
  const a = goals.filter((g) => g.side === 1).length;
  const level = h === a;
  const legacy = saved && !saved.goals && (saved.h > 0 || saved.a > 0);

  const change = (next: Goal[]) => {
    setGoals(next);
    setDirty(true);
  };
  const save = () => {
    if (isFinal && level && pens == null && !confirm('The final is level. Save without a penalty winner?')) return;
    const score: Score = { h, a, goals };
    if (isFinal) dispatch({ type: 'finalResult', score: { ...score, pens: level ? pens : null } });
    else dispatch({ type: 'result', match: mkey, score });
    setDirty(false);
  };
  const clear = () => {
    if (!confirm(`Clear the result of ${label}? Its goals and assists are removed from the stats.`)) return;
    if (isFinal) dispatch({ type: 'finalResult', score: null });
    else dispatch({ type: 'result', match: mkey, score: null });
    setGoals([]);
    setPens(null);
    setDirty(false);
  };

  return (
    <div className="card ad-editor">
      <div className="ad-head">
        <span className="ad-label cond">{label}</span>
        <span className={`ad-state${dirty ? ' dirty' : saved ? ' saved' : ''}`}>
          {dirty ? 'Unsaved changes' : saved ? 'Result saved' : 'Not played yet'}
        </span>
      </div>

      <div className="ad-scoreline">
        <span className="ad-team cond">
          <Dot t={pair[0]} />
          {teams[pair[0]]}
        </span>
        <span className="ad-score cond">
          {h} : {a}
        </span>
        <span className="ad-team right cond">
          {teams[pair[1]]}
          <Dot t={pair[1]} />
        </span>
      </div>
      {legacy && (
        <div className="fx-note">
          Saved earlier as {saved.h} : {saved.a} without goal details. Add the goals below and save to record scorers.
        </div>
      )}

      <div className="ad-sides">
        {([0, 1] as const).map((side) => {
          const t = pair[side];
          const list = goals.map((g, i) => ({ g, i })).filter(({ g }) => g.side === side);
          return (
            <div key={side} className="ad-side">
              <div className="small-label">
                <Dot t={t} /> {teams[t]} goals
              </div>
              <div className="ad-goals">
                {list.length === 0 && <div className="ad-none">No goals</div>}
                {list.map(({ g, i }) => (
                  <div key={i} className="ad-goal">
                    <span className="ad-ball">⚽</span>
                    <span className="ad-gtext">
                      <b>{g.scorer}</b>
                      {g.og ? (
                        <span className="ad-ogtag">OG</span>
                      ) : (
                        g.assist && <span className="ad-assist">assist {g.assist}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="ad-x"
                      aria-label="Remove goal"
                      onClick={() => change(goals.filter((_, k) => k !== i))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <GoalForm
                id={`g-${String(mkey)}-${side}`}
                squad={squad(t)}
                oppSquad={squad(pair[1 - side])}
                onAdd={(g) => change([...goals, { ...g, side }])}
              />
            </div>
          );
        })}
      </div>

      {isFinal && level && (
        <div className="fx-pens">
          <span className="label">Level · penalties won by</span>
          {pair.map((t, side) => (
            <button
              key={t}
              type="button"
              className={`fx-pen${pens === side ? ' on' : ''}`}
              onClick={() => {
                setPens(side as 0 | 1);
                setDirty(true);
              }}
            >
              <Dot t={t} />
              {teams[t]}
            </button>
          ))}
        </div>
      )}

      <div className="ad-actions">
        <button type="button" className="sold-btn ad-save" onClick={save} disabled={!dirty && !!saved}>
          {saved ? 'Update result' : `Save result ${h} : ${a}`}
        </button>
        {saved && (
          <button type="button" className="ghost" onClick={clear}>
            Clear result
          </button>
        )}
      </div>
    </div>
  );
}

/** Team names and the fixture draw. */
function Setup() {
  const { S, dispatch, teams } = useAuction();
  const T = S.tour;
  const [names, setNames] = useState<string[]>(teams);
  const [msg, setMsg] = useState('');
  const changed = names.some((n, i) => n.trim() !== teams[i]);
  const played = T.results.filter(Boolean).length + (T.final ? 1 : 0);
  const { spinning } = useSpin(T.drawAt, FIX_STEP * (T.order.length + 1));

  const saveNames = () => {
    if (names.some((n) => !n.trim())) return setMsg('Every team needs a name');
    const lower = names.map((n) => n.trim().toLowerCase());
    if (new Set(lower).size !== lower.length) return setMsg('Team names must be different');
    dispatch({ type: 'renameTeams', names });
    setMsg('Saved');
  };
  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    location.reload();
  };
  const draw = () => dispatch({ type: 'drawFixtures', order: drawFixtures(T.prevOrder), at: Date.now() });
  const reset = () => {
    const warn = played
      ? `Reset the fixtures? ${played} result(s), the points table, the final and all goal/assist stats will be cleared.`
      : 'Reset the fixtures? They will need to be drawn again (the new draw will be different).';
    if (confirm(warn)) dispatch({ type: 'clearFixtures' });
  };

  return (
    <div className="card ad-setup">
      <div className="ad-names">
        <span className="label">Team names</span>
        {names.map((n, i) => (
          <span key={i} className="ad-name">
            <Dot t={i} />
            <input
              className="ad-input"
              value={n}
              maxLength={30}
              aria-label={`Team ${i + 1} name`}
              onChange={(e) => {
                setNames(names.map((x, k) => (k === i ? e.target.value : x)));
                setMsg('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && saveNames()}
            />
          </span>
        ))}
        <button type="button" className="ad-add" onClick={saveNames} disabled={!changed}>
          Save names
        </button>
        {msg && <span className={`ad-msg${msg === 'Saved' ? ' ok' : ''}`}>{msg}</span>}
      </div>
      <div className="ad-fix">
        <span className="label">Fixtures</span>
        {T.order.length ? (
          <>
            <span className="draw-count">{spinning ? 'Revealing on screen…' : `Drawn · ${played} played`}</span>
            <button type="button" className="redraw-btn" onClick={reset} disabled={spinning}>
              Reset fixtures
            </button>
          </>
        ) : (
          <button type="button" className="draw-player cond" onClick={draw}>
            Draw fixtures
          </button>
        )}
        <button type="button" className="ghost ad-logout" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default function AdminScreen() {
  const { S, teams } = useAuction();
  const T = S.tour;
  const matches = allMatches(T);
  const firstOpen = matches.find((m) => m.teams && !m.score)?.key ?? 0;
  const [sel, setSel] = useState<Key | null>(null);
  const cur = matches.find((m) => m.key === (sel ?? firstOpen));
  const scorers = topScorers(T).slice(0, 5);
  const assists = topAssists(T).slice(0, 5);

  if (!T.order.length)
    return (
      <Stage>
        <Header />
        <div className="ad-shell">
          <AdminSidebar />
          <div className="ad-body">
            <Setup key={teams.join('|')} />
            <div className="card fx-empty">
              <span className="d-q cond">?</span>
              <span className="draw-sub">Draw the fixtures above. They are revealed live on the Fixtures screen.</span>
            </div>
          </div>
        </div>
      </Stage>
    );

  return (
    <Stage>
      <Header />
      <div className="ad-shell">
        <AdminSidebar />
        <div className="ad-body">
          <Setup key={teams.join('|')} />
          <div className="ad-main">
            <div className="card ad-list">
              <div className="h-title">
                <span className="cond">Matches</span>
                <span className="count">Admin</span>
              </div>
              {matches.map((m) => {
                const on = cur?.key === m.key;
                return (
                  <button
                    key={String(m.key)}
                    type="button"
                    className={`ad-match${on ? ' on' : ''}${m.score ? ' done' : ''}`}
                    disabled={!m.teams}
                    onClick={() => setSel(m.key)}
                  >
                    <span className="fx-no cond">{m.label}</span>
                    {m.teams ? (
                      <span className="ad-mteams">
                        <Dot t={m.teams[0]} />
                        {teams[m.teams[0]]}
                        <span className="ad-mscore">{m.score ? `${m.score.h} : ${m.score.a}` : 'vs'}</span>
                        {teams[m.teams[1]]}
                        <Dot t={m.teams[1]} />
                      </span>
                    ) : (
                      <span className="ad-mteams muted">1st vs 2nd · after the league</span>
                    )}
                  </button>
                );
              })}
            </div>

            {cur?.teams ? (
              <MatchEditor
                key={`${String(cur.key)}-${JSON.stringify(cur.score)}`}
                mkey={cur.key}
                label={cur.key === 'final' ? 'Final' : `${cur.label} · League`}
                pair={cur.teams}
                saved={cur.score}
                savedPens={cur.key === 'final' ? (T.final?.pens ?? null) : null}
              />
            ) : (
              <div className="card fx-empty">
                <span className="draw-sub">Pick a match</span>
              </div>
            )}

            <div className="ad-stats">
              {[
                { title: 'Top scorers', list: scorers, val: (p: (typeof scorers)[number]) => p.goals },
                { title: 'Top assists', list: assists, val: (p: (typeof scorers)[number]) => p.assists },
              ].map((b) => (
                <div key={b.title} className="card ad-board">
                  <div className="h-title">
                    <span className="cond">{b.title}</span>
                    <Link href="/stats" className="fx-link">
                      Full list
                    </Link>
                  </div>
                  {b.list.length === 0 ? (
                    <div className="ad-none">None yet</div>
                  ) : (
                    b.list.map((p, k) => (
                      <div key={`${p.team}-${p.name}`} className="ad-brow">
                        <span className="fx-no cond">{k + 1}</span>
                        <Dot t={p.team} />
                        <span className="ad-bname">{p.name}</span>
                        <span className="ad-bval cond">{b.val(p)}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
