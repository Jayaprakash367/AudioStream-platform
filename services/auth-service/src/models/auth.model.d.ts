/**
 * Auth Service — Mongoose Schemas
 * User credentials and refresh token storage.
 * Separated from User Service — Auth only manages authentication data.
 */
import mongoose, { Document } from 'mongoose';
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
export declare const AuthCredentials: mongoose.Model<IAuthCredentialsDoc, {}, {}, {}, mongoose.Document<unknown, {}, IAuthCredentialsDoc, {}, {}> & IAuthCredentialsDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=auth.model.d.ts.map