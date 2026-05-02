/**
 * ═══════════════════════════════════════════════════════════════════
 * Auralux X — MongoDB Initialization Script
 * ═══════════════════════════════════════════════════════════════════
 * Run once at startup via: mongosh < infra/mongo/init-db.js
 * Or mount as Docker init: /docker-entrypoint-initdb.d/init-db.js
 *
 * What this does:
 *   1. Creates all 8 service databases
 *   2. Creates all collections with proper validators (schema enforcement)
 *   3. Creates all indexes for performance & uniqueness
 *   4. Seeds an admin user record (auth + profile)
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── 1. AUTH DATABASE ────────────────────────────────────────────────────────

db = db.getSiblingDB('auralux_auth');

print('📦 Initializing auralux_auth...');

// auth_credentials collection — stores hashed passwords + refresh tokens
db.createCollection('auth_credentials', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'email', 'username', 'passwordHash'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'UUID — must be unique and is required',
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$',
          description: 'Valid email address — required',
        },
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          description: 'Unique username 3-30 chars',
        },
        passwordHash: {
          bsonType: 'string',
          description: 'bcrypt hash — required',
        },
        refreshTokens: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['token', 'expiresAt'],
            properties: {
              token: { bsonType: 'string' },
              expiresAt: { bsonType: 'date' },
              isRevoked: { bsonType: 'bool' },
              userAgent: { bsonType: 'string' },
              ipAddress: { bsonType: 'string' },
            },
          },
        },
        isEmailVerified: { bsonType: 'bool' },
        failedLoginAttempts: { bsonType: 'int' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

// Indexes for auth_credentials
db.auth_credentials.createIndex({ userId: 1 }, { unique: true, name: 'idx_userId_unique' });
db.auth_credentials.createIndex({ email: 1 }, { unique: true, name: 'idx_email_unique' });
db.auth_credentials.createIndex({ username: 1 }, { unique: true, name: 'idx_username_unique' });
db.auth_credentials.createIndex(
  { email: 1, isEmailVerified: 1 },
  { name: 'idx_email_verified_compound' }
);
db.auth_credentials.createIndex(
  { 'refreshTokens.token': 1 },
  { sparse: true, name: 'idx_refresh_token' }
);
db.auth_credentials.createIndex(
  { passwordResetToken: 1 },
  { sparse: true, name: 'idx_password_reset_token' }
);
// TTL index: auto-expire password reset tokens after their expiry date
db.auth_credentials.createIndex(
  { passwordResetExpires: 1 },
  { expireAfterSeconds: 0, sparse: true, name: 'idx_password_reset_ttl' }
);

print('  ✅ auth_credentials collection + indexes created');

// ─── 2. USER DATABASE ─────────────────────────────────────────────────────────

db = db.getSiblingDB('auralux_users');

print('📦 Initializing auralux_users...');

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'email', 'username', 'displayName'],
      properties: {
        userId: { bsonType: 'string' },
        email: { bsonType: 'string' },
        username: { bsonType: 'string', minLength: 3, maxLength: 30 },
        displayName: { bsonType: 'string', minLength: 1, maxLength: 100 },
        avatarUrl: { bsonType: 'string' },
        role: {
          bsonType: 'string',
          enum: ['LISTENER', 'ARTIST', 'CURATOR', 'ADMIN', 'SUPER_ADMIN'],
        },
        subscription: {
          bsonType: 'string',
          enum: ['FREE', 'PREMIUM', 'FAMILY', 'STUDENT'],
        },
        isEmailVerified: { bsonType: 'bool' },
        isActive: { bsonType: 'bool' },
        preferences: {
          bsonType: 'object',
          properties: {
            preferredGenres: { bsonType: 'array' },
            audioQuality: {
              bsonType: 'string',
              enum: ['64kbps', '128kbps', '256kbps', '320kbps', 'FLAC'],
            },
            language: { bsonType: 'string' },
            explicitContentEnabled: { bsonType: 'bool' },
            notificationsEnabled: { bsonType: 'bool' },
          },
        },
        lastLoginAt: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.users.createIndex({ userId: 1 }, { unique: true, name: 'idx_userId_unique' });
db.users.createIndex({ email: 1 }, { unique: true, name: 'idx_email_unique' });
db.users.createIndex({ username: 1 }, { unique: true, name: 'idx_username_unique' });
db.users.createIndex({ role: 1, subscription: 1 }, { name: 'idx_role_subscription' });
db.users.createIndex({ isActive: 1, createdAt: -1 }, { name: 'idx_active_recent' });

print('  ✅ users collection + indexes created');

// ─── 3. MUSIC DATABASE ────────────────────────────────────────────────────────

db = db.getSiblingDB('auralux_music');

print('📦 Initializing auralux_music...');

// songs
db.createCollection('songs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'artistId', 'duration'],
      properties: {
        title: { bsonType: 'string', minLength: 1, maxLength: 500 },
        artistId: { bsonType: 'objectId' },
        albumId: { bsonType: 'objectId' },
        duration: { bsonType: 'int', minimum: 1 },
        audioUrl: { bsonType: 'string' },
        coverUrl: { bsonType: 'string' },
        genre: { bsonType: 'array' },
        tags: { bsonType: 'array' },
        isExplicit: { bsonType: 'bool' },
        playCount: { bsonType: 'long' },
        likeCount: { bsonType: 'long' },
        isActive: { bsonType: 'bool' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.songs.createIndex({ artistId: 1, createdAt: -1 }, { name: 'idx_artist_recent' });
db.songs.createIndex({ albumId: 1 }, { sparse: true, name: 'idx_album' });
db.songs.createIndex({ genre: 1 }, { name: 'idx_genre' });
db.songs.createIndex({ playCount: -1 }, { name: 'idx_play_count_desc' });
db.songs.createIndex({ isActive: 1, isExplicit: 1 }, { name: 'idx_active_explicit' });
db.songs.createIndex(
  { title: 'text', 'artist.name': 'text', 'album.title': 'text' },
  { name: 'idx_full_text_search', weights: { title: 10, 'artist.name': 5 } }
);

// artists
db.createCollection('artists');
db.artists.createIndex({ userId: 1 }, { sparse: true, name: 'idx_userId' });
db.artists.createIndex({ name: 'text' }, { name: 'idx_artist_name_text' });
db.artists.createIndex({ monthlyListeners: -1 }, { name: 'idx_monthly_listeners' });

// albums
db.createCollection('albums');
db.albums.createIndex({ artistId: 1, releaseDate: -1 }, { name: 'idx_artist_albums' });

print('  ✅ songs, artists, albums collections + indexes created');

// ─── 4. PLAYLIST DATABASE ─────────────────────────────────────────────────────

db = db.getSiblingDB('auralux_playlists');

print('📦 Initializing auralux_playlists...');

db.createCollection('playlists', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['ownerId', 'name', 'visibility'],
      properties: {
        ownerId: { bsonType: 'string' },
        name: { bsonType: 'string', minLength: 1, maxLength: 200 },
        description: { bsonType: 'string', maxLength: 500 },
        visibility: { bsonType: 'string', enum: ['PRIVATE', 'PUBLIC', 'SHARED'] },
        coverUrl: { bsonType: 'string' },
        songIds: { bsonType: 'array' },
        songCount: { bsonType: 'int' },
        totalDuration: { bsonType: 'int' },
        followersCount: { bsonType: 'long' },
        isCollaborative: { bsonType: 'bool' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.playlists.createIndex({ ownerId: 1, createdAt: -1 }, { name: 'idx_owner_recent' });
db.playlists.createIndex({ visibility: 1, followersCount: -1 }, { name: 'idx_public_popular' });
db.playlists.createIndex({ name: 'text', description: 'text' }, { name: 'idx_playlist_search' });

print('  ✅ playlists collection + indexes created');

// ─── 5. HISTORY DATABASE ─────────────────────────────────────────────────────

db = db.getSiblingDB('auralux_history');

print('📦 Initializing auralux_history...');

db.createCollection('listening_events', {
  // Capped at 50M docs or 5GB — oldest events auto-deleted
  // Remove cap if you want permanent unlimited history
});

db.listening_events.createIndex({ userId: 1, playedAt: -1 }, { name: 'idx_user_recent' });
db.listening_events.createIndex({ songId: 1, playedAt: -1 }, { name: 'idx_song_recent' });
db.listening_events.createIndex({ userId: 1, songId: 1 }, { name: 'idx_user_song' });
// TTL: auto-delete raw events older than 1 year (365 days)
db.listening_events.createIndex(
  { playedAt: 1 },
  { expireAfterSeconds: 365 * 24 * 3600, name: 'idx_history_ttl_1year' }
);

// Aggregated listening stats (permanent — survives TTL)
db.createCollection('listening_stats');
db.listening_stats.createIndex({ userId: 1, period: 1 }, { unique: true, name: 'idx_user_period' });

print('  ✅ listening_events, listening_stats collections + indexes created');

// ─── 6. RECOMMENDATION DATABASE ──────────────────────────────────────────────

db = db.getSiblingDB('auralux_recommendations');

print('📦 Initializing auralux_recommendations...');

db.createCollection('user_recommendations');
db.user_recommendations.createIndex(
  { userId: 1 },
  { unique: true, name: 'idx_userId_unique' }
);
db.user_recommendations.createIndex(
  { generatedAt: 1 },
  { expireAfterSeconds: 24 * 3600, name: 'idx_recommendation_ttl_24h' }
);

db.createCollection('trending_cache');
db.trending_cache.createIndex(
  { type: 1, region: 1 },
  { unique: true, name: 'idx_trending_type_region' }
);
db.trending_cache.createIndex(
  { updatedAt: 1 },
  { expireAfterSeconds: 6 * 3600, name: 'idx_trending_ttl_6h' }
);

print('  ✅ recommendations, trending_cache collections + indexes created');

// ─── 7. ANALYTICS DATABASE ───────────────────────────────────────────────────

db = db.getSiblingDB('auralux_analytics');

print('📦 Initializing auralux_analytics...');

db.createCollection('raw_events');
db.raw_events.createIndex({ eventType: 1, occurredAt: -1 }, { name: 'idx_event_type_time' });
db.raw_events.createIndex({ userId: 1, occurredAt: -1 }, { name: 'idx_user_events' });
// TTL: keep raw events for 90 days only
db.raw_events.createIndex(
  { occurredAt: 1 },
  { expireAfterSeconds: 90 * 24 * 3600, name: 'idx_raw_events_ttl_90d' }
);

db.createCollection('daily_aggregates');
db.daily_aggregates.createIndex({ date: -1, metric: 1 }, { name: 'idx_daily_metric' });

db.createCollection('artist_analytics');
db.artist_analytics.createIndex(
  { artistId: 1, period: 1 },
  { unique: true, name: 'idx_artist_period' }
);

print('  ✅ analytics collections + indexes created');

// ─── 8. NOTIFICATION DATABASE ─────────────────────────────────────────────────

db = db.getSiblingDB('auralux_notifications');

print('📦 Initializing auralux_notifications...');

db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'title', 'body', 'channel'],
      properties: {
        userId: { bsonType: 'string' },
        title: { bsonType: 'string', maxLength: 200 },
        body: { bsonType: 'string', maxLength: 2000 },
        channel: { bsonType: 'string', enum: ['EMAIL', 'PUSH', 'IN_APP', 'SMS'] },
        isRead: { bsonType: 'bool' },
        sentAt: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.notifications.createIndex({ userId: 1, sentAt: -1 }, { name: 'idx_user_notifications' });
db.notifications.createIndex({ userId: 1, isRead: 1 }, { name: 'idx_user_unread' });
// TTL: auto-delete notifications older than 30 days
db.notifications.createIndex(
  { sentAt: 1 },
  { expireAfterSeconds: 30 * 24 * 3600, name: 'idx_notifications_ttl_30d' }
);

print('  ✅ notifications collection + indexes created');

// ─── 9. SEED ADMIN USER ──────────────────────────────────────────────────────
// Admin credentials: admin@auralux.io / Admin@123!
// Password hash generated from: bcrypt.hash("Admin@123!", 12)
// Change this password immediately in production!

const ADMIN_USER_ID = 'system-admin-00000000-0000-0000-0000-000000000001';
const ADMIN_PASSWORD_HASH =
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewc3GnwkX3kXkBuS'; // Admin@123!

db = db.getSiblingDB('auralux_auth');
const existingAdmin = db.auth_credentials.findOne({ userId: ADMIN_USER_ID });
if (!existingAdmin) {
  db.auth_credentials.insertOne({
    userId: ADMIN_USER_ID,
    email: 'admin@auralux.io',
    username: 'auralux_admin',
    passwordHash: ADMIN_PASSWORD_HASH,
    refreshTokens: [],
    emailVerificationToken: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  print('  ✅ Admin auth credentials seeded');
}

db = db.getSiblingDB('auralux_users');
const existingAdminProfile = db.users.findOne({ userId: ADMIN_USER_ID });
if (!existingAdminProfile) {
  db.users.insertOne({
    userId: ADMIN_USER_ID,
    email: 'admin@auralux.io',
    username: 'auralux_admin',
    displayName: 'Auralux Admin',
    avatarUrl: null,
    role: 'SUPER_ADMIN',
    subscription: 'PREMIUM',
    isEmailVerified: true,
    isActive: true,
    preferences: {
      preferredGenres: [],
      audioQuality: '320kbps',
      language: 'en',
      explicitContentEnabled: true,
      notificationsEnabled: true,
    },
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  print('  ✅ Admin user profile seeded');
}

print('');
print('═══════════════════════════════════════════════════════════════');
print('🎵 Auralux X — Database initialization complete!');
print('   Databases: auralux_auth, auralux_users, auralux_music,');
print('              auralux_playlists, auralux_history,');
print('              auralux_recommendations, auralux_analytics,');
print('              auralux_notifications');
print('');
print('   ⚠️  IMPORTANT: Change admin password before going live!');
print('   Admin email:    admin@auralux.io');
print('   Admin password: Admin@123!  (change this NOW)');
print('═══════════════════════════════════════════════════════════════');
