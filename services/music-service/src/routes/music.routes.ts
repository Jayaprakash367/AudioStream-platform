/**
 * Music Service — Routes
 * Enhanced with language support, quality selection, and admin management APIs
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MusicService } from '../services';
import { songSearchSchema } from '@auralux/common';
import { z } from 'zod';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createSongSchema = z.object({
  title: z.string().min(1).max(500),
  artistId: z.string(),
  artistName: z.string().min(1).max(200),
  albumId: z.string().optional(),
  albumName: z.string().optional(),
  genre: z.string().min(1).max(50),
  language: z.string().min(2).max(50),
  duration: z.number().min(1),
  releaseDate: z.string().transform(s => new Date(s)),
  coverArtUrl: z.string().url(),
  audioFileKey: z.string(),
  audioFiles: z.array(z.object({
    quality: z.enum(['128kbps', '192kbps', '256kbps', '320kbps', 'lossless']),
    url: z.string().url(),
    bitrate: z.number(),
    format: z.enum(['mp3', 'aac', 'flac', 'ogg']),
    fileSize: z.number(),
  })).optional(),
  availableQualities: z.array(z.enum(['128kbps', '192kbps', '256kbps', '320kbps', 'lossless'])).optional(),
  isExplicit: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  lyrics: z.string().optional(),
  lyricsLanguage: z.string().optional(),
  region: z.array(z.string()).optional(),
});

const bulkImportSchema = z.object({
  songs: z.array(createSongSchema),
});

// ─── Route Registration ──────────────────────────────────────────────────────

export async function registerMusicRoutes(app: FastifyInstance, musicService: MusicService): Promise<void> {

  // ─── Search & Browse ─────────────────────────────────────────────────────────

  /** GET /music/search — Full-text search with language/genre filters */
  app.get('/music/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const params = {
      q: query.q,
      genre: query.genre,
      language: query.language,
      artistId: query.artistId,
      isExplicit: query.isExplicit === 'true' ? true : query.isExplicit === 'false' ? false : undefined,
      year: query.year ? parseInt(query.year, 10) : undefined,
      page: parseInt(query.page || '1', 10),
      limit: Math.min(parseInt(query.limit || '20', 10), 100),
      sortBy: query.sortBy,
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
    };
    const result = await musicService.searchSongs(params);
    reply.send({ success: true, data: result.songs, meta: result.meta });
  });

  /** GET /music/songs/:songId — Get song with quality selection */
  app.get('/music/songs/:songId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { songId } = request.params as { songId: string };
    const { quality } = request.query as { quality?: string };
    const song = await musicService.getSongById(songId, quality as any);
    reply.send({ success: true, data: song });
  });

  // ─── Language-Based Endpoints ────────────────────────────────────────────────

  /** GET /music/languages — Get all available languages with stats */
  app.get('/music/languages', async (request: FastifyRequest, reply: FastifyReply) => {
    const languages = await musicService.getAvailableLanguages();
    reply.send({ success: true, data: languages });
  });

  /** GET /music/languages/:language/songs — Get songs by language */
  app.get('/music/languages/:language/songs', async (request: FastifyRequest, reply: FastifyReply) => {
    const { language } = request.params as { language: string };
    const { page, limit } = request.query as { page?: string; limit?: string };
    const result = await musicService.getSongsByLanguage(
      language,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
    reply.send({ success: true, data: result.songs, meta: result.meta });
  });

  /** GET /music/languages/:language/new — New releases by language */
  app.get('/music/languages/:language/new', async (request: FastifyRequest, reply: FastifyReply) => {
    const { language } = request.params as { language: string };
    const { limit } = request.query as { limit?: string };
    const songs = await musicService.getNewReleasesByLanguage(language, limit ? parseInt(limit, 10) : 20);
    reply.send({ success: true, data: songs });
  });

  /** GET /music/languages/:language/trending — Trending by language */
  app.get('/music/languages/:language/trending', async (request: FastifyRequest, reply: FastifyReply) => {
    const { language } = request.params as { language: string };
    const { limit } = request.query as { limit?: string };
    const trending = await musicService.getTrendingByLanguage(language, limit ? parseInt(limit, 10) : 20);
    reply.send({ success: true, data: trending });
  });

  // ─── Genre Endpoints ─────────────────────────────────────────────────────────

  /** GET /music/genres — Get all available genres */
  app.get('/music/genres', async (request: FastifyRequest, reply: FastifyReply) => {
    const genres = await musicService.getAvailableGenres();
    reply.send({ success: true, data: genres });
  });

  /** GET /music/genres/:genre — Get songs by genre */
  app.get('/music/genres/:genre', async (request: FastifyRequest, reply: FastifyReply) => {
    const { genre } = request.params as { genre: string };
    const { page, limit } = request.query as { page?: string; limit?: string };
    const result = await musicService.getSongsByGenre(
      genre,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
    reply.send({ success: true, data: result.songs, meta: result.meta });
  });

  // ─── Popular & Trending ──────────────────────────────────────────────────────

  /** GET /music/popular — Popular songs (cached) */
  app.get('/music/popular', async (request: FastifyRequest, reply: FastifyReply) => {
    const { genre, language, limit } = request.query as { genre?: string; language?: string; limit?: string };
    const songs = await musicService.getPopularSongs(genre, language, limit ? parseInt(limit, 10) : 50);
    reply.send({ success: true, data: songs });
  });

  /** GET /music/new-releases — Recently added songs */
  app.get('/music/new-releases', async (request: FastifyRequest, reply: FastifyReply) => {
    const { language, limit } = request.query as { language?: string; limit?: string };
    const songs = await musicService.getNewReleasesByLanguage(language || 'All', limit ? parseInt(limit, 10) : 20);
    reply.send({ success: true, data: songs });
  });

  /** GET /music/trending — Global trending */
  app.get('/music/trending', async (request: FastifyRequest, reply: FastifyReply) => {
    const { language, limit } = request.query as { language?: string; limit?: string };
    const trending = await musicService.getTrendingByLanguage(language || 'All', limit ? parseInt(limit, 10) : 20);
    reply.send({ success: true, data: trending });
  });

  // ─── Admin Routes ────────────────────────────────────────────────────────────

  /** POST /music/admin/songs — Create a new song */
  app.post('/music/admin/songs', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createSongSchema.parse(request.body);
    const song = await musicService.createSong(body as any);
    reply.status(201).send({ success: true, data: song });
  });

  /** PUT /music/admin/songs/:songId — Update a song */
  app.put('/music/admin/songs/:songId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { songId } = request.params as { songId: string };
    const body = createSongSchema.partial().parse(request.body);
    const song = await musicService.updateSong(songId, body as any);
    reply.send({ success: true, data: song });
  });

  /** DELETE /music/admin/songs/:songId — Delete/deactivate a song */
  app.delete('/music/admin/songs/:songId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { songId } = request.params as { songId: string };
    const { hard } = request.query as { hard?: string };
    await musicService.deleteSong(songId, hard === 'true');
    reply.send({ success: true, message: 'Song deleted' });
  });

  /** POST /music/admin/bulk-import — Bulk import songs */
  app.post('/music/admin/bulk-import', async (request: FastifyRequest, reply: FastifyReply) => {
    const { songs } = bulkImportSchema.parse(request.body);
    const result = await musicService.bulkImportSongs(songs as any);
    reply.send({ success: true, data: result });
  });

  /** GET /music/admin/recent — Recently added songs (admin dashboard) */
  app.get('/music/admin/recent', async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit } = request.query as { limit?: string };
    const songs = await musicService.getRecentlyAdded(limit ? parseInt(limit, 10) : 50);
    reply.send({ success: true, data: songs });
  });

  /** POST /music/admin/reset-counters — Reset play counters (scheduled) */
  app.post('/music/admin/reset-counters', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.body as { type: 'weekly' | 'monthly' };
    await musicService.resetPlayCounters(type);
    reply.send({ success: true, message: `${type} counters reset` });
  });
}
