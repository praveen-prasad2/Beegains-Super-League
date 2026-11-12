import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { STORAGE_KEY } from '@/lib/config';

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
  let state: { queue?: unknown } | undefined;
  try {
    state = (await req.json())?.state;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!state || typeof state !== 'object' || !Array.isArray(state.queue)) {
    return NextResponse.json({ error: 'Invalid auction state' }, { status: 400 });
  }

  try {
    const doc = await (await collection()).findOneAndUpdate(
      { _id: STORAGE_KEY },
      { $set: { state, updatedAt: new Date() }, $inc: { version: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    return NextResponse.json({ version: doc?.version ?? 0 }, { headers: NO_STORE });
  } catch (e) {
    return fail(e);
  }
}
