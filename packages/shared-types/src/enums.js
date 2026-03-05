"use strict";
/**
 * Domain enumerations — used across all services for consistent
 * categorization, roles, and status tracking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaTopic = exports.CircuitState = exports.NotificationChannel = exports.PlaylistVisibility = exports.Genre = exports.AudioQuality = exports.UserRole = exports.SubscriptionTier = void 0;
/** User subscription tiers dictating feature access and bitrate limits */
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["FREE"] = "FREE";
    SubscriptionTier["PREMIUM"] = "PREMIUM";
    SubscriptionTier["FAMILY"] = "FAMILY";
    SubscriptionTier["STUDENT"] = "STUDENT";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
/** Role-based access control levels */
var UserRole;
(function (UserRole) {
    UserRole["LISTENER"] = "LISTENER";
    UserRole["ARTIST"] = "ARTIST";
    UserRole["CURATOR"] = "CURATOR";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
/** Supported audio quality levels for adaptive bitrate streaming */
var AudioQuality;
(function (AudioQuality) {
    AudioQuality["LOW"] = "64kbps";
    AudioQuality["NORMAL"] = "128kbps";
    AudioQuality["HIGH"] = "256kbps";
    AudioQuality["ULTRA"] = "320kbps";
    AudioQuality["LOSSLESS"] = "FLAC";
})(AudioQuality || (exports.AudioQuality = AudioQuality = {}));
/** Song genre taxonomy */
var Genre;
(function (Genre) {
    Genre["POP"] = "POP";
    Genre["ROCK"] = "ROCK";
    Genre["HIP_HOP"] = "HIP_HOP";
    Genre["R_AND_B"] = "R_AND_B";
    Genre["ELECTRONIC"] = "ELECTRONIC";
    Genre["JAZZ"] = "JAZZ";
    Genre["CLASSICAL"] = "CLASSICAL";
    Genre["COUNTRY"] = "COUNTRY";
    Genre["INDIE"] = "INDIE";
    Genre["METAL"] = "METAL";
    Genre["LATIN"] = "LATIN";
    Genre["K_POP"] = "K_POP";
    Genre["AMBIENT"] = "AMBIENT";
    Genre["FOLK"] = "FOLK";
    Genre["REGGAE"] = "REGGAE";
})(Genre || (exports.Genre = Genre = {}));
/** Playlist visibility modes */
var PlaylistVisibility;
(function (PlaylistVisibility) {
    PlaylistVisibility["PRIVATE"] = "PRIVATE";
    PlaylistVisibility["PUBLIC"] = "PUBLIC";
    PlaylistVisibility["SHARED"] = "SHARED";
})(PlaylistVisibility || (exports.PlaylistVisibility = PlaylistVisibility = {}));
/** Notification delivery channels */
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["PUSH"] = "PUSH";
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["IN_APP"] = "IN_APP";
    NotificationChannel["SMS"] = "SMS";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
/** Service health states for circuit breaker pattern */
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
/** Kafka topic names — centralized to prevent typos across services */
var KafkaTopic;
(function (KafkaTopic) {
    KafkaTopic["USER_REGISTERED"] = "user.registered";
    KafkaTopic["USER_UPDATED"] = "user.updated";
    KafkaTopic["AUTH_LOGIN"] = "auth.login";
    KafkaTopic["AUTH_LOGOUT"] = "auth.logout";
    KafkaTopic["SONG_PLAYED"] = "song.played";
    KafkaTopic["SONG_SKIPPED"] = "song.skipped";
    KafkaTopic["SONG_LIKED"] = "song.liked";
    KafkaTopic["PLAYLIST_CREATED"] = "playlist.created";
    KafkaTopic["PLAYLIST_UPDATED"] = "playlist.updated";
    KafkaTopic["LISTENING_HISTORY"] = "listening.history";
    KafkaTopic["RECOMMENDATION_GENERATED"] = "recommendation.generated";
    KafkaTopic["NOTIFICATION_SEND"] = "notification.send";
    KafkaTopic["ANALYTICS_EVENT"] = "analytics.event";
})(KafkaTopic || (exports.KafkaTopic = KafkaTopic = {}));
//# sourceMappingURL=enums.js.map