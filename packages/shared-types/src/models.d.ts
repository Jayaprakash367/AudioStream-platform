/**
 * Domain models — canonical schema definitions for all business entities.
 * These map 1:1 to MongoDB documents across their respective services.
 */
import { SubscriptionTier, UserRole, AudioQuality, Genre, PlaylistVisibility } from './enums';
/** ─── Base Entity ─────────────────────────────────────────── */
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
/** ─── User Domain ─────────────────────────────────────────── */
export interface IUser extends BaseEntity {
    email: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    role: UserRole;
    subscription: SubscriptionTier;
    isEmailVerified: boolean;
    isActive: boolean;
    preferences: IUserPreferences;
    lastLoginAt?: Date;
}
export interface IUserPreferences {
    preferredGenres: Genre[];
    audioQuality: AudioQuality;
    language: string;
    explicitContentEnabled: boolean;
    notificationsEnabled: boolean;
}
/** ─── Auth Domain ─────────────────────────────────────────── */
export interface IAuthCredentials {
    userId: string;
    passwordHash: string;
    refreshTokens: IRefreshToken[];
    emailVerificationToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    failedLoginAttempts: number;
    lockoutUntil?: Date;
}
export interface IRefreshToken {
    token: string;
    expiresAt: Date;
    createdAt: Date;
    userAgent: string;
    ipAddress: string;
    isRevoked: boolean;
}
/** ─── Music Domain ────────────────────────────────────────── */
export interface ISong extends BaseEntity {
    title: string;
    artistId: string;
    artistName: string;
    albumId?: string;
    albumName?: string;
    genre: Genre;
    duration: number;
    releaseDate: Date;
    coverArtUrl: string;
    audioFileKey: string;
    availableQualities: AudioQuality[];
    isExplicit: boolean;
    playCount: number;
    likeCount: number;
    tags: string[];
}
export interface IAlbum extends BaseEntity {
    title: string;
    artistId: string;
    artistName: string;
    coverArtUrl: string;
    releaseDate: Date;
    genre: Genre;
    songIds: string[];
    totalDuration: number;
}
export interface IArtist extends BaseEntity {
    name: string;
    bio: string;
    avatarUrl: string;
    genres: Genre[];
    monthlyListeners: number;
    isVerified: boolean;
    socialLinks: Record<string, string>;
}
/** ─── Playlist Domain ─────────────────────────────────────── */
export interface IPlaylist extends BaseEntity {
    name: string;
    description?: string;
    ownerId: string;
    ownerName: string;
    coverArtUrl?: string;
    visibility: PlaylistVisibility;
    songIds: string[];
    followerCount: number;
    totalDuration: number;
    collaborators: string[];
}
/** ─── History Domain ──────────────────────────────────────── */
export interface IListeningHistory extends BaseEntity {
    userId: string;
    songId: string;
    songTitle: string;
    artistName: string;
    listenedAt: Date;
    duration: number;
    completionRate: number;
    source: 'search' | 'playlist' | 'recommendation' | 'radio' | 'album';
    /** TTL: auto-expires after 7 days via MongoDB index */
    expiresAt: Date;
}
/** ─── Streaming Domain ────────────────────────────────────── */
export interface IStreamSession {
    sessionId: string;
    userId: string;
    songId: string;
    quality: AudioQuality;
    signedUrl: string;
    tokenExpiry: Date;
    startedAt: Date;
    ipAddress: string;
    userAgent: string;
}
/** ─── Recommendation Domain ───────────────────────────────── */
export interface IRecommendation {
    userId: string;
    songIds: string[];
    strategy: 'collaborative_filtering' | 'content_based' | 'hybrid';
    confidence: number;
    generatedAt: Date;
    expiresAt: Date;
}
export interface IUserEmbedding {
    userId: string;
    vector: number[];
    lastUpdated: Date;
}
/** ─── Analytics Domain ────────────────────────────────────── */
export interface IAnalyticsEvent extends BaseEntity {
    eventType: string;
    userId?: string;
    metadata: Record<string, unknown>;
    timestamp: Date;
    sessionId: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
}
export interface IDailyMetrics {
    date: string;
    activeUsers: number;
    totalPlays: number;
    uniqueListeners: number;
    topGenres: Array<{
        genre: Genre;
        count: number;
    }>;
    topSongs: Array<{
        songId: string;
        title: string;
        plays: number;
    }>;
    avgSessionDuration: number;
}
/** ─── Notification Domain ─────────────────────────────────── */
export interface INotification extends BaseEntity {
    userId: string;
    title: string;
    body: string;
    channel: string;
    isRead: boolean;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=models.d.ts.map