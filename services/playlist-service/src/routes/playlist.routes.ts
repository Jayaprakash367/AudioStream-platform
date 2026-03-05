import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PlaylistService } from '../services';
import { createPlaylistSchema, addSongToPlaylistSchema } from '@auralux/common';

export async function registerPlaylistRoutes(app: FastifyInstance, service: PlaylistService): Promise<void> {
  app.post('/playlists', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createPlaylistSchema.parse(request.body);
    const userId = request.headers['x-user-id'] as string;
    const playlist = await service.createPlaylist({ ...body, ownerId: userId, ownerName: userId });
    reply.status(201).send({ success: true, data: playlist });
  });

  app.get('/playlists', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const { page, limit } = request.query as { page?: string; limit?: string };
    const result = await service.getUserPlaylists(userId, parseInt(page || '1', 10), parseInt(limit || '20', 10));
    reply.send({ success: true, data: result.playlists, meta: result.meta });
  });

  app.get('/playlists/:playlistId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { playlistId } = request.params as { playlistId: string };
    const userId = request.headers['x-user-id'] as string;
    const playlist = await service.getPlaylistById(playlistId, userId);
    reply.send({ success: true, data: playlist });
  });

  app.post('/playlists/:playlistId/songs', async (request: FastifyRequest, reply: FastifyReply) => {
    const { playlistId } = request.params as { playlistId: string };
    const { songId } = addSongToPlaylistSchema.parse(request.body);
    const userId = request.headers['x-user-id'] as string;
    const playlist = await service.addSongToPlaylist(playlistId, songId, userId);
    reply.send({ success: true, data: playlist });
  });

  app.delete('/playlists/:playlistId/songs/:songId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { playlistId, songId } = request.params as { playlistId: string; songId: string };
    const userId = request.headers['x-user-id'] as string;
    const playlist = await service.removeSongFromPlaylist(playlistId, songId, userId);
    reply.send({ success: true, data: playlist });
  });

  app.delete('/playlists/:playlistId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { playlistId } = request.params as { playlistId: string };
    const userId = request.headers['x-user-id'] as string;
    await service.deletePlaylist(playlistId, userId);
    reply.status(204).send();
  });
}
