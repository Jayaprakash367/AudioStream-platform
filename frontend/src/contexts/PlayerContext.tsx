'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useSpotifyPlayer, PlaybackState, PlayerActions } from '@/hooks/useSpotifyPlayer';

interface PlayerContextType {
  playback: PlaybackState;
  controls: PlayerActions;
  error: string | null;
  isSDKLoaded: boolean;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { state, actions, error, isSDKLoaded } = useSpotifyPlayer();

  const value = useMemo(
    () => ({ playback: state, controls: actions, error, isSDKLoaded }),
    [state, actions, error, isSDKLoaded]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
