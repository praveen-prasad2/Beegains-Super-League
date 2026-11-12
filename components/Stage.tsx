'use client';

import { useEffect, useState } from 'react';
import { useAuction } from './AuctionProvider';

/** 1920x1080 stage, scaled to fit any window. Hidden until saved state has loaded. */
export default function Stage({ children }: { children: React.ReactNode }) {
  const { ready } = useAuction();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div
      id="stage"
      style={{ transform: `translate(-50%,-50%) scale(${scale})`, visibility: ready ? 'visible' : 'hidden' }}
    >
      {children}
    </div>
  );
}
