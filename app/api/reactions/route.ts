import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { CONFIG, REACTION_BASE, STORAGE_KEY } from '@/lib/config';
import { isAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fire reactions per team, kept apart from the auction state so taps are atomic $inc's. */
type ReactionDoc = { _id: string; counts: Record<string, number> };

const NO_STORE = { 'cache-control': 'no-store' };
const ID = `${STORAGE_KEY}-reactions`;
/** Most taps one request may add (a burst of quick taps is sent together). */
const MAX_BATCH = 20;

const collection = async () => (await getDb()).collection<ReactionDoc>('reactions');
/** Shown count = starting value + taps stored in the database. */
const totals = (doc: ReactionDoc | null) => CONFIG.teams.map((_, i) => (REACTION_BASE[i] ?? 0) + (doc?.counts?.[i] ?? 0));

function fail(e: unknown) {
  console.error('[api/reactions]', e);
  return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers: NO_STORE });
}

export async function GET() {
  try {
    return NextResponse.json({ counts: totals(await (await collection()).findOne({ _id: ID })) }, { headers: NO_STORE });
  } catch (e) {
    return fail(e);
  }
}

/** Body: { team: number, n?: number } → adds n (default 1) fire reactions to that team. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const team = body?.team;
  const n = Math.min(MAX_BATCH, Math.max(1, Math.floor(Number(body?.n ?? 1)) || 1));
  if (!Number.isInteger(team) || team < 0 || team >= CONFIG.teams.length) {
    return NextResponse.json({ error: 'Invalid team' }, { status: 400 });
  }
  try {
    const doc = await (await collection()).findOneAndUpdate(
      { _id: ID },
      { $inc: { [`counts.${team}`]: n } },
      { upsert: true, returnDocument: 'after' }
    );
    return NextResponse.json({ counts: totals(doc) }, { headers: NO_STORE });
  } catch (e) {
    return fail(e);
  }
}

/** Admin only: clear every team's taps (counts go back to REACTION_BASE). */
export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });
  try {
    await (await collection()).updateOne({ _id: ID }, { $set: { counts: {} } }, { upsert: true });
    return NextResponse.json({ counts: totals(null) }, { headers: NO_STORE });
  } catch (e) {
    return fail(e);
  }
}
