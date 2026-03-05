import mongoose, { Schema, Document } from 'mongoose';

/* ── Raw Analytics Event ─────────────────────────────────────────────── */

export interface IAnalyticsEvent extends Document {
  eventType: string;            // e.g. 'song.played', 'playlist.created', 'user.registered'
  userId: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  sessionId?: string;
  deviceType?: string;
  country?: string;
  ip?: string;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
    sessionId: { type: String },
    deviceType: { type: String },
    country: { type: String, index: true },
    ip: { type: String },
  },
  { timestamps: true },
);

AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 3600 }); // 1-year TTL

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);

/* ── Daily Aggregated Metrics ────────────────────────────────────────── */

export interface IDailyMetrics extends Document {
  date: string;               // YYYY-MM-DD
  totalPlays: number;
  uniqueListeners: number;
  totalStreamDuration: number;// seconds
  newUsers: number;
  activeUsers: number;
  topSongs: Array<{ songId: string; plays: number }>;
  topGenres: Array<{ genre: string; plays: number }>;
  topCountries: Array<{ country: string; plays: number }>;
  deviceBreakdown: Record<string, number>;
}

const DailyMetricsSchema = new Schema<IDailyMetrics>(
  {
    date: { type: String, required: true, unique: true, index: true },
    totalPlays: { type: Number, default: 0 },
    uniqueListeners: { type: Number, default: 0 },
    totalStreamDuration: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    topSongs: {
      type: [{ songId: String, plays: Number }],
      default: [],
    },
    topGenres: {
      type: [{ genre: String, plays: Number }],
      default: [],
    },
    topCountries: {
      type: [{ country: String, plays: Number }],
      default: [],
    },
    deviceBreakdown: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const DailyMetrics = mongoose.model<IDailyMetrics>('DailyMetrics', DailyMetricsSchema);

/* ── Song Analytics (per-song aggregate) ────────────────────────────── */

export interface ISongAnalytics extends Document {
  songId: string;
  totalPlays: number;
  uniqueListeners: number;
  totalDuration: number;
  avgCompletionRate: number;
  skipRate: number;
  saveRate: number;
  dailyPlays: Array<{ date: string; plays: number }>;
  countryBreakdown: Record<string, number>;
}

const SongAnalyticsSchema = new Schema<ISongAnalytics>(
  {
    songId: { type: String, required: true, unique: true, index: true },
    totalPlays: { type: Number, default: 0 },
    uniqueListeners: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    avgCompletionRate: { type: Number, default: 0, min: 0, max: 1 },
    skipRate: { type: Number, default: 0, min: 0, max: 1 },
    saveRate: { type: Number, default: 0, min: 0, max: 1 },
    dailyPlays: {
      type: [{ date: String, plays: Number }],
      default: [],
    },
    countryBreakdown: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const SongAnalytics = mongoose.model<ISongAnalytics>('SongAnalytics', SongAnalyticsSchema);
