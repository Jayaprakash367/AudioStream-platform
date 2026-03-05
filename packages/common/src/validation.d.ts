/**
 * Zod validation schemas for all API input boundaries.
 * Centralized here to share between gateway validation and individual services.
 */
import { z } from 'zod';
/** ─── Reusable Primitives ─────────────────────────────────── */
export declare const objectIdSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const usernameSchema: z.ZodString;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
/** ─── Auth Schemas ────────────────────────────────────────── */
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    password: string;
    displayName: string;
}, {
    email: string;
    username: string;
    password: string;
    displayName: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const passwordResetConfirmSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
/** ─── User Schemas ────────────────────────────────────────── */
export declare const updateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        preferredGenres: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        audioQuality: z.ZodOptional<z.ZodEnum<["64kbps", "128kbps", "256kbps", "320kbps", "FLAC"]>>;
        language: z.ZodOptional<z.ZodString>;
        explicitContentEnabled: z.ZodOptional<z.ZodBoolean>;
        notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        preferredGenres?: string[] | undefined;
        audioQuality?: "64kbps" | "128kbps" | "256kbps" | "320kbps" | "FLAC" | undefined;
        language?: string | undefined;
        explicitContentEnabled?: boolean | undefined;
        notificationsEnabled?: boolean | undefined;
    }, {
        preferredGenres?: string[] | undefined;
        audioQuality?: "64kbps" | "128kbps" | "256kbps" | "320kbps" | "FLAC" | undefined;
        language?: string | undefined;
        explicitContentEnabled?: boolean | undefined;
        notificationsEnabled?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    displayName?: string | undefined;
    avatarUrl?: string | undefined;
    preferences?: {
        preferredGenres?: string[] | undefined;
        audioQuality?: "64kbps" | "128kbps" | "256kbps" | "320kbps" | "FLAC" | undefined;
        language?: string | undefined;
        explicitContentEnabled?: boolean | undefined;
        notificationsEnabled?: boolean | undefined;
    } | undefined;
}, {
    displayName?: string | undefined;
    avatarUrl?: string | undefined;
    preferences?: {
        preferredGenres?: string[] | undefined;
        audioQuality?: "64kbps" | "128kbps" | "256kbps" | "320kbps" | "FLAC" | undefined;
        language?: string | undefined;
        explicitContentEnabled?: boolean | undefined;
        notificationsEnabled?: boolean | undefined;
    } | undefined;
}>;
/** ─── Music Schemas ───────────────────────────────────────── */
export declare const songSearchSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
} & {
    q: z.ZodOptional<z.ZodString>;
    genre: z.ZodOptional<z.ZodString>;
    artistId: z.ZodOptional<z.ZodString>;
    albumId: z.ZodOptional<z.ZodString>;
    isExplicit: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
    q?: string | undefined;
    genre?: string | undefined;
    artistId?: string | undefined;
    albumId?: string | undefined;
    isExplicit?: boolean | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    q?: string | undefined;
    genre?: string | undefined;
    artistId?: string | undefined;
    albumId?: string | undefined;
    isExplicit?: boolean | undefined;
}>;
/** ─── Streaming Schemas ───────────────────────────────────── */
export declare const streamRequestSchema: z.ZodObject<{
    songId: z.ZodString;
    quality: z.ZodDefault<z.ZodEnum<["64kbps", "128kbps", "256kbps", "320kbps", "FLAC"]>>;
}, "strip", z.ZodTypeAny, {
    songId: string;
    quality: "64kbps" | "128kbps" | "256kbps" | "320kbps" | "FLAC";
}, {
    songId: string;
    quality?: "64kbps" | "128kbps" | "256kbps" | "320kbps" | "FLAC" | undefined;
}>;
/** ─── Playlist Schemas ────────────────────────────────────── */
export declare const createPlaylistSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    visibility: z.ZodDefault<z.ZodEnum<["PRIVATE", "PUBLIC", "SHARED"]>>;
    songIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    visibility: "PRIVATE" | "PUBLIC" | "SHARED";
    description?: string | undefined;
    songIds?: string[] | undefined;
}, {
    name: string;
    description?: string | undefined;
    visibility?: "PRIVATE" | "PUBLIC" | "SHARED" | undefined;
    songIds?: string[] | undefined;
}>;
export declare const updatePlaylistSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "PUBLIC", "SHARED"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    visibility?: "PRIVATE" | "PUBLIC" | "SHARED" | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    visibility?: "PRIVATE" | "PUBLIC" | "SHARED" | undefined;
}>;
export declare const addSongToPlaylistSchema: z.ZodObject<{
    songId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    songId: string;
}, {
    songId: string;
}>;
//# sourceMappingURL=validation.d.ts.map