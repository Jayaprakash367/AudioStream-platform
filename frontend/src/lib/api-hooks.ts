/**
 * API Hooks for Backend Integration
 * Provides hooks for all backend API calls with fallback to mock data
 */

import { useState, useEffect, useCallback } from 'react';
import { appConfig } from './config';
import * as mockData from './mock-data';

// ─── Generic Hook for API Calls ──────────────────────────────────────────────

export function useApi<T>(
  url: string,
  options?: RequestInit,
  fallbackData?: T
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(fallbackData || null);
  const [loading, setLoading] = useState(!fallbackData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result.data || result);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`API Error [${url}]:`, errorMsg, '- Using fallback data');
      setError(null); // Don't show error if we have fallback data
      setData(fallbackData || null);
    } finally {
      setLoading(false);
    }
  }, [url, options, fallbackData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── Music API Hooks ────────────────────────────────────────────────────────

export function useTrendingTracks(limit = 20) {
  return useApi(
    `${appConfig.apiUrl}/music/trending?limit=${limit}`,
    undefined,
    mockData.getMockTrendingTracks(limit) as any
  );
}

export function useFeaturedTracks(limit = 8) {
  return useApi(
    `${appConfig.apiUrl}/music/featured?limit=${limit}`,
    undefined,
    mockData.getMockFeaturedTracks(limit) as any
  );
}

export function useTracksByLanguage(language: string, limit = 18) {
  return useApi(
    `${appConfig.apiUrl}/music/language/${encodeURIComponent(language)}?limit=${limit}`,
    undefined,
    mockData.getMockTracksByLanguage(language, limit) as any
  );
}

export function useNewReleases(language?: string, limit = 20) {
  const url = language
    ? `${appConfig.apiUrl}/music/new-releases?language=${encodeURIComponent(language)}&limit=${limit}`
    : `${appConfig.apiUrl}/music/new-releases?limit=${limit}`;
  return useApi(url, undefined, mockData.getMockFeaturedTracks(limit) as any);
}

export function useSongSearch(query: string, language?: string) {
  const url = new URL(`${appConfig.apiUrl}/music/search`);
  url.searchParams.set('q', query);
  if (language) url.searchParams.set('language', language);
  return useApi(url.toString(), undefined, mockData.getMockSearch(query) as any);
}

export function usePlaylist(playlistId: string) {
  return useApi(`${appConfig.apiUrl}/playlist/${playlistId}`, undefined, { songs: [] } as any);
}

export function useUserPlaylists() {
  return useApi(
    `${appConfig.apiUrl}/user/playlists`,
    undefined,
    mockData.getMockUserPlaylists() as any
  );
}

export function useUserLibrary() {
  return useApi(
    `${appConfig.apiUrl}/user/library`,
    undefined,
    mockData.getMockUserLibrary() as any
  );
}

export function useLikedSongs() {
  return useApi(
    `${appConfig.apiUrl}/user/liked-songs`,
    undefined,
    mockData.getMockLikedSongs() as any
  );
}

export function useRecentlyPlayed() {
  return useApi(
    `${appConfig.apiUrl}/user/recently-played`,
    undefined,
    mockData.getMockRecentlyPlayed() as any
  );
}

export function useLanguages() {
  return useApi(
    `${appConfig.apiUrl}/music/languages`,
    undefined,
    mockData.getMockLanguages() as any
  );
}

// ─── Streaming API Hooks ────────────────────────────────────────────────────

export async function getStreamingUrl(
  songId: string,
  quality = 'high'
): Promise<{
  streamUrl: string;
  quality: string;
  duration: number;
  format: string;
}> {
  const response = await fetch(`${appConfig.streamingServiceUrl}/stream/${songId}?quality=${quality}`);
  if (!response.ok) throw new Error('Failed to get streaming URL');
  return response.json();
}

export async function trackPlaybackEvent(
  songId: string,
  event: 'play' | 'pause' | 'resume' | 'complete' | 'skip',
  position?: number
) {
  await fetch(`${appConfig.streamingServiceUrl}/track-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId, event, position }),
  });
}

// ─── User API Hooks ─────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useApi(`${appConfig.apiUrl}/user/me`);
}

export async function updateUserProfile(updates: Record<string, unknown>) {
  const response = await fetch(`${appConfig.apiUrl}/user/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
}

export async function addToLibrary(songId: string) {
  const response = await fetch(`${appConfig.apiUrl}/user/library`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId }),
  });
  if (!response.ok) throw new Error('Failed to add to library');
  return response.json();
}

export async function removeFromLibrary(songId: string) {
  const response = await fetch(`${appConfig.apiUrl}/user/library/${songId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove from library');
  return response.json();
}

export async function likeSong(songId: string) {
  const response = await fetch(`${appConfig.apiUrl}/user/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId }),
  });
  if (!response.ok) throw new Error('Failed to like song');
  return response.json();
}

export async function unlikeSong(songId: string) {
  const response = await fetch(`${appConfig.apiUrl}/user/likes/${songId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to unlike song');
  return response.json();
}

// ─── Playlist API Hooks ─────────────────────────────────────────────────────

export async function createPlaylist(name: string, description?: string) {
  const response = await fetch(`${appConfig.apiUrl}/playlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) throw new Error('Failed to create playlist');
  return response.json();
}

export async function addToPlaylist(playlistId: string, songId: string) {
  const response = await fetch(`${appConfig.apiUrl}/playlist/${playlistId}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId }),
  });
  if (!response.ok) throw new Error('Failed to add to playlist');
  return response.json();
}

export async function removeFromPlaylist(playlistId: string, songId: string) {
  const response = await fetch(`${appConfig.apiUrl}/playlist/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove from playlist');
  return response.json();
}

export async function updatePlaylist(playlistId: string, updates: Record<string, unknown>) {
  const response = await fetch(`${appConfig.apiUrl}/playlist/${playlistId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update playlist');
  return response.json();
}

export async function deletePlaylist(playlistId: string) {
  const response = await fetch(`${appConfig.apiUrl}/playlist/${playlistId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete playlist');
  return response.json();
}
