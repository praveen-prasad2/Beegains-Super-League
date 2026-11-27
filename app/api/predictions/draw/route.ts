import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { CONFIG, STORAGE_KEY } from '@/lib/config';
import { isAdmin } from '@/lib/adminAuth';
import { MAX_GOALS, type PredDraw } from '@/lib/predictions';
import { DRAW_ID, NO_STORE, draws, fail, predictions, toDraw } from '@/lib/predictionsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const goals = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= MAX_GOALS ? (v as number) : null);

/**
 * Admin: draw one winner among everyone who picked `team` as champion.
 * With `exact` ({c, o}), only those who also got the final score right are in the draw.
 * The pick is made here on the server, so it cannot be steered from the browser.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Admin only' }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const team = Number(body?.team);
  if (!Number.isInteger(team) || team < 0 || team >= CONFIG.teams.length)
    return NextResponse.json({ error: 'Pick the champion team' }, { status: 400 });
  let exact: { c: number; o: number } | null = null;
  if (body?.exact) {
    const c = goals(body.exact.c);
    const o = goals(body.exact.o);
    if (c == null || o == null) return NextResponse.json({ error: 'Invalid final score' }, { status: 400 });
    exact = { c, o };
  }

  try {
    const filter = { key: STORAGE_KEY, team, ...(exact ? { 'score.c': exact.c, 'score.o': exact.o } : {}) };
    const pool = await (await predictions()).find(filter).sort({ createdAt: 1 }).toArray();
    if (!pool.length) return NextResponse.json({ error: 'Nobody is in this draw' }, { status: 400 });
    const w = pool[randomInt(pool.length)];
    const draw: PredDraw = {
      team,
      pool: exact ? 'exact' : 'all',
      poolSize: pool.length,
      winner: { id: String(w._id), name: w.name, phone: w.phone },
      at: new Date().toISOString(),
    };
    const { at, ...rest } = draw;
    await (await draws()).replaceOne({ _id: DRAW_ID }, { ...rest, at: new Date(at) }, { upsert: true });
    return NextResponse.json({ draw }, { headers: NO_STORE });
  } catch (e) {
    return fail('predictions/draw', e);
  }
}

/** Admin: clear the draw result. */
export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Admin only' }, { status: 401 });
  try {
    await (await draws()).deleteOne({ _id: DRAW_ID });
    return NextResponse.json({ draw: toDraw(null) }, { headers: NO_STORE });
  } catch (e) {
    return fail('predictions/draw', e);
  }
}
