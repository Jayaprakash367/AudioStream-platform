"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const common_1 = require("@auralux/common");
function loadConfig() {
    const base = (0, common_1.loadBaseConfig)();
    return {
        ...base,
        port: parseInt(process.env.PORT || '3007', 10),
        serviceName: 'recommendation-service',
        musicServiceUrl: process.env.MUSIC_SERVICE_URL || 'http://localhost:3003',
        historyServiceUrl: process.env.HISTORY_SERVICE_URL || 'http://localhost:3006',
        recommendationTTL: parseInt(process.env.RECOMMENDATION_TTL || '3600', 10),
        maxRecommendations: parseInt(process.env.MAX_RECOMMENDATIONS || '50', 10),
        collaborativeFilteringMinUsers: parseInt(process.env.CF_MIN_USERS || '10', 10),
        contentBasedWeight: parseFloat(process.env.CONTENT_BASED_WEIGHT || '0.4'),
        collaborativeWeight: parseFloat(process.env.COLLABORATIVE_WEIGHT || '0.6'),
    };
}
//# sourceMappingURL=config.js.map