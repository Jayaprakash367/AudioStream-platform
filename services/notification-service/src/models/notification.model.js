"use strict";
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
exports.NotificationPreference = exports.Notification = exports.NotificationType = exports.NotificationStatus = exports.NotificationChannel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/* ── Notification Channel & Status Enums ────────────────────────────── */
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["SMS"] = "sms";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["DELIVERED"] = "delivered";
    NotificationStatus["READ"] = "read";
    NotificationStatus["FAILED"] = "failed";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["WELCOME"] = "welcome";
    NotificationType["PASSWORD_RESET"] = "password_reset";
    NotificationType["EMAIL_VERIFICATION"] = "email_verification";
    NotificationType["NEW_RELEASE"] = "new_release";
    NotificationType["PLAYLIST_SHARED"] = "playlist_shared";
    NotificationType["SUBSCRIPTION_EXPIRING"] = "subscription_expiring";
    NotificationType["SUBSCRIPTION_RENEWED"] = "subscription_renewed";
    NotificationType["WEEKLY_DIGEST"] = "weekly_digest";
    NotificationType["SYSTEM_ALERT"] = "system_alert";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const NotificationSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    status: {
        type: String,
        enum: Object.values(NotificationStatus),
        default: NotificationStatus.PENDING,
        index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    readAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    lastError: { type: String },
}, { timestamps: true });
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 }); // 90-day TTL
exports.Notification = mongoose_1.default.model('Notification', NotificationSchema);
const NotificationPreferenceSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    emailEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    inAppEnabled: { type: Boolean, default: true },
    quietHoursStart: { type: String },
    quietHoursEnd: { type: String },
    disabledTypes: { type: [String], default: [] },
}, { timestamps: true });
exports.NotificationPreference = mongoose_1.default.model('NotificationPreference', NotificationPreferenceSchema);
//# sourceMappingURL=notification.model.js.map