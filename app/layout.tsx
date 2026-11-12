import type { Metadata } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import AuctionProvider from '@/components/AuctionProvider';
import './globals.css';

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-cond' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BSL 2026 · Live Bid Screen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${inter.variable}`}>
      <body>
        <AuctionProvider>{children}</AuctionProvider>
      </body>
    </html>
  );
}
