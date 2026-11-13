import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuctionScreen from '@/components/AuctionScreen';
import { isAdmin } from '@/lib/adminAuth';

export const metadata: Metadata = { title: 'BSL 2026 · Live Bid' };
export const dynamic = 'force-dynamic';

/** Live bid screen: admin only. Non-admins are sent to the admin login. */
export default async function Page() {
  if (!(await isAdmin())) redirect('/admin');
  return <AuctionScreen />;
}
