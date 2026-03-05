import mongoose, { Document } from 'mongoose';
export interface IPlaylistDoc extends Document {
    name: string;
    description?: string;
    ownerId: string;
    ownerName: string;
    coverArtUrl?: string;
    visibility: string;
    songIds: string[];
    followerCount: number;
    totalDuration: number;
    collaborators: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Playlist: mongoose.Model<IPlaylistDoc, {}, {}, {}, mongoose.Document<unknown, {}, IPlaylistDoc, {}, {}> & IPlaylistDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=playlist.model.d.ts.map