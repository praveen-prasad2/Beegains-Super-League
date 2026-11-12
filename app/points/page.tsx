import type { Metadata } from 'next';
import PointsScreen from '@/components/PointsScreen';

export const metadata: Metadata = { title: 'BSL 2026 · Points Table' };

export default function Page() {
  return <PointsScreen />;
}
