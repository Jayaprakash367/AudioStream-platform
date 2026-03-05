"use strict";
/**
 * Music Service — Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMusicRoutes = registerMusicRoutes;
const common_1 = require("@auralux/common");
async function registerMusicRoutes(app, musicService) {
    /** GET /music/search — Full-text search with filters */
    app.get('/music/search', async (request, reply) => {
        const params = common_1.songSearchSchema.parse(request.query);
        const result = await musicService.searchSongs(params);
        reply.send({ success: true, data: result.songs, meta: result.meta });
    });
    /** GET /music/songs/:songId */
    app.get('/music/songs/:songId', async (request, reply) => {
        const { songId } = request.params;
        const song = await musicService.getSongById(songId);
        reply.send({ success: true, data: song });
    });
    /** GET /music/popular — Popular songs (Redis cached) */
    app.get('/music/popular', async (request, reply) => {
        const { genre, limit } = request.query;
        const songs = await musicService.getPopularSongs(genre, limit ? parseInt(limit, 10) : 50);
        reply.send({ success: true, data: songs });
    });
    /** GET /music/genres/:genre */
    app.get('/music/genres/:genre', async (request, reply) => {
        const { genre } = request.params;
        const { page, limit } = request.query;
        const result = await musicService.getSongsByGenre(genre, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
        reply.send({ success: true, data: result.songs, meta: result.meta });
    });
}
//# sourceMappingURL=music.routes.js.map