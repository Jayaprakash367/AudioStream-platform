/**
 * API Gateway — Configuration
 * Extends base config with gateway-specific settings (upstream service URLs).
 */

import { loadBaseConfig, BaseServiceConfig } from '@auralux/common';

export interface GatewayConfig extends BaseServiceConfig {
  /** Upstream service URLs */
  services: {
    auth: string;
    user: string;
    music: string;
    streaming: string;
    playlist: string;
    history: string;
    recommendation: string;
    analytics: string;
    notification: string;
  };
}

export function loadGatewayConfig(): GatewayConfig {
  const base = loadBaseConfig('api-gateway', 3000);

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
