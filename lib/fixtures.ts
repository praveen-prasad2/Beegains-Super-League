import { CONFIG } from './config';

/** A league match: home team index, away team index. */
export type Pair = [number, number];
/**
 * One goal. side = which team it counts for (0 = home, 1 = away).
 * og = own goal: scorer is from the other team and gets no goal credit.
 */
export type Goal = { side: 0 | 1; scorer: string; assist: string | null; og?: boolean };
export type Score = { h: number; a: number; /** Goal-by-goal detail, entered on the Admin screen. */ goals?: Goal[] };
export type FinalScore = Score & { /** Penalty-shootout winner when the final is level: 0 = home, 1 = away. */ pens: 0 | 1 | null };

export type Tournament = {
  /** League fixtures in playing order; empty = not drawn yet. */
  order: Pair[];
  /** When the fixtures were drawn (ms), so every screen plays the reveal together. */
  drawAt: number | null;
  /** Result per league match (same index as order); null = not played. */
  results: (Score | null)[];
  final: FinalScore | null;
  /** The previous draw; a redraw never produces the same fixture list. */
  prevOrder: Pair[] | null;
};

export const POINTS = { win: 3, draw: 1, loss: 0 };
/** Time between each fixture popping in during the draw reveal (ms). */
export const FIX_STEP = 650;

export const freshTournament = (): Tournament => ({ order: [], drawAt: null, results: [], final: null, prevOrder: null });

const shuffle = <T,>(xs: T[]) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sameOrder = (x: Pair[] | null, y: Pair[]) =>
  !!x && x.length === y.length && x.every((p, i) => p[0] === y[i][0] && p[1] === y[i][1]);

/**
 * Double round-robin: every pair of teams meets twice (home and away), so with 3 teams
 * each team plays 4 matches. Round 2 replays round 1's order with home/away swapped,
 * which means no pair meets back-to-back and no team plays 3 matches in a row.
 * Never returns the same fixture list as the previous draw.
 */
export function drawFixtures(prev: Pair[] | null): Pair[] {
  const n = CONFIG.teams.length;
  const pairs: Pair[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  for (let tries = 0; tries < 50; tries++) {
    const round1 = shuffle(pairs).map(([x, y]) => (Math.random() < 0.5 ? [x, y] : [y, x]) as Pair);
    const round2 = round1.map(([x, y]) => [y, x] as Pair);
    const order = [...round1, ...round2];
    if (!sameOrder(prev, order)) return order;
  }
  return [...pairs, ...pairs.map(([x, y]) => [y, x] as Pair)];
}

/**
 * Double round-robin in plain team order instead of a random draw:
 * A v B, A v C, B v C, then the return legs B v A, C v A, C v B.
 */
export function fixedFixtures(): Pair[] {
  const n = CONFIG.teams.length;
  const round1: Pair[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) round1.push([i, j]);
  return [...round1, ...round1.map(([x, y]) => [y, x] as Pair)];
}

/** Team letter for a team index: 0 → A, 1 → B, … */
export const teamLetter = (i: number) => String.fromCharCode(65 + i);

export type Row = { team: number; p: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number };

/** Points table, sorted: points, goal difference, goals scored, head-to-head points, then team order. */
export function table(t: Tournament): Row[] {
  const rows: Row[] = CONFIG.teams.map((_, team) => ({ team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }));
  const h2h = CONFIG.teams.map(() => CONFIG.teams.map(() => 0)); // h2h[a][b] = points a took off b
  t.order.forEach(([h, a], i) => {
    const r = t.results[i];
    if (!r) return;
    const H = rows[h], A = rows[a];
    H.p++; A.p++;
    H.gf += r.h; H.ga += r.a; A.gf += r.a; A.ga += r.h;
    if (r.h > r.a) { H.w++; A.l++; h2h[h][a] += POINTS.win; }
    else if (r.h < r.a) { A.w++; H.l++; h2h[a][h] += POINTS.win; }
    else { H.d++; A.d++; h2h[h][a] += POINTS.draw; h2h[a][h] += POINTS.draw; }
  });
  rows.forEach((r) => {
    r.gd = r.gf - r.ga;
    r.pts = r.w * POINTS.win + r.d * POINTS.draw + r.l * POINTS.loss;
  });
  return rows.sort(
    (x, y) =>
      y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || h2h[y.team][x.team] - h2h[x.team][y.team] || x.team - y.team
  );
}

export const leagueDone = (t: Tournament) => t.order.length > 0 && t.results.length === t.order.length && t.results.every(Boolean);

/** Final pairing (1st vs 2nd) once every league match is played. */
export const finalists = (t: Tournament): Pair | null => {
  if (!leagueDone(t)) return null;
  const [first, second] = table(t);
  return [first.team, second.team];
};

export function champion(t: Tournament): number | null {
  const f = finalists(t);
  const r = t.final;
  if (!f || !r) return null;
  if (r.h > r.a) return f[0];
  if (r.a > r.h) return f[1];
  return r.pens == null ? null : f[r.pens];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTournament(x: any): Tournament {
  if (!x || typeof x !== 'object' || !Array.isArray(x.order)) return freshTournament();
  const n = CONFIG.teams.length;
  const okPair = (p: unknown) => Array.isArray(p) && p.length === 2 && p.every((v) => Number.isInteger(v) && v >= 0 && v < n);
  if (!x.order.every(okPair)) return freshTournament();
  return {
    order: x.order,
    drawAt: typeof x.drawAt === 'number' ? x.drawAt : null,
    results: x.order.map((_: unknown, i: number) => x.results?.[i] ?? null),
    final: x.final ?? null,
    prevOrder: Array.isArray(x.prevOrder) && x.prevOrder.every(okPair) ? x.prevOrder : null,
  };
}

/** Every match in order: league matches (index 0..n-1) then the final ('final'). */
export function allMatches(t: Tournament): { key: number | 'final'; label: string; teams: Pair | null; score: Score | null }[] {
  const league = t.order.map((p, i) => ({ key: i as number | 'final', label: `M${i + 1}`, teams: p as Pair | null, score: t.results[i] }));
  return [...league, { key: 'final', label: 'Final', teams: finalists(t), score: t.final }];
}

export type PlayerStat = { name: string; team: number; goals: number; assists: number };

/** Goals and assists per player across the league and the final (own goals are not credited). */
export function playerStats(t: Tournament): PlayerStat[] {
  const map = new Map<string, PlayerStat>();
  const get = (name: string, team: number) => {
    const k = `${team}|${name.trim().toLowerCase()}`;
    let s = map.get(k);
    if (!s) map.set(k, (s = { name: name.trim(), team, goals: 0, assists: 0 }));
    return s;
  };
  for (const m of allMatches(t)) {
    if (!m.teams || !m.score?.goals) continue;
    for (const g of m.score.goals) {
      const team = m.teams[g.side];
      if (g.og) continue;
      if (g.scorer.trim()) get(g.scorer, team).goals++;
      if (g.assist?.trim()) get(g.assist, team).assists++;
    }
  }
  return [...map.values()];
}

export const topScorers = (t: Tournament) =>
  playerStats(t).filter((p) => p.goals > 0).sort((x, y) => y.goals - x.goals || y.assists - x.assists || x.name.localeCompare(y.name));
export const topAssists = (t: Tournament) =>
  playerStats(t).filter((p) => p.assists > 0).sort((x, y) => y.assists - x.assists || y.goals - x.goals || x.name.localeCompare(y.name));
