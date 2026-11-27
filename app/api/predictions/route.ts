import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { CONFIG, PREDICT_DEADLINE, PREDICT_DEADLINE_LABEL, STORAGE_KEY } from '@/lib/config';
import { isAdmin } from '@/lib/adminAuth';
import { parsePrediction } from '@/lib/predictions';
import { DRAW_ID, NO_STORE, draws, fail, isDuplicateKey, predictions, toDraw, toPrediction } from '@/lib/predictionsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Saved auction state: current team names and whether the final has a result yet. */
async function league() {
  const doc = await (await getDb()).collection<{ _id: string; state?: any }>('auctions').findOne({ _id: STORAGE_KEY });
  const s = doc?.state ?? {};
  const teams = CONFIG.teams.map((d, i) => String(s.teamNames?.[i] ?? '').trim() || d);
  return { teams, finalPlayed: !!s.tour?.final };
}

/** Public: submit a prediction. One per phone number. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (Date.now() >= PREDICT_DEADLINE)
    return NextResponse.json({ error: `Predictions closed at ${PREDICT_DEADLINE_LABEL}` }, { status: 403 });
  const p = parsePrediction(body, CONFIG.teams.length);
  if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });

  try {
    const { teams, finalPlayed } = await league();
    if (finalPlayed)
      return NextResponse.json({ error: 'Predictions are closed: the final has been played' }, { status: 403 });
    const col = await predictions();
    const doc = { key: STORAGE_KEY, name: p.name, phone: p.phone, team: p.team, teamName: teams[p.team], score: p.score, createdAt: new Date() };
    await col.insertOne(doc);
    return NextResponse.json({ ok: true, prediction: toPrediction(doc) }, { headers: NO_STORE });
  } catch (e) {
    if (isDuplicateKey(e))
      return NextResponse.json({ error: 'This phone number has already made a prediction' }, { status: 409 });
    return fail('predictions', e);
  }
}

/** Admin: every prediction (oldest first) and the current draw. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Admin only' }, { status: 401 });
  try {
    const list = await (await predictions()).find({ key: STORAGE_KEY }).sort({ createdAt: 1 }).toArray();
    const draw = await (await draws()).findOne({ _id: DRAW_ID });
    return NextResponse.json({ predictions: list.map(toPrediction), draw: toDraw(draw) }, { headers: NO_STORE });
  } catch (e) {
    return fail('predictions', e);
  }
}

/** Admin: remove one prediction (?id=…). If it had won the draw, the draw is cleared too. */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Admin only' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await (await predictions()).deleteOne({ _id: new ObjectId(id), key: STORAGE_KEY });
    await (await draws()).deleteOne({ _id: DRAW_ID, 'winner.id': id });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    return fail('predictions', e);
  }
}
