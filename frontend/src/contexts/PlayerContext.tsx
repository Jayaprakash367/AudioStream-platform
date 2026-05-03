'use client';

/**
 * PlayerContext — thin wrapper around the zustand usePlayerStore.
 *
 * Auralux X streams via iTunes / JioSaavn (HTML5 Audio). The zustand
 * store in lib/store.ts already drives the actual <audio> element.
 * NowPlayingBar and other consumers that import from PlayerContext are
 * re-pointed to use usePlayerStore directly below.
 */

import React, { createContext, useContext } from 'react';
import { usePlayerStore } from '@/lib/store';

// ─── Context ────────────────────────────────────────────────────────────────

type PlayerContextValue = ReturnType<typeof usePlayerStore>;

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // usePlayerStore is a singleton zustand store — safe to call here.
  const store = usePlayerStore();
  return <PlayerContext.Provider value={store}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}
