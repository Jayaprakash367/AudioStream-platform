/**
 * API contract types — request/response shapes for all service endpoints.
 * Used by both backend services and frontend for end-to-end type safety.
 */

import { UserRole, SubscriptionTier, Genre, AudioQuality, PlaylistVisibility } from './enums';

/** ─── Generic API Response Wrapper ────────────────────────── */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string; // Only in development
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** ─── Auth API ────────────────────────────────────────────── */

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/** ─── User API ────────────────────────────────────────────── */

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferencesRequest>;
}

export interface UserPreferencesRequest {
  preferredGenres: Genre[];
  audioQuality: AudioQuality;
  language: string;
  explicitContentEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  subscription: SubscriptionTier;
  isEmailVerified: boolean;
  preferences: UserPreferencesRequest;
  createdAt: string;
}

/** ─── Music API ───────────────────────────────────────────── */

export interface SongSearchQuery extends PaginationQuery {
  q?: string;
  genre?: Genre;
  artistId?: string;
  albumId?: string;
  isExplicit?: boolean;
}

export interface SongResponse {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumName?: string;
  genre: Genre;
  duration: number;
  coverArtUrl: string;
  isExplicit: boolean;
  playCount: number;
  likeCount: number;
  releaseDate: string;
}

/** ─── Streaming API ───────────────────────────────────────── */

export interface StreamRequest {
  songId: string;
  quality: AudioQuality;
}

export interface StreamResponse {
  sessionId: string;
  streamUrl: string;
  tokenExpiry: string;
  quality: AudioQuality;
}

/** ─── Playlist API ────────────────────────────────────────── */

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  visibility: PlaylistVisibility;
  songIds?: string[];
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  visibility?: PlaylistVisibility;
}

export interface PlaylistResponse {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  coverArtUrl?: string;
  visibility: PlaylistVisibility;
  songCount: number;
  followerCount: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

/** ─── History API ─────────────────────────────────────────── */

export interface HistoryEntryResponse {
  id: string;
  songId: string;
  songTitle: string;
  artistName: string;
  listenedAt: string;
  duration: number;
  completionRate: number;
  source: string;
}

/** ─── Recommendation API ──────────────────────────────────── */

export interface RecommendationResponse {
  songs: SongResponse[];
  strategy: string;
  confidence: number;
  generatedAt: string;
}

/** ─── JWT Token Payload ───────────────────────────────────── */

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  subscription: SubscriptionTier;
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
}

/** ─── Service Health Check ────────────────────────────────── */

export interface HealthCheckResponse {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  dependencies: DependencyHealth[];
}

export interface DependencyHealth {
  name: string;
  status: 'connected' | 'disconnected' | 'degraded';
  latency?: number;
}
