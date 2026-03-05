/**
 * Music Service — Business Logic
 * Catalog management, search, language/genre filtering, admin APIs with Redis caching.
 */

import { Song, ISongDoc, AudioFile, SUPPORTED_LANGUAGES, AUDIO_QUALITIES, AudioQuality } from '../models';
import { RedisCacheManager } from '@auralux/redis-client';
import { KafkaEventBus } from '@auralux/kafka-client';
import { NotFoundError, buildPaginationMeta, BadRequestError } from '@auralux/common';
import { FilterQuery } from 'mongoose';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchParams {
  q?: string;
  genre?: string;
  language?: string;
  artistId?: string;
  isExplicit?: boolean;
  year?: number;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateSongParams {
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
  audioFiles?: AudioFile[];
  availableQualities?: AudioQuality[];
  isExplicit?: boolean;
  tags?: string[];
  lyrics?: string;
  lyricsLanguage?: string;
  region?: string[];
}

interface UpdateSongParams extends Partial<CreateSongParams> {
  isActive?: boolean;
}

interface LanguageStats {
  language: string;
  songCount: number;
  totalPlays: number;
}

interface TrendingSong {
  songId: string;
  title: string;
  artist: string;
  rank: number;
  change: 'up' | 'down' | 'new' | 'same';
  playCount: number;
  coverArtUrl: string;
  language: string;
}

// ─── Music Service ───────────────────────────────────────────────────────────

export class MusicService {
  constructor(
    private redis: RedisCacheManager,
    private kafka?: KafkaEventBus
  ) {}

  // ─── Search & Browse ─────────────────────────────────────────────────────────

  /** Search songs with full-text search, filtering by language/genre, and pagination */
  async searchSongs(params: SearchParams) {
    const { q, genre, language, artistId, isExplicit, year, page, limit, sortBy, sortOrder } = params;

    const filter: FilterQuery<ISongDoc> = { isActive: true };

    if (q) {
      filter.$text = { $search: q };
    }
    if (genre) {
      filter.genre = { $regex: new RegExp(genre, 'i') };
    }
    if (language && language !== 'All') {
      filter.language = language;
    }
    if (artistId) {
      filter.artistId = artistId;
    }
    if (isExplicit !== undefined) {
      filter.isExplicit = isExplicit;
    }
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      filter.releaseDate = { $gte: startOfYear, $lt: endOfYear };
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {};

    if (q && !sortBy) {
      sort.score = -1;
    } else {
      sort[sortBy || 'playCount'] = sortOrder === 'asc' ? 1 : -1;
    }

    const [songs, total] = await Promise.all([
      Song.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Song.countDocuments(filter),
    ]);

    return {
      songs,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /** Get song by ID with quality-specific audio URLs */
  async getSongById(songId: string, quality?: AudioQuality): Promise<ISongDoc & { selectedAudioUrl?: string }> {
    const cacheKey = `song:${songId}`;
    let song = await this.redis.get<ISongDoc>(cacheKey);

    if (!song) {
      song = await Song.findById(songId).lean() as ISongDoc;
      if (!song) throw new NotFoundError('Song');
      await this.redis.set(cacheKey, song, 600);
    }

    // Select audio URL based on quality preference
    let selectedAudioUrl: string | undefined;
    if (quality && song.audioFiles?.length) {
      const audioFile = song.audioFiles.find(f => f.quality === quality) 
        || song.audioFiles[song.audioFiles.length - 1];
      selectedAudioUrl = audioFile?.url;
    }

    return { ...song, selectedAudioUrl };
  }

  // ─── Language-Based Browsing ─────────────────────────────────────────────────

  /** Get songs by language with caching */
  async getSongsByLanguage(language: string, page = 1, limit = 20) {
    const cacheKey = `lang:${language}:${page}:${limit}`;
    
    return this.redis.getOrSet(
      cacheKey,
      async () => this.searchSongs({ language, page, limit, sortBy: 'playCount', sortOrder: 'desc' }),
      180 // 3 min cache
    );
  }

  /** Get new releases by language (last 7 days) */
  async getNewReleasesByLanguage(language: string, limit = 20) {
    const cacheKey = `new:${language}:${limit}`;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return this.redis.getOrSet(
      cacheKey,
      async () => {
        const filter: FilterQuery<ISongDoc> = { isActive: true, releaseDate: { $gte: weekAgo } };
        if (language && language !== 'All') filter.language = language;

        return Song.find(filter)
          .sort({ releaseDate: -1 })
          .limit(limit)
          .lean();
      },
      120 // 2 min cache
    );
  }

  /** Get trending songs by language (weekly plays) */
  async getTrendingByLanguage(language: string, limit = 20): Promise<TrendingSong[]> {
    const cacheKey = `trending:${language}:${limit}`;

    return this.redis.getOrSet(
      cacheKey,
      async () => {
        const filter: FilterQuery<ISongDoc> = { isActive: true };
        if (language && language !== 'All') filter.language = language;

        const songs = await Song.find(filter)
          .sort({ weeklyPlays: -1 })
          .limit(limit)
          .lean();

        return songs.map((song, idx) => ({
          songId: song._id.toString(),
          title: song.title,
          artist: song.artistName,
          rank: idx + 1,
          change: 'same' as const,
          playCount: song.weeklyPlays,
          coverArtUrl: song.coverArtUrl,
          language: song.language,
        }));
      },
      300 // 5 min cache
    );
  }

  /** Get all available languages with song counts */
  async getAvailableLanguages(): Promise<LanguageStats[]> {
    const cacheKey = 'languages:stats';

    return this.redis.getOrSet(
      cacheKey,
      async () => {
        const stats = await Song.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: '$language',
              songCount: { $sum: 1 },
              totalPlays: { $sum: '$playCount' },
            },
          },
          { $sort: { songCount: -1 } },
        ]);

        return stats.map(s => ({
          language: s._id || 'Unknown',
          songCount: s.songCount,
          totalPlays: s.totalPlays,
        }));
      },
      600 // 10 min cache
    );
  }

  // ─── Popular & Genre Browsing ────────────────────────────────────────────────

  /** Get popular songs — heavily cached */
  async getPopularSongs(genre?: string, language?: string, limit = 50) {
    const cacheKey = `popular:${genre || 'all'}:${language || 'all'}:${limit}`;

    return this.redis.getOrSet(
      cacheKey,
      async () => {
        const filter: FilterQuery<ISongDoc> = { isActive: true };
        if (genre) filter.genre = { $regex: new RegExp(genre, 'i') };
        if (language && language !== 'All') filter.language = language;

        return Song.find(filter)
          .sort({ playCount: -1 })
          .limit(limit)
          .lean();
      },
      300
    );
  }

  /** Get songs by genre */
  async getSongsByGenre(genre: string, page: number, limit: number) {
    return this.searchSongs({ genre, page, limit });
  }

  /** Get available genres with counts */
  async getAvailableGenres() {
    const cacheKey = 'genres:stats';

    return this.redis.getOrSet(
      cacheKey,
      async () => {
        const stats = await Song.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: '$genre',
              songCount: { $sum: 1 },
            },
          },
          { $sort: { songCount: -1 } },
        ]);

        return stats.map(s => ({
          genre: s._id,
          songCount: s.songCount,
        }));
      },
      600
    );
  }

  // ─── Admin: Song Management ──────────────────────────────────────────────────

  /** Create a new song (Admin) */
  async createSong(params: CreateSongParams): Promise<ISongDoc> {
    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(params.language as any)) {
      throw new BadRequestError(`Unsupported language: ${params.language}`);
    }

    // Validate audio qualities
    if (params.availableQualities) {
      for (const q of params.availableQualities) {
        if (!AUDIO_QUALITIES.includes(q)) {
          throw new BadRequestError(`Invalid audio quality: ${q}`);
        }
      }
    }

    const song = new Song({
      ...params,
      addedAt: new Date(),
      isActive: true,
      playCount: 0,
      likeCount: 0,
      weeklyPlays: 0,
      monthlyPlays: 0,
    });

    await song.save();

    // Publish new song event for real-time updates
    if (this.kafka) {
      await this.kafka.publish(
        {
          event: 'SONG_ADDED',
          song: {
            songId: song._id.toString(),
            title: song.title,
            artist: song.artistName,
            album: song.albumName,
            coverArtUrl: song.coverArtUrl,
            language: song.language,
            genre: song.genre,
            duration: song.duration,
            releaseDate: song.releaseDate.toISOString(),
            availableQualities: song.availableQualities,
            isExplicit: song.isExplicit,
          },
        },
        { topic: 'music.catalog.new', key: song._id.toString() }
      );
    }

    // Invalidate relevant caches
    await this.invalidateLanguageCaches(song.language);
    await this.invalidateGenreCaches(song.genre);

    return song;
  }

  /** Update an existing song (Admin) */
  async updateSong(songId: string, params: UpdateSongParams): Promise<ISongDoc> {
    const song = await Song.findByIdAndUpdate(songId, { $set: params }, { new: true, runValidators: true });
    if (!song) throw new NotFoundError('Song');

    // Invalidate caches
    await this.redis.del(`song:${songId}`);
    if (params.language) await this.invalidateLanguageCaches(params.language);
    if (params.genre) await this.invalidateGenreCaches(params.genre);

    return song;
  }

  /** Delete/deactivate a song (Admin) */
  async deleteSong(songId: string, hardDelete = false): Promise<void> {
    if (hardDelete) {
      await Song.findByIdAndDelete(songId);
    } else {
      await Song.findByIdAndUpdate(songId, { isActive: false });
    }
    await this.redis.del(`song:${songId}`);
  }

  /** Bulk import songs (Admin) */
  async bulkImportSongs(songs: CreateSongParams[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const songData of songs) {
      try {
        await this.createSong(songData);
        imported++;
      } catch (err) {
        errors.push(`${songData.title}: ${(err as Error).message}`);
      }
    }

    return { imported, errors };
  }

  /** Get recently added songs (Admin dashboard) */
  async getRecentlyAdded(limit = 50): Promise<ISongDoc[]> {
    return Song.find({ isActive: true })
      .sort({ addedAt: -1 })
      .limit(limit)
      .lean() as Promise<ISongDoc[]>;
  }

  // ─── Play Count Management ───────────────────────────────────────────────────

  /** Increment play count (called via Kafka from streaming service) */
  async incrementPlayCount(songId: string): Promise<void> {
    await Song.findByIdAndUpdate(songId, {
      $inc: { playCount: 1, weeklyPlays: 1, monthlyPlays: 1 },
      lastPlayedAt: new Date(),
    });
    await this.redis.del(`song:${songId}`);
  }

  /** Reset weekly/monthly play counts (scheduled job) */
  async resetPlayCounters(type: 'weekly' | 'monthly'): Promise<void> {
    const field = type === 'weekly' ? 'weeklyPlays' : 'monthlyPlays';
    await Song.updateMany({}, { [field]: 0 });
    
    // Clear all trending caches
    const keys = await this.redis.keys('trending:*');
    for (const key of keys) {
      await this.redis.del(key);
    }
  }

  // ─── Cache Invalidation ──────────────────────────────────────────────────────

  private async invalidateLanguageCaches(language: string): Promise<void> {
    const patterns = [
      `lang:${language}:*`,
      `new:${language}:*`,
      `trending:${language}:*`,
      `popular:*:${language}:*`,
      'languages:stats',
    ];
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      for (const key of keys) {
        await this.redis.del(key);
      }
    }
  }

  private async invalidateGenreCaches(genre: string): Promise<void> {
    const patterns = [`popular:${genre}:*`, 'genres:stats'];
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      for (const key of keys) {
        await this.redis.del(key);
      }
    }
  }
}

  /** Increment play count (called by streaming service via Kafka) */
  async incrementPlayCount(songId: string): Promise<void> {
    await Song.findByIdAndUpdate(songId, { $inc: { playCount: 1 } });
    // Invalidate caches
    await this.redis.del(`song:${songId}`);
    await this.redis.del(`popular:all:50`);
  }
}
