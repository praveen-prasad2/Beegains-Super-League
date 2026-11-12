import type { Metadata } from 'next';
import FixturesScreen from '@/components/FixturesScreen';

export const metadata: Metadata = { title: 'BSL 2026 · Fixtures' };

export default function Page() {
  return <FixturesScreen />;
}
