import type { Metadata } from 'next';
import TeamsScreen from '@/components/TeamsScreen';
import { isAdmin } from '@/lib/adminAuth';

export const metadata: Metadata = { title: 'BSL 2026 · Teams' };

/** Public: squads by position, no amounts. `?view=admin` (logged-in admin only, used by the admin panel): full layout. */
export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const full = (await searchParams).view === 'admin' && (await isAdmin());
  return <TeamsScreen full={full} />;
}
