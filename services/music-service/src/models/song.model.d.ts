/**
 * Music Service — Song & Album Models
 */
import mongoose, { Document } from 'mongoose';
export interface ISongDoc extends Document {
    title: string;
    artistId: string;
    artistName: string;
    albumId?: string;
    albumName?: string;
    genre: string;
    duration: number;
    releaseDate: Date;
    coverArtUrl: string;
    audioFileKey: string;
    availableQualities: string[];
    isExplicit: boolean;
    playCount: number;
    likeCount: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Song: mongoose.Model<ISongDoc, {}, {}, {}, mongoose.Document<unknown, {}, ISongDoc, {}, {}> & ISongDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
/** ── Artist Model ── */
export interface IArtistDoc extends Document {
    name: string;
    bio: string;
    avatarUrl: string;
    genres: string[];
    monthlyListeners: number;
    isVerified: boolean;
    socialLinks: Record<string, string>;
}
export declare const Artist: mongoose.Model<IArtistDoc, {}, {}, {}, mongoose.Document<unknown, {}, IArtistDoc, {}, {}> & IArtistDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=song.model.d.ts.map