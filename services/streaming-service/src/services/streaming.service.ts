/**
 * Streaming Service — Core Logic
 * Enhanced with multi-quality HLS streaming, adaptive bitrate,
 * signed URLs, and real-time play tracking.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RedisCacheManager } from '@auralux/redis-client';
import { KafkaEventBus } from '@auralux/kafka-client';
import { BadRequestError, UnauthorizedError } from '@auralux/common';
import { KafkaTopic } from '@auralux/shared-types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StreamSession {
  sessionId: string;
  userId: string;
  songId: string;
  quality: string;
  streamUrl: string;
  directUrl?: string;
  tokenExpiry: string;
  startedAt: string;
  lastActivity?: string;
  bytesStreamed?: number;
}

export interface StreamQualityOption {
  quality: string;
  bitrate: number;
  format: string;
  available: boolean;
  requiresPremium: boolean;
}

export interface PlaybackProgress {
  songId: string;
  position: number;
  duration: number;
  quality: string;
  timestamp: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Max concurrent streams per subscription tier */
const CONCURRENT_LIMITS: Record<string, number> = {
  FREE: 1,
  PREMIUM: 3,
  FAMILY: 6,
  STUDENT: 2,
};

/** Quality settings with bitrates */
const QUALITY_CONFIG: Record<string, { bitrate: number; format: string; requiresPremium: boolean }> = {
  '128kbps': { bitrate: 128, format: 'mp3', requiresPremium: false },
  '192kbps': { bitrate: 192, format: 'aac', requiresPremium: false },
  '256kbps': { bitrate: 256, format: 'aac', requiresPremium: false },
  '320kbps': { bitrate: 320, format: 'mp3', requiresPremium: false },
  'lossless': { bitrate: 1411, format: 'flac', requiresPremium: true },
};

/** CDN base URL for streaming */
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.auralux.stream';

// ─── Streaming Service ───────────────────────────────────────────────────────

export class StreamingService {
  constructor(
    private redis: RedisCacheManager,
    private kafka: KafkaEventBus,
    private jwtSecret: string
  ) {}

  // ─── Session Management ────────────────────────────────────────────────────

  /** Generate a signed streaming URL with quality selection */
  async createStreamSession(params: {
    userId: string;
    songId: string;
    quality: string;
    subscription: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<StreamSession> {
    const { userId, songId, quality, subscription, ipAddress, userAgent } = params;

    // Validate quality tier
    const qualityConfig = QUALITY_CONFIG[quality];
    if (!qualityConfig) {
      throw new BadRequestError(`Invalid quality: ${quality}. Valid options: ${Object.keys(QUALITY_CONFIG).join(', ')}`);
    }

    // Check premium requirement for lossless
    if (qualityConfig.requiresPremium && subscription === 'FREE') {
      throw new BadRequestError('Lossless quality requires a Premium subscription');
    }

    // Check concurrent session limit
    const activeSessions = await this.getActiveSessions(userId);
    const limit = CONCURRENT_LIMITS[subscription] || 1;

    if (activeSessions.length >= limit) {
      // For premium users, terminate oldest session instead of blocking
      if (subscription !== 'FREE' && activeSessions.length > 0) {
        const oldest = activeSessions.sort((a, b) => 
          new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        )[0];
        await this.endSession(oldest.sessionId, userId);
      } else {
        throw new BadRequestError(
          `Concurrent stream limit reached (${limit}). Upgrade your subscription for more.`
        );
      }
    }

    // Generate signed playback token (short-lived: 60 min for premium, 30 min for free)
    const sessionId = crypto.randomUUID();
    const tokenDuration = subscription === 'FREE' ? 30 : 60;
    const tokenExpiry = new Date(Date.now() + tokenDuration * 60 * 1000);

    const playbackToken = jwt.sign(
      {
        sid: sessionId,
        uid: userId,
        song: songId,
        quality,
        sub: subscription,
        ip: this.hashIP(ipAddress),
        exp: Math.floor(tokenExpiry.getTime() / 1000),
      },
      this.jwtSecret
    );

    // Construct HLS manifest URL with signed token
    const streamUrl = `${CDN_BASE_URL}/hls/${songId}/${quality}/manifest.m3u8?token=${playbackToken}&sid=${sessionId}`;
    
    // Direct MP3/AAC URL for fallback
    const directUrl = `${CDN_BASE_URL}/audio/${songId}/${quality}.${qualityConfig.format}?token=${playbackToken}`;

    const session: StreamSession = {
      sessionId,
      userId,
      songId,
      quality,
      streamUrl,
      directUrl,
      tokenExpiry: tokenExpiry.toISOString(),
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      bytesStreamed: 0,
    };

    // Store active session in Redis (TTL matches token)
    await this.redis.set(`stream:session:${sessionId}`, session, tokenDuration * 60);

    // Track user's active sessions
    await this.redis.hset(`stream:user:${userId}`, sessionId, JSON.stringify(session));
    await this.redis.expire(`stream:user:${userId}`, tokenDuration * 60);

    // Publish song played event to Kafka for analytics
    await this.kafka.publish(
      {
        userId,
        songId,
        quality,
        sessionId,
        subscription,
        timestamp: new Date().toISOString(),
        ipHash: this.hashIP(ipAddress),
        userAgent: this.parseUserAgent(userAgent),
      },
      { topic: KafkaTopic.SONG_PLAYED, key: userId }
    );

    return session;
  }

  /** Validate a playback token for an active stream */
  async validatePlaybackToken(token: string): Promise<{ valid: boolean; session?: StreamSession }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        sid: string;
        uid: string;
        song: string;
        quality: string;
        sub: string;
        ip: string;
      };

      const session = await this.redis.get<StreamSession>(`stream:session:${decoded.sid}`);
      if (!session) {
        return { valid: false };
      }

      // Update last activity
      session.lastActivity = new Date().toISOString();
      await this.redis.set(`stream:session:${decoded.sid}`, session, 3600);

      return { valid: true, session };
    } catch {
      return { valid: false };
    }
  }

  /** Get all active streaming sessions for a user */
  async getActiveSessions(userId: string): Promise<StreamSession[]> {
    const sessions = await this.redis.hgetall(`stream:user:${userId}`);
    return Object.values(sessions).map((s) => JSON.parse(s));
  }

  /** End a streaming session */
  async endSession(sessionId: string, userId: string): Promise<void> {
    await this.redis.del(`stream:session:${sessionId}`);
    const client = this.redis.getClient();
    await client.hdel(`stream:user:${userId}`, sessionId);
  }

  // ─── Quality Options ─────────────────────────────────────────────────────────

  /** Get available quality options for a song */
  async getQualityOptions(songId: string, subscription: string): Promise<StreamQualityOption[]> {
    // In production, fetch actual available qualities from music service
    return Object.entries(QUALITY_CONFIG).map(([quality, config]) => ({
      quality,
      bitrate: config.bitrate,
      format: config.format,
      available: true,
      requiresPremium: config.requiresPremium,
    })).filter(opt => subscription !== 'FREE' || !opt.requiresPremium);
  }

  /** Get recommended quality based on network conditions */
  getRecommendedQuality(networkSpeed: number, subscription: string): string {
    // networkSpeed in Mbps
    if (subscription !== 'FREE' && networkSpeed > 5) return 'lossless';
    if (networkSpeed > 2) return '320kbps';
    if (networkSpeed > 1) return '256kbps';
    if (networkSpeed > 0.5) return '192kbps';
    return '128kbps';
  }

  // ─── Playback Progress ───────────────────────────────────────────────────────

  /** Save playback progress for resume functionality */
  async savePlaybackProgress(userId: string, progress: PlaybackProgress): Promise<void> {
    const key = `playback:progress:${userId}:${progress.songId}`;
    await this.redis.set(key, progress, 86400 * 7); // Keep for 7 days

    // Also update recent plays
    await this.redis.lpush(`playback:recent:${userId}`, JSON.stringify({
      songId: progress.songId,
      timestamp: progress.timestamp,
      quality: progress.quality,
    }));
    await this.redis.ltrim(`playback:recent:${userId}`, 0, 99); // Keep last 100
  }

  /** Get playback progress for resume */
  async getPlaybackProgress(userId: string, songId: string): Promise<PlaybackProgress | null> {
    return this.redis.get<PlaybackProgress>(`playback:progress:${userId}:${songId}`);
  }

  /** Get recently played songs */
  async getRecentlyPlayed(userId: string, limit = 20): Promise<Array<{ songId: string; timestamp: string }>> {
    const items = await this.redis.lrange(`playback:recent:${userId}`, 0, limit - 1);
    return items.map(item => JSON.parse(item));
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  /** Track streaming analytics */
  async trackStreamEvent(event: {
    type: 'start' | 'pause' | 'resume' | 'seek' | 'complete' | 'skip';
    sessionId: string;
    userId: string;
    songId: string;
    position: number;
    quality: string;
  }): Promise<void> {
    await this.kafka.publish(
      {
        ...event,
        timestamp: new Date().toISOString(),
      },
      { topic: 'streaming.analytics', key: event.userId }
    );
  }

  /** Update bytes streamed for bandwidth tracking */
  async updateBytesStreamed(sessionId: string, bytes: number): Promise<void> {
    const session = await this.redis.get<StreamSession>(`stream:session:${sessionId}`);
    if (session) {
      session.bytesStreamed = (session.bytesStreamed || 0) + bytes;
      session.lastActivity = new Date().toISOString();
      await this.redis.set(`stream:session:${sessionId}`, session, 3600);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Hash IP address for privacy */
  private hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip + this.jwtSecret).digest('hex').substring(0, 16);
  }

  /** Parse user agent for analytics */
  private parseUserAgent(userAgent: string): { device: string; browser: string; os: string } {
    // Simplified parsing - in production use a proper UA parser
    const device = userAgent.includes('Mobile') ? 'mobile' : 'desktop';
    let browser = 'unknown';
    let os = 'unknown';

    if (userAgent.includes('Chrome')) browser = 'chrome';
    else if (userAgent.includes('Firefox')) browser = 'firefox';
    else if (userAgent.includes('Safari')) browser = 'safari';
    else if (userAgent.includes('Edge')) browser = 'edge';

    if (userAgent.includes('Windows')) os = 'windows';
    else if (userAgent.includes('Mac')) os = 'macos';
    else if (userAgent.includes('Linux')) os = 'linux';
    else if (userAgent.includes('Android')) os = 'android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'ios';

    return { device, browser, os };
  }
}
