import { RedisCacheManager } from '@auralux/redis-client';
import { INotification, NotificationChannel, NotificationStatus, NotificationType } from '../models';
import { NotificationServiceConfig } from '../config';
interface NotificationPayload {
    userId: string;
    type: NotificationType;
    channels: NotificationChannel[];
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    scheduledAt?: Date;
}
export declare class NotificationService {
    private readonly config;
    private readonly cache;
    private emailTransport;
    constructor(config: NotificationServiceConfig, cache: RedisCacheManager);
    send(payload: NotificationPayload): Promise<INotification[]>;
    private dispatch;
    private sendEmail;
    private buildEmailHtml;
    private sendPush;
    private sendInApp;
    private sendSms;
    private getUserPreferences;
    private isChannelEnabled;
    private isQuietHours;
    private getQuietHoursEnd;
    getUserNotifications(userId: string, options: {
        page: number;
        limit: number;
        status?: NotificationStatus;
    }): Promise<{
        notifications: (import("mongoose").FlattenMaps<INotification> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<INotification | null>;
    markAllAsRead(userId: string): Promise<number>;
    getUnreadCount(userId: string): Promise<number>;
    updatePreferences(userId: string, updates: Partial<{
        emailEnabled: boolean;
        pushEnabled: boolean;
        smsEnabled: boolean;
        inAppEnabled: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
        disabledTypes: NotificationType[];
    }>): Promise<import("mongoose").Document<unknown, {}, import("../models").INotificationPreference, {}, {}> & import("../models").INotificationPreference & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    processScheduledNotifications(): Promise<void>;
}
export {};
//# sourceMappingURL=notification.service.d.ts.map