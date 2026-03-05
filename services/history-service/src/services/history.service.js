"use strict";
/**
 * History Service — Business Logic
 * Records listening history and publishes events to Kafka for the Recommendation engine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const models_1 = require("../models");
const shared_types_1 = require("@auralux/shared-types");
const common_1 = require("@auralux/common");
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
class HistoryService {
    kafka;
    constructor(kafka) {
        this.kafka = kafka;
    }
    /** Record a listening event (consumed from Kafka song.played topic) */
    async recordListening(data) {
        await models_1.ListeningHistory.create({
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
            topic: shared_types_1.KafkaTopic.LISTENING_HISTORY,
            key: data.userId,
        });
    }
    /** Get user's listening history (paginated) */
    async getUserHistory(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [entries, total] = await Promise.all([
            models_1.ListeningHistory.find({ userId }).sort({ listenedAt: -1 }).skip(skip).limit(limit).lean(),
            models_1.ListeningHistory.countDocuments({ userId }),
        ]);
        return { entries, meta: (0, common_1.buildPaginationMeta)(total, page, limit) };
    }
    /** Get recently played songs (last 20) */
    async getRecentlyPlayed(userId) {
        return models_1.ListeningHistory.find({ userId })
            .sort({ listenedAt: -1 })
            .limit(20)
            .lean();
    }
}
exports.HistoryService = HistoryService;
//# sourceMappingURL=history.service.js.map