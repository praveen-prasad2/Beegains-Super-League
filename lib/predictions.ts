/** Winner prediction: shared between the public form, the API and the admin panel. */

/** Predicted final score: champion's goals vs the other finalist's. Level = won on penalties. */
export type PredScore = { c: number; o: number };

export type Prediction = {
  id: string;
  name: string;
  phone: string;
  team: number;
  /** Team name when the prediction was made (teams can be renamed later). */
  teamName: string;
  score: PredScore;
  createdAt: string;
};

/** Draw among the people who picked the champion. `pool` = who could win it. */
export type PredDraw = {
  team: number;
  pool: 'all' | 'exact';
  poolSize: number;
  winner: { id: string; name: string; phone: string };
  at: string;
};

export const MAX_GOALS = 20;
export const NAME_MAX = 60;

/** Digits only, Indian +91 / 0 prefix removed. Returns null unless it is a 10-digit mobile number. */
export function normalizePhone(raw: string): string | null {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/** "98•••••210": enough to recognise on a shared screen, not enough to call. */
export const maskPhone = (p: string) => (p.length > 5 ? p.slice(0, 2) + '•'.repeat(p.length - 5) + p.slice(-3) : p);

export const cleanName = (raw: unknown) => String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

const goals = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= MAX_GOALS ? n : null;
};

/** Validates a submitted prediction; returns the clean values or an error message. */
export function parsePrediction(
  body: any,
  teamCount: number
): { ok: true; name: string; phone: string; team: number; score: PredScore } | { ok: false; error: string } {
  const name = cleanName(body?.name);
  if (name.length < 2) return { ok: false, error: 'Enter your name' };
  const phone = normalizePhone(body?.phone);
  if (!phone) return { ok: false, error: 'Enter a valid 10-digit mobile number' };
  const team = Number(body?.team);
  if (!Number.isInteger(team) || team < 0 || team >= teamCount) return { ok: false, error: 'Pick a champion' };
  const c = goals(body?.score?.c);
  const o = goals(body?.score?.o);
  if (c == null || o == null) return { ok: false, error: `Enter a score from 0 to ${MAX_GOALS}` };
  if (c < o) return { ok: false, error: 'The champion cannot score fewer goals than the other team' };
  return { ok: true, name, phone, team, score: { c, o } };
}
