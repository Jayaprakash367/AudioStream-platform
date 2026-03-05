/**
 * Playlist Service — Business Logic
 */

import { Playlist, IPlaylistDoc } from '../models';
import { KafkaEventBus } from '@auralux/kafka-client';
import { NotFoundError, ForbiddenError, buildPaginationMeta } from '@auralux/common';
import { KafkaTopic } from '@auralux/shared-types';

export class PlaylistService {
  constructor(private kafka: KafkaEventBus) {}

  async createPlaylist(data: {
    name: string;
    description?: string;
    visibility: string;
    songIds?: string[];
    ownerId: string;
    ownerName: string;
  }): Promise<IPlaylistDoc> {
    const playlist = await Playlist.create({
      name: data.name,
      description: data.description,
      visibility: data.visibility,
      songIds: data.songIds || [],
      ownerId: data.ownerId,
      ownerName: data.ownerName,
    });

    await this.kafka.publish(
      { playlistId: playlist.id, ownerId: data.ownerId, name: data.name, visibility: data.visibility, createdAt: new Date().toISOString() },
      { topic: KafkaTopic.PLAYLIST_CREATED, key: data.ownerId }
    );

    return playlist;
  }

  async getPlaylistById(playlistId: string, requesterId: string): Promise<IPlaylistDoc> {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist');
    if (playlist.visibility === 'PRIVATE' && playlist.ownerId !== requesterId && !playlist.collaborators.includes(requesterId)) {
      throw new ForbiddenError('You do not have access to this playlist');
    }
    return playlist;
  }

  async getUserPlaylists(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [playlists, total] = await Promise.all([
      Playlist.find({ ownerId: userId }).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Playlist.countDocuments({ ownerId: userId }),
    ]);
    return { playlists, meta: buildPaginationMeta(total, page, limit) };
  }

  async addSongToPlaylist(playlistId: string, songId: string, userId: string): Promise<IPlaylistDoc> {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist');
    if (playlist.ownerId !== userId && !playlist.collaborators.includes(userId)) {
      throw new ForbiddenError('Cannot modify this playlist');
    }
    if (!playlist.songIds.includes(songId)) {
      playlist.songIds.push(songId);
      await playlist.save();
      await this.kafka.publish(
        { playlistId, ownerId: userId, action: 'song_added', songId, updatedAt: new Date().toISOString() },
        { topic: KafkaTopic.PLAYLIST_UPDATED, key: playlistId }
      );
    }
    return playlist;
  }

  async removeSongFromPlaylist(playlistId: string, songId: string, userId: string): Promise<IPlaylistDoc> {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist');
    if (playlist.ownerId !== userId) throw new ForbiddenError('Cannot modify this playlist');
    playlist.songIds = playlist.songIds.filter((id) => id !== songId);
    await playlist.save();
    return playlist;
  }

  async deletePlaylist(playlistId: string, userId: string): Promise<void> {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist');
    if (playlist.ownerId !== userId) throw new ForbiddenError('Cannot delete this playlist');
    await Playlist.findByIdAndDelete(playlistId);
  }
}
