'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { STORAGE_KEY } from '@/lib/config';
import { type Action, type AuctionState, fresh, loadState, normalize, reducer, saveState, teamNames } from '@/lib/auction';

export type SyncStatus = 'connecting' | 'saved' | 'saving' | 'offline';

type Ctx = { S: AuctionState; dispatch: (a: Action) => void; ready: boolean; sync: SyncStatus; /** Current team names. */ teams: string[] };
const AuctionContext = createContext<Ctx | null>(null);

const API = '/api/auction';
const POLL_MS = 1000;

/**
 * Holds the auction state for every page.
 * MongoDB (via /api/auction) is the source of truth, shared by every device;
 * localStorage is a fast local cache so the screen renders instantly and survives offline.
 */
export default function AuctionProvider({ children }: { children: React.ReactNode }) {
  const [S, rawDispatch] = useReducer(reducer, undefined, fresh);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncStatus>('connecting');

  const stateRef = useRef(S);
  const version = useRef(0); // last server version we know about
  const dirty = useRef(false); // S changed by a local action → must be saved
  const queued = useRef<AuctionState | null>(null); // latest state waiting to be saved
  const saving = useRef(false);

  // Local actions (clicks) are saved; remote loads are not.
  const dispatch = useCallback((a: Action) => {
    dirty.current = true;
    rawDispatch(a);
  }, []);

  // Send the newest queued state, one request at a time, so saves never arrive out of order.
  const flush = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      while (queued.current) {
        const st = queued.current;
        setSync('saving');
        const r = await fetch(API, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ state: st }),
        });
        if (!r.ok) throw new Error(`save failed: ${r.status}`);
        const d = await r.json();
        // If the server ignored admin-only changes (not logged in), force a reload of its copy.
        version.current = d.corrected ? 0 : d.version;
        if (queued.current === st) queued.current = null;
      }
      setSync('saved');
    } catch {
      setSync('offline'); // queued state is kept and retried on the next poll
    } finally {
      saving.current = false;
    }
  }, []);

  // Pick up changes from other devices.
  const poll = useCallback(async () => {
    if (saving.current) return;
    if (queued.current) return flush();
    try {
      const r = await fetch(API, { cache: 'no-store' });
      if (!r.ok) throw new Error(`load failed: ${r.status}`);
      const d = await r.json();
      if (saving.current || queued.current) return; // a local change happened meanwhile; it wins
      if (d.state == null) {
        // Empty database: seed it with what this screen has.
        queued.current = stateRef.current;
        return flush();
      }
      if (d.version > version.current) {
        version.current = d.version;
        const st = normalize(d.state);
        if (st) rawDispatch({ type: 'load', state: st });
      }
      setSync('saved');
    } catch {
      setSync('offline');
    }
  }, [flush]);

  useEffect(() => {
    // 1. Instant render from the local cache.
    const cached = loadState();
    if (cached) rawDispatch({ type: 'load', state: cached });

    // 2. Then the database; show the screen once it answers (or after 3s, offline).
    let alive = true;
    const giveUp = setTimeout(() => alive && setReady(true), 3000);
    poll().finally(() => alive && setReady(true));
    const timer = setInterval(poll, POLL_MS);

    // Same-machine tabs update instantly through storage events.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const st = loadState();
      if (st) rawDispatch({ type: 'load', state: st });
    };
    window.addEventListener('storage', onStorage);

    return () => {
      alive = false;
      clearTimeout(giveUp);
      clearInterval(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, [poll]);

  const initial = useRef(S);
  useEffect(() => {
    stateRef.current = S;
    if (S === initial.current) return; // don't overwrite the cache with the blank first render
    saveState(S);
    if (dirty.current) {
      dirty.current = false;
      queued.current = S;
      flush();
    }
  }, [S, flush]);

  const teams = useMemo(() => teamNames(S), [S]);
  return <AuctionContext.Provider value={{ S, dispatch, ready, sync, teams }}>{children}</AuctionContext.Provider>;
}

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used inside <AuctionProvider>');
  return ctx;
}
