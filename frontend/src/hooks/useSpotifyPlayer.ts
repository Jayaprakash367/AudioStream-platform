'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appConfig } from '@/lib/config';

// Spotify SDK types
declare global {
  interface Window {
    Spotify: {
      Player: new (config: SpotifyPlayerConfig) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayerConfig {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume: number;
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string) => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  setName: (name: string) => Promise<void>;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  activateElement: () => Promise<void>;
}

interface SpotifyPlaybackState {
  context: { uri: string | null; metadata: Record<string, string> };
  disallows: Record<string, boolean>;
  duration: number;
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrackWindow;
    previous_tracks: SpotifyTrackWindow[];
    next_tracks: SpotifyTrackWindow[];
  };
  timestamp: number;
}

interface SpotifyTrackWindow {
  uri: string;
  id: string;
  type: string;
  media_type: string;
  name: string;
  is_playable: boolean;
  album: {
    uri: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  artists: Array<{ uri: string; name: string }>;
  duration_ms: number;
}

// Player state for our app
export interface PlaybackState {
  isReady: boolean;
  isActive: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  track: {
    id: string;
    uri: string;
    name: string;
    artist: string;
    artists: Array<{ name: string; uri: string }>;
    album: string;
    albumArt: string;
    duration: number;
  } | null;
  position: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeatMode: number;
  deviceId: string | null;
  nextTracks: Array<{ id: string; name: string; artist: string; albumArt: string }>;
  previousTracks: Array<{ id: string; name: string; artist: string; albumArt: string }>;
}

export interface PlayerActions {
  play: (uri?: string, contextUri?: string, offset?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  setRepeatMode: (mode: number) => Promise<void>;
  transferPlayback: () => Promise<void>;
}

interface UseSpotifyPlayerReturn {
  state: PlaybackState;
  actions: PlayerActions;
  error: string | null;
  isSDKLoaded: boolean;
}

const initialPlaybackState: PlaybackState = {
  isReady: false,
  isActive: false,
  isPlaying: false,
  isPaused: true,
  track: null,
  position: 0,
  duration: 0,
  volume: appConfig.defaultVolume,
  shuffle: false,
  repeatMode: 0,
  deviceId: null,
  nextTracks: [],
  previousTracks: [],
};

export function useSpotifyPlayer(): UseSpotifyPlayerReturn {
  const { getAccessToken, isAuthenticated, isPremium } = useAuth();
  const [state, setState] = useState<PlaybackState>(initialPlaybackState);
  const [error, setError] = useState<string | null>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  const playerRef = useRef<SpotifyPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Spotify SDK script
  useEffect(() => {
    if (!isAuthenticated || !isPremium) return;

    if (window.Spotify) {
      setIsSDKLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    window.onSpotifyWebPlaybackSDKReady = () => {
      setIsSDKLoaded(true);
    };

    document.body.appendChild(script);
  }, [isAuthenticated, isPremium]);

  // Initialize player when SDK is ready
  useEffect(() => {
    if (!isSDKLoaded || !isAuthenticated || !isPremium) return;

    async function initPlayer() {
      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Failed to get access token');
          return;
        }
        tokenRef.current = token;

        const player = new window.Spotify.Player({
          name: appConfig.playerName,
          getOAuthToken: async (cb: (token: string) => void) => {
            const freshToken = await getAccessToken();
            if (freshToken) {
              tokenRef.current = freshToken;
              cb(freshToken);
            }
          },
          volume: appConfig.defaultVolume,
        });

        // Error handling
        player.addListener('initialization_error', ({ message }: { message: string }) => {
          console.error('Initialization error:', message);
          setError(`Player initialization failed: ${message}`);
        });

        player.addListener('authentication_error', ({ message }: { message: string }) => {
          console.error('Authentication error:', message);
          setError(`Authentication error: ${message}`);
        });

        player.addListener('account_error', ({ message }: { message: string }) => {
          console.error('Account error:', message);
          setError('Spotify Premium is required for playback');
        });

        player.addListener('playback_error', ({ message }: { message: string }) => {
          console.error('Playback error:', message);
          setError(`Playback error: ${message}`);
        });

        // Ready
        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          console.log('Spotify Player ready, device ID:', device_id);
          deviceIdRef.current = device_id;
          setState((prev) => ({ ...prev, isReady: true, deviceId: device_id }));
          setError(null);
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
          console.log('Player not ready, device ID:', device_id);
          setState((prev) => ({ ...prev, isReady: false }));
        });

        // State changed
        player.addListener('player_state_changed', (spotifyState: SpotifyPlaybackState | null) => {
          if (!spotifyState) {
            setState((prev) => ({ ...prev, isActive: false }));
            return;
          }

          const currentTrack = spotifyState.track_window.current_track;

          setState((prev) => ({
            ...prev,
            isActive: true,
            isPlaying: !spotifyState.paused,
            isPaused: spotifyState.paused,
            position: spotifyState.position,
            duration: spotifyState.duration,
            shuffle: spotifyState.shuffle,
            repeatMode: spotifyState.repeat_mode,
            track: currentTrack
              ? {
                  id: currentTrack.id,
                  uri: currentTrack.uri,
                  name: currentTrack.name,
                  artist: currentTrack.artists.map((a) => a.name).join(', '),
                  artists: currentTrack.artists,
                  album: currentTrack.album.name,
                  albumArt: currentTrack.album.images[0]?.url || '',
                  duration: currentTrack.duration_ms,
                }
              : null,
            nextTracks: spotifyState.track_window.next_tracks.map((t) => ({
              id: t.id,
              name: t.name,
              artist: t.artists.map((a) => a.name).join(', '),
              albumArt: t.album.images[0]?.url || '',
            })),
            previousTracks: spotifyState.track_window.previous_tracks.map((t) => ({
              id: t.id,
              name: t.name,
              artist: t.artists.map((a) => a.name).join(', '),
              albumArt: t.album.images[0]?.url || '',
            })),
          }));
        });

        // Connect
        const connected = await player.connect();
        if (connected) {
          playerRef.current = player;
          console.log('Spotify Player connected');
        } else {
          setError('Failed to connect to Spotify');
        }
      } catch (err) {
        console.error('Player init error:', err);
        setError('Failed to initialize Spotify player');
      }
    }

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [isSDKLoaded, isAuthenticated, isPremium, getAccessToken]);

  // Position tracking interval
  useEffect(() => {
    if (state.isPlaying && state.isActive) {
      positionIntervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.isPlaying && prev.position < prev.duration) {
            return { ...prev, position: prev.position + 1000 };
          }
          return prev;
        });
      }, 1000);
    } else {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
      }
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [state.isPlaying, state.isActive]);

  // Player actions
  const play = useCallback(
    async (uri?: string, contextUri?: string, offset?: number) => {
      const token = tokenRef.current || (await getAccessToken());
      if (!token || !deviceIdRef.current) return;

      const body: Record<string, any> = {};
      if (contextUri) {
        body.context_uri = contextUri;
        if (offset !== undefined) {
          body.offset = { position: offset };
        }
      } else if (uri) {
        body.uris = [uri];
      }

      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );
    },
    [getAccessToken]
  );

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    await playerRef.current?.resume();
  }, []);

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay();
  }, []);

  const next = useCallback(async () => {
    await playerRef.current?.nextTrack();
  }, []);

  const previous = useCallback(async () => {
    await playerRef.current?.previousTrack();
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    await playerRef.current?.seek(positionMs);
    setState((prev) => ({ ...prev, position: positionMs }));
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    await playerRef.current?.setVolume(clamped);
    setState((prev) => ({ ...prev, volume: clamped }));
  }, []);

  const toggleShuffle = useCallback(async () => {
    const token = tokenRef.current || (await getAccessToken());
    if (!token) return;

    const newShuffle = !state.shuffle;
    await fetch(
      `https://api.spotify.com/v1/me/player/shuffle?state=${newShuffle}&device_id=${deviceIdRef.current}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
    );
    setState((prev) => ({ ...prev, shuffle: newShuffle }));
  }, [state.shuffle, getAccessToken]);

  const setRepeatMode = useCallback(
    async (mode: number) => {
      const token = tokenRef.current || (await getAccessToken());
      if (!token) return;

      const modes = ['off', 'context', 'track'];
      await fetch(
        `https://api.spotify.com/v1/me/player/repeat?state=${modes[mode]}&device_id=${deviceIdRef.current}`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
      );
      setState((prev) => ({ ...prev, repeatMode: mode }));
    },
    [getAccessToken]
  );

  const transferPlayback = useCallback(async () => {
    const token = tokenRef.current || (await getAccessToken());
    if (!token || !deviceIdRef.current) return;

    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_ids: [deviceIdRef.current], play: true }),
    });
  }, [getAccessToken]);

  const actions: PlayerActions = {
    play, pause, resume, togglePlay, next, previous, seek, setVolume,
    toggleShuffle, setRepeatMode, transferPlayback,
  };

  return { state, actions, error, isSDKLoaded };
}
