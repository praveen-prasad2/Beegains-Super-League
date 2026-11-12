import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_HOURS, authConfigured, checkCredentials, makeToken } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Log in as admin: sets a signed, HttpOnly session cookie. */
export async function POST(req: Request) {
  if (!authConfigured())
    return NextResponse.json({ error: 'Admin login is not set up on the server (.env.local)' }, { status: 500 });
  let email = '', password = '';
  try {
    const b = await req.json();
    email = String(b?.email ?? '');
    password = String(b?.password ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (!checkCredentials(email, password)) {
    await wait(800); // slow down password guessing
    return NextResponse.json({ error: 'Wrong email or password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}
