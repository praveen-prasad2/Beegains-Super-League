import type { Metadata } from 'next';
import StatsScreen from '@/components/StatsScreen';

export const metadata: Metadata = { title: 'BSL 2026 · Stats' };

export default function Page() {
  return <StatsScreen />;
}
