/**
 * Auth Service — Mongoose Schemas
 * User credentials and refresh token storage.
 * Separated from User Service — Auth only manages authentication data.
 */

import mongoose, { Schema, Document } from 'mongoose';

/** ─── Refresh Token Sub-document ──────────────────────────── */

const RefreshTokenSchema = new Schema({
  token: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  isRevoked: { type: Boolean, default: false },
});

/** ─── Auth Credentials Document ───────────────────────────── */

export interface IAuthCredentialsDoc extends Document {
  userId: string;
  email: string;
  username: string;
  passwordHash: string;
  refreshTokens: Array<{
    token: string;
    expiresAt: Date;
    createdAt: Date;
    userAgent: string;
    ipAddress: string;
    isRevoked: boolean;
  }>;
  emailVerificationToken?: string;
  isEmailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuthCredentialsSchema = new Schema<IAuthCredentialsDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    username: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
    emailVerificationToken: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String, index: true },
    passwordResetExpires: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
  },
  {
    timestamps: true,
    collection: 'auth_credentials',
  }
);

/** Compound index for login lookup performance */
AuthCredentialsSchema.index({ email: 1, isEmailVerified: 1 });

/** TTL index to auto-cleanup expired password reset tokens */
AuthCredentialsSchema.index({ passwordResetExpires: 1 }, { expireAfterSeconds: 0, sparse: true });

export const AuthCredentials = mongoose.model<IAuthCredentialsDoc>(
  'AuthCredentials',
  AuthCredentialsSchema
);
