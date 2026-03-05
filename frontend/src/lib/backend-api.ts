/**
 * Backend Music API Client
 * Connects to Auralux backend services for catalog, streaming, and real-time updates
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STREAMING_URL = process.env.NEXT_PUBLIC_STREAMING_URL || 'http://localhost:3006';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Song {
  _id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumName?: string;
  genre: string;
  language: string;
  duration: number;
  releaseDate: string;
  coverArtUrl: string;
  audioFileKey: string;
  availableQualities: string[];
  isExplicit: boolean;
  playCount: number;
  likeCount: number;
  weeklyPlays: number;
  monthlyPlays: number;
}

export interface LanguageStats {
  language: string;
  songCount: number;
  totalPlays: number;
}

export interface GenreStats {
  genre: string;
  songCount: number;
}

export interface TrendingSong {
  songId: string;
  title: string;
  artist: string;
  rank: number;
  change: 'up' | 'down' | 'new' | 'same';
  playCount: number;
  coverArtUrl: string;
  language: string;
}

export interface StreamSession {
  sessionId: string;
  songId: string;
  quality: string;
  streamUrl: string;
  directUrl: string;
  tokenExpiry: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: string;
}

// ─── API Client ──────────────────────────────────────────────────────────────

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ─── Music Catalog API ───────────────────────────────────────────────────────

export const MusicApi = {
  /**
   * Search songs with filters
   */
  search: async (params: {
    q?: string;
    language?: string;
    genre?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Song[]>> => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.set('q', params.q);
    if (params.language) queryParams.set('language', params.language);
    if (params.genre) queryParams.set('genre', params.genre);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    return fetchApi(`/music/search?${queryParams.toString()}`);
  },

  /**
   * Get song by ID with quality selection
   */
  getSong: async (songId: string, quality?: string): Promise<ApiResponse<Song & { selectedAudioUrl?: string }>> => {
    const params = quality ? `?quality=${quality}` : '';
    return fetchApi(`/music/songs/${songId}${params}`);
  },

  /**
   * Get all available languages with stats
   */
  getLanguages: async (): Promise<ApiResponse<LanguageStats[]>> => {
    return fetchApi('/music/languages');
  },

  /**
   * Get songs by language
   */
  getSongsByLanguage: async (language: string, page = 1, limit = 20): Promise<ApiResponse<Song[]>> => {
    return fetchApi(`/music/languages/${encodeURIComponent(language)}/songs?page=${page}&limit=${limit}`);
  },

  /**
   * Get new releases by language
   */
  getNewReleases: async (language?: string, limit = 20): Promise<ApiResponse<Song[]>> => {
    const params = language ? `?language=${language}&limit=${limit}` : `?limit=${limit}`;
    return fetchApi(`/music/new-releases${params}`);
  },

  /**
   * Get trending songs by language
   */
  getTrending: async (language?: string, limit = 20): Promise<ApiResponse<TrendingSong[]>> => {
    const params = language ? `?language=${language}&limit=${limit}` : `?limit=${limit}`;
    return fetchApi(`/music/trending${params}`);
  },

  /**
   * Get popular songs
   */
  getPopular: async (params?: { genre?: string; language?: string; limit?: number }): Promise<ApiResponse<Song[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.genre) queryParams.set('genre', params.genre);
    if (params?.language) queryParams.set('language', params.language);
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    return fetchApi(`/music/popular?${queryParams.toString()}`);
  },

  /**
   * Get all genres with stats
   */
  getGenres: async (): Promise<ApiResponse<GenreStats[]>> => {
    return fetchApi('/music/genres');
  },

  /**
   * Get songs by genre
   */
  getSongsByGenre: async (genre: string, page = 1, limit = 20): Promise<ApiResponse<Song[]>> => {
    return fetchApi(`/music/genres/${encodeURIComponent(genre)}?page=${page}&limit=${limit}`);
  },
};

// ─── Streaming API ───────────────────────────────────────────────────────────

export const StreamingApi = {
  /**
   * Create a streaming session for a song
   */
  createSession: async (params: {
    songId: string;
    quality: string;
    userId?: string;
    subscription?: string;
  }): Promise<StreamSession> => {
    const response = await fetch(`${STREAMING_URL}/stream/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        songId: params.songId,
        quality: params.quality,
        userId: params.userId || 'anonymous',
        subscription: params.subscription || 'FREE',
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create stream session');
    }

    return data.data;
  },

  /**
   * Get available quality options for a user
   */
  getQualityOptions: async (songId: string, subscription = 'FREE'): Promise<Array<{
    quality: string;
    bitrate: number;
    format: string;
    available: boolean;
    requiresPremium: boolean;
  }>> => {
    const response = await fetch(`${STREAMING_URL}/stream/quality-options?songId=${songId}&subscription=${subscription}`);
    const data = await response.json();
    return data.data;
  },

  /**
   * End a streaming session
   */
  endSession: async (sessionId: string): Promise<void> => {
    await fetch(`${STREAMING_URL}/stream/session/${sessionId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Track playback events
   */
  trackEvent: async (event: {
    type: 'start' | 'pause' | 'resume' | 'seek' | 'complete' | 'skip';
    sessionId: string;
    songId: string;
    position: number;
    quality: string;
  }): Promise<void> => {
    await fetch(`${STREAMING_URL}/stream/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  },

  /**
   * Save playback progress for resume
   */
  saveProgress: async (songId: string, position: number, duration: number, quality: string): Promise<void> => {
    await fetch(`${STREAMING_URL}/stream/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, position, duration, quality }),
    });
  },
};

// ─── Admin API ───────────────────────────────────────────────────────────────

export const AdminApi = {
  /**
   * Create a new song
   */
  createSong: async (song: Omit<Song, '_id' | 'playCount' | 'likeCount' | 'weeklyPlays' | 'monthlyPlays'>): Promise<ApiResponse<Song>> => {
    return fetchApi('/music/admin/songs', {
      method: 'POST',
      body: JSON.stringify(song),
    });
  },

  /**
   * Update a song
   */
  updateSong: async (songId: string, updates: Partial<Song>): Promise<ApiResponse<Song>> => {
    return fetchApi(`/music/admin/songs/${songId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete a song
   */
  deleteSong: async (songId: string, hardDelete = false): Promise<void> => {
    await fetchApi(`/music/admin/songs/${songId}?hard=${hardDelete}`, {
      method: 'DELETE',
    });
  },

  /**
   * Bulk import songs
   */
  bulkImport: async (songs: Array<Omit<Song, '_id' | 'playCount' | 'likeCount' | 'weeklyPlays' | 'monthlyPlays'>>): Promise<ApiResponse<{ imported: number; errors: string[] }>> => {
    return fetchApi('/music/admin/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ songs }),
    });
  },

  /**
   * Get recently added songs
   */
  getRecentlyAdded: async (limit = 50): Promise<ApiResponse<Song[]>> => {
    return fetchApi(`/music/admin/recent?limit=${limit}`);
  },
};

// ─── Real-Time API ───────────────────────────────────────────────────────────

export const RealtimeApi = {
  /**
   * Get recent songs from real-time feed
   */
  getRecentSongs: async (limit = 20): Promise<ApiResponse<Array<{
    songId: string;
    title: string;
    artist: string;
    coverArtUrl: string;
    language: string;
    genre: string;
  }>>> => {
    return fetchApi(`/realtime/recent-songs?limit=${limit}`);
  },

  /**
   * Get real-time service stats
   */
  getStats: async (): Promise<ApiResponse<{
    totalClients: number;
    totalChannels: number;
    channelStats: Record<string, number>;
  }>> => {
    return fetchApi('/realtime/stats');
  },
};

export default {
  Music: MusicApi,
  Streaming: StreamingApi,
  Admin: AdminApi,
  Realtime: RealtimeApi,
};
