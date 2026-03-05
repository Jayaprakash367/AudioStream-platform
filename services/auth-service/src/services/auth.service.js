"use strict";
/**
 * Auth Service — Business Logic Layer
 * Handles registration, login, token management, and password operations.
 * Publishes domain events to Kafka for downstream consumption.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const common_1 = require("@auralux/common");
const shared_types_1 = require("@auralux/shared-types");
class AuthService {
    config;
    kafka;
    redis;
    constructor(config, kafka, redis) {
        this.config = config;
        this.kafka = kafka;
        this.redis = redis;
    }
    /** ─── Register ──────────────────────────────────────────── */
    async register(data) {
        // Check for existing email/username
        const existing = await models_1.AuthCredentials.findOne({
            $or: [{ email: data.email.toLowerCase() }, { username: data.username.toLowerCase() }],
        });
        if (existing) {
            const field = existing.email === data.email.toLowerCase() ? 'email' : 'username';
            throw new common_1.ConflictError(`${field} already registered`);
        }
        // Hash password with bcrypt
        const passwordHash = await bcryptjs_1.default.hash(data.password, this.config.bcryptSaltRounds);
        // Generate unique user ID
        const userId = crypto_1.default.randomUUID();
        const emailVerificationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Create auth credentials
        const credentials = await models_1.AuthCredentials.create({
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
        await this.kafka.publish({
            userId,
            email: data.email,
            username: data.username,
            displayName: data.displayName,
            registeredAt: new Date().toISOString(),
        }, {
            topic: shared_types_1.KafkaTopic.USER_REGISTERED,
            key: userId,
        });
        return { userId, tokens };
    }
    /** ─── Login ─────────────────────────────────────────────── */
    async login(data) {
        const credentials = await models_1.AuthCredentials.findOne({ email: data.email.toLowerCase() });
        if (!credentials) {
            throw new common_1.UnauthorizedError('Invalid email or password');
        }
        // Check account lockout
        if (credentials.lockoutUntil && credentials.lockoutUntil > new Date()) {
            const remainingMs = credentials.lockoutUntil.getTime() - Date.now();
            throw new common_1.BadRequestError(`Account locked. Try again in ${Math.ceil(remainingMs / 60000)} minutes`);
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(data.password, credentials.passwordHash);
        if (!isValidPassword) {
            // Increment failed attempts
            credentials.failedLoginAttempts += 1;
            // Lock after 5 failed attempts for 15 minutes
            if (credentials.failedLoginAttempts >= 5) {
                credentials.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
                credentials.failedLoginAttempts = 0;
            }
            await credentials.save();
            throw new common_1.UnauthorizedError('Invalid email or password');
        }
        // Reset failed attempts on successful login
        credentials.failedLoginAttempts = 0;
        credentials.lockoutUntil = undefined;
        // Cleanup expired refresh tokens
        credentials.refreshTokens = credentials.refreshTokens.filter((rt) => rt.expiresAt > new Date() && !rt.isRevoked);
        const tokens = await this.generateTokenPair(credentials, data.ipAddress, data.userAgent);
        await credentials.save();
        // Publish login event
        await this.kafka.publish({
            userId: credentials.userId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            loginAt: new Date().toISOString(),
        }, {
            topic: shared_types_1.KafkaTopic.AUTH_LOGIN,
            key: credentials.userId,
        });
        return { userId: credentials.userId, tokens };
    }
    /** ─── Refresh Token ─────────────────────────────────────── */
    async refreshToken(currentRefreshToken) {
        // Find credentials with this refresh token
        const credentials = await models_1.AuthCredentials.findOne({
            'refreshTokens.token': currentRefreshToken,
            'refreshTokens.isRevoked': false,
        });
        if (!credentials) {
            throw new common_1.UnauthorizedError('Invalid refresh token');
        }
        const tokenEntry = credentials.refreshTokens.find((rt) => rt.token === currentRefreshToken && !rt.isRevoked);
        if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
            throw new common_1.UnauthorizedError('Refresh token expired');
        }
        // Revoke the used refresh token (rotation)
        tokenEntry.isRevoked = true;
        // Generate new pair
        const tokens = await this.generateTokenPair(credentials, tokenEntry.ipAddress, tokenEntry.userAgent);
        await credentials.save();
        return tokens;
    }
    /** ─── Logout ────────────────────────────────────────────── */
    async logout(userId, refreshToken) {
        const credentials = await models_1.AuthCredentials.findOne({ userId });
        if (!credentials)
            return;
        if (refreshToken) {
            // Revoke specific token
            const tokenEntry = credentials.refreshTokens.find((rt) => rt.token === refreshToken);
            if (tokenEntry)
                tokenEntry.isRevoked = true;
        }
        else {
            // Revoke all tokens (logout from all devices)
            credentials.refreshTokens.forEach((rt) => {
                rt.isRevoked = true;
            });
        }
        await credentials.save();
        // Blacklist the access token in Redis (TTL = token remaining lifetime)
        await this.redis.set(`blacklist:${userId}`, true, 900); // 15 min max token lifetime
        // Publish logout event
        await this.kafka.publish({ userId, logoutAt: new Date().toISOString() }, { topic: shared_types_1.KafkaTopic.AUTH_LOGOUT, key: userId });
    }
    /** ─── Email Verification ────────────────────────────────── */
    async verifyEmail(token) {
        const credentials = await models_1.AuthCredentials.findOne({ emailVerificationToken: token });
        if (!credentials) {
            throw new common_1.BadRequestError('Invalid verification token');
        }
        credentials.isEmailVerified = true;
        credentials.emailVerificationToken = undefined;
        await credentials.save();
    }
    /** ─── Password Reset ───────────────────────────────────── */
    async requestPasswordReset(email) {
        const credentials = await models_1.AuthCredentials.findOne({ email: email.toLowerCase() });
        if (!credentials) {
            // Don't reveal if email exists — return silently
            return 'If that email exists, a reset link has been sent';
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        credentials.passwordResetToken = crypto_1.default
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        credentials.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await credentials.save();
        // TODO: Publish notification event to send email
        await this.kafka.publish({
            userId: credentials.userId,
            title: 'Password Reset Request',
            body: `Use this token to reset your password: ${resetToken}`,
            channels: ['EMAIL'],
        }, { topic: shared_types_1.KafkaTopic.NOTIFICATION_SEND, key: credentials.userId });
        return 'If that email exists, a reset link has been sent';
    }
    async confirmPasswordReset(token, newPassword) {
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const credentials = await models_1.AuthCredentials.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        });
        if (!credentials) {
            throw new common_1.BadRequestError('Invalid or expired reset token');
        }
        credentials.passwordHash = await bcryptjs_1.default.hash(newPassword, this.config.bcryptSaltRounds);
        credentials.passwordResetToken = undefined;
        credentials.passwordResetExpires = undefined;
        // Revoke all refresh tokens on password change
        credentials.refreshTokens.forEach((rt) => {
            rt.isRevoked = true;
        });
        await credentials.save();
    }
    /** ─── Token Generation ──────────────────────────────────── */
    async generateTokenPair(credentials, ipAddress, userAgent) {
        const jti = crypto_1.default.randomUUID();
        const accessToken = jsonwebtoken_1.default.sign({
            sub: credentials.userId,
            email: credentials.email,
            role: 'LISTENER', // Default role; User Service manages actual role
            subscription: 'FREE',
            jti,
        }, this.config.jwtSecret, { expiresIn: this.config.jwtExpiresIn });
        const refreshToken = crypto_1.default.randomBytes(64).toString('hex');
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
            const oldest = activeTokens.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
            oldest.isRevoked = true;
        }
        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseExpiry(this.config.jwtExpiresIn) / 1000,
        };
    }
    /** Parse duration string (e.g., "15m", "7d") to milliseconds */
    parseExpiry(duration) {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match)
            return 900000; // Default 15 minutes
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return value * (multipliers[unit] || 60000);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map