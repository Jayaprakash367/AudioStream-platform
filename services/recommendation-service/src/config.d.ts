import { BaseServiceConfig } from '@auralux/common';
export interface RecommendationServiceConfig extends BaseServiceConfig {
    musicServiceUrl: string;
    historyServiceUrl: string;
    recommendationTTL: number;
    maxRecommendations: number;
    collaborativeFilteringMinUsers: number;
    contentBasedWeight: number;
    collaborativeWeight: number;
}
export declare function loadConfig(): RecommendationServiceConfig;
//# sourceMappingURL=config.d.ts.map