import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { CONFIG, STORAGE_KEY } from '@/lib/config';
import { freshTournament } from '@/lib/fixtures';
import { isAdmin } from '@/lib/adminAuth';

/** Parts of the state only a logged-in admin may change. */
const ADMIN_FIELDS = { tour: freshTournament, teamNames: () => [...CONFIG.teams] } as const;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AuctionDoc = { _id: string; state: unknown; version: number; updatedAt: Date };

const NO_STORE = { 'cache-control': 'no-store' };
const collection = async () => (await getDb()).collection<AuctionDoc>('auctions');

function fail(e: unknown) {
  console.error('[api/auction]', e);
  return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers: NO_STORE });
}

/** Current auction state and its version (0 = nothing saved yet). */
export async function GET() {
  try {
    const doc = await (await collection()).findOne({ _id: STORAGE_KEY });
    return NextResponse.json({ state: doc?.state ?? null, version: doc?.version ?? 0 }, { headers: NO_STORE });
  } catch (e) {
    return fail(e);
  }
}

/** Replace the auction state; returns the new version. */
export async function PUT(req: Request) {
  let state: { queue?: unknown; [k: string]: unknown } | undefined;
  try {
    state = (await req.json())?.state;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!state || typeof state !== 'object' || !Array.isArray(state.queue)) {
    return NextResponse.json({ error: 'Invalid auction state' }, { status: 400 });
  }

  try {
    const col = await collection();
    // Non-admins can run the auction, but their copy of the admin-only fields is ignored:
    // the stored fixtures, results and team names are kept.
    let corrected = false;
    if (!(await isAdmin())) {
      const stored = ((await col.findOne({ _id: STORAGE_KEY }))?.state ?? {}) as Record<string, unknown>;
      for (const [k, def] of Object.entries(ADMIN_FIELDS)) {
        const keep = stored[k] ?? def();
        if (JSON.stringify(state[k]) !== JSON.stringify(keep)) corrected = true;
        state[k] = keep;
      }
    }
    const doc = await col.findOneAndUpdate(
      { _id: STORAGE_KEY },
      { $set: { state, updatedAt: new Date() }, $inc: { version: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    // corrected = this screen tried to change admin-only data; it should reload the stored state.
    return NextResponse.json({ version: doc?.version ?? 0, corrected }, { headers: NO_STORE });
  } catch (e) {
    return fail(e);
  }
}
