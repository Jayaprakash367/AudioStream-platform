"use strict";
/**
 * API Gateway — Configuration
 * Extends base config with gateway-specific settings (upstream service URLs).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGatewayConfig = loadGatewayConfig;
const common_1 = require("@auralux/common");
function loadGatewayConfig() {
    const base = (0, common_1.loadBaseConfig)('api-gateway', 3000);
    return {
        ...base,
        services: {
            auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
            user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
            music: process.env.MUSIC_SERVICE_URL || 'http://localhost:3003',
            streaming: process.env.STREAMING_SERVICE_URL || 'http://localhost:3004',
            playlist: process.env.PLAYLIST_SERVICE_URL || 'http://localhost:3005',
            history: process.env.HISTORY_SERVICE_URL || 'http://localhost:3006',
            recommendation: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3007',
            analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008',
            notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
        },
    };
}
//# sourceMappingURL=config.js.map