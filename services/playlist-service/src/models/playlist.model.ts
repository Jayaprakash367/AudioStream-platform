import mongoose, { Schema, Document } from 'mongoose';

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

const PlaylistSchema = new Schema<IPlaylistDoc>(
  {
    name: { type: String, required: true },
    description: { type: String },
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, required: true },
    coverArtUrl: { type: String },
    visibility: { type: String, default: 'PRIVATE', enum: ['PRIVATE', 'PUBLIC', 'SHARED'] },
    songIds: { type: [String], default: [] },
    followerCount: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    collaborators: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'playlists' }
);

PlaylistSchema.index({ ownerId: 1, updatedAt: -1 });
PlaylistSchema.index({ visibility: 1, followerCount: -1 });

export const Playlist = mongoose.model<IPlaylistDoc>('Playlist', PlaylistSchema);
