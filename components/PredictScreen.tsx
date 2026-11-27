'use client';

import { useEffect, useState } from 'react';
import { PREDICT_DEADLINE, PREDICT_DEADLINE_LABEL, TEAM_COLORS } from '@/lib/config';
import { MAX_GOALS, NAME_MAX, type Prediction, maskPhone, normalizePhone } from '@/lib/predictions';
import { useAuction } from './AuctionProvider';
import Header from './Header';
import Stage from './Stage';

/** This device's own prediction, so a revisit shows it instead of an empty form. */
const MINE_KEY = 'bsl-2026-prediction';

const goalOptions = Array.from({ length: MAX_GOALS + 1 }, (_, i) => i);

export default function PredictScreen() {
  const { S, teams } = useAuction();
  // Closes at the deadline (checked each 15 s so an open page flips on time) or once the final is played.
  const [late, setLate] = useState(false);
  useEffect(() => {
    const tick = () => setLate(Date.now() >= PREDICT_DEADLINE);
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  const closed = late || !!S.tour.final;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [team, setTeam] = useState('');
  const [c, setC] = useState('');
  const [o, setO] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<Prediction | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MINE_KEY);
      if (saved) setMine(JSON.parse(saved));
    } catch {}
  }, []);

  const phoneOk = !!normalizePhone(phone);
  const scoreOk = c !== '' && o !== '' && Number(c) >= Number(o);
  const canSubmit = name.trim().length >= 2 && phoneOk && team !== '' && scoreOk && !busy;
  const t = team === '' ? null : Number(team);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, team: Number(team), score: { c: Number(c), o: Number(o) } }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.prediction) {
        setMine(j.prediction);
        try {
          localStorage.setItem(MINE_KEY, JSON.stringify(j.prediction));
        } catch {}
      } else setError(j?.error ?? 'Could not save your prediction');
    } catch {
      setError('Could not reach the server');
    }
    setBusy(false);
  };

  let body: React.ReactNode;
  if (mine)
    body = (
      <div className="lg-form pr-done">
        <div className="draw-title cond">You&apos;re in!</div>
        <div className="draw-sub">Thanks, {mine.name}. Your prediction is saved.</div>
        <div className="pr-pick">
          <span className="label">Your champion</span>
          <span className="pr-team cond">
            <span className="dot" style={{ background: TEAM_COLORS[mine.team] }} />
            {teams[mine.team] ?? mine.teamName}
          </span>
          <span className="label">Final score</span>
          <span className="pr-score cond">
            {mine.score.c} – {mine.score.o}
            {mine.score.c === mine.score.o && <span className="pr-pens"> on penalties</span>}
          </span>
          <span className="pr-phone">Phone {maskPhone(mine.phone)}</span>
        </div>
        <div className="draw-sub">
          If more than one person picks the champion, the winner is chosen by a draw after the final.
        </div>
        {!closed && (
          <button
            type="button"
            className="fx-link pr-another"
            onClick={() => {
              try {
                localStorage.removeItem(MINE_KEY);
              } catch {}
              setMine(null);
              setName('');
              setPhone('');
              setTeam('');
              setC('');
              setO('');
            }}
          >
            Not you? Add a prediction with another phone number
          </button>
        )}
      </div>
    );
  else if (closed)
    body = (
      <div className="lg-form">
        <div className="draw-title cond">Predictions closed</div>
        <div className="draw-sub">
          {S.tour.final ? 'The final has been played.' : `Entries closed at ${PREDICT_DEADLINE_LABEL}.`} Thanks to everyone
          who took part.
        </div>
      </div>
    );
  else
    body = (
      <form className="lg-form" onSubmit={submit} noValidate>
        <div>
          <div className="draw-title cond">Predict the champion</div>
          <div className="draw-sub">
            Pick who wins BSL 2026 and the final score. One entry per phone number. Closes at {PREDICT_DEADLINE_LABEL}.
          </div>
        </div>
        <label className="lg-field">
          <span className="label">Your name</span>
          <input
            className="ad-input lg-input"
            autoComplete="name"
            maxLength={NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="lg-field">
          <span className="label">Phone number</span>
          <input
            className="ad-input lg-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={phone !== '' && !phoneOk}
            required
          />
          {phone.replace(/\D/g, '').length >= 10 && !phoneOk && (
            <span className="pr-hint">Enter a valid 10-digit mobile number</span>
          )}
        </label>
        <label className="lg-field">
          <span className="label">Champion</span>
          <select className="ad-input lg-input" value={team} onChange={(e) => setTeam(e.target.value)} required>
            <option value="" disabled>
              Select a team
            </option>
            {teams.map((n, i) => (
              <option key={i} value={i}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="lg-field">
          <span className="label">Final score</span>
          <div className="pr-scores">
            <label className="pr-side">
              <span className="pr-side-name">{t == null ? 'Champion' : teams[t]}</span>
              <select className="ad-input lg-input" value={c} onChange={(e) => setC(e.target.value)} aria-label="Champion goals">
                <option value="" disabled>
                  –
                </option>
                {goalOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <span className="pr-dash cond">–</span>
            <label className="pr-side">
              <span className="pr-side-name">Other finalist</span>
              <select className="ad-input lg-input" value={o} onChange={(e) => setO(e.target.value)} aria-label="Other finalist goals">
                <option value="" disabled>
                  –
                </option>
                {goalOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {c !== '' && o !== '' && Number(c) < Number(o) && (
            <span className="pr-hint">The champion needs at least as many goals as the other team.</span>
          )}
          {c !== '' && c === o && <span className="pr-note">Level score: your champion wins on penalties.</span>}
        </div>
        {error && <div className="lg-error">{error}</div>}
        <button type="submit" className="sold-btn" disabled={!canSubmit}>
          {busy ? 'Saving…' : 'Submit prediction'}
        </button>
      </form>
    );

  return (
    <Stage>
      <Header />
      <div className="card lg-wrap pr-wrap">{body}</div>
    </Stage>
  );
}
