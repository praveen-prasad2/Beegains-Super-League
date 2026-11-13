'use client';

import Link from 'next/link';
import Countdown from './Countdown';

const LINKS = [
  { href: '/draw', label: 'Icon draw', sub: 'Reveal icon players' },
  { href: '/live', label: 'Live bid', sub: 'Auction screen' },
];

export default function AdminSidebar() {
  return (
    <aside className="sb">
      <div className="card sb-nav">
        <span className="label">Auction screens</span>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="sb-link">
            <span className="sb-ltitle cond">{l.label}</span>
            <span className="sb-lsub">{l.sub}</span>
          </Link>
        ))}
      </div>
      <Countdown />
    </aside>
  );
}
