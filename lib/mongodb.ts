import { MongoClient } from 'mongodb';

// Reuse one connection across requests (and across hot reloads in dev).
const g = globalThis as unknown as { _bslMongo?: Promise<MongoClient> };

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (add it to .env.local)');
  if (!g._bslMongo) {
    g._bslMongo = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect().catch((e) => {
      g._bslMongo = undefined; // allow a retry on the next request
      throw e;
    });
  }
  return (await g._bslMongo).db(process.env.MONGODB_DB || 'bsl-auction');
}
