"use strict";
/**
 * Zod validation schemas for all API input boundaries.
 * Centralized here to share between gateway validation and individual services.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSongToPlaylistSchema = exports.updatePlaylistSchema = exports.createPlaylistSchema = exports.streamRequestSchema = exports.songSearchSchema = exports.updateProfileSchema = exports.passwordResetConfirmSchema = exports.passwordResetRequestSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = exports.paginationSchema = exports.usernameSchema = exports.passwordSchema = exports.emailSchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
/** ─── Reusable Primitives ─────────────────────────────────── */
exports.objectIdSchema = zod_1.z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');
exports.emailSchema = zod_1.z.string().email().max(255).toLowerCase().trim();
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character');
exports.usernameSchema = zod_1.z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, underscores')
    .trim();
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
/** ─── Auth Schemas ────────────────────────────────────────── */
exports.registerSchema = zod_1.z.object({
    email: exports.emailSchema,
    username: exports.usernameSchema,
    password: exports.passwordSchema,
    displayName: zod_1.z.string().min(1).max(100).trim(),
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1).max(128),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
exports.passwordResetRequestSchema = zod_1.z.object({
    email: exports.emailSchema,
});
exports.passwordResetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    newPassword: exports.passwordSchema,
});
/** ─── User Schemas ────────────────────────────────────────── */
exports.updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).trim().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    preferences: zod_1.z
        .object({
        preferredGenres: zod_1.z.array(zod_1.z.string()).max(10).optional(),
        audioQuality: zod_1.z.enum(['64kbps', '128kbps', '256kbps', '320kbps', 'FLAC']).optional(),
        language: zod_1.z.string().min(2).max(5).optional(),
        explicitContentEnabled: zod_1.z.boolean().optional(),
        notificationsEnabled: zod_1.z.boolean().optional(),
    })
        .optional(),
});
/** ─── Music Schemas ───────────────────────────────────────── */
exports.songSearchSchema = exports.paginationSchema.extend({
    q: zod_1.z.string().max(200).optional(),
    genre: zod_1.z.string().optional(),
    artistId: exports.objectIdSchema.optional(),
    albumId: exports.objectIdSchema.optional(),
    isExplicit: zod_1.z.coerce.boolean().optional(),
});
/** ─── Streaming Schemas ───────────────────────────────────── */
exports.streamRequestSchema = zod_1.z.object({
    songId: exports.objectIdSchema,
    quality: zod_1.z.enum(['64kbps', '128kbps', '256kbps', '320kbps', 'FLAC']).default('128kbps'),
});
/** ─── Playlist Schemas ────────────────────────────────────── */
exports.createPlaylistSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).trim(),
    description: zod_1.z.string().max(500).optional(),
    visibility: zod_1.z.enum(['PRIVATE', 'PUBLIC', 'SHARED']).default('PRIVATE'),
    songIds: zod_1.z.array(exports.objectIdSchema).max(500).optional(),
});
exports.updatePlaylistSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).trim().optional(),
    description: zod_1.z.string().max(500).optional(),
    visibility: zod_1.z.enum(['PRIVATE', 'PUBLIC', 'SHARED']).optional(),
});
exports.addSongToPlaylistSchema = zod_1.z.object({
    songId: exports.objectIdSchema,
});
//# sourceMappingURL=validation.js.map