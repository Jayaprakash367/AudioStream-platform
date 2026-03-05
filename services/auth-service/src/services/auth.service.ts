/**
 * Auth Service — Business Logic Layer
 * Handles registration, login, token management, and password operations.
 * Publishes domain events to Kafka for downstream consumption.
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
  generateEventId,
  generateCorrelationId,
} from '@auralux/common';
import { KafkaTopic } from '@auralux/shared-types';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  constructor(
    private config: AuthServiceConfig,
    private kafka: KafkaEventBus,
    private redis: RedisCacheManager
  ) {}

  /** ─── Register ──────────────────────────────────────────── */

  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }): Promise<{ userId: string; tokens: TokenPair }> {
    // Check for existing email/username
    const existing = await AuthCredentials.findOne({
      $or: [{ email: data.email.toLowerCase() }, { username: data.username.toLowerCase() }],
    });

    if (existing) {
      const field = existing.email === data.email.toLowerCase() ? 'email' : 'username';
      throw new ConflictError(`${field} already registered`);
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(data.password, this.config.bcryptSaltRounds);

    // Generate unique user ID
    const userId = crypto.randomUUID();
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create auth credentials
    const credentials = await AuthCredentials.create({
      userId,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      passwordHash,
      emailVerificationToken,
      isEmailVerified: false,
    });

    // Generate token pair
    const tokens = await this.generateTokenPair(credentials, '', '');

    // Publish registration event
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

  /** ─── Login ─────────────────────────────────────────────── */

  async login(data: {
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<{ userId: string; tokens: TokenPair }> {
    const credentials = await AuthCredentials.findOne({ email: data.email.toLowerCase() });

    if (!credentials) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account lockout
    if (credentials.lockoutUntil && credentials.lockoutUntil > new Date()) {
      const remainingMs = credentials.lockoutUntil.getTime() - Date.now();
      throw new BadRequestError(`Account locked. Try again in ${Math.ceil(remainingMs / 60000)} minutes`);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, credentials.passwordHash);

    if (!isValidPassword) {
      // Increment failed attempts
      credentials.failedLoginAttempts += 1;

      // Lock after 5 failed attempts for 15 minutes
      if (credentials.failedLoginAttempts >= 5) {
        credentials.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        credentials.failedLoginAttempts = 0;
      }

      await credentials.save();
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed attempts on successful login
    credentials.failedLoginAttempts = 0;
    credentials.lockoutUntil = undefined;

    // Cleanup expired refresh tokens
    credentials.refreshTokens = credentials.refreshTokens.filter(
      (rt) => rt.expiresAt > new Date() && !rt.isRevoked
    );

    const tokens = await this.generateTokenPair(credentials, data.ipAddress, data.userAgent);
    await credentials.save();

    // Publish login event
    await this.kafka.publish(
      {
        userId: credentials.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        loginAt: new Date().toISOString(),
      },
      {
        topic: KafkaTopic.AUTH_LOGIN,
        key: credentials.userId,
      }
    );

    return { userId: credentials.userId, tokens };
  }

  /** ─── Refresh Token ─────────────────────────────────────── */

  async refreshToken(currentRefreshToken: string): Promise<TokenPair> {
    // Find credentials with this refresh token
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

    // Revoke the used refresh token (rotation)
    tokenEntry.isRevoked = true;

    // Generate new pair
    const tokens = await this.generateTokenPair(
      credentials,
      tokenEntry.ipAddress,
      tokenEntry.userAgent
    );

    await credentials.save();
    return tokens;
  }

  /** ─── Logout ────────────────────────────────────────────── */

  async logout(userId: string, refreshToken?: string): Promise<void> {
    const credentials = await AuthCredentials.findOne({ userId });
    if (!credentials) return;

    if (refreshToken) {
      // Revoke specific token
      const tokenEntry = credentials.refreshTokens.find((rt) => rt.token === refreshToken);
      if (tokenEntry) tokenEntry.isRevoked = true;
    } else {
      // Revoke all tokens (logout from all devices)
      credentials.refreshTokens.forEach((rt) => {
        rt.isRevoked = true;
      });
    }

    await credentials.save();

    // Blacklist the access token in Redis (TTL = token remaining lifetime)
    await this.redis.set(`blacklist:${userId}`, true, 900); // 15 min max token lifetime

    // Publish logout event
    await this.kafka.publish(
      { userId, logoutAt: new Date().toISOString() },
      { topic: KafkaTopic.AUTH_LOGOUT, key: userId }
    );
  }

  /** ─── Email Verification ────────────────────────────────── */

  async verifyEmail(token: string): Promise<void> {
    const credentials = await AuthCredentials.findOne({ emailVerificationToken: token });
    if (!credentials) {
      throw new BadRequestError('Invalid verification token');
    }

    credentials.isEmailVerified = true;
    credentials.emailVerificationToken = undefined;
    await credentials.save();
  }

  /** ─── Password Reset ───────────────────────────────────── */

  async requestPasswordReset(email: string): Promise<string> {
    const credentials = await AuthCredentials.findOne({ email: email.toLowerCase() });
    if (!credentials) {
      // Don't reveal if email exists — return silently
      return 'If that email exists, a reset link has been sent';
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    credentials.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    credentials.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await credentials.save();

    // TODO: Publish notification event to send email
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
    // Revoke all refresh tokens on password change
    credentials.refreshTokens.forEach((rt) => {
      rt.isRevoked = true;
    });

    await credentials.save();
  }

  /** ─── Token Generation ──────────────────────────────────── */

  private async generateTokenPair(
    credentials: IAuthCredentialsDoc,
    ipAddress: string,
    userAgent: string
  ): Promise<TokenPair> {
    const jti = crypto.randomUUID();

    const accessToken = jwt.sign(
      {
        sub: credentials.userId,
        email: credentials.email,
        role: 'LISTENER', // Default role; User Service manages actual role
        subscription: 'FREE',
        jti,
      },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiresIn }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiry = this.parseExpiry(this.config.jwtRefreshExpiresIn);

    // Store refresh token
    credentials.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + refreshExpiry),
      createdAt: new Date(),
      userAgent,
      ipAddress,
      isRevoked: false,
    });

    // Limit to 5 active refresh tokens per user (prevent token accumulation)
    const activeTokens = credentials.refreshTokens.filter((rt) => !rt.isRevoked);
    if (activeTokens.length > 5) {
      // Revoke oldest
      const oldest = activeTokens.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      oldest.isRevoked = true;
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(this.config.jwtExpiresIn) / 1000,
    };
  }

  /** Parse duration string (e.g., "15m", "7d") to milliseconds */
  private parseExpiry(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 900000; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || 60000);
  }
}
