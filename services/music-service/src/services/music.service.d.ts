/**
 * Music Service — Business Logic
 * Catalog management, search, genre filtering with Redis caching.
 */
import { ISongDoc } from '../models';
import { RedisCacheManager } from '@auralux/redis-client';
interface SearchParams {
    q?: string;
    genre?: string;
    artistId?: string;
    isExplicit?: boolean;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class MusicService {
    private redis;
    constructor(redis: RedisCacheManager);
    /** Search songs with full-text search, filtering, and pagination */
    searchSongs(params: SearchParams): Promise<{
        songs: (import("mongoose").FlattenMaps<ISongDoc> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    /** Get song by ID */
    getSongById(songId: string): Promise<ISongDoc>;
    /** Get popular songs — heavily cached in Redis */
    getPopularSongs(genre?: string, limit?: number): Promise<(import("mongoose").FlattenMaps<ISongDoc> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /** Get songs by genre */
    getSongsByGenre(genre: string, page: number, limit: number): Promise<{
        songs: (import("mongoose").FlattenMaps<ISongDoc> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    /** Increment play count (called by streaming service via Kafka) */
    incrementPlayCount(songId: string): Promise<void>;
}
export {};
//# sourceMappingURL=music.service.d.ts.map