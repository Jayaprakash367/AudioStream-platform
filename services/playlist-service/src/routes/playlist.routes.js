"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlaylistRoutes = registerPlaylistRoutes;
const common_1 = require("@auralux/common");
async function registerPlaylistRoutes(app, service) {
    app.post('/playlists', async (request, reply) => {
        const body = common_1.createPlaylistSchema.parse(request.body);
        const userId = request.headers['x-user-id'];
        const playlist = await service.createPlaylist({ ...body, ownerId: userId, ownerName: userId });
        reply.status(201).send({ success: true, data: playlist });
    });
    app.get('/playlists', async (request, reply) => {
        const userId = request.headers['x-user-id'];
        const { page, limit } = request.query;
        const result = await service.getUserPlaylists(userId, parseInt(page || '1', 10), parseInt(limit || '20', 10));
        reply.send({ success: true, data: result.playlists, meta: result.meta });
    });
    app.get('/playlists/:playlistId', async (request, reply) => {
        const { playlistId } = request.params;
        const userId = request.headers['x-user-id'];
        const playlist = await service.getPlaylistById(playlistId, userId);
        reply.send({ success: true, data: playlist });
    });
    app.post('/playlists/:playlistId/songs', async (request, reply) => {
        const { playlistId } = request.params;
        const { songId } = common_1.addSongToPlaylistSchema.parse(request.body);
        const userId = request.headers['x-user-id'];
        const playlist = await service.addSongToPlaylist(playlistId, songId, userId);
        reply.send({ success: true, data: playlist });
    });
    app.delete('/playlists/:playlistId/songs/:songId', async (request, reply) => {
        const { playlistId, songId } = request.params;
        const userId = request.headers['x-user-id'];
        const playlist = await service.removeSongFromPlaylist(playlistId, songId, userId);
        reply.send({ success: true, data: playlist });
    });
    app.delete('/playlists/:playlistId', async (request, reply) => {
        const { playlistId } = request.params;
        const userId = request.headers['x-user-id'];
        await service.deletePlaylist(playlistId, userId);
        reply.status(204).send();
    });
}
//# sourceMappingURL=playlist.routes.js.map