import type { Metadata } from 'next';
import HomeScreen from '@/components/HomeScreen';

export const metadata: Metadata = { title: 'BSL 2026 · Home' };

export default function Page() {
  return <HomeScreen />;
}
