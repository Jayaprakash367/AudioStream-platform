/**
 * Zod validation schemas for all API input boundaries.
 * Centralized here to share between gateway validation and individual services.
 */

import { z } from 'zod';

/** ─── Reusable Primitives ─────────────────────────────────── */

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const emailSchema = z.string().email().max(255).toLowerCase().trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  );

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, underscores')
  .trim();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** ─── Auth Schemas ────────────────────────────────────────── */

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: z.string().min(1).max(100).trim(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

/** ─── User Schemas ────────────────────────────────────────── */

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).trim().optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z
    .object({
      preferredGenres: z.array(z.string()).max(10).optional(),
      audioQuality: z.enum(['64kbps', '128kbps', '256kbps', '320kbps', 'FLAC']).optional(),
      language: z.string().min(2).max(5).optional(),
      explicitContentEnabled: z.boolean().optional(),
      notificationsEnabled: z.boolean().optional(),
    })
    .optional(),
});

/** ─── Music Schemas ───────────────────────────────────────── */

export const songSearchSchema = paginationSchema.extend({
  q: z.string().max(200).optional(),
  genre: z.string().optional(),
  artistId: objectIdSchema.optional(),
  albumId: objectIdSchema.optional(),
  isExplicit: z.coerce.boolean().optional(),
});

/** ─── Streaming Schemas ───────────────────────────────────── */

export const streamRequestSchema = z.object({
  songId: objectIdSchema,
  quality: z.enum(['64kbps', '128kbps', '256kbps', '320kbps', 'FLAC']).default('128kbps'),
});

/** ─── Playlist Schemas ────────────────────────────────────── */

export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(500).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'SHARED']).default('PRIVATE'),
  songIds: z.array(objectIdSchema).max(500).optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(500).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'SHARED']).optional(),
});

export const addSongToPlaylistSchema = z.object({
  songId: objectIdSchema,
});
