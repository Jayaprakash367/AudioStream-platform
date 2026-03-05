import mongoose, { Schema, Document } from 'mongoose';

/* ── Notification Channel & Status Enums ────────────────────────────── */

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  IN_APP = 'in_app',
  SMS = 'sms',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum NotificationType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  NEW_RELEASE = 'new_release',
  PLAYLIST_SHARED = 'playlist_shared',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  WEEKLY_DIGEST = 'weekly_digest',
  SYSTEM_ALERT = 'system_alert',
}

/* ── Notification Document ──────────────────────────────────────────── */

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

const NotificationSchema = new Schema<INotification>(
  {
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
    metadata: { type: Schema.Types.Mixed, default: {} },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    readAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    lastError: { type: String },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 }); // 90-day TTL

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

/* ── User Notification Preferences ──────────────────────────────────── */

export interface INotificationPreference extends Document {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart?: string;  // "22:00"
  quietHoursEnd?: string;    // "08:00"
  disabledTypes: NotificationType[];
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    emailEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    inAppEnabled: { type: Boolean, default: true },
    quietHoursStart: { type: String },
    quietHoursEnd: { type: String },
    disabledTypes: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  NotificationPreferenceSchema,
);
