import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import DrawScreen from '@/components/DrawScreen';
import { isAdmin } from '@/lib/adminAuth';

export const metadata: Metadata = { title: 'BSL 2026 · Icon Draw' };
export const dynamic = 'force-dynamic';

/** Icon draw: admin only. Non-admins are sent to the admin login. */
export default async function Page() {
  if (!(await isAdmin())) redirect('/admin');
  return <DrawScreen />;
}
