/**
 * Domain enumerations — used across all services for consistent
 * categorization, roles, and status tracking.
 */

/** User subscription tiers dictating feature access and bitrate limits */
export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  FAMILY = 'FAMILY',
  STUDENT = 'STUDENT',
}

/** Role-based access control levels */
export enum UserRole {
  LISTENER = 'LISTENER',
  ARTIST = 'ARTIST',
  CURATOR = 'CURATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/** Supported audio quality levels for adaptive bitrate streaming */
export enum AudioQuality {
  LOW = '64kbps',
  NORMAL = '128kbps',
  HIGH = '256kbps',
  ULTRA = '320kbps',
  LOSSLESS = 'FLAC',
}

/** Song genre taxonomy */
export enum Genre {
  POP = 'POP',
  ROCK = 'ROCK',
  HIP_HOP = 'HIP_HOP',
  R_AND_B = 'R_AND_B',
  ELECTRONIC = 'ELECTRONIC',
  JAZZ = 'JAZZ',
  CLASSICAL = 'CLASSICAL',
  COUNTRY = 'COUNTRY',
  INDIE = 'INDIE',
  METAL = 'METAL',
  LATIN = 'LATIN',
  K_POP = 'K_POP',
  AMBIENT = 'AMBIENT',
  FOLK = 'FOLK',
  REGGAE = 'REGGAE',
}

/** Playlist visibility modes */
export enum PlaylistVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
  SHARED = 'SHARED',
}

/** Notification delivery channels */
export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SMS = 'SMS',
}

/** Service health states for circuit breaker pattern */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/** Kafka topic names — centralized to prevent typos across services */
export enum KafkaTopic {
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  SONG_PLAYED = 'song.played',
  SONG_SKIPPED = 'song.skipped',
  SONG_LIKED = 'song.liked',
  PLAYLIST_CREATED = 'playlist.created',
  PLAYLIST_UPDATED = 'playlist.updated',
  LISTENING_HISTORY = 'listening.history',
  RECOMMENDATION_GENERATED = 'recommendation.generated',
  NOTIFICATION_SEND = 'notification.send',
  ANALYTICS_EVENT = 'analytics.event',
}
