import mongoose, { Document } from 'mongoose';
export declare enum NotificationChannel {
    EMAIL = "email",
    PUSH = "push",
    IN_APP = "in_app",
    SMS = "sms"
}
export declare enum NotificationStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    FAILED = "failed"
}
export declare enum NotificationType {
    WELCOME = "welcome",
    PASSWORD_RESET = "password_reset",
    EMAIL_VERIFICATION = "email_verification",
    NEW_RELEASE = "new_release",
    PLAYLIST_SHARED = "playlist_shared",
    SUBSCRIPTION_EXPIRING = "subscription_expiring",
    SUBSCRIPTION_RENEWED = "subscription_renewed",
    WEEKLY_DIGEST = "weekly_digest",
    SYSTEM_ALERT = "system_alert"
}
export interface INotification extends Document {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    status: NotificationStatus;
    title: string;
    body: string;
    metadata: Record<string, unknown>;
    scheduledAt?: Date;
    sentAt?: Date;
    readAt?: Date;
    retryCount: number;
    lastError?: string;
}
export declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface INotificationPreference extends Document {
    userId: string;
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
    inAppEnabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    disabledTypes: NotificationType[];
}
export declare const NotificationPreference: mongoose.Model<INotificationPreference, {}, {}, {}, mongoose.Document<unknown, {}, INotificationPreference, {}, {}> & INotificationPreference & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=notification.model.d.ts.map