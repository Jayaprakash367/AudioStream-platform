/**
 * User Service — Mongoose Model
 * Manages user profiles, preferences, and subscription tiers.
 * Created on user.registered Kafka event from Auth Service.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDoc extends Document {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  subscription: string;
  isEmailVerified: boolean;
  isActive: boolean;
  preferences: {
    preferredGenres: string[];
    audioQuality: string;
    language: string;
    explicitContentEnabled: boolean;
    notificationsEnabled: boolean;
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    role: { type: String, default: 'LISTENER', enum: ['LISTENER', 'ARTIST', 'CURATOR', 'ADMIN', 'SUPER_ADMIN'] },
    subscription: { type: String, default: 'FREE', enum: ['FREE', 'PREMIUM', 'FAMILY', 'STUDENT'] },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    preferences: {
      preferredGenres: { type: [String], default: [] },
      audioQuality: { type: String, default: '128kbps' },
      language: { type: String, default: 'en' },
      explicitContentEnabled: { type: Boolean, default: false },
      notificationsEnabled: { type: Boolean, default: true },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, collection: 'users' }
);

export const User = mongoose.model<IUserDoc>('User', UserSchema);
