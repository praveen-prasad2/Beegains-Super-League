import type { Metadata } from 'next';
import DrawScreen from '@/components/DrawScreen';

export const metadata: Metadata = { title: 'BSL 2026 · Icon Draw' };

export default function Page() {
  return <DrawScreen />;
}
