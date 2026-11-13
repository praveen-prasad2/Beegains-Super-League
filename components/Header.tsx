'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOT_SPIN, statusOf } from '@/lib/auction';
import { useSpin } from './useSpin';
import { useAuction } from './AuctionProvider';

const pad = (n: number) => String(n).padStart(2, '0');
/** Main screens: the header tab bar, and the admin sidebar (which hides the tab bar). */
export const TABS = [
  { href: '/', label: 'Home' },
  { href: '/teams', label: 'Teams' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/points', label: 'Points' },
  { href: '/stats', label: 'Stats' },
  { href: '/admin', label: 'Admin' },
];

/** Auction screens (header title reads "Player Auction"); the rest are league screens. */
const AUCTION = ['/live', '/teams', '/draw'];
/** Pages that show the auction's player counter and status chip. */
const AUCTION_PAGES = ['/live'];

const SYNC_LABEL = { connecting: 'Connecting', saving: 'Saving', saved: 'Saved', offline: 'Offline' };
const SYNC_TITLE = {
  connecting: 'Connecting to the database…',
  saving: 'Saving to the database…',
  saved: 'All changes saved to the database',
  offline: 'Database unreachable. Changes are kept on this device and will be saved when it reconnects.',
};

/** `nav={false}` hides the tab bar (the admin panel shows the tabs in its sidebar instead). */
export default function Header({ nav = true }: { nav?: boolean }) {
  const { S, sync } = useAuction();
  const path = usePathname();
  // Inside the admin panel's embedded view the panel's sidebar does the navigating.
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => setEmbedded(window.self !== window.top), []);
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
        {nav && !embedded && (
          <nav className="tabs" aria-label="Screens">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className={`tab${path === t.href ? ' on' : ''}`}>
                {t.label}
              </Link>
            ))}
          </nav>
        )}
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
