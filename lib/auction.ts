import { CONFIG, POSITION_ORDER, POSITION_RENAMES, STORAGE_KEY, steps } from './config';
import { type FinalScore, type Pair, type Score, type Tournament, finalists, freshTournament, normalizeTournament } from './fixtures';

export type Lot = { name: string; pos: string; again: boolean };
export type BidEntry = { team: number; value: number };
export type Signing = { name: string; pos: string; price: number | null };

export type AuctionState = {
  idx: number;
  done: boolean;
  bid: number | null;
  leader: number | null;
  step: number;
  history: BidEntry[];
  sold: boolean;
  unsold: boolean;
  /** Current lot was given automatically to the only team still missing that position. */
  auto: boolean;
  /** When the current lot's player was drawn (ms); null = not drawn yet, bidding can't start. */
  lotDrawAt: number | null;
  /** First-round draw order this run, per position (names in the order they were drawn). */
  drawOrder: Record<string, string[]>;
  /** Draw order from before the last reset; the next run avoids repeating it. */
  prevDrawOrder: Record<string, string[]>;
  /** queue[idx..] is the pot still to be auctioned; drawing swaps the picked player into queue[idx]. */
  queue: Lot[];
  spent: number[];
  squad: number[];
  bought: Signing[][];
  /** Icon player index (into CONFIG.iconPlayers) per team; null = not drawn yet. */
  icons: (number | null)[];
  /** When each team drew (ms), so every open screen plays that team's reveal in sync. */
  drawTimes: (number | null)[];
  /** The allocation before the last redraw; a redraw never gives a team the same icon again. */
  prevIcons: (number | null)[] | null;
  /** League fixtures, results and final. Kept when the auction is reset. */
  tour: Tournament;
};

/** How long one team's draw spins before revealing (ms). */
export const DRAW_SPIN = 2600;
/** How long the player draw spins before revealing (ms). */
export const LOT_SPIN = 2400;

const posRank = (pos: string) => {
  const r = POSITION_ORDER.indexOf(pos);
  return r < 0 ? POSITION_ORDER.length : r;
};

/**
 * Queue indexes the next player can be drawn from: first-round players before any
 * second-round ones, and within that, only the earliest position in POSITION_ORDER
 * that still has players left (all GKs, then CBs, ...).
 */
export function lotCandidates(s: AuctionState): number[] {
  const pot = s.queue.map((_, i) => i).filter((i) => i >= s.idx);
  const firstRound = pot.filter((i) => !s.queue[i].again);
  const group = firstRound.length ? firstRound : pot;
  if (!group.length) return [];
  const rank = Math.min(...group.map((i) => posRank(s.queue[i].pos)));
  return group.filter((i) => posRank(s.queue[i].pos) === rank);
}

/**
 * Draw the next player at random from the current position group.
 * After a reset, each position avoids last run's order: its first pick differs from last
 * time's first pick, and the sequence never ends up identical to last time's.
 */
export function pickLot(s: AuctionState): number | null {
  const c = lotCandidates(s);
  if (!c.length) return null;
  let pool = c;
  const { pos, again } = s.queue[c[0]];
  const prev = s.prevDrawOrder[pos];
  if (!again && prev?.length) {
    const sofar = s.drawOrder[pos] ?? [];
    // Still following last run's order exactly? Then don't pick last run's next player.
    const repeating = sofar.every((name, k) => prev[k] === name);
    if (repeating && prev[sofar.length]) {
      const avoid = c.filter((i) => s.queue[i].name !== prev[sofar.length]);
      if (avoid.length) pool = avoid;
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export const iconOf = (s: AuctionState, team: number) => {
  const k = s.icons[team];
  return k == null ? null : CONFIG.iconPlayers[k] ?? null;
};

/**
 * Pick a random icon for one team from those still in the pot.
 * After a redraw, the team never gets the icon it had before, and the pick always
 * leaves a valid choice for the teams still to draw.
 */
export function pickIcon(s: AuctionState, team: number): number | null {
  const taken = new Set(s.icons.filter((x) => x != null));
  const free = CONFIG.iconPlayers.map((_, i) => i).filter((i) => !taken.has(i));
  if (!free.length) return null;

  const prev = s.prevIcons;
  const allowed = (t: number, i: number) => !prev || prev[t] == null || prev[t] !== i;
  const feasible = (teams: number[], pool: number[]): boolean => {
    if (!teams.length || !pool.length) return true;
    const [t, ...rest] = teams;
    return pool.some((i) => allowed(t, i) && feasible(rest, pool.filter((x) => x !== i)));
  };
  const waiting = CONFIG.teams.map((_, t) => t).filter((t) => t !== team && s.icons[t] == null);

  const candidates = free.filter((i) => allowed(team, i) && feasible(waiting, free.filter((x) => x !== i)));
  const pool = candidates.length ? candidates : free;
  return pool[Math.floor(Math.random() * pool.length)];
}

export type Action =
  | { type: 'step'; step: number }
  | { type: 'bid'; team: number; amount?: number }
  | { type: 'sold' }
  | { type: 'unsold' }
  | { type: 'next' }
  | { type: 'reset' }
  | { type: 'drawTeam'; team: number; icon: number; at: number }
  | { type: 'redraw' }
  | { type: 'drawLot'; pick: number; at: number }
  | { type: 'drawFixtures'; order: Pair[]; at: number }
  | { type: 'clearFixtures' }
  | { type: 'result'; match: number; score: Score | null }
  | { type: 'finalResult'; score: FinalScore | null }
  | { type: 'load'; state: AuctionState };

export function fresh(): AuctionState {
  return {
    idx: 0, done: false, bid: null, leader: null, step: 0, history: [], sold: false, unsold: false, auto: false,
    lotDrawAt: null,
    drawOrder: {},
    prevDrawOrder: {},
    queue: CONFIG.players.map(([name, pos]) => ({ name, pos, again: false })),
    spent: CONFIG.teams.map(() => 0),
    squad: CONFIG.teams.map(() => 0),
    bought: CONFIG.teams.map(() => []),
    icons: CONFIG.teams.map(() => null),
    drawTimes: CONFIG.teams.map(() => null),
    prevIcons: null,
    tour: freshTournament(),
  };
}

export function loadState(): AuctionState | null {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
  } catch {
    return null;
  }
}

/** Validate a saved state (from the browser or the database) and upgrade older shapes. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalize(s: any): AuctionState | null {
  try {
    const n = CONFIG.teams.length;
    // Discard saved state if it doesn't match the current team setup.
    if (!(s && Array.isArray(s.queue) && s.spent?.length === n && s.squad?.length === n && s.bought?.length === n)) return null;
    // Older saves stored bought players as plain names.
    s.bought = s.bought.map((list: unknown[]) =>
      list.map((p) =>
        typeof p === 'string' ? { name: p, pos: CONFIG.players.find(([nm]) => nm === p)?.[1] ?? '', price: null } : p
      )
    );
    // Older saves have no icon draw.
    if (!Array.isArray(s.icons) || s.icons.length !== n) s.icons = CONFIG.teams.map(() => null);
    // Older saves drew all teams at once with a single drawAt.
    if (!Array.isArray(s.drawTimes) || s.drawTimes.length !== n)
      s.drawTimes = s.icons.map((x: number | null) => (x == null ? null : typeof s.drawAt === 'number' ? s.drawAt : 0));
    delete s.drawAt;
    if (typeof s.auto !== 'boolean') s.auto = false;
    // Renamed positions (DEF → CB, FWD → ST).
    // Saves from before the player draw: a lot already in progress counts as drawn.
    if (!s.drawOrder || typeof s.drawOrder !== 'object') s.drawOrder = {};
    if (!s.prevDrawOrder || typeof s.prevDrawOrder !== 'object') s.prevDrawOrder = {};
    if (typeof s.lotDrawAt !== 'number' && s.lotDrawAt !== null)
      s.lotDrawAt = s.idx > 0 || s.bid != null || s.sold || s.unsold || s.done ? 0 : null;
    const rename = (p: { pos?: string }) =>
      p && typeof p.pos === 'string' && POSITION_RENAMES[p.pos] ? { ...p, pos: POSITION_RENAMES[p.pos] } : p;
    s.queue = s.queue.map(rename);
    s.bought = s.bought.map((list: { pos?: string }[]) => list.map(rename));
    if (!Array.isArray(s.prevIcons) || s.prevIcons.length !== n) s.prevIcons = null;
    s.tour = normalizeTournament(s.tour);
    return s as AuctionState;
  } catch {
    return null;
  }
}

export function saveState(s: AuctionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export const current = (s: AuctionState) => s.queue[s.idx] || s.queue[s.queue.length - 1];
export const locked = (s: AuctionState) => s.sold || s.unsold || s.done || s.lotDrawAt == null;
/** Bid placed by the fixed raise buttons. */
export const nextBid = (s: AuctionState) => (s.bid == null ? CONFIG.basePrice : s.bid + steps()[s.step]);
/** Lowest amount a custom bid may be. */
export const minBid = (s: AuctionState) => (s.bid == null ? CONFIG.basePrice : s.bid + 1);
export const purseLeft = (s: AuctionState, team: number) => CONFIG.totalPurse - s.spent[team];

/** A team may sign only one player per position. */
export const hasPosition = (s: AuctionState, team: number, pos: string) => s.bought[team].some((p) => p.pos === pos);

/** Why a team can't bid right now (shown on its button), or null if it can. */
export function bidBlock(s: AuctionState, team: number, amount = nextBid(s)): string | null {
  if (locked(s)) return '';
  if (s.leader === team) return '';
  const pos = current(s).pos;
  if (hasPosition(s, team, pos)) return `Already has ${pos}`;
  if (s.squad[team] >= CONFIG.squadSize) return 'Squad full';
  if (!Number.isFinite(amount) || amount < minBid(s)) return '';
  if (purseLeft(s, team) < amount) return 'Not enough purse';
  return null;
}

export const canBid = (s: AuctionState, team: number, amount = nextBid(s)) => bidBlock(s, team, amount) === null;

export function statusOf(s: AuctionState) {
  const cur = current(s);
  let status = { label: 'Bidding open', bg: '#C8F03C', fg: '#0A110E' };
  if (s.sold) status = { label: s.auto ? 'Auto allotted' : 'Sold', bg: '#FF7A1A', fg: '#0A110E' };
  else if (s.unsold) status = { label: 'Unsold', bg: '#3A4D43', fg: '#EEF3EF' };
  if (!s.done && s.lotDrawAt == null) status = { label: 'Draw next player', bg: '#F4D35E', fg: '#0A110E' };
  if (s.done) status = { label: 'Auction complete', bg: '#EEF3EF', fg: '#0A110E' };
  else if (cur.again && s.lotDrawAt != null && !s.sold && !s.unsold) status = { label: 'Second round', bg: '#F4D35E', fg: '#0A110E' };
  return status;
}

/**
 * If every other team already has a player in this lot's position, the one team still
 * missing it gets the player straight away at base price (deducted from its purse).
 */
export function autoAllot(s: AuctionState): AuctionState {
  if (locked(s) || s.bid != null) return s;
  const cur = current(s);
  const teams = CONFIG.teams.map((_, t) => t);
  const missing = teams.filter((t) => !hasPosition(s, t, cur.pos));
  if (missing.length !== 1) return s;
  const team = missing[0];
  const price = CONFIG.basePrice;
  if (s.squad[team] >= CONFIG.squadSize || purseLeft(s, team) < price) return s;
  return {
    ...s,
    bid: price,
    leader: team,
    history: [{ team, value: price }],
    sold: true,
    auto: true,
    spent: s.spent.map((x, k) => (k === team ? x + price : x)),
    squad: s.squad.map((x, k) => (k === team ? x + 1 : x)),
    bought: s.bought.map((x, k) => (k === team ? [...x, { name: cur.name, pos: cur.pos, price }] : x)),
  };
}

export function reducer(s: AuctionState, a: Action): AuctionState {
  switch (a.type) {
    case 'load':
      return a.state;
    case 'reset': {
      // Remember this run's draw order (positions not drawn this run keep the older one).
      const drawnNow = Object.fromEntries(Object.entries(s.drawOrder).filter(([, names]) => names.length));
      return { ...fresh(), prevDrawOrder: { ...s.prevDrawOrder, ...drawnNow }, tour: s.tour };
    }
    case 'step':
      return { ...s, step: a.step };
    case 'drawTeam': {
      if (s.icons[a.team] != null || s.icons.includes(a.icon)) return s;
      return {
        ...s,
        icons: s.icons.map((x, t) => (t === a.team ? a.icon : x)),
        drawTimes: s.drawTimes.map((x, t) => (t === a.team ? a.at : x)),
      };
    }
    case 'redraw': {
      if (!s.icons.some((x) => x != null)) return s;
      // Remember this allocation (teams that hadn't drawn keep their older one).
      const prevIcons = s.icons.map((x, t) => x ?? s.prevIcons?.[t] ?? null);
      return { ...s, prevIcons, icons: s.icons.map(() => null), drawTimes: s.drawTimes.map(() => null) };
    }
    case 'bid': {
      const v = a.amount ?? nextBid(s);
      if (!canBid(s, a.team, v)) return s;
      return { ...s, bid: v, leader: a.team, history: [{ team: a.team, value: v }, ...s.history].slice(0, 5) };
    }
    case 'sold': {
      if (locked(s) || s.bid == null || s.leader == null) return s;
      const i = s.leader, bid = s.bid, cur = current(s);
      return {
        ...s,
        sold: true,
        spent: s.spent.map((x, k) => (k === i ? x + bid : x)),
        squad: s.squad.map((x, k) => (k === i ? x + 1 : x)),
        bought: s.bought.map((x, k) => (k === i ? [...x, { name: cur.name, pos: cur.pos, price: bid }] : x)),
      };
    }
    case 'unsold':
      return !locked(s) && s.bid == null ? { ...s, unsold: true } : s;
    case 'next': {
      if (s.done || !(s.sold || s.unsold)) return s;
      const cur = current(s);
      const queue = s.unsold && !cur.again ? [...s.queue, { name: cur.name, pos: cur.pos, again: true }] : s.queue;
      const allFull = s.squad.every((q) => q >= CONFIG.squadSize);
      if (s.idx + 1 >= queue.length || allFull) return { ...s, queue, done: true };
      return {
        ...s, queue, idx: s.idx + 1, bid: null, leader: null, history: [], sold: false, unsold: false, auto: false,
        lotDrawAt: null,
      };
    }
    case 'drawFixtures': {
      if (s.tour.order.length) return s;
      return { ...s, tour: { ...s.tour, order: a.order, drawAt: a.at, results: a.order.map(() => null), final: null } };
    }
    case 'clearFixtures': {
      if (!s.tour.order.length) return s;
      return { ...s, tour: { ...freshTournament(), prevOrder: s.tour.order } };
    }
    case 'result': {
      if (a.match < 0 || a.match >= s.tour.order.length) return s;
      const results = s.tour.results.map((r, i) => (i === a.match ? a.score : r));
      const tour = { ...s.tour, results };
      // If the change alters who reaches the final, the final's result no longer applies.
      const before = finalists(s.tour), after = finalists(tour);
      const same = !!before && !!after && before[0] === after[0] && before[1] === after[1];
      return { ...s, tour: same ? tour : { ...tour, final: null } };
    }
    case 'finalResult':
      return { ...s, tour: { ...s.tour, final: a.score } };
    case 'drawLot': {
      // Swap the drawn player into the current slot, then open bidding (or auto-allot).
      if (s.done || s.lotDrawAt != null || !lotCandidates(s).includes(a.pick)) return s;
      const queue = [...s.queue];
      [queue[s.idx], queue[a.pick]] = [queue[a.pick], queue[s.idx]];
      const lot = queue[s.idx];
      const drawOrder = lot.again
        ? s.drawOrder
        : { ...s.drawOrder, [lot.pos]: [...(s.drawOrder[lot.pos] ?? []), lot.name] };
      return autoAllot({ ...s, queue, lotDrawAt: a.at, drawOrder });
    }
  }
}
