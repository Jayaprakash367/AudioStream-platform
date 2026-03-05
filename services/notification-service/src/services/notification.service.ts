import nodemailer, { Transporter } from 'nodemailer';
import { createLogger } from '@auralux/logger';
import { RedisCacheManager } from '@auralux/redis-client';
import { retryWithBackoff } from '@auralux/common';
import {
  Notification,
  NotificationPreference,
  INotification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '../models';
import { NotificationServiceConfig } from '../config';

const logger = createLogger({ service: 'notification-service', level: 'info' });

/* ── Channel Dispatchers Interface ───────────────────────────────────── */

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
}

export class NotificationService {
  private emailTransport: Transporter;

  constructor(
    private readonly config: NotificationServiceConfig,
    private readonly cache: RedisCacheManager,
  ) {
    this.emailTransport = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth:
        config.smtpUser && config.smtpPass
          ? { user: config.smtpUser, pass: config.smtpPass }
          : undefined,
    });
  }

  /* ── Send Notification ─────────────────────────────────────────────── */

  async send(payload: NotificationPayload): Promise<INotification[]> {
    const preferences = await this.getUserPreferences(payload.userId);
    const results: INotification[] = [];

    for (const channel of payload.channels) {
      // Respect user preferences
      if (!this.isChannelEnabled(channel, preferences)) {
        logger.debug('Channel disabled by user preference', { userId: payload.userId, channel });
        continue;
      }

      // Respect quiet hours
      if (this.isQuietHours(preferences)) {
        logger.debug('Quiet hours active, deferring', { userId: payload.userId });
        // Schedule for after quiet hours
        const notification = await Notification.create({
          ...payload,
          channel,
          status: NotificationStatus.PENDING,
          scheduledAt: this.getQuietHoursEnd(preferences),
        });
        results.push(notification);
        continue;
      }

      // Check disabled notification types
      if (preferences?.disabledTypes?.includes(payload.type)) {
        logger.debug('Notification type disabled', { userId: payload.userId, type: payload.type });
        continue;
      }

      const notification = await Notification.create({
        userId: payload.userId,
        type: payload.type,
        channel,
        title: payload.title,
        body: payload.body,
        metadata: payload.metadata || {},
        status: NotificationStatus.PENDING,
        scheduledAt: payload.scheduledAt,
      });

      // Dispatch immediately if not scheduled
      if (!payload.scheduledAt || payload.scheduledAt <= new Date()) {
        await this.dispatch(notification);
      }

      results.push(notification);
    }

    return results;
  }

  /* ── Channel Dispatch ──────────────────────────────────────────────── */

  private async dispatch(notification: INotification): Promise<void> {
    try {
      await retryWithBackoff(
        async () => {
          switch (notification.channel) {
            case NotificationChannel.EMAIL:
              await this.sendEmail(notification);
              break;
            case NotificationChannel.PUSH:
              await this.sendPush(notification);
              break;
            case NotificationChannel.IN_APP:
              await this.sendInApp(notification);
              break;
            case NotificationChannel.SMS:
              await this.sendSms(notification);
              break;
          }
        },
        this.config.maxRetries,
        this.config.retryDelayMs,
      );

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await notification.save();

      logger.info('Notification dispatched', {
        id: notification._id,
        channel: notification.channel,
        userId: notification.userId,
      });
    } catch (err) {
      notification.status = NotificationStatus.FAILED;
      notification.retryCount += 1;
      notification.lastError = err instanceof Error ? err.message : String(err);
      await notification.save();

      logger.error('Notification dispatch failed', {
        id: notification._id,
        channel: notification.channel,
        error: notification.lastError,
      });
    }
  }

  /* ── Email ─────────────────────────────────────────────────────────── */

  private async sendEmail(notification: INotification): Promise<void> {
    const recipientEmail = (notification.metadata?.email as string) || '';
    if (!recipientEmail) {
      throw new Error('No recipient email in notification metadata');
    }

    await this.emailTransport.sendMail({
      from: this.config.smtpFrom,
      to: recipientEmail,
      subject: notification.title,
      html: this.buildEmailHtml(notification),
    });
  }

  private buildEmailHtml(notification: INotification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Auralux X</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border-radius: 0 0 12px 12px; border: 1px solid #eee; border-top: none;">
          <h2 style="color: #333; margin-top: 0;">${notification.title}</h2>
          <p style="color: #555; line-height: 1.6;">${notification.body}</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Auralux X. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /* ── Push Notification ─────────────────────────────────────────────── */

  private async sendPush(notification: INotification): Promise<void> {
    if (!this.config.pushEnabled) {
      logger.warn('Push notifications disabled in config');
      return;
    }
    // In production: integrate with FCM / APNs / Web Push
    // Placeholder for push notification dispatch
    logger.info('Push notification sent (stub)', {
      userId: notification.userId,
      title: notification.title,
    });
  }

  /* ── In-App Notification ───────────────────────────────────────────── */

  private async sendInApp(notification: INotification): Promise<void> {
    // Store in Redis for real-time delivery via WebSocket/SSE
    const key = `notifications:inbox:${notification.userId}`;
    const inAppPayload = JSON.stringify({
      id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      createdAt: new Date().toISOString(),
    });

    // Push to list, trim to last 100
    // Using raw Redis commands through cache manager
    await this.cache.set(
      `${key}:${notification._id}`,
      inAppPayload,
      7 * 24 * 3600, // 7-day TTL
    );

    // Increment unread counter
    await this.cache.increment(`notifications:unread:${notification.userId}`);
  }

  /* ── SMS ────────────────────────────────────────────────────────────── */

  private async sendSms(notification: INotification): Promise<void> {
    if (!this.config.smsEnabled) {
      logger.warn('SMS notifications disabled in config');
      return;
    }
    // In production: integrate with Twilio / AWS SNS / Vonage
    logger.info('SMS notification sent (stub)', {
      userId: notification.userId,
      phone: notification.metadata?.phone,
    });
  }

  /* ── User Preferences ──────────────────────────────────────────────── */

  private async getUserPreferences(userId: string) {
    const cacheKey = `notif:prefs:${userId}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const prefs = await NotificationPreference.findOne({ userId }).lean();
    if (prefs) {
      await this.cache.set(cacheKey, prefs, 300);
    }
    return prefs;
  }

  private isChannelEnabled(
    channel: NotificationChannel,
    preferences: any,
  ): boolean {
    if (!preferences) return true; // Default: all enabled
    switch (channel) {
      case NotificationChannel.EMAIL: return preferences.emailEnabled !== false;
      case NotificationChannel.PUSH: return preferences.pushEnabled !== false;
      case NotificationChannel.IN_APP: return preferences.inAppEnabled !== false;
      case NotificationChannel.SMS: return preferences.smsEnabled === true;
      default: return true;
    }
  }

  private isQuietHours(preferences: any): boolean {
    if (!preferences?.quietHoursStart || !preferences?.quietHoursEnd) return false;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Handle overnight quiet hours (e.g. 22:00 - 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    return currentTime >= start && currentTime < end;
  }

  private getQuietHoursEnd(preferences: any): Date {
    const endTime = preferences?.quietHoursEnd || '08:00';
    const [hours, minutes] = endTime.split(':').map(Number);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }

  /* ── Query APIs ────────────────────────────────────────────────────── */

  async getUserNotifications(
    userId: string,
    options: { page: number; limit: number; status?: NotificationStatus },
  ) {
    const query: any = { userId };
    if (options.status) query.status = options.status;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return { notifications, total };
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { status: NotificationStatus.READ, readAt: new Date() },
      { new: true },
    );

    if (notification) {
      await this.cache.decrement(`notifications:unread:${userId}`);
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, status: { $ne: NotificationStatus.READ } },
      { status: NotificationStatus.READ, readAt: new Date() },
    );

    await this.cache.set(`notifications:unread:${userId}`, 0, 3600);
    return result.modifiedCount;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cached = await this.cache.get<number>(`notifications:unread:${userId}`);
    if (cached !== null && cached !== undefined) return cached;

    const count = await Notification.countDocuments({
      userId,
      status: { $ne: NotificationStatus.READ },
    });
    await this.cache.set(`notifications:unread:${userId}`, count, 300);
    return count;
  }

  async updatePreferences(
    userId: string,
    updates: Partial<{
      emailEnabled: boolean;
      pushEnabled: boolean;
      smsEnabled: boolean;
      inAppEnabled: boolean;
      quietHoursStart: string;
      quietHoursEnd: string;
      disabledTypes: NotificationType[];
    }>,
  ) {
    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: updates },
      { upsert: true, new: true },
    );
    await this.cache.del(`notif:prefs:${userId}`);
    return prefs;
  }

  /* ── Scheduled Notification Processor ──────────────────────────────── */

  async processScheduledNotifications(): Promise<void> {
    const pending = await Notification.find({
      status: NotificationStatus.PENDING,
      scheduledAt: { $lte: new Date() },
    }).limit(100);

    for (const notification of pending) {
      await this.dispatch(notification);
    }

    if (pending.length > 0) {
      logger.info(`Processed ${pending.length} scheduled notifications`);
    }
  }
}
