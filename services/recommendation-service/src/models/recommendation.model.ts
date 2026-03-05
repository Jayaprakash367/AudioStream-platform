import mongoose, { Schema, Document } from 'mongoose';
import { Genre } from '@auralux/shared-types';

/* ── User Taste Profile ─────────────────────────────────────────────── */

export interface IGenreWeight {
  genre: Genre;
  weight: number;          // 0..1 normalised score
  playCount: number;
  totalListenDuration: number; // seconds
}

export interface IArtistAffinity {
  artistId: string;
  score: number;           // 0..1 affinity score
  playCount: number;
  lastPlayed: Date;
}

export interface IUserTasteProfile extends Document {
  userId: string;
  genreWeights: IGenreWeight[];
  artistAffinities: IArtistAffinity[];
  recentSongIds: string[];          // rolling window of last 200 song IDs
  avgSessionDuration: number;       // seconds
  preferredTimeOfDay: string[];     // e.g. ['morning','evening']
  totalPlays: number;
  lastUpdated: Date;
}

const GenreWeightSchema = new Schema<IGenreWeight>(
  {
    genre: { type: String, enum: Object.values(Genre), required: true },
    weight: { type: Number, required: true, min: 0, max: 1 },
    playCount: { type: Number, default: 0 },
    totalListenDuration: { type: Number, default: 0 },
  },
  { _id: false },
);

const ArtistAffinitySchema = new Schema<IArtistAffinity>(
  {
    artistId: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 1 },
    playCount: { type: Number, default: 0 },
    lastPlayed: { type: Date, default: Date.now },
  },
  { _id: false },
);

const UserTasteProfileSchema = new Schema<IUserTasteProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    genreWeights: { type: [GenreWeightSchema], default: [] },
    artistAffinities: { type: [ArtistAffinitySchema], default: [] },
    recentSongIds: { type: [String], default: [] },
    avgSessionDuration: { type: Number, default: 0 },
    preferredTimeOfDay: { type: [String], default: [] },
    totalPlays: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

UserTasteProfileSchema.index({ 'genreWeights.genre': 1 });
UserTasteProfileSchema.index({ 'artistAffinities.artistId': 1 });

export const UserTasteProfile = mongoose.model<IUserTasteProfile>(
  'UserTasteProfile',
  UserTasteProfileSchema,
);

/* ── Cached Recommendation Batch ────────────────────────────────────── */

export interface IRecommendationItem {
  songId: string;
  score: number;            // 0..1 relevance
  reason: string;           // human-readable reason
  strategy: 'collaborative' | 'content-based' | 'trending' | 'discovery';
}

export interface IRecommendationBatch extends Document {
  userId: string;
  items: IRecommendationItem[];
  generatedAt: Date;
  expiresAt: Date;
  strategyMix: Record<string, number>; // % each strategy contributed
}

const RecommendationItemSchema = new Schema<IRecommendationItem>(
  {
    songId: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
    reason: { type: String, required: true },
    strategy: { type: String, enum: ['collaborative', 'content-based', 'trending', 'discovery'], required: true },
  },
  { _id: false },
);

const RecommendationBatchSchema = new Schema<IRecommendationBatch>(
  {
    userId: { type: String, required: true, index: true },
    items: { type: [RecommendationItemSchema], required: true },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    strategyMix: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

RecommendationBatchSchema.index({ userId: 1, generatedAt: -1 });

export const RecommendationBatch = mongoose.model<IRecommendationBatch>(
  'RecommendationBatch',
  RecommendationBatchSchema,
);
