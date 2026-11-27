// Server-side only: MongoDB access for winner predictions.
import { NextResponse } from 'next/server';
import type { ObjectId } from 'mongodb';
import { getDb } from './mongodb';
import { STORAGE_KEY } from './config';
import type { PredDraw, PredScore, Prediction } from './predictions';

export type PredictionDoc = {
  _id?: ObjectId;
  /** Season key, so a later season starts with an empty list. */
  key: string;
  name: string;
  phone: string;
  team: number;
  teamName: string;
  score: PredScore;
  createdAt: Date;
};
type DrawDoc = { _id: string } & Omit<PredDraw, 'at'> & { at: Date };

export const NO_STORE = { 'cache-control': 'no-store' };

const g = globalThis as unknown as { _bslPredIdx?: Promise<unknown> };

/** Predictions collection; one prediction per phone number per season is enforced by a unique index. */
export async function predictions() {
  const col = (await getDb()).collection<PredictionDoc>('predictions');
  if (!g._bslPredIdx) {
    g._bslPredIdx = col.createIndex({ key: 1, phone: 1 }, { unique: true }).catch((e) => {
      g._bslPredIdx = undefined;
      throw e;
    });
  }
  await g._bslPredIdx;
  return col;
}

export const draws = async () => (await getDb()).collection<DrawDoc>('predictionDraws');

export const DRAW_ID = STORAGE_KEY;

export const toPrediction = (d: PredictionDoc): Prediction => ({
  id: String(d._id),
  name: d.name,
  phone: d.phone,
  team: d.team,
  teamName: d.teamName,
  score: d.score,
  createdAt: d.createdAt.toISOString(),
});

export const toDraw = (d: DrawDoc | null): PredDraw | null =>
  d ? { team: d.team, pool: d.pool, poolSize: d.poolSize, winner: d.winner, at: d.at.toISOString() } : null;

export function fail(where: string, e: unknown) {
  console.error(`[api/${where}]`, e);
  return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers: NO_STORE });
}

export const isDuplicateKey = (e: unknown) => (e as { code?: number })?.code === 11000;
