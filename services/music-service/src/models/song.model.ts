/**
 * Music Service — Song & Album Models
 * Enhanced with multi-language support, quality tiers, and real-time updates
 */

import mongoose, { Schema, Document } from 'mongoose';

// ─── Audio Quality Tiers ─────────────────────────────────────────────────────

export const AUDIO_QUALITIES = ['128kbps', '192kbps', '256kbps', '320kbps', 'lossless'] as const;
export type AudioQuality = typeof AUDIO_QUALITIES[number];

// ─── Supported Languages ─────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Punjabi', 'Malayalam',
  'Kannada', 'Bengali', 'Marathi', 'Korean', 'Japanese', 'Spanish',
  'Arabic', 'French', 'Chinese', 'Portuguese', 'Turkish', 'German', 'Italian'
] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// ─── Audio Files by Quality ──────────────────────────────────────────────────

export interface AudioFile {
  quality: AudioQuality;
  url: string;
  bitrate: number;
  format: 'mp3' | 'aac' | 'flac' | 'ogg';
  fileSize: number; // in bytes
}

// ─── Song Document Interface ─────────────────────────────────────────────────

export interface ISongDoc extends Document {
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumName?: string;
  genre: string;
  language: string;
  duration: number;
  releaseDate: Date;
  coverArtUrl: string;
  audioFileKey: string;
  audioFiles: AudioFile[];
  availableQualities: AudioQuality[];
  isExplicit: boolean;
  playCount: number;
  likeCount: number;
  tags: string[];
  lyrics?: string;
  lyricsLanguage?: string;
  region?: string[];
  isActive: boolean;
  addedAt: Date;
  lastPlayedAt?: Date;
  weeklyPlays: number;
  monthlyPlays: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Audio File Sub-Schema ───────────────────────────────────────────────────

const AudioFileSchema = new Schema<AudioFile>(
  {
    quality: { type: String, enum: AUDIO_QUALITIES, required: true },
    url: { type: String, required: true },
    bitrate: { type: Number, required: true },
    format: { type: String, enum: ['mp3', 'aac', 'flac', 'ogg'], default: 'mp3' },
    fileSize: { type: Number, required: true },
  },
  { _id: false }
);

// ─── Song Schema ─────────────────────────────────────────────────────────────

const SongSchema = new Schema<ISongDoc>(
  {
    title: { type: String, required: true, index: 'text' },
    artistId: { type: String, required: true, index: true },
    artistName: { type: String, required: true, index: 'text' },
    albumId: { type: String, index: true },
    albumName: { type: String },
    genre: { type: String, required: true, index: true },
    language: { type: String, required: true, index: true, default: 'English' },
    duration: { type: Number, required: true },
    releaseDate: { type: Date, required: true, index: true },
    coverArtUrl: { type: String, required: true },
    audioFileKey: { type: String, required: true },
    audioFiles: { type: [AudioFileSchema], default: [] },
    availableQualities: { type: [String], enum: AUDIO_QUALITIES, default: ['128kbps', '320kbps'] },
    isExplicit: { type: Boolean, default: false },
    playCount: { type: Number, default: 0, index: true },
    likeCount: { type: Number, default: 0 },
    tags: { type: [String], default: [], index: true },
    lyrics: { type: String },
    lyricsLanguage: { type: String },
    region: { type: [String], default: ['global'] },
    isActive: { type: Boolean, default: true, index: true },
    addedAt: { type: Date, default: Date.now, index: true },
    lastPlayedAt: { type: Date },
    weeklyPlays: { type: Number, default: 0 },
    monthlyPlays: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'songs' }
);

// ─── Compound Indexes for Query Optimization ─────────────────────────────────

SongSchema.index({ genre: 1, playCount: -1 });
SongSchema.index({ artistId: 1, releaseDate: -1 });
SongSchema.index({ language: 1, playCount: -1 });
SongSchema.index({ language: 1, releaseDate: -1 });
SongSchema.index({ language: 1, genre: 1, playCount: -1 });
SongSchema.index({ isActive: 1, addedAt: -1 });
SongSchema.index({ weeklyPlays: -1 });
SongSchema.index({ monthlyPlays: -1 });
SongSchema.index({ title: 'text', artistName: 'text', tags: 'text', albumName: 'text' });

export const Song = mongoose.model<ISongDoc>('Song', SongSchema);

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

const ArtistSchema = new Schema<IArtistDoc>(
  {
    name: { type: String, required: true, index: 'text' },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    genres: { type: [String], default: [] },
    monthlyListeners: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    socialLinks: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'artists' }
);

export const Artist = mongoose.model<IArtistDoc>('Artist', ArtistSchema);
