export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-library-read',
  'user-library-modify',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-recently-played',
  'user-top-read',
] as const;

export const SPOTIFY_ENDPOINTS = {
  AUTHORIZE: 'https://accounts.spotify.com/authorize',
  TOKEN: 'https://accounts.spotify.com/api/token',
  API_BASE: 'https://api.spotify.com/v1',
  ME: 'https://api.spotify.com/v1/me',
  PLAYER: 'https://api.spotify.com/v1/me/player',
  PLAYLISTS: 'https://api.spotify.com/v1/me/playlists',
  TRACKS: 'https://api.spotify.com/v1/tracks',
  SEARCH: 'https://api.spotify.com/v1/search',
  RECENTLY_PLAYED: 'https://api.spotify.com/v1/me/player/recently-played',
  TOP_TRACKS: 'https://api.spotify.com/v1/me/top/tracks',
  TOP_ARTISTS: 'https://api.spotify.com/v1/me/top/artists',
  SDK_URL: 'https://sdk.scdn.co/spotify-player.js',
} as const;

export const AUTH_CONFIG = {
  SESSION_TTL: 3600 * 24 * 7, // 7 days
  TOKEN_REFRESH_BUFFER: 300, // Refresh 5 min before expiry
  MAX_REFRESH_RETRIES: 3,
  STATE_TTL: 600, // OAuth state validity: 10 min
  COOKIE_NAME: 'auralux_session',
  COOKIE_MAX_AGE: 3600 * 24 * 7,
} as const;

export const RATE_LIMITS = {
  AUTH: { windowMs: 60000, maxRequests: 10 },
  API: { windowMs: 60000, maxRequests: 100 },
  SEARCH: { windowMs: 60000, maxRequests: 30 },
  PLAYER: { windowMs: 1000, maxRequests: 10 },
} as const;

export const SERVICE_PORTS = {
  AUTH: 4001,
  PLAYER: 4002,
  SEARCH: 4003,
  GATEWAY: 4000,
  FRONTEND: 3000,
} as const;
