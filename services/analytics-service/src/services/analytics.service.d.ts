import { RedisCacheManager } from '@auralux/redis-client';
import { AnalyticsServiceConfig } from '../config';
export declare class AnalyticsService {
    private readonly config;
    private readonly cache;
    private eventBuffer;
    private flushTimer;
    constructor(config: AnalyticsServiceConfig, cache: RedisCacheManager);
    ingestEvent(event: {
        eventType: string;
        userId: string;
        metadata?: Record<string, unknown>;
        sessionId?: string;
        deviceType?: string;
        country?: string;
    }): Promise<void>;
    /** Periodic flush of event buffer to MongoDB */
    private startBufferFlush;
    private flushEventBuffer;
    trackSongPlay(data: {
        songId: string;
        userId: string;
        duration: number;
        completionRate: number;
        skipped: boolean;
        country?: string;
    }): Promise<void>;
    aggregateDailyMetrics(date: string): Promise<void>;
    getDailyMetrics(date: string): Promise<{} | null>;
    getMetricsRange(startDate: string, endDate: string): Promise<(import("mongoose").FlattenMaps<import("../models").IDailyMetrics> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getSongAnalytics(songId: string): Promise<{} | null>;
    getTopSongs(limit?: number): Promise<(import("mongoose").FlattenMaps<import("../models").ISongAnalytics> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getRealTimeStats(): Promise<{
        date: string;
        plays: number;
        uniqueListeners: number;
    }>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=analytics.service.d.ts.map