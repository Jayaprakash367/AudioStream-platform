/**
 * History Service — Business Logic
 * Records listening history and publishes events to Kafka for the Recommendation engine.
 */

import { ListeningHistory } from '../models';
import { KafkaEventBus } from '@auralux/kafka-client';
import { KafkaTopic, SongPlayedPayload } from '@auralux/shared-types';
import { buildPaginationMeta } from '@auralux/common';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export class HistoryService {
  constructor(private kafka: KafkaEventBus) {}

  /** Record a listening event (consumed from Kafka song.played topic) */
  async recordListening(data: SongPlayedPayload): Promise<void> {
    await ListeningHistory.create({
      userId: data.userId,
      songId: data.songId,
      songTitle: data.songTitle,
      artistName: data.artistName,
      listenedAt: new Date(data.timestamp),
      duration: data.listenedDuration,
      completionRate: data.completionRate,
      source: data.source,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    });

    // Re-publish to listening.history topic for the recommendation engine
    await this.kafka.publish(data, {
      topic: KafkaTopic.LISTENING_HISTORY,
      key: data.userId,
    });
  }

  /** Get user's listening history (paginated) */
  async getUserHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      ListeningHistory.find({ userId }).sort({ listenedAt: -1 }).skip(skip).limit(limit).lean(),
      ListeningHistory.countDocuments({ userId }),
    ]);
    return { entries, meta: buildPaginationMeta(total, page, limit) };
  }

  /** Get recently played songs (last 20) */
  async getRecentlyPlayed(userId: string) {
    return ListeningHistory.find({ userId })
      .sort({ listenedAt: -1 })
      .limit(20)
      .lean();
  }
}
