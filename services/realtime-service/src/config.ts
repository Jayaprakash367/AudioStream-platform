/**
 * Real-Time Service Configuration
 * WebSocket server for live music updates, notifications, and presence
 */

import { BaseServiceConfig, loadBaseConfig } from '@auralux/common';

export interface RealtimeServiceConfig extends BaseServiceConfig {
  wsHeartbeatInterval: number;
  maxConnectionsPerUser: number;
  messageRateLimit: number;
}

export function loadConfig(): RealtimeServiceConfig {
  const base = loadBaseConfig('realtime-service');
  return {
    ...base,
    wsHeartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
    maxConnectionsPerUser: parseInt(process.env.MAX_CONNECTIONS_PER_USER || '5', 10),
    messageRateLimit: parseInt(process.env.MESSAGE_RATE_LIMIT || '100', 10),
  };
}
