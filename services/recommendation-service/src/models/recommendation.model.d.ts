import mongoose, { Document } from 'mongoose';
import { Genre } from '@auralux/shared-types';
export interface IGenreWeight {
    genre: Genre;
    weight: number;
    playCount: number;
    totalListenDuration: number;
}
export interface IArtistAffinity {
    artistId: string;
    score: number;
    playCount: number;
    lastPlayed: Date;
}
export interface IUserTasteProfile extends Document {
    userId: string;
    genreWeights: IGenreWeight[];
    artistAffinities: IArtistAffinity[];
    recentSongIds: string[];
    avgSessionDuration: number;
    preferredTimeOfDay: string[];
    totalPlays: number;
    lastUpdated: Date;
}
export declare const UserTasteProfile: mongoose.Model<IUserTasteProfile, {}, {}, {}, mongoose.Document<unknown, {}, IUserTasteProfile, {}, {}> & IUserTasteProfile & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface IRecommendationItem {
    songId: string;
    score: number;
    reason: string;
    strategy: 'collaborative' | 'content-based' | 'trending' | 'discovery';
}
export interface IRecommendationBatch extends Document {
    userId: string;
    items: IRecommendationItem[];
    generatedAt: Date;
    expiresAt: Date;
    strategyMix: Record<string, number>;
}
export declare const RecommendationBatch: mongoose.Model<IRecommendationBatch, {}, {}, {}, mongoose.Document<unknown, {}, IRecommendationBatch, {}, {}> & IRecommendationBatch & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=recommendation.model.d.ts.map