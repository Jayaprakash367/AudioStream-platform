/**
 * Real-Time WebSocket Hook for Auralux
 * Provides live updates for new songs, trending, and user notifications
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RealtimeMessage {
  type: 'NEW_SONG' | 'TRENDING_UPDATE' | 'PLAYLIST_UPDATE' | 'USER_ACTIVITY' | 'QUALITY_CHANGE' | 'SYSTEM';
  payload: Record<string, unknown>;
  timestamp: string;
  channel?: string;
}

export interface NewSong {
  songId: string;
  title: string;
  artist: string;
  album?: string;
  coverArtUrl: string;
  language: string;
  genre: string;
  duration: number;
  releaseDate: string;
  availableQualities: string[];
  isExplicit: boolean;
}

export interface TrendingSong {
  songId: string;
  title: string;
  artist: string;
  rank: number;
  change: 'up' | 'down' | 'new' | 'same';
  playCount: number;
}

export interface RealtimeState {
  isConnected: boolean;
  connectionError: string | null;
  newSongs: NewSong[];
  trendingSongs: TrendingSong[];
  notifications: Array<{ id: string; message: string; timestamp: Date; read: boolean }>;
  preferredLanguage: string;
  preferredQuality: string;
  availableLanguages: string[];
  availableQualities: string[];

  // Actions
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  addNewSong: (song: NewSong) => void;
  updateTrending: (songs: TrendingSong[]) => void;
  addNotification: (message: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setPreferredLanguage: (language: string) => void;
  setPreferredQuality: (quality: string) => void;
  setAvailableLanguages: (languages: string[]) => void;
  setAvailableQualities: (qualities: string[]) => void;
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useRealtimeStore = create<RealtimeState>((set) => ({
  isConnected: false,
  connectionError: null,
  newSongs: [],
  trendingSongs: [],
  notifications: [],
  preferredLanguage: 'All',
  preferredQuality: '320kbps',
  availableLanguages: [
    'All', 'English', 'Hindi', 'Tamil', 'Telugu', 'Punjabi', 'Malayalam',
    'Kannada', 'Bengali', 'Marathi', 'Korean', 'Japanese', 'Spanish',
    'Arabic', 'French', 'Chinese', 'Portuguese', 'Turkish', 'German', 'Italian'
  ],
  availableQualities: ['128kbps', '192kbps', '256kbps', '320kbps', 'lossless'],

  setConnected: (connected) => set({ isConnected: connected, connectionError: connected ? null : undefined }),
  setError: (error) => set({ connectionError: error }),
  
  addNewSong: (song) => set((state) => ({
    newSongs: [song, ...state.newSongs].slice(0, 50),
    notifications: [{
      id: `song-${song.songId}-${Date.now()}`,
      message: `New song: "${song.title}" by ${song.artist}`,
      timestamp: new Date(),
      read: false,
    }, ...state.notifications].slice(0, 20),
  })),

  updateTrending: (songs) => set({ trendingSongs: songs }),

  addNotification: (message) => set((state) => ({
    notifications: [{
      id: `notif-${Date.now()}`,
      message,
      timestamp: new Date(),
      read: false,
    }, ...state.notifications].slice(0, 20),
  })),

  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),

  clearNotifications: () => set({ notifications: [] }),

  setPreferredLanguage: (language) => set({ preferredLanguage: language }),
  setPreferredQuality: (quality) => set({ preferredQuality: quality }),
  setAvailableLanguages: (languages) => set({ availableLanguages: languages }),
  setAvailableQualities: (qualities) => set({ availableQualities: qualities }),
}));

// ─── WebSocket Configuration ─────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_REALTIME_WS_URL || 'ws://localhost:3010/ws';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

// ─── WebSocket Hook ──────────────────────────────────────────────────────────

export function useRealtime(userId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const {
    isConnected,
    preferredLanguage,
    preferredQuality,
    setConnected,
    setError,
    addNewSong,
    updateTrending,
    setAvailableLanguages,
    setAvailableQualities,
    setPreferredLanguage,
    setPreferredQuality,
  } = useRealtimeStore();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    params.set('language', preferredLanguage);
    
    const url = `${WS_URL}?${params.toString()}`;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Realtime] Connected');
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('[Realtime] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[Realtime] WebSocket error:', error);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('[Realtime] Disconnected:', event.code, event.reason);
        setConnected(false);
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.log(`[Realtime] Reconnecting (attempt ${reconnectAttemptsRef.current})...`);
            connect();
          }, RECONNECT_DELAY);
        }
      };
    } catch (err) {
      console.error('[Realtime] Failed to connect:', err);
      setError('Failed to connect');
    }
  }, [userId, preferredLanguage, setConnected, setError]);

  // Handle incoming messages
  const handleMessage = useCallback((message: RealtimeMessage) => {
    switch (message.type) {
      case 'NEW_SONG':
        addNewSong(message.payload as unknown as NewSong);
        break;

      case 'TRENDING_UPDATE':
        if (message.payload?.songs) {
          updateTrending(message.payload.songs as TrendingSong[]);
        }
        break;

      case 'SYSTEM':
        const { event, availableLanguages, availableQualities } = message.payload as {
          event?: string;
          availableLanguages?: string[];
          availableQualities?: string[];
        };
        
        if (event === 'connected') {
          if (availableLanguages) setAvailableLanguages(availableLanguages);
          if (availableQualities) setAvailableQualities(availableQualities);
        }
        break;

      default:
        console.log('[Realtime] Unknown message type:', message.type);
    }
  }, [addNewSong, updateTrending, setAvailableLanguages, setAvailableQualities]);

  // Send message to server
  const send = useCallback((type: string, payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    send('SUBSCRIBE', { channel });
  }, [send]);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    send('UNSUBSCRIBE', { channel });
  }, [send]);

  // Update preferences
  const updatePreferences = useCallback((language?: string, quality?: string) => {
    send('UPDATE_PREFERENCES', { language, quality });
    if (language) setPreferredLanguage(language);
    if (quality) setPreferredQuality(quality);
  }, [send, setPreferredLanguage, setPreferredQuality]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    updatePreferences,
    send,
  };
}

// ─── Hook for New Songs Feed ─────────────────────────────────────────────────

export function useNewSongs() {
  const { newSongs, preferredLanguage } = useRealtimeStore();
  
  // Filter by preferred language
  const filteredSongs = preferredLanguage === 'All'
    ? newSongs
    : newSongs.filter(s => s.language === preferredLanguage);

  return filteredSongs;
}

// ─── Hook for Trending Songs ─────────────────────────────────────────────────

export function useTrendingSongs() {
  return useRealtimeStore((state) => state.trendingSongs);
}

// ─── Hook for Notifications ──────────────────────────────────────────────────

export function useNotifications() {
  const { notifications, markNotificationRead, clearNotifications } = useRealtimeStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markRead: markNotificationRead,
    clearAll: clearNotifications,
  };
}
