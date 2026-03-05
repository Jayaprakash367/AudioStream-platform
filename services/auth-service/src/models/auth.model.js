"use strict";
/**
 * Auth Service — Mongoose Schemas
 * User credentials and refresh token storage.
 * Separated from User Service — Auth only manages authentication data.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCredentials = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/** ─── Refresh Token Sub-document ──────────────────────────── */
const RefreshTokenSchema = new mongoose_1.Schema({
    token: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    isRevoked: { type: Boolean, default: false },
});
const AuthCredentialsSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    collection: 'auth_credentials',
});
/** Compound index for login lookup performance */
AuthCredentialsSchema.index({ email: 1, isEmailVerified: 1 });
/** TTL index to auto-cleanup expired password reset tokens */
AuthCredentialsSchema.index({ passwordResetExpires: 1 }, { expireAfterSeconds: 0, sparse: true });
exports.AuthCredentials = mongoose_1.default.model('AuthCredentials', AuthCredentialsSchema);
//# sourceMappingURL=auth.model.js.map