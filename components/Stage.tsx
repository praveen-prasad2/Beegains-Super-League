'use client';

import { useEffect, useState } from 'react';
import { useAuction } from './AuctionProvider';

/** Below this window width the app drops the scaled 1920x1080 stage for a normal scrolling layout. */
export const FLUID_BELOW = 1100;

/**
 * Wide screens (TV, projector, laptop): a 1920x1080 stage scaled to fit the window.
 * Phones, tablets and narrow windows: a stacked layout that scrolls (html gets the `fluid` class;
 * the styles are in the "Responsive" section of globals.css).
 * Pages embedded in the admin panel always keep the stage, so the admin sees the TV layout.
 * Hidden until saved state has loaded.
 */
export default function Stage({ children }: { children: React.ReactNode }) {
  const { ready } = useAuction();
  const [scale, setScale] = useState(1);
  const [fluid, setFluid] = useState(false);

  useEffect(() => {
    const embedded = window.self !== window.top;
    const fit = () => {
      const f = !embedded && window.innerWidth < FLUID_BELOW;
      setFluid(f);
      document.documentElement.classList.toggle('fluid', f);
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('resize', fit);
      document.documentElement.classList.remove('fluid');
    };
  }, []);

  return (
    <div
      id="stage"
      style={{
        transform: fluid ? undefined : `translate(-50%,-50%) scale(${scale})`,
        visibility: ready ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  );
}
