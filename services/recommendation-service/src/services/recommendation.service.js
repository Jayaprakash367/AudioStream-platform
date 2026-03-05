"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const logger_1 = require("@auralux/logger");
const shared_types_1 = require("@auralux/shared-types");
const models_1 = require("../models");
const logger = (0, logger_1.createLogger)({ service: 'recommendation-service', level: 'info' });
/* ── Helpers ─────────────────────────────────────────────────────────── */
function cosineSimilarity(a, b) {
    if (a.length !== b.length || a.length === 0)
        return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}
/** Convert genre weights to a fixed-length vector keyed by Genre enum */
function genreVector(weights) {
    const genres = Object.values(shared_types_1.Genre);
    const vec = new Array(genres.length).fill(0);
    for (const gw of weights) {
        const idx = genres.indexOf(gw.genre);
        if (idx !== -1)
            vec[idx] = gw.weight;
    }
    return vec;
}
/* ── Service ─────────────────────────────────────────────────────────── */
class RecommendationService {
    config;
    cache;
    constructor(config, cache) {
        this.config = config;
        this.cache = cache;
    }
    /* ─── Taste Profile Ingestion ───────────────────────────────────── */
    /**
     * Called when a `listening.history` Kafka event arrives.
     * Updates the user's taste profile incrementally.
     */
    async ingestListeningEvent(event) {
        const { userId, songId, artistId, genre, duration } = event;
        let profile = await models_1.UserTasteProfile.findOne({ userId });
        if (!profile) {
            profile = new models_1.UserTasteProfile({ userId });
        }
        // ── Update genre weights ──
        const existingGenre = profile.genreWeights.find((g) => g.genre === genre);
        if (existingGenre) {
            existingGenre.playCount += 1;
            existingGenre.totalListenDuration += duration;
        }
        else {
            profile.genreWeights.push({
                genre: genre,
                weight: 0,
                playCount: 1,
                totalListenDuration: duration,
            });
        }
        // Re-normalise genre weights
        const totalGenrePlays = profile.genreWeights.reduce((sum, g) => sum + g.playCount, 0);
        for (const g of profile.genreWeights) {
            g.weight = totalGenrePlays > 0 ? g.playCount / totalGenrePlays : 0;
        }
        // ── Update artist affinity ──
        if (artistId) {
            const existingArtist = profile.artistAffinities.find((a) => a.artistId === artistId);
            if (existingArtist) {
                existingArtist.playCount += 1;
                existingArtist.lastPlayed = new Date();
            }
            else {
                profile.artistAffinities.push({
                    artistId,
                    score: 0,
                    playCount: 1,
                    lastPlayed: new Date(),
                });
            }
            // Re-normalise artist affinity scores
            const maxArtistPlays = Math.max(...profile.artistAffinities.map((a) => a.playCount), 1);
            for (const a of profile.artistAffinities) {
                a.score = a.playCount / maxArtistPlays;
            }
        }
        // ── Rolling recent songs (keep last 200) ──
        profile.recentSongIds = [songId, ...profile.recentSongIds].slice(0, 200);
        profile.totalPlays += 1;
        profile.lastUpdated = new Date();
        await profile.save();
        // Invalidate cached recommendations
        await this.cache.del(`recommendations:${userId}`);
        logger.debug('Taste profile updated', { userId, songId, totalPlays: profile.totalPlays });
    }
    /* ─── Recommendation Generation ─────────────────────────────────── */
    async getRecommendations(userId, limit = 20) {
        // Check cache first
        const cacheKey = `recommendations:${userId}:${limit}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        // Check for a fresh batch in DB
        const existingBatch = await models_1.RecommendationBatch.findOne({
            userId,
            expiresAt: { $gt: new Date() },
        }).sort({ generatedAt: -1 });
        if (existingBatch) {
            const items = existingBatch.items.slice(0, limit);
            await this.cache.set(cacheKey, items, this.config.recommendationTTL);
            return items;
        }
        // Generate fresh recommendations
        const items = await this.generateRecommendations(userId, limit);
        // Persist batch
        const expiresAt = new Date(Date.now() + this.config.recommendationTTL * 1000);
        await models_1.RecommendationBatch.create({
            userId,
            items,
            generatedAt: new Date(),
            expiresAt,
            strategyMix: this.computeStrategyMix(items),
        });
        await this.cache.set(cacheKey, items, this.config.recommendationTTL);
        return items;
    }
    async generateRecommendations(userId, limit) {
        const profile = await models_1.UserTasteProfile.findOne({ userId });
        const results = [];
        // Strategy 1: Content-based (from genre & artist affinity)
        if (profile && profile.genreWeights.length > 0) {
            const contentBased = await this.contentBasedFiltering(profile, limit);
            results.push(...contentBased);
        }
        // Strategy 2: Collaborative filtering (users with similar taste)
        if (profile && profile.totalPlays >= 5) {
            const collaborative = await this.collaborativeFiltering(profile, limit);
            results.push(...collaborative);
        }
        // Strategy 3: Trending / popular (fallback & discovery)
        const trending = await this.trendingStrategy(userId, limit);
        results.push(...trending);
        // Deduplicate by songId, keep highest score
        const deduped = this.deduplicateAndRank(results, profile?.recentSongIds || []);
        return deduped.slice(0, limit);
    }
    /* ─── Content-Based Filtering ───────────────────────────────────── */
    async contentBasedFiltering(profile, limit) {
        const topGenres = [...profile.genreWeights]
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 3)
            .map((g) => g.genre);
        const topArtists = [...profile.artistAffinities]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((a) => a.artistId);
        // In production this would query the music-service catalog via gRPC/HTTP.
        // Here we build recommendation items from profile data as a scaffold.
        const items = [];
        for (const genre of topGenres) {
            items.push({
                songId: `content-genre-${genre}-${Date.now()}`,
                score: profile.genreWeights.find((g) => g.genre === genre)?.weight || 0.5,
                reason: `Based on your love of ${genre}`,
                strategy: 'content-based',
            });
        }
        for (const artistId of topArtists) {
            const affinity = profile.artistAffinities.find((a) => a.artistId === artistId);
            items.push({
                songId: `content-artist-${artistId}-${Date.now()}`,
                score: affinity?.score || 0.5,
                reason: `More from artists you enjoy`,
                strategy: 'content-based',
            });
        }
        return items.slice(0, limit);
    }
    /* ─── Collaborative Filtering ───────────────────────────────────── */
    async collaborativeFiltering(profile, limit) {
        const userVector = genreVector(profile.genreWeights);
        // Find similar users by genre taste vector cosine similarity
        const allProfiles = await models_1.UserTasteProfile.find({
            userId: { $ne: profile.userId },
            totalPlays: { $gte: this.config.collaborativeFilteringMinUsers },
        })
            .sort({ totalPlays: -1 })
            .limit(100)
            .lean();
        const similarities = [];
        for (const other of allProfiles) {
            const otherVector = genreVector(other.genreWeights);
            const sim = cosineSimilarity(userVector, otherVector);
            if (sim > 0.5) {
                similarities.push({ userId: other.userId, sim, recentSongIds: other.recentSongIds });
            }
        }
        similarities.sort((a, b) => b.sim - a.sim);
        const topSimilar = similarities.slice(0, 10);
        // Collect songs from similar users that the target user hasn't heard
        const heardSet = new Set(profile.recentSongIds);
        const candidateScores = new Map();
        for (const neighbor of topSimilar) {
            for (const songId of neighbor.recentSongIds) {
                if (heardSet.has(songId))
                    continue;
                const existing = candidateScores.get(songId) || { totalScore: 0, count: 0 };
                existing.totalScore += neighbor.sim;
                existing.count += 1;
                candidateScores.set(songId, existing);
            }
        }
        const items = [];
        for (const [songId, { totalScore, count }] of candidateScores) {
            items.push({
                songId,
                score: Math.min(totalScore / count, 1),
                reason: `Loved by listeners with similar taste`,
                strategy: 'collaborative',
            });
        }
        items.sort((a, b) => b.score - a.score);
        return items.slice(0, limit);
    }
    /* ─── Trending / Discovery ──────────────────────────────────────── */
    async trendingStrategy(userId, limit) {
        // In production: query Music Service for globally trending songs
        // and filter out ones the user already heard.
        const trendingCacheKey = 'global:trending:songs';
        const trendingSongIds = await this.cache.get(trendingCacheKey);
        if (!trendingSongIds || trendingSongIds.length === 0) {
            return [
                {
                    songId: 'trending-placeholder',
                    score: 0.3,
                    reason: 'Trending right now',
                    strategy: 'trending',
                },
            ];
        }
        const profile = await models_1.UserTasteProfile.findOne({ userId }).lean();
        const heardSet = new Set(profile?.recentSongIds || []);
        return trendingSongIds
            .filter((id) => !heardSet.has(id))
            .slice(0, limit)
            .map((songId, idx) => ({
            songId,
            score: Math.max(0.8 - idx * 0.02, 0.3),
            reason: 'Trending right now',
            strategy: 'trending',
        }));
    }
    /* ─── Dedup & Rank ──────────────────────────────────────────────── */
    deduplicateAndRank(items, recentSongIds) {
        const heardSet = new Set(recentSongIds);
        const seen = new Map();
        for (const item of items) {
            if (heardSet.has(item.songId))
                continue;
            const existing = seen.get(item.songId);
            if (!existing || item.score > existing.score) {
                seen.set(item.songId, item);
            }
        }
        return [...seen.values()].sort((a, b) => b.score - a.score);
    }
    computeStrategyMix(items) {
        const counts = {};
        for (const item of items) {
            counts[item.strategy] = (counts[item.strategy] || 0) + 1;
        }
        const total = items.length || 1;
        const mix = {};
        for (const [strategy, count] of Object.entries(counts)) {
            mix[strategy] = Math.round((count / total) * 100);
        }
        return mix;
    }
    /* ─── Taste Profile Read ────────────────────────────────────────── */
    async getUserTasteProfile(userId) {
        return models_1.UserTasteProfile.findOne({ userId }).lean();
    }
}
exports.RecommendationService = RecommendationService;
//# sourceMappingURL=recommendation.service.js.map