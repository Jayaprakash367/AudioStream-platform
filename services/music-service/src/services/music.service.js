"use strict";
/**
 * Music Service — Business Logic
 * Catalog management, search, genre filtering with Redis caching.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicService = void 0;
const models_1 = require("../models");
const common_1 = require("@auralux/common");
class MusicService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    /** Search songs with full-text search, filtering, and pagination */
    async searchSongs(params) {
        const { q, genre, artistId, isExplicit, page, limit, sortBy, sortOrder } = params;
        const filter = {};
        if (q) {
            filter.$text = { $search: q };
        }
        if (genre) {
            filter.genre = genre;
        }
        if (artistId) {
            filter.artistId = artistId;
        }
        if (isExplicit !== undefined) {
            filter.isExplicit = isExplicit;
        }
        const skip = (page - 1) * limit;
        const sort = {};
        if (q && !sortBy) {
            // Sort by text relevance when searching
            sort.score = -1;
        }
        else {
            sort[sortBy || 'playCount'] = sortOrder === 'asc' ? 1 : -1;
        }
        const [songs, total] = await Promise.all([
            models_1.Song.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            models_1.Song.countDocuments(filter),
        ]);
        return {
            songs,
            meta: (0, common_1.buildPaginationMeta)(total, page, limit),
        };
    }
    /** Get song by ID */
    async getSongById(songId) {
        const cached = await this.redis.get(`song:${songId}`);
        if (cached)
            return cached;
        const song = await models_1.Song.findById(songId).lean();
        if (!song)
            throw new common_1.NotFoundError('Song');
        await this.redis.set(`song:${songId}`, song, 600); // 10 min cache
        return song;
    }
    /** Get popular songs — heavily cached in Redis */
    async getPopularSongs(genre, limit = 50) {
        const cacheKey = genre ? `popular:${genre}:${limit}` : `popular:all:${limit}`;
        return this.redis.getOrSet(cacheKey, async () => {
            const filter = {};
            if (genre)
                filter.genre = genre;
            return models_1.Song.find(filter)
                .sort({ playCount: -1 })
                .limit(limit)
                .lean();
        }, 300 // 5 min cache
        );
    }
    /** Get songs by genre */
    async getSongsByGenre(genre, page, limit) {
        return this.searchSongs({ genre, page, limit });
    }
    /** Increment play count (called by streaming service via Kafka) */
    async incrementPlayCount(songId) {
        await models_1.Song.findByIdAndUpdate(songId, { $inc: { playCount: 1 } });
        // Invalidate caches
        await this.redis.del(`song:${songId}`);
        await this.redis.del(`popular:all:50`);
    }
}
exports.MusicService = MusicService;
//# sourceMappingURL=music.service.js.map