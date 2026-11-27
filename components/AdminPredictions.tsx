'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TEAM_COLORS } from '@/lib/config';
import { champion, finalists } from '@/lib/fixtures';
import type { PredDraw, Prediction } from '@/lib/predictions';
import { useAuction } from './AuctionProvider';

/** How long the names shuffle before the drawn winner is shown (ms). */
const SHUFFLE_MS = 2400;

const Dot = ({ t }: { t: number }) => <span className="dot" style={{ background: TEAM_COLORS[t] }} />;
const scoreText = (p: { c: number; o: number }) => `${p.c} – ${p.o}${p.c === p.o ? ' (pens)' : ''}`;

/** Admin: every winner prediction, and the draw among those who picked the champion. */
export default function AdminPredictions() {
  const { S, teams } = useAuction();
  const T = S.tour;

  const [list, setList] = useState<Prediction[] | null>(null);
  const [draw, setDraw] = useState<PredDraw | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/predictions', { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error ?? 'Could not load predictions');
      setList(j.predictions);
      setDraw(j.draw);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // Refresh every 15 s so new entries show up while the panel is open.
  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  // Actual result, once the final is saved: the champion and the score from the champion's side.
  const actual = useMemo(() => {
    const won = champion(T);
    const f = finalists(T);
    if (won == null || !f || !T.final) return null;
    const mine = won === f[0] ? T.final.h : T.final.a;
    const theirs = won === f[0] ? T.final.a : T.final.h;
    return { team: won, score: { c: mine, o: theirs } };
  }, [T]);

  const [drawTeam, setDrawTeam] = useState<number | null>(null);
  const team = drawTeam ?? actual?.team ?? null;
  const [exactOnly, setExactOnly] = useState(true);

  const all = list ?? [];
  const counts = teams.map((_, i) => all.filter((p) => p.team === i).length);
  const picked = team == null ? [] : all.filter((p) => p.team === team);
  const exactScore = actual && team === actual.team ? actual.score : null;
  const exact = exactScore ? picked.filter((p) => p.score.c === exactScore.c && p.score.o === exactScore.o) : [];
  const useExact = exactOnly && exact.length > 0;
  const pool = useExact ? exact : picked;

  const shown = all.filter(
    (p) =>
      (filter === 'all' || p.team === filter) &&
      (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()) || p.phone.includes(q.replace(/\D/g, '') || '\u0000'))
  );

  // Draw: the server picks; the names shuffle on screen until the pick is revealed.
  const [rolling, setRolling] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const runDraw = async () => {
    if (team == null || !pool.length) return;
    if (draw && !confirm(`Draw again? ${draw.winner.name} is replaced as the winner.`)) return;
    setError('');
    const names = pool.map((p) => p.name);
    let k = 0;
    setRolling(names[0]);
    timer.current = setInterval(() => setRolling(names[++k % names.length]), 90);
    const started = Date.now();
    try {
      const r = await fetch('/api/predictions/draw', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ team, exact: useExact ? exactScore : null }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error ?? 'Draw failed');
      await new Promise((res) => setTimeout(res, Math.max(0, SHUFFLE_MS - (Date.now() - started))));
      setDraw(j.draw);
    } catch (e) {
      setError((e as Error).message);
    }
    if (timer.current) clearInterval(timer.current);
    setRolling(null);
  };

  const clearDraw = async () => {
    if (!draw || !confirm('Clear the draw result?')) return;
    const r = await fetch('/api/predictions/draw', { method: 'DELETE' }).catch(() => null);
    if (r?.ok) setDraw(null);
    else setError('Could not clear the draw');
  };

  const remove = async (p: Prediction) => {
    if (!confirm(`Delete the prediction by ${p.name} (${p.phone})? They can then enter again.`)) return;
    const r = await fetch(`/api/predictions?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' }).catch(() => null);
    if (r?.ok) load();
    else setError('Could not delete the prediction');
  };

  const winner = draw && all.find((p) => p.id === draw.winner.id);

  return (
    <>
      <div className="card ad-setup pr-bar">
        <div className="pr-total">
          <span className="label">Predictions</span>
          <span className="pr-total-n cond">{list ? all.length : '…'}</span>
        </div>
        <div className="pr-counts">
          {teams.map((n, i) => (
            <button
              key={i}
              type="button"
              className={`pr-count${filter === i ? ' on' : ''}`}
              onClick={() => setFilter(filter === i ? 'all' : i)}
              title="Show only this team's predictions"
            >
              <Dot t={i} />
              <span className="pr-count-name">{n}</span>
              <span className="pr-count-n cond">{counts[i]}</span>
            </button>
          ))}
        </div>
        <a href="/predict" target="_blank" rel="noopener" className="fx-link">
          Open prediction page ↗
        </a>
      </div>

      <div className="pr-main">
        <div className="card ad-list pr-list">
          <div className="h-title">
            <span className="cond">{filter === 'all' ? 'All entries' : teams[filter]}</span>
            <span className="count">{shown.length} shown</span>
          </div>
          <input className="ad-input" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
          {error && <div className="lg-error">{error}</div>}
          {!list ? (
            <div className="ad-none">Loading…</div>
          ) : shown.length === 0 ? (
            <div className="empty">{all.length ? 'No matching entries' : 'No predictions yet. Share the /predict page.'}</div>
          ) : (
            <div className="pr-rows">
              <div className="pr-row pr-headrow">
                <span>#</span>
                <span>Name</span>
                <span>Phone</span>
                <span>Champion</span>
                <span>Score</span>
                <span />
              </div>
              {shown.map((p) => (
                <div key={p.id} className={`pr-row${draw?.winner.id === p.id ? ' won' : ''}`}>
                  <span className="fx-no cond">{all.indexOf(p) + 1}</span>
                  <span className="pr-name" title={new Date(p.createdAt).toLocaleString('en-IN')}>
                    {p.name}
                  </span>
                  <span className="pr-ph">{p.phone}</span>
                  <span className="pr-champ">
                    <Dot t={p.team} />
                    {teams[p.team] ?? p.teamName}
                  </span>
                  <span className="pr-sc cond">{scoreText(p.score)}</span>
                  <button type="button" className="ad-x" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card ad-editor pr-draw">
          <div className="ad-head">
            <span className="ad-label cond">Winner draw</span>
            <span className={`ad-state${draw ? ' saved' : ''}`}>{draw ? 'Winner drawn' : 'Not drawn'}</span>
          </div>

          <label className="lg-field">
            <span className="label">Champion</span>
            <select
              className="ad-input"
              value={team ?? ''}
              onChange={(e) => setDrawTeam(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="" disabled>
                Select the champion
              </option>
              {teams.map((n, i) => (
                <option key={i} value={i}>
                  {n}
                  {actual?.team === i ? ' (won the final)' : ''}
                </option>
              ))}
            </select>
            {!actual && <span className="pr-note">The final has no result yet. You can still pick a team to draw.</span>}
          </label>

          {team != null && (
            <div className="pr-pool">
              <div className="pr-pool-n">
                <b className="cond">{picked.length}</b> picked {teams[team]}
                {exactScore && (
                  <>
                    {' · '}
                    <b className="cond">{exact.length}</b> also got {scoreText(exactScore)}
                  </>
                )}
              </div>
              {exactScore && exact.length > 0 && (
                <label className="ad-og">
                  <input type="checkbox" checked={exactOnly} onChange={(e) => setExactOnly(e.target.checked)} /> Draw only
                  among exact-score predictions
                </label>
              )}
              <div className="pr-note">
                {pool.length === 0
                  ? 'Nobody predicted this champion.'
                  : pool.length === 1
                    ? `Only ${pool[0].name} is in the draw, so they win outright.`
                    : `${pool.length} people are in the draw. One is picked at random.`}
              </div>
            </div>
          )}

          <div className={`pr-reveal${rolling ? ' rolling' : ''}${draw && !rolling ? ' done' : ''}`}>
            {rolling ? (
              <span className="pr-reveal-name cond">{rolling}</span>
            ) : draw ? (
              <>
                <span className="label">Winner</span>
                <span className="pr-reveal-name cond">{draw.winner.name}</span>
                <span className="pr-reveal-sub">
                  {draw.winner.phone} · picked <Dot t={draw.team} /> {teams[draw.team]}
                  {winner ? ` · ${scoreText(winner.score)}` : ''}
                </span>
                <span className="pr-reveal-sub">
                  Drawn from {draw.poolSize} {draw.pool === 'exact' ? 'exact-score ' : ''}
                  {draw.poolSize === 1 ? 'entry' : 'entries'} · {new Date(draw.at).toLocaleString('en-IN')}
                </span>
              </>
            ) : (
              <span className="d-q cond">?</span>
            )}
          </div>

          <div className="ad-fix">
            <button type="button" className="draw-player cond" onClick={runDraw} disabled={!!rolling || team == null || !pool.length}>
              {rolling ? 'Drawing…' : draw ? 'Draw again' : pool.length === 1 ? 'Confirm winner' : 'Draw winner'}
            </button>
            {draw && (
              <button type="button" className="redraw-btn" onClick={clearDraw} disabled={!!rolling}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
