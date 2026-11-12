'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOT_SPIN, statusOf } from '@/lib/auction';
import { useSpin } from './useSpin';
import { useAuction } from './AuctionProvider';

const pad = (n: number) => String(n).padStart(2, '0');
const TABS = [
  { href: '/draw', label: 'Icon draw' },
  { href: '/', label: 'Live bid' },
  { href: '/teams', label: 'Teams' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/points', label: 'Points' },
  { href: '/stats', label: 'Stats' },
  { href: '/admin', label: 'Admin' },
];

/** Auction screens (header title reads "Player Auction"); the rest are league screens. */
const AUCTION = ['/', '/teams', '/draw'];
/** Pages that show the auction's player counter and status chip. */
const AUCTION_PAGES = ['/'];

const SYNC_LABEL = { connecting: 'Connecting', saving: 'Saving', saved: 'Saved', offline: 'Offline' };
const SYNC_TITLE = {
  connecting: 'Connecting to the database…',
  saving: 'Saving to the database…',
  saved: 'All changes saved to the database',
  offline: 'Database unreachable. Changes are kept on this device and will be saved when it reconnects.',
};

export default function Header() {
  const { S, sync } = useAuction();
  const path = usePathname();
  const { spinning } = useSpin(S.lotDrawAt, LOT_SPIN);
  const status = spinning ? { label: 'Drawing player…', bg: '#F4D35E', fg: '#0A110E' } : statusOf(S);

  return (
    <div className="header">
      <div className="brand">
        <Image src="/bsl-logo.png" alt="BSL – Beegains Super League 2026" width={4000} height={926} priority />
        <div className="divider" />
        <div>
          <div className="title cond">{AUCTION.includes(path) ? 'Player Auction' : 'League'}</div>
          <div className="sub">Season 2026 · Beegains</div>
        </div>
      </div>
      <div className="chips">
        <nav className="tabs" aria-label="Screens">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={`tab${path === t.href ? ' on' : ''}`}>
              {t.label}
            </Link>
          ))}
        </nav>
        {AUCTION_PAGES.includes(path) && (
          <>
            <div className="chip">
              Player{' '}
              <b>
                {pad(Math.min(S.idx + 1, S.queue.length))} / {pad(S.queue.length)}
              </b>
            </div>
            <div className="status" style={{ background: status.bg, color: status.fg }}>
              {status.label}
            </div>
          </>
        )}
        <div className={`sync ${sync}`} title={SYNC_TITLE[sync]}>
          <span className="sync-dot" />
          {SYNC_LABEL[sync]}
        </div>
      </div>
    </div>
  );
}
