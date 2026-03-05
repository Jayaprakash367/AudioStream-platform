import { RedisCacheManager } from '@auralux/redis-client';
import { IListeningHistoryEvent } from '@auralux/shared-types';
import { IUserTasteProfile, IRecommendationItem } from '../models';
import { RecommendationServiceConfig } from '../config';
export declare class RecommendationService {
    private readonly config;
    private readonly cache;
    constructor(config: RecommendationServiceConfig, cache: RedisCacheManager);
    /**
     * Called when a `listening.history` Kafka event arrives.
     * Updates the user's taste profile incrementally.
     */
    ingestListeningEvent(event: IListeningHistoryEvent): Promise<void>;
    getRecommendations(userId: string, limit?: number): Promise<IRecommendationItem[]>;
    private generateRecommendations;
    private contentBasedFiltering;
    private collaborativeFiltering;
    private trendingStrategy;
    private deduplicateAndRank;
    private computeStrategyMix;
    getUserTasteProfile(userId: string): Promise<IUserTasteProfile | null>;
}
//# sourceMappingURL=recommendation.service.d.ts.map