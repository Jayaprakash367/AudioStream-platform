export const appConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001',
  spotifyClientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
  appName: 'Auralux X',
  playerName: 'Auralux X Web Player',
  defaultVolume: 0.5,
} as const;

export const ROUTES = {
  HOME: '/dashboard',
  AUTH_SUCCESS: '/auth/success',
  AUTH_ERROR: '/auth/error',
  PLAYER: '/dashboard',
  SEARCH: '/search',
  LIBRARY: '/library',
  PLAYLIST: '/playlist',
} as const;
