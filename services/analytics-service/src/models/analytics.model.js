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
exports.SongAnalytics = exports.DailyMetrics = exports.AnalyticsEvent = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AnalyticsEventSchema = new mongoose_1.Schema({
    eventType: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
    sessionId: { type: String },
    deviceType: { type: String },
    country: { type: String, index: true },
    ip: { type: String },
}, { timestamps: true });
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 3600 }); // 1-year TTL
exports.AnalyticsEvent = mongoose_1.default.model('AnalyticsEvent', AnalyticsEventSchema);
const DailyMetricsSchema = new mongoose_1.Schema({
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
    deviceBreakdown: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
exports.DailyMetrics = mongoose_1.default.model('DailyMetrics', DailyMetricsSchema);
const SongAnalyticsSchema = new mongoose_1.Schema({
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
    countryBreakdown: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
exports.SongAnalytics = mongoose_1.default.model('SongAnalytics', SongAnalyticsSchema);
//# sourceMappingURL=analytics.model.js.map