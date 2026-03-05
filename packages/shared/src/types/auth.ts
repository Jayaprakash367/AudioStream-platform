export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
  tokenType: string;
  scope: string;
}

export interface SpotifyUserProfile {
  id: string;
  displayName: string;
  email: string;
  images: SpotifyImage[];
  product: 'free' | 'open' | 'premium';
  country: string;
  uri: string;
  externalUrls: { spotify: string };
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  spotifyId: string;
  tokens: SpotifyTokens;
  profile: SpotifyUserProfile;
  createdAt: number;
  lastRefreshed: number;
  isActive: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SpotifyUserProfile | null;
  session: AuthSession | null;
  error: string | null;
  isPremium: boolean;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
  error?: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  expiresIn: number;
  expiresAt: number;
}

export enum AuthErrorCode {
  INVALID_STATE = 'INVALID_STATE',
  TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INSUFFICIENT_SCOPE = 'INSUFFICIENT_SCOPE',
  PREMIUM_REQUIRED = 'PREMIUM_REQUIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  SPOTIFY_API_ERROR = 'SPOTIFY_API_ERROR',
}
