/**
 * Kafka event payload contracts — strict typing for all async messages
 * flowing through the event bus. Each event includes metadata for
 * tracing, deduplication, and dead-letter queue processing.
 */
import { KafkaTopic } from './enums';
/** ─── Base Event Envelope ─────────────────────────────────── */
export interface IBaseEvent<T = unknown> {
    /** Unique event ID for idempotency checks */
    eventId: string;
    /** Kafka topic this event belongs to */
    topic: KafkaTopic;
    /** ISO 8601 timestamp of when the event was produced */
    timestamp: string;
    /** Service that produced this event */
    source: string;
    /** Correlation ID for distributed tracing */
    correlationId: string;
    /** Schema version for backward compatibility */
    version: number;
    /** Actual event data */
    payload: T;
}
/** ─── Auth Events ─────────────────────────────────────────── */
export interface UserRegisteredPayload {
    userId: string;
    email: string;
    username: string;
    registeredAt: string;
}
export interface UserLoginPayload {
    userId: string;
    ipAddress: string;
    userAgent: string;
    loginAt: string;
}
export interface UserLogoutPayload {
    userId: string;
    logoutAt: string;
}
/** ─── Listening Events ────────────────────────────────────── */
export interface SongPlayedPayload {
    userId: string;
    songId: string;
    songTitle: string;
    artistName: string;
    genre: string;
    duration: number;
    listenedDuration: number;
    completionRate: number;
    source: string;
    quality: string;
    timestamp: string;
}
export interface SongSkippedPayload {
    userId: string;
    songId: string;
    skippedAtSecond: number;
    timestamp: string;
}
export interface SongLikedPayload {
    userId: string;
    songId: string;
    timestamp: string;
}
/** ─── Playlist Events ─────────────────────────────────────── */
export interface PlaylistCreatedPayload {
    playlistId: string;
    ownerId: string;
    name: string;
    visibility: string;
    createdAt: string;
}
export interface PlaylistUpdatedPayload {
    playlistId: string;
    ownerId: string;
    action: 'song_added' | 'song_removed' | 'metadata_updated';
    songId?: string;
    updatedAt: string;
}
/** ─── Recommendation Events ───────────────────────────────── */
export interface RecommendationGeneratedPayload {
    userId: string;
    songIds: string[];
    strategy: string;
    confidence: number;
    generatedAt: string;
}
/** ─── Notification Events ─────────────────────────────────── */
export interface NotificationSendPayload {
    userId: string;
    title: string;
    body: string;
    channels: string[];
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}
/** ─── Analytics Events ────────────────────────────────────── */
export interface AnalyticsEventPayload {
    eventType: string;
    userId?: string;
    sessionId: string;
    deviceType: string;
    metadata: Record<string, unknown>;
    timestamp: string;
}
/** ─── Typed Event Aliases ─────────────────────────────────── */
export type UserRegisteredEvent = IBaseEvent<UserRegisteredPayload>;
export type UserLoginEvent = IBaseEvent<UserLoginPayload>;
export type UserLogoutEvent = IBaseEvent<UserLogoutPayload>;
export type SongPlayedEvent = IBaseEvent<SongPlayedPayload>;
export type SongSkippedEvent = IBaseEvent<SongSkippedPayload>;
export type SongLikedEvent = IBaseEvent<SongLikedPayload>;
export type PlaylistCreatedEvent = IBaseEvent<PlaylistCreatedPayload>;
export type PlaylistUpdatedEvent = IBaseEvent<PlaylistUpdatedPayload>;
export type RecommendationGeneratedEvent = IBaseEvent<RecommendationGeneratedPayload>;
export type NotificationSendEvent = IBaseEvent<NotificationSendPayload>;
export type AnalyticsTrackEvent = IBaseEvent<AnalyticsEventPayload>;
//# sourceMappingURL=events.d.ts.map