import type { Metadata } from 'next';
import AdminScreen from '@/components/AdminScreen';
import AdminLogin from '@/components/AdminLogin';
import { isAdmin } from '@/lib/adminAuth';

export const metadata: Metadata = { title: 'BSL 2026 · Admin' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return (await isAdmin()) ? <AdminScreen /> : <AdminLogin />;
}
