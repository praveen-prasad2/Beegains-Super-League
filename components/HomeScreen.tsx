'use client';

import Image from 'next/image';
import { TEAM_COLORS, TEAM_LOGOS } from '@/lib/config';
import { useAuction } from './AuctionProvider';
import Countdown from './Countdown';
import Header from './Header';
import Stage from './Stage';

export default function HomeScreen() {
  const { teams } = useAuction();

  return (
    <Stage>
      <Header />
      <div className="hm">
        <Countdown big title="Countdown to kick-off" />
        <div className="hm-teams" style={{ gridTemplateColumns: `repeat(${teams.length},minmax(0,1fr))` }}>
          {teams.map((t, i) => (
            <div key={i} className="card hm-team" style={{ borderTopColor: TEAM_COLORS[i] }}>
              <span className="label">{t}</span>
              {TEAM_LOGOS[i] ? (
                <Image
                  className="hm-logo"
                  src={TEAM_LOGOS[i]!.src}
                  alt={t}
                  width={TEAM_LOGOS[i]!.w}
                  height={TEAM_LOGOS[i]!.h}
                  priority
                />
              ) : (
                <span className="hm-name cond" style={{ color: TEAM_COLORS[i] }}>
                  {t}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}
