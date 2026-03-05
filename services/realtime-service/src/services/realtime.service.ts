/**
 * Real-Time WebSocket Service
 * Handles live song updates, new releases, and user presence
 */

import { WebSocket } from 'ws';
import { RedisCacheManager } from '@auralux/redis-client';
import { KafkaEventBus } from '@auralux/kafka-client';
import { createLogger } from '@auralux/logger';

const logger = createLogger({ serviceName: 'realtime-service', level: 'info' });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RealtimeClient {
  id: string;
  userId?: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  connectedAt: Date;
  lastPing: Date;
  language?: string;
  quality?: string;
}

export interface RealtimeMessage {
  type: 'NEW_SONG' | 'TRENDING_UPDATE' | 'PLAYLIST_UPDATE' | 'USER_ACTIVITY' | 'QUALITY_CHANGE' | 'SYSTEM';
  payload: Record<string, unknown>;
  timestamp: string;
  channel?: string;
}

export interface NewSongPayload {
  songId: string;
  title: string;
  artist: string;
  album: string;
  coverArtUrl: string;
  language: string;
  genre: string;
  duration: number;
  releaseDate: string;
  availableQualities: string[];
  isExplicit: boolean;
}

export interface TrendingUpdatePayload {
  songs: Array<{
    songId: string;
    title: string;
    artist: string;
    rank: number;
    change: 'up' | 'down' | 'new' | 'same';
    playCount: number;
  }>;
  language: string;
  genre?: string;
}

// ─── Channel Types ───────────────────────────────────────────────────────────

export const CHANNELS = {
  ALL_SONGS: 'all_songs',
  NEW_RELEASES: 'new_releases',
  TRENDING: 'trending',
  LANGUAGE: (lang: string) => `language:${lang.toLowerCase()}`,
  GENRE: (genre: string) => `genre:${genre.toLowerCase()}`,
  ARTIST: (artistId: string) => `artist:${artistId}`,
  USER: (userId: string) => `user:${userId}`,
} as const;

// ─── Real-Time Service ───────────────────────────────────────────────────────

export class RealtimeService {
  private clients: Map<string, RealtimeClient> = new Map();
  private channelSubscribers: Map<string, Set<string>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private redis: RedisCacheManager,
    private kafka: KafkaEventBus,
    private config: { heartbeatInterval: number; maxConnectionsPerUser: number }
  ) {}

  // ─── Connection Management ─────────────────────────────────────────────────

  async handleConnection(ws: WebSocket, clientId: string, userId?: string, initialLanguage?: string): Promise<void> {
    // Check connection limits for authenticated users
    if (userId) {
      const userConnections = this.getClientsByUserId(userId);
      if (userConnections.length >= this.config.maxConnectionsPerUser) {
        ws.close(4001, 'Too many connections');
        return;
      }
    }

    const client: RealtimeClient = {
      id: clientId,
      userId,
      ws,
      subscriptions: new Set(),
      connectedAt: new Date(),
      lastPing: new Date(),
      language: initialLanguage || 'all',
      quality: '320kbps',
    };

    this.clients.set(clientId, client);

    // Auto-subscribe to essential channels
    this.subscribe(clientId, CHANNELS.NEW_RELEASES);
    this.subscribe(clientId, CHANNELS.TRENDING);
    if (initialLanguage && initialLanguage !== 'all') {
      this.subscribe(clientId, CHANNELS.LANGUAGE(initialLanguage));
    }

    // Track online users in Redis
    if (userId) {
      await this.redis.hset('realtime:online', userId, JSON.stringify({
        clientId,
        connectedAt: client.connectedAt.toISOString(),
        language: initialLanguage,
      }));
    }

    // Send welcome message with current state
    this.send(clientId, {
      type: 'SYSTEM',
      payload: {
        event: 'connected',
        clientId,
        subscribedChannels: Array.from(client.subscriptions),
        availableLanguages: await this.getAvailableLanguages(),
        availableQualities: ['128kbps', '192kbps', '256kbps', '320kbps', 'lossless'],
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('Client connected', { clientId, userId, language: initialLanguage });
  }

  handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Unsubscribe from all channels
    for (const channel of client.subscriptions) {
      const subscribers = this.channelSubscribers.get(channel);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(channel);
        }
      }
    }

    // Remove from online users
    if (client.userId) {
      this.redis.hdel('realtime:online', client.userId).catch(() => {});
    }

    this.clients.delete(clientId);
    logger.info('Client disconnected', { clientId, userId: client.userId });
  }

  // ─── Subscription Management ───────────────────────────────────────────────

  subscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.subscriptions.add(channel);

    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    this.channelSubscribers.get(channel)!.add(clientId);

    logger.debug('Client subscribed', { clientId, channel });
    return true;
  }

  unsubscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.subscriptions.delete(channel);
    const subscribers = this.channelSubscribers.get(channel);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(channel);
      }
    }

    logger.debug('Client unsubscribed', { clientId, channel });
    return true;
  }

  // ─── Message Broadcasting ──────────────────────────────────────────────────

  private send(clientId: string, message: RealtimeMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;
    
    try {
      client.ws.send(JSON.stringify(message));
    } catch (err) {
      logger.error('Failed to send message', { clientId, error: err });
    }
  }

  broadcastToChannel(channel: string, message: Omit<RealtimeMessage, 'channel'>): void {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers) return;

    const fullMessage: RealtimeMessage = { ...message, channel };
    const payload = JSON.stringify(fullMessage);

    for (const clientId of subscribers) {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(payload);
        } catch {
          // Client will be cleaned up by heartbeat
        }
      }
    }

    logger.info('Broadcast to channel', { channel, recipientCount: subscribers.size });
  }

  broadcastToAll(message: RealtimeMessage): void {
    const payload = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(payload);
        } catch {
          // Ignore
        }
      }
    }
  }

  // ─── Song Update Events ────────────────────────────────────────────────────

  async publishNewSong(song: NewSongPayload): Promise<void> {
    const message: RealtimeMessage = {
      type: 'NEW_SONG',
      payload: song,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all relevant channels
    this.broadcastToChannel(CHANNELS.NEW_RELEASES, message);
    this.broadcastToChannel(CHANNELS.LANGUAGE(song.language), message);
    this.broadcastToChannel(CHANNELS.GENRE(song.genre), message);

    // Store in Redis for recent songs list
    await this.redis.lpush('realtime:new_songs', JSON.stringify(song));
    await this.redis.ltrim('realtime:new_songs', 0, 99); // Keep last 100

    // Publish to Kafka for other services
    await this.kafka.publish({ event: 'NEW_SONG', song }, { topic: 'music.realtime', key: song.songId });

    logger.info('New song published', { songId: song.songId, title: song.title, language: song.language });
  }

  async publishTrendingUpdate(update: TrendingUpdatePayload): Promise<void> {
    const message: RealtimeMessage = {
      type: 'TRENDING_UPDATE',
      payload: update,
      timestamp: new Date().toISOString(),
    };

    this.broadcastToChannel(CHANNELS.TRENDING, message);
    if (update.language) {
      this.broadcastToChannel(CHANNELS.LANGUAGE(update.language), message);
    }
    if (update.genre) {
      this.broadcastToChannel(CHANNELS.GENRE(update.genre), message);
    }

    logger.info('Trending update published', { language: update.language, songCount: update.songs.length });
  }

  // ─── Quality & Language Updates ────────────────────────────────────────────

  updateClientPreferences(clientId: string, language?: string, quality?: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Update language subscription
    if (language && language !== client.language) {
      if (client.language && client.language !== 'all') {
        this.unsubscribe(clientId, CHANNELS.LANGUAGE(client.language));
      }
      if (language !== 'all') {
        this.subscribe(clientId, CHANNELS.LANGUAGE(language));
      }
      client.language = language;
    }

    if (quality) {
      client.quality = quality;
    }

    this.send(clientId, {
      type: 'SYSTEM',
      payload: {
        event: 'preferences_updated',
        language: client.language,
        quality: client.quality,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  getClientsByUserId(userId: string): RealtimeClient[] {
    return Array.from(this.clients.values()).filter(c => c.userId === userId);
  }

  async getAvailableLanguages(): Promise<string[]> {
    const cached = await this.redis.get<string[]>('music:languages');
    return cached || [
      'English', 'Hindi', 'Tamil', 'Telugu', 'Punjabi', 'Malayalam',
      'Kannada', 'Bengali', 'Marathi', 'Korean', 'Japanese', 'Spanish',
      'Arabic', 'French', 'Chinese', 'Portuguese', 'Turkish', 'German', 'Italian'
    ];
  }

  async getRecentSongs(limit = 20): Promise<NewSongPayload[]> {
    const songs = await this.redis.lrange('realtime:new_songs', 0, limit - 1);
    return songs.map(s => JSON.parse(s));
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      totalChannels: this.channelSubscribers.size,
      channelStats: Object.fromEntries(
        Array.from(this.channelSubscribers.entries()).map(([ch, subs]) => [ch, subs.size])
      ),
    };
  }

  // ─── Heartbeat ─────────────────────────────────────────────────────────────

  startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [clientId, client] of this.clients) {
        if (client.ws.readyState !== WebSocket.OPEN) {
          this.handleDisconnect(clientId);
          continue;
        }

        // Check for stale connections (no ping for 2x heartbeat interval)
        if (now - client.lastPing.getTime() > this.config.heartbeatInterval * 2) {
          client.ws.terminate();
          this.handleDisconnect(clientId);
          continue;
        }

        // Send ping
        try {
          client.ws.ping();
        } catch {
          this.handleDisconnect(clientId);
        }
      }
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async shutdown(): Promise<void> {
    this.stopHeartbeat();
    for (const client of this.clients.values()) {
      client.ws.close(1001, 'Server shutting down');
    }
    this.clients.clear();
    this.channelSubscribers.clear();
  }
}
