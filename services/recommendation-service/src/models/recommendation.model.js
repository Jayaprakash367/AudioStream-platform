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
exports.RecommendationBatch = exports.UserTasteProfile = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const shared_types_1 = require("@auralux/shared-types");
const GenreWeightSchema = new mongoose_1.Schema({
    genre: { type: String, enum: Object.values(shared_types_1.Genre), required: true },
    weight: { type: Number, required: true, min: 0, max: 1 },
    playCount: { type: Number, default: 0 },
    totalListenDuration: { type: Number, default: 0 },
}, { _id: false });
const ArtistAffinitySchema = new mongoose_1.Schema({
    artistId: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 1 },
    playCount: { type: Number, default: 0 },
    lastPlayed: { type: Date, default: Date.now },
}, { _id: false });
const UserTasteProfileSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    genreWeights: { type: [GenreWeightSchema], default: [] },
    artistAffinities: { type: [ArtistAffinitySchema], default: [] },
    recentSongIds: { type: [String], default: [] },
    avgSessionDuration: { type: Number, default: 0 },
    preferredTimeOfDay: { type: [String], default: [] },
    totalPlays: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });
UserTasteProfileSchema.index({ 'genreWeights.genre': 1 });
UserTasteProfileSchema.index({ 'artistAffinities.artistId': 1 });
exports.UserTasteProfile = mongoose_1.default.model('UserTasteProfile', UserTasteProfileSchema);
const RecommendationItemSchema = new mongoose_1.Schema({
    songId: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
    reason: { type: String, required: true },
    strategy: { type: String, enum: ['collaborative', 'content-based', 'trending', 'discovery'], required: true },
}, { _id: false });
const RecommendationBatchSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    items: { type: [RecommendationItemSchema], required: true },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    strategyMix: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
RecommendationBatchSchema.index({ userId: 1, generatedAt: -1 });
exports.RecommendationBatch = mongoose_1.default.model('RecommendationBatch', RecommendationBatchSchema);
//# sourceMappingURL=recommendation.model.js.map