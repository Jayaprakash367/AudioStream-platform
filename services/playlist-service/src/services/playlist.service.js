"use strict";
/**
 * Playlist Service — Business Logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistService = void 0;
const models_1 = require("../models");
const common_1 = require("@auralux/common");
const shared_types_1 = require("@auralux/shared-types");
class PlaylistService {
    kafka;
    constructor(kafka) {
        this.kafka = kafka;
    }
    async createPlaylist(data) {
        const playlist = await models_1.Playlist.create({
            name: data.name,
            description: data.description,
            visibility: data.visibility,
            songIds: data.songIds || [],
            ownerId: data.ownerId,
            ownerName: data.ownerName,
        });
        await this.kafka.publish({ playlistId: playlist.id, ownerId: data.ownerId, name: data.name, visibility: data.visibility, createdAt: new Date().toISOString() }, { topic: shared_types_1.KafkaTopic.PLAYLIST_CREATED, key: data.ownerId });
        return playlist;
    }
    async getPlaylistById(playlistId, requesterId) {
        const playlist = await models_1.Playlist.findById(playlistId);
        if (!playlist)
            throw new common_1.NotFoundError('Playlist');
        if (playlist.visibility === 'PRIVATE' && playlist.ownerId !== requesterId && !playlist.collaborators.includes(requesterId)) {
            throw new common_1.ForbiddenError('You do not have access to this playlist');
        }
        return playlist;
    }
    async getUserPlaylists(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [playlists, total] = await Promise.all([
            models_1.Playlist.find({ ownerId: userId }).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
            models_1.Playlist.countDocuments({ ownerId: userId }),
        ]);
        return { playlists, meta: (0, common_1.buildPaginationMeta)(total, page, limit) };
    }
    async addSongToPlaylist(playlistId, songId, userId) {
        const playlist = await models_1.Playlist.findById(playlistId);
        if (!playlist)
            throw new common_1.NotFoundError('Playlist');
        if (playlist.ownerId !== userId && !playlist.collaborators.includes(userId)) {
            throw new common_1.ForbiddenError('Cannot modify this playlist');
        }
        if (!playlist.songIds.includes(songId)) {
            playlist.songIds.push(songId);
            await playlist.save();
            await this.kafka.publish({ playlistId, ownerId: userId, action: 'song_added', songId, updatedAt: new Date().toISOString() }, { topic: shared_types_1.KafkaTopic.PLAYLIST_UPDATED, key: playlistId });
        }
        return playlist;
    }
    async removeSongFromPlaylist(playlistId, songId, userId) {
        const playlist = await models_1.Playlist.findById(playlistId);
        if (!playlist)
            throw new common_1.NotFoundError('Playlist');
        if (playlist.ownerId !== userId)
            throw new common_1.ForbiddenError('Cannot modify this playlist');
        playlist.songIds = playlist.songIds.filter((id) => id !== songId);
        await playlist.save();
        return playlist;
    }
    async deletePlaylist(playlistId, userId) {
        const playlist = await models_1.Playlist.findById(playlistId);
        if (!playlist)
            throw new common_1.NotFoundError('Playlist');
        if (playlist.ownerId !== userId)
            throw new common_1.ForbiddenError('Cannot delete this playlist');
        await models_1.Playlist.findByIdAndDelete(playlistId);
    }
}
exports.PlaylistService = PlaylistService;
//# sourceMappingURL=playlist.service.js.map