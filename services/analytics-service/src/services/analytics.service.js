"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const logger_1 = require("@auralux/logger");
const models_1 = require("../models");
const logger = (0, logger_1.createLogger)({ service: 'analytics-service', level: 'info' });
class AnalyticsService {
    config;
    cache;
    eventBuffer = [];
    flushTimer = null;
    constructor(config, cache) {
        this.config = config;
        this.cache = cache;
        this.startBufferFlush();
    }
    /* ── Event Ingestion ───────────────────────────────────────────────── */
    async ingestEvent(event) {
        this.eventBuffer.push({
            ...event,
            timestamp: new Date(),
        });
        // Real-time counters in Redis
        const today = new Date().toISOString().slice(0, 10);
        await Promise.all([
            this.cache.increment(`analytics:daily:${today}:plays`),
            this.cache.increment(`analytics:daily:${today}:event:${event.eventType}`),
        ]);
        // Track unique listeners per day via HyperLogLog (approximated with Set)
        if (event.eventType === 'song.played') {
            await this.cache.increment(`analytics:daily:${today}:unique_listeners`);
        }
        if (this.eventBuffer.length >= this.config.batchInsertSize) {
            await this.flushEventBuffer();
        }
    }
    /** Periodic flush of event buffer to MongoDB */
    startBufferFlush() {
        this.flushTimer = setInterval(async () => {
            if (this.eventBuffer.length > 0) {
                await this.flushEventBuffer();
            }
        }, this.config.aggregationIntervalMs);
    }
    async flushEventBuffer() {
        const batch = this.eventBuffer.splice(0, this.config.batchInsertSize);
        if (batch.length === 0)
            return;
        try {
            await models_1.AnalyticsEvent.insertMany(batch, { ordered: false });
            logger.info(`Flushed ${batch.length} analytics events to MongoDB`);
        }
        catch (err) {
            logger.error('Failed to flush analytics events', { error: err, count: batch.length });
            // Re-queue failed batch (capped to prevent OOM)
            if (this.eventBuffer.length < 10_000) {
                this.eventBuffer.unshift(...batch);
            }
        }
    }
    /* ── Song Play Tracking ────────────────────────────────────────────── */
    async trackSongPlay(data) {
        const today = new Date().toISOString().slice(0, 10);
        await models_1.SongAnalytics.findOneAndUpdate({ songId: data.songId }, {
            $inc: {
                totalPlays: 1,
                totalDuration: data.duration,
            },
            $push: {
                dailyPlays: {
                    $each: [{ date: today, plays: 1 }],
                    $slice: -90, // keep last 90 days
                },
            },
        }, { upsert: true, new: true });
        // Update completion & skip rates with running average
        const songStats = await models_1.SongAnalytics.findOne({ songId: data.songId });
        if (songStats && songStats.totalPlays > 0) {
            const n = songStats.totalPlays;
            songStats.avgCompletionRate =
                (songStats.avgCompletionRate * (n - 1) + data.completionRate) / n;
            songStats.skipRate =
                (songStats.skipRate * (n - 1) + (data.skipped ? 1 : 0)) / n;
            if (data.country) {
                const countryBreakdown = songStats.countryBreakdown || {};
                countryBreakdown[data.country] = (countryBreakdown[data.country] || 0) + 1;
                songStats.countryBreakdown = countryBreakdown;
                songStats.markModified('countryBreakdown');
            }
            await songStats.save();
        }
    }
    /* ── Daily Aggregation ─────────────────────────────────────────────── */
    async aggregateDailyMetrics(date) {
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);
        const [totalPlays, uniqueListeners, newUsers, topSongsAgg, topGenresAgg, topCountriesAgg,] = await Promise.all([
            models_1.AnalyticsEvent.countDocuments({
                eventType: 'song.played',
                timestamp: { $gte: startOfDay, $lte: endOfDay },
            }),
            models_1.AnalyticsEvent.distinct('userId', {
                eventType: 'song.played',
                timestamp: { $gte: startOfDay, $lte: endOfDay },
            }).then((ids) => ids.length),
            models_1.AnalyticsEvent.countDocuments({
                eventType: 'user.registered',
                timestamp: { $gte: startOfDay, $lte: endOfDay },
            }),
            models_1.AnalyticsEvent.aggregate([
                { $match: { eventType: 'song.played', timestamp: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: '$metadata.songId', plays: { $sum: 1 } } },
                { $sort: { plays: -1 } },
                { $limit: 50 },
                { $project: { songId: '$_id', plays: 1, _id: 0 } },
            ]),
            models_1.AnalyticsEvent.aggregate([
                { $match: { eventType: 'song.played', timestamp: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: '$metadata.genre', plays: { $sum: 1 } } },
                { $sort: { plays: -1 } },
                { $limit: 20 },
                { $project: { genre: '$_id', plays: 1, _id: 0 } },
            ]),
            models_1.AnalyticsEvent.aggregate([
                { $match: { eventType: 'song.played', timestamp: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: '$country', plays: { $sum: 1 } } },
                { $sort: { plays: -1 } },
                { $limit: 30 },
                { $project: { country: '$_id', plays: 1, _id: 0 } },
            ]),
        ]);
        const activeUsers = await models_1.AnalyticsEvent.distinct('userId', {
            timestamp: { $gte: startOfDay, $lte: endOfDay },
        }).then((ids) => ids.length);
        await models_1.DailyMetrics.findOneAndUpdate({ date }, {
            date,
            totalPlays,
            uniqueListeners,
            newUsers,
            activeUsers,
            topSongs: topSongsAgg,
            topGenres: topGenresAgg,
            topCountries: topCountriesAgg,
        }, { upsert: true, new: true });
        logger.info('Daily metrics aggregated', { date, totalPlays, uniqueListeners, activeUsers });
    }
    /* ── Query APIs ────────────────────────────────────────────────────── */
    async getDailyMetrics(date) {
        const cacheKey = `analytics:metrics:${date}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const metrics = await models_1.DailyMetrics.findOne({ date }).lean();
        if (metrics) {
            await this.cache.set(cacheKey, metrics, 3600);
        }
        return metrics;
    }
    async getMetricsRange(startDate, endDate) {
        return models_1.DailyMetrics.find({
            date: { $gte: startDate, $lte: endDate },
        })
            .sort({ date: 1 })
            .lean();
    }
    async getSongAnalytics(songId) {
        const cacheKey = `analytics:song:${songId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const stats = await models_1.SongAnalytics.findOne({ songId }).lean();
        if (stats) {
            await this.cache.set(cacheKey, stats, 300);
        }
        return stats;
    }
    async getTopSongs(limit = 20) {
        return models_1.SongAnalytics.find()
            .sort({ totalPlays: -1 })
            .limit(limit)
            .lean();
    }
    async getRealTimeStats() {
        const today = new Date().toISOString().slice(0, 10);
        const [plays, listeners] = await Promise.all([
            this.cache.get(`analytics:daily:${today}:plays`),
            this.cache.get(`analytics:daily:${today}:unique_listeners`),
        ]);
        return { date: today, plays: plays || 0, uniqueListeners: listeners || 0 };
    }
    /* ── Cleanup ───────────────────────────────────────────────────────── */
    async shutdown() {
        if (this.flushTimer)
            clearInterval(this.flushTimer);
        await this.flushEventBuffer();
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map