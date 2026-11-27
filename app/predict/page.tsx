import type { Metadata } from 'next';
import PredictScreen from '@/components/PredictScreen';

export const metadata: Metadata = { title: 'BSL 2026 · Predict the Champion' };

export default function Page() {
  return <PredictScreen />;
}
