import { createLogger } from '@auralux/logger';
import { RedisCacheManager } from '@auralux/redis-client';
import { Genre, KafkaTopic, IListeningHistoryEvent } from '@auralux/shared-types';
import {
  UserTasteProfile,
  RecommendationBatch,
  IUserTasteProfile,
  IRecommendationItem,
  IGenreWeight,
} from '../models';
import { RecommendationServiceConfig } from '../config';

const logger = createLogger({ service: 'recommendation-service', level: 'info' });

/* ── Helpers ─────────────────────────────────────────────────────────── */

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/** Convert genre weights to a fixed-length vector keyed by Genre enum */
function genreVector(weights: IGenreWeight[]): number[] {
  const genres = Object.values(Genre);
  const vec = new Array(genres.length).fill(0);
  for (const gw of weights) {
    const idx = genres.indexOf(gw.genre);
    if (idx !== -1) vec[idx] = gw.weight;
  }
  return vec;
}

/* ── Service ─────────────────────────────────────────────────────────── */

export class RecommendationService {
  constructor(
    private readonly config: RecommendationServiceConfig,
    private readonly cache: RedisCacheManager,
  ) {}

  /* ─── Taste Profile Ingestion ───────────────────────────────────── */

  /**
   * Called when a `listening.history` Kafka event arrives.
   * Updates the user's taste profile incrementally.
   */
  async ingestListeningEvent(event: IListeningHistoryEvent): Promise<void> {
    const { userId, songId, artistId, genre, duration } = event;

    let profile = await UserTasteProfile.findOne({ userId });
    if (!profile) {
      profile = new UserTasteProfile({ userId });
    }

    // ── Update genre weights ──
    const existingGenre = profile.genreWeights.find((g) => g.genre === genre);
    if (existingGenre) {
      existingGenre.playCount += 1;
      existingGenre.totalListenDuration += duration;
    } else {
      profile.genreWeights.push({
        genre: genre as Genre,
        weight: 0,
        playCount: 1,
        totalListenDuration: duration,
      });
    }
    // Re-normalise genre weights
    const totalGenrePlays = profile.genreWeights.reduce((sum, g) => sum + g.playCount, 0);
    for (const g of profile.genreWeights) {
      g.weight = totalGenrePlays > 0 ? g.playCount / totalGenrePlays : 0;
    }

    // ── Update artist affinity ──
    if (artistId) {
      const existingArtist = profile.artistAffinities.find((a) => a.artistId === artistId);
      if (existingArtist) {
        existingArtist.playCount += 1;
        existingArtist.lastPlayed = new Date();
      } else {
        profile.artistAffinities.push({
          artistId,
          score: 0,
          playCount: 1,
          lastPlayed: new Date(),
        });
      }
      // Re-normalise artist affinity scores
      const maxArtistPlays = Math.max(...profile.artistAffinities.map((a) => a.playCount), 1);
      for (const a of profile.artistAffinities) {
        a.score = a.playCount / maxArtistPlays;
      }
    }

    // ── Rolling recent songs (keep last 200) ──
    profile.recentSongIds = [songId, ...profile.recentSongIds].slice(0, 200);
    profile.totalPlays += 1;
    profile.lastUpdated = new Date();

    await profile.save();

    // Invalidate cached recommendations
    await this.cache.del(`recommendations:${userId}`);

    logger.debug('Taste profile updated', { userId, songId, totalPlays: profile.totalPlays });
  }

  /* ─── Recommendation Generation ─────────────────────────────────── */

  async getRecommendations(
    userId: string,
    limit: number = 20,
  ): Promise<IRecommendationItem[]> {
    // Check cache first
    const cacheKey = `recommendations:${userId}:${limit}`;
    const cached = await this.cache.get<IRecommendationItem[]>(cacheKey);
    if (cached) return cached;

    // Check for a fresh batch in DB
    const existingBatch = await RecommendationBatch.findOne({
      userId,
      expiresAt: { $gt: new Date() },
    }).sort({ generatedAt: -1 });

    if (existingBatch) {
      const items = existingBatch.items.slice(0, limit);
      await this.cache.set(cacheKey, items, this.config.recommendationTTL);
      return items;
    }

    // Generate fresh recommendations
    const items = await this.generateRecommendations(userId, limit);

    // Persist batch
    const expiresAt = new Date(Date.now() + this.config.recommendationTTL * 1000);
    await RecommendationBatch.create({
      userId,
      items,
      generatedAt: new Date(),
      expiresAt,
      strategyMix: this.computeStrategyMix(items),
    });

    await this.cache.set(cacheKey, items, this.config.recommendationTTL);
    return items;
  }

  private async generateRecommendations(
    userId: string,
    limit: number,
  ): Promise<IRecommendationItem[]> {
    const profile = await UserTasteProfile.findOne({ userId });

    const results: IRecommendationItem[] = [];

    // Strategy 1: Content-based (from genre & artist affinity)
    if (profile && profile.genreWeights.length > 0) {
      const contentBased = await this.contentBasedFiltering(profile, limit);
      results.push(...contentBased);
    }

    // Strategy 2: Collaborative filtering (users with similar taste)
    if (profile && profile.totalPlays >= 5) {
      const collaborative = await this.collaborativeFiltering(profile, limit);
      results.push(...collaborative);
    }

    // Strategy 3: Trending / popular (fallback & discovery)
    const trending = await this.trendingStrategy(userId, limit);
    results.push(...trending);

    // Deduplicate by songId, keep highest score
    const deduped = this.deduplicateAndRank(results, profile?.recentSongIds || []);

    return deduped.slice(0, limit);
  }

  /* ─── Content-Based Filtering ───────────────────────────────────── */

  private async contentBasedFiltering(
    profile: IUserTasteProfile,
    limit: number,
  ): Promise<IRecommendationItem[]> {
    const topGenres = [...profile.genreWeights]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((g) => g.genre);

    const topArtists = [...profile.artistAffinities]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((a) => a.artistId);

    // In production this would query the music-service catalog via gRPC/HTTP.
    // Here we build recommendation items from profile data as a scaffold.
    const items: IRecommendationItem[] = [];

    for (const genre of topGenres) {
      items.push({
        songId: `content-genre-${genre}-${Date.now()}`,
        score: profile.genreWeights.find((g) => g.genre === genre)?.weight || 0.5,
        reason: `Based on your love of ${genre}`,
        strategy: 'content-based',
      });
    }

    for (const artistId of topArtists) {
      const affinity = profile.artistAffinities.find((a) => a.artistId === artistId);
      items.push({
        songId: `content-artist-${artistId}-${Date.now()}`,
        score: affinity?.score || 0.5,
        reason: `More from artists you enjoy`,
        strategy: 'content-based',
      });
    }

    return items.slice(0, limit);
  }

  /* ─── Collaborative Filtering ───────────────────────────────────── */

  private async collaborativeFiltering(
    profile: IUserTasteProfile,
    limit: number,
  ): Promise<IRecommendationItem[]> {
    const userVector = genreVector(profile.genreWeights);

    // Find similar users by genre taste vector cosine similarity
    const allProfiles = await UserTasteProfile.find({
      userId: { $ne: profile.userId },
      totalPlays: { $gte: this.config.collaborativeFilteringMinUsers },
    })
      .sort({ totalPlays: -1 })
      .limit(100)
      .lean();

    const similarities: Array<{ userId: string; sim: number; recentSongIds: string[] }> = [];

    for (const other of allProfiles) {
      const otherVector = genreVector(other.genreWeights);
      const sim = cosineSimilarity(userVector, otherVector);
      if (sim > 0.5) {
        similarities.push({ userId: other.userId, sim, recentSongIds: other.recentSongIds });
      }
    }

    similarities.sort((a, b) => b.sim - a.sim);
    const topSimilar = similarities.slice(0, 10);

    // Collect songs from similar users that the target user hasn't heard
    const heardSet = new Set(profile.recentSongIds);
    const candidateScores = new Map<string, { totalScore: number; count: number }>();

    for (const neighbor of topSimilar) {
      for (const songId of neighbor.recentSongIds) {
        if (heardSet.has(songId)) continue;
        const existing = candidateScores.get(songId) || { totalScore: 0, count: 0 };
        existing.totalScore += neighbor.sim;
        existing.count += 1;
        candidateScores.set(songId, existing);
      }
    }

    const items: IRecommendationItem[] = [];
    for (const [songId, { totalScore, count }] of candidateScores) {
      items.push({
        songId,
        score: Math.min(totalScore / count, 1),
        reason: `Loved by listeners with similar taste`,
        strategy: 'collaborative',
      });
    }

    items.sort((a, b) => b.score - a.score);
    return items.slice(0, limit);
  }

  /* ─── Trending / Discovery ──────────────────────────────────────── */

  private async trendingStrategy(
    userId: string,
    limit: number,
  ): Promise<IRecommendationItem[]> {
    // In production: query Music Service for globally trending songs
    // and filter out ones the user already heard.
    const trendingCacheKey = 'global:trending:songs';
    const trendingSongIds = await this.cache.get<string[]>(trendingCacheKey);

    if (!trendingSongIds || trendingSongIds.length === 0) {
      return [
        {
          songId: 'trending-placeholder',
          score: 0.3,
          reason: 'Trending right now',
          strategy: 'trending',
        },
      ];
    }

    const profile = await UserTasteProfile.findOne({ userId }).lean();
    const heardSet = new Set(profile?.recentSongIds || []);

    return trendingSongIds
      .filter((id) => !heardSet.has(id))
      .slice(0, limit)
      .map((songId, idx) => ({
        songId,
        score: Math.max(0.8 - idx * 0.02, 0.3),
        reason: 'Trending right now',
        strategy: 'trending' as const,
      }));
  }

  /* ─── Dedup & Rank ──────────────────────────────────────────────── */

  private deduplicateAndRank(
    items: IRecommendationItem[],
    recentSongIds: string[],
  ): IRecommendationItem[] {
    const heardSet = new Set(recentSongIds);
    const seen = new Map<string, IRecommendationItem>();

    for (const item of items) {
      if (heardSet.has(item.songId)) continue;
      const existing = seen.get(item.songId);
      if (!existing || item.score > existing.score) {
        seen.set(item.songId, item);
      }
    }

    return [...seen.values()].sort((a, b) => b.score - a.score);
  }

  private computeStrategyMix(items: IRecommendationItem[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.strategy] = (counts[item.strategy] || 0) + 1;
    }
    const total = items.length || 1;
    const mix: Record<string, number> = {};
    for (const [strategy, count] of Object.entries(counts)) {
      mix[strategy] = Math.round((count / total) * 100);
    }
    return mix;
  }

  /* ─── Taste Profile Read ────────────────────────────────────────── */

  async getUserTasteProfile(userId: string): Promise<IUserTasteProfile | null> {
    return UserTasteProfile.findOne({ userId }).lean();
  }
}
