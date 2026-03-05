/**
 * Auth Service — Configuration
 */

import { loadBaseConfig, BaseServiceConfig } from '@auralux/common';

export interface AuthServiceConfig extends BaseServiceConfig {
  bcryptSaltRounds: number;
}

export function loadAuthConfig(): AuthServiceConfig {
  const base = loadBaseConfig('auth-service', 3001);

  return {
    ...base,
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  };
}
