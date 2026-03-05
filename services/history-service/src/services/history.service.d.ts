/**
 * History Service — Business Logic
 * Records listening history and publishes events to Kafka for the Recommendation engine.
 */
import { KafkaEventBus } from '@auralux/kafka-client';
import { SongPlayedPayload } from '@auralux/shared-types';
export declare class HistoryService {
    private kafka;
    constructor(kafka: KafkaEventBus);
    /** Record a listening event (consumed from Kafka song.played topic) */
    recordListening(data: SongPlayedPayload): Promise<void>;
    /** Get user's listening history (paginated) */
    getUserHistory(userId: string, page: number, limit: number): Promise<{
        entries: (import("mongoose").FlattenMaps<import("../models").IHistoryDoc> & Required<{
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
    /** Get recently played songs (last 20) */
    getRecentlyPlayed(userId: string): Promise<(import("mongoose").FlattenMaps<import("../models").IHistoryDoc> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
//# sourceMappingURL=history.service.d.ts.map