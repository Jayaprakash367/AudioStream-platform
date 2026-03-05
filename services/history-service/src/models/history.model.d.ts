/**
 * History Service — Listening History Model
 * TTL index auto-deletes records after 7 days.
 */
import mongoose, { Document } from 'mongoose';
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
export declare const ListeningHistory: mongoose.Model<IHistoryDoc, {}, {}, {}, mongoose.Document<unknown, {}, IHistoryDoc, {}, {}> & IHistoryDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=history.model.d.ts.map