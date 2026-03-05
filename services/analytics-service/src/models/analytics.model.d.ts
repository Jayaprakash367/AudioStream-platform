import mongoose, { Document } from 'mongoose';
export interface IAnalyticsEvent extends Document {
    eventType: string;
    userId: string;
    metadata: Record<string, unknown>;
    timestamp: Date;
    sessionId?: string;
    deviceType?: string;
    country?: string;
    ip?: string;
}
export declare const AnalyticsEvent: mongoose.Model<IAnalyticsEvent, {}, {}, {}, mongoose.Document<unknown, {}, IAnalyticsEvent, {}, {}> & IAnalyticsEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface IDailyMetrics extends Document {
    date: string;
    totalPlays: number;
    uniqueListeners: number;
    totalStreamDuration: number;
    newUsers: number;
    activeUsers: number;
    topSongs: Array<{
        songId: string;
        plays: number;
    }>;
    topGenres: Array<{
        genre: string;
        plays: number;
    }>;
    topCountries: Array<{
        country: string;
        plays: number;
    }>;
    deviceBreakdown: Record<string, number>;
}
export declare const DailyMetrics: mongoose.Model<IDailyMetrics, {}, {}, {}, mongoose.Document<unknown, {}, IDailyMetrics, {}, {}> & IDailyMetrics & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ISongAnalytics extends Document {
    songId: string;
    totalPlays: number;
    uniqueListeners: number;
    totalDuration: number;
    avgCompletionRate: number;
    skipRate: number;
    saveRate: number;
    dailyPlays: Array<{
        date: string;
        plays: number;
    }>;
    countryBreakdown: Record<string, number>;
}
export declare const SongAnalytics: mongoose.Model<ISongAnalytics, {}, {}, {}, mongoose.Document<unknown, {}, ISongAnalytics, {}, {}> & ISongAnalytics & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=analytics.model.d.ts.map