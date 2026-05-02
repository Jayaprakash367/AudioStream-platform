/**
 * Auth Service — Business Logic Layer
 * Handles registration, login, token management, and password operations.
 * Publishes domain events to Kafka for downstream consumption.
 *
 * Key patterns:
 *   - rememberMe=true  → 30-day refresh token, cached in Redis for auto-login
 *   - rememberMe=false → 1-day refresh token, no persistent Redis session
 *   - Token rotation    → every refresh issues a new pair, old token revoked
 *   - Blacklisting      → logout adds user to Redis blacklist (15 min)
 *   - Rate limiting     → 5 failed attempts → 15-minute account lockout
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthCredentials, IAuthCredentialsDoc } from '../models';
import { AuthServiceConfig } from '../config';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '@auralux/common';
import { KafkaTopic } from '@auralux/shared-types';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  subscription: string;
  jti: string;
  iat: number;
  exp: number;
}

/** Lightweight user profile stored in Redis for session checks */
interface SessionProfile {
  userId: string;
  email: string;
  username: string;
  role: string;
  subscription: string;
  isEmailVerified: boolean;
  rememberMe: boolean;
  sessionCachedAt: string;
}

// Redis key prefixes — keep organized
const KEY = {
  session: (uid: string) => `session:${uid}`,         // SessionProfile JSON
  blacklist: (uid: string) => `blacklist:${uid}`,      // Logout blacklist flag
  rateLimit: (uid: string) => `ratelimit:${uid}`,      // Login attempt counter
};

// TTLs
const TTL = {
  SESSION_REMEMBER: 30 * 24 * 3600,   // 30 days (rememberMe=true)
  SESSION_TEMP: 24 * 3600,            // 1 day   (rememberMe=false)
  BLACKLIST: 15 * 60,                  // 15 min  (access token max lifetime)
  REFRESH_REMEMBER: '30d',
  REFRESH_TEMP: '1d',
  ACCESS_TOKEN: '15m',
};

export class AuthService {
  constructor(
    private config: AuthServiceConfig,
    private kafka: KafkaEventBus,
    private redis: RedisCacheManager
  ) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }): Promise<{ userId: string; tokens: TokenPair }> {
    // Check for duplicate email or username
    const existing = await AuthCredentials.findOne({
      $or: [{ email: data.email.toLowerCase() }, { username: data.username.toLowerCase() }],
    });

    if (existing) {
      const field = existing.email === data.email.toLowerCase() ? 'email' : 'username';
      throw new ConflictError(`${field} already registered`);
    }

    const passwordHash = await bcrypt.hash(data.password, this.config.bcryptSaltRounds);
    const userId = crypto.randomUUID();
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const credentials = await AuthCredentials.create({
      userId,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      passwordHash,
      emailVerificationToken,
      isEmailVerified: false,
    });

    // New accounts get a temporary (1-day) refresh token by default
    const tokens = await this.generateTokenPair(credentials, '', '', false);

    // Publish registration event for UserService to create profile
    await this.kafka.publish(
      {
        userId,
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        registeredAt: new Date().toISOString(),
      },
      {
        topic: KafkaTopic.USER_REGISTERED,
        key: userId,
      }
    );

    return { userId, tokens };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(data: {
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
    rememberMe: boolean;
  }): Promise<{ userId: string; tokens: TokenPair }> {
    const credentials = await AuthCredentials.findOne({ email: data.email.toLowerCase() });

    if (!credentials) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account lockout
    if (credentials.lockoutUntil && credentials.lockoutUntil > new Date()) {
      const remainingMs = credentials.lockoutUntil.getTime() - Date.now();
      throw new BadRequestError(
        `Account locked. Try again in ${Math.ceil(remainingMs / 60000)} minutes`
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, credentials.passwordHash);

    if (!isValidPassword) {
      credentials.failedLoginAttempts += 1;

      // Lock after 5 failed attempts for 15 minutes
      if (credentials.failedLoginAttempts >= 5) {
        credentials.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        credentials.failedLoginAttempts = 0;
      }

      await credentials.save();
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed attempts on success
    credentials.failedLoginAttempts = 0;
    credentials.lockoutUntil = undefined;

    // Remove expired / revoked refresh tokens to keep document clean
    credentials.refreshTokens = credentials.refreshTokens.filter(
      (rt) => rt.expiresAt > new Date() && !rt.isRevoked
    );

    const tokens = await this.generateTokenPair(
      credentials,
      data.ipAddress,
      data.userAgent,
      data.rememberMe
    );

    await credentials.save();

    // ── Cache session in Redis for auto-login ──────────────────────────────
    const sessionProfile: SessionProfile = {
      userId: credentials.userId,
      email: credentials.email,
      username: credentials.username,
      role: 'LISTENER',
      subscription: 'FREE',
      isEmailVerified: credentials.isEmailVerified,
      rememberMe: data.rememberMe,
      sessionCachedAt: new Date().toISOString(),
    };

    const sessionTTL = data.rememberMe ? TTL.SESSION_REMEMBER : TTL.SESSION_TEMP;
    await this.redis.set(KEY.session(credentials.userId), sessionProfile, sessionTTL);

    // ── Publish login event ────────────────────────────────────────────────
    await this.kafka.publish(
      {
        userId: credentials.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        loginAt: new Date().toISOString(),
        rememberMe: data.rememberMe,
      },
      {
        topic: KafkaTopic.AUTH_LOGIN,
        key: credentials.userId,
      }
    );

    return { userId: credentials.userId, tokens };
  }

  // ─── Refresh Token ─────────────────────────────────────────────────────────

  async refreshToken(currentRefreshToken: string): Promise<TokenPair> {
    const credentials = await AuthCredentials.findOne({
      'refreshTokens.token': currentRefreshToken,
      'refreshTokens.isRevoked': false,
    });

    if (!credentials) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenEntry = credentials.refreshTokens.find(
      (rt) => rt.token === currentRefreshToken && !rt.isRevoked
    );

    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // Revoke old token (token rotation)
    tokenEntry.isRevoked = true;

    // Preserve the rememberMe setting from the original login
    // We determine it by the token's TTL duration
    const expiryMs = tokenEntry.expiresAt.getTime() - tokenEntry.createdAt.getTime();
    const wasRememberMe = expiryMs > 2 * 24 * 3600 * 1000; // >2 days = rememberMe

    const tokens = await this.generateTokenPair(
      credentials,
      tokenEntry.ipAddress,
      tokenEntry.userAgent,
      wasRememberMe
    );

    await credentials.save();

    // Extend session TTL in Redis
    const sessionProfile = await this.redis.get<SessionProfile>(KEY.session(credentials.userId));
    if (sessionProfile) {
      const sessionTTL = wasRememberMe ? TTL.SESSION_REMEMBER : TTL.SESSION_TEMP;
      sessionProfile.sessionCachedAt = new Date().toISOString();
      await this.redis.set(KEY.session(credentials.userId), sessionProfile, sessionTTL);
    }

    return tokens;
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: string, refreshToken?: string): Promise<void> {
    const credentials = await AuthCredentials.findOne({ userId });
    if (!credentials) return;

    if (refreshToken) {
      const tokenEntry = credentials.refreshTokens.find((rt) => rt.token === refreshToken);
      if (tokenEntry) tokenEntry.isRevoked = true;
    } else {
      // Logout from all devices
      credentials.refreshTokens.forEach((rt) => {
        rt.isRevoked = true;
      });
    }

    await credentials.save();

    // Remove session from Redis
    await this.redis.del(KEY.session(userId));

    // Blacklist the user's access token for remaining lifetime
    await this.redis.set(KEY.blacklist(userId), true, TTL.BLACKLIST);

    // Publish logout event
    await this.kafka.publish(
      { userId, logoutAt: new Date().toISOString() },
      { topic: KafkaTopic.AUTH_LOGOUT, key: userId }
    );
  }

  // ─── Get Session Profile (auto-login check) ────────────────────────────────

  /**
   * Returns the cached session profile from Redis.
   * The frontend calls /auth/me on every page load — if this returns a profile,
   * the user is auto-logged in without re-entering credentials.
   */
  async getSessionProfile(userId: string): Promise<SessionProfile | null> {
    // Reject if user is in the logout blacklist
    const isBlacklisted = await this.redis.get<boolean>(KEY.blacklist(userId));
    if (isBlacklisted) return null;

    return this.redis.get<SessionProfile>(KEY.session(userId));
  }

  // ─── Validate Token (for API gateway) ─────────────────────────────────────

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as JwtPayload;

      // Check if user is in the logout blacklist
      const isBlacklisted = await this.redis.get<boolean>(KEY.blacklist(decoded.sub));
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      return decoded;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token expired');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid access token');
      }
      throw err;
    }
  }

  // ─── Email Verification ────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<void> {
    const credentials = await AuthCredentials.findOne({ emailVerificationToken: token });
    if (!credentials) {
      throw new BadRequestError('Invalid verification token');
    }

    credentials.isEmailVerified = true;
    credentials.emailVerificationToken = undefined;
    await credentials.save();

    // Update the Redis session to reflect verified status
    const session = await this.redis.get<SessionProfile>(KEY.session(credentials.userId));
    if (session) {
      session.isEmailVerified = true;
      await this.redis.set(
        KEY.session(credentials.userId),
        session,
        session.rememberMe ? TTL.SESSION_REMEMBER : TTL.SESSION_TEMP
      );
    }
  }

  // ─── Password Reset ────────────────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<string> {
    const credentials = await AuthCredentials.findOne({ email: email.toLowerCase() });
    if (!credentials) {
      return 'If that email exists, a reset link has been sent';
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    credentials.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    credentials.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await credentials.save();

    await this.kafka.publish(
      {
        userId: credentials.userId,
        title: 'Password Reset Request',
        body: `Use this token to reset your password: ${resetToken}`,
        channels: ['EMAIL'],
      },
      { topic: KafkaTopic.NOTIFICATION_SEND, key: credentials.userId }
    );

    return 'If that email exists, a reset link has been sent';
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const credentials = await AuthCredentials.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!credentials) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    credentials.passwordHash = await bcrypt.hash(newPassword, this.config.bcryptSaltRounds);
    credentials.passwordResetToken = undefined;
    credentials.passwordResetExpires = undefined;

    // Revoke ALL refresh tokens on password change — security measure
    credentials.refreshTokens.forEach((rt) => {
      rt.isRevoked = true;
    });

    await credentials.save();

    // Force logout from all devices
    await this.redis.del(KEY.session(credentials.userId));
    await this.redis.set(KEY.blacklist(credentials.userId), true, TTL.BLACKLIST);
  }

  // ─── Private: Token Generation ────────────────────────────────────────────

  private async generateTokenPair(
    credentials: IAuthCredentialsDoc,
    ipAddress: string,
    userAgent: string,
    rememberMe: boolean
  ): Promise<TokenPair> {
    const jti = crypto.randomUUID();

    // Access token — short lived (15 min)
    const accessToken = jwt.sign(
      {
        sub: credentials.userId,
        email: credentials.email,
        role: 'LISTENER',
        subscription: 'FREE',
        jti,
      },
      this.config.jwtSecret,
      { expiresIn: TTL.ACCESS_TOKEN }
    );

    // Refresh token — long lived based on rememberMe
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresIn = rememberMe ? TTL.REFRESH_REMEMBER : TTL.REFRESH_TEMP;
    const refreshExpiryMs = this.parseExpiry(refreshExpiresIn);

    credentials.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + refreshExpiryMs),
      createdAt: new Date(),
      userAgent,
      ipAddress,
      isRevoked: false,
    });

    // Cap at 5 active refresh tokens per user (multi-device support)
    const activeTokens = credentials.refreshTokens.filter((rt) => !rt.isRevoked);
    if (activeTokens.length > 5) {
      const oldest = activeTokens.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      oldest.isRevoked = true;
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(TTL.ACCESS_TOKEN) / 1000,
    };
  }

  /** Parse duration string (e.g., "15m", "7d") to milliseconds */
  private parseExpiry(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 900_000; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60 * 1_000,
      h: 60 * 60 * 1_000,
      d: 24 * 60 * 60 * 1_000,
    };

    return value * (multipliers[unit] || 60_000);
  }
}
