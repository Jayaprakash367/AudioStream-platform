import { z } from 'zod';

export const SpotifyCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

export const TokenRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const PlaybackActionSchema = z.object({
  uri: z.string().regex(/^spotify:(track|album|playlist|artist):/, 'Invalid Spotify URI').optional(),
  contextUri: z.string().regex(/^spotify:(album|playlist|artist):/, 'Invalid context URI').optional(),
  positionMs: z.number().min(0).optional(),
  deviceId: z.string().optional(),
});

export const VolumeSchema = z.object({
  volumePercent: z.number().min(0).max(100),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['track', 'album', 'artist', 'playlist']).default('track'),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
  market: z.string().length(2).optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

export type SpotifyCallbackInput = z.infer<typeof SpotifyCallbackSchema>;
export type TokenRefreshInput = z.infer<typeof TokenRefreshSchema>;
export type PlaybackActionInput = z.infer<typeof PlaybackActionSchema>;
export type VolumeInput = z.infer<typeof VolumeSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
