import type { Metadata } from 'next';
import TeamsScreen from '@/components/TeamsScreen';

export const metadata: Metadata = { title: 'BSL 2026 · Teams' };

export default function Page() {
  return <TeamsScreen />;
}
