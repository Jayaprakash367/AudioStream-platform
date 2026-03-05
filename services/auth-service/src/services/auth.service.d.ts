/**
 * Auth Service — Business Logic Layer
 * Handles registration, login, token management, and password operations.
 * Publishes domain events to Kafka for downstream consumption.
 */
import { AuthServiceConfig } from '../config';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private config;
    private kafka;
    private redis;
    constructor(config: AuthServiceConfig, kafka: KafkaEventBus, redis: RedisCacheManager);
    /** ─── Register ──────────────────────────────────────────── */
    register(data: {
        email: string;
        username: string;
        password: string;
        displayName: string;
    }): Promise<{
        userId: string;
        tokens: TokenPair;
    }>;
    /** ─── Login ─────────────────────────────────────────────── */
    login(data: {
        email: string;
        password: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<{
        userId: string;
        tokens: TokenPair;
    }>;
    /** ─── Refresh Token ─────────────────────────────────────── */
    refreshToken(currentRefreshToken: string): Promise<TokenPair>;
    /** ─── Logout ────────────────────────────────────────────── */
    logout(userId: string, refreshToken?: string): Promise<void>;
    /** ─── Email Verification ────────────────────────────────── */
    verifyEmail(token: string): Promise<void>;
    /** ─── Password Reset ───────────────────────────────────── */
    requestPasswordReset(email: string): Promise<string>;
    confirmPasswordReset(token: string, newPassword: string): Promise<void>;
    /** ─── Token Generation ──────────────────────────────────── */
    private generateTokenPair;
    /** Parse duration string (e.g., "15m", "7d") to milliseconds */
    private parseExpiry;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map