/**
 * History Service — Listening History Model
 * TTL index auto-deletes records after 7 days.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IHistoryDoc extends Document {
  userId: string;
  songId: string;
  songTitle: string;
  artistName: string;
  listenedAt: Date;
  duration: number;
  completionRate: number;
  source: string;
  expiresAt: Date;
}

const HistorySchema = new Schema<IHistoryDoc>(
  {
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true },
    songTitle: { type: String, required: true },
    artistName: { type: String, required: true },
    listenedAt: { type: Date, default: Date.now, index: true },
    duration: { type: Number, required: true },
    completionRate: { type: Number, default: 0 },
    source: { type: String, default: 'search' },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, collection: 'listening_history' }
);

/** TTL index: MongoDB auto-deletes documents when expiresAt is reached */
HistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
HistorySchema.index({ userId: 1, listenedAt: -1 });

export const ListeningHistory = mongoose.model<IHistoryDoc>('ListeningHistory', HistorySchema);
