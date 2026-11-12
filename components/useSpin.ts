'use client';

import { useEffect, useState } from 'react';

/**
 * Is a draw that started at `at` (ms timestamp) still spinning?
 * Driven by the saved timestamp, so every open screen spins and reveals together.
 */
export function useSpin(at: number | null, dur: number) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (at == null) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t - at < dur) timer = setTimeout(tick, 60);
    };
    tick();
    return () => clearTimeout(timer);
  }, [at, dur]);

  if (at == null) return { spinning: false, elapsed: 0 };
  const elapsed = Math.max(0, (now ?? Date.now()) - at);
  return { spinning: elapsed < dur, elapsed };
}
