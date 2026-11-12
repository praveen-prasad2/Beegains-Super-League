// Server-side only: imported by route handlers and server components.
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/** Admin login: credentials and signing secret come from .env.local, never from client code. */
export const ADMIN_COOKIE = 'bsl_admin';
export const SESSION_HOURS = 12;

const env = (k: string) => process.env[k] ?? '';
const digest = (s: string) => createHash('sha256').update(s).digest();
/** Constant-time string compare (hashing first makes the lengths equal). */
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export const authConfigured = () => !!(env('ADMIN_EMAIL') && env('ADMIN_PASSWORD') && env('ADMIN_SECRET'));

export function checkCredentials(email: string, password: string) {
  if (!authConfigured()) return false;
  const okEmail = same(email.trim().toLowerCase(), env('ADMIN_EMAIL').trim().toLowerCase());
  const okPass = same(password, env('ADMIN_PASSWORD'));
  return okEmail && okPass;
}

const sign = (payload: string) => createHmac('sha256', env('ADMIN_SECRET')).update(payload).digest('hex');

/** Session token: "<expiry ms>.<hmac>". */
export function makeToken() {
  const exp = String(Date.now() + SESSION_HOURS * 3600_000);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token: string | undefined) {
  if (!token || !authConfigured()) return false;
  const [exp, mac] = token.split('.');
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return same(mac, sign(exp));
}

export async function isAdmin() {
  return verifyToken((await cookies()).get(ADMIN_COOKIE)?.value);
}
