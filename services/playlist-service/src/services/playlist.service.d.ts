/**
 * Playlist Service — Business Logic
 */
import { IPlaylistDoc } from '../models';
import { KafkaEventBus } from '@auralux/kafka-client';
export declare class PlaylistService {
    private kafka;
    constructor(kafka: KafkaEventBus);
    createPlaylist(data: {
        name: string;
        description?: string;
        visibility: string;
        songIds?: string[];
        ownerId: string;
        ownerName: string;
    }): Promise<IPlaylistDoc>;
    getPlaylistById(playlistId: string, requesterId: string): Promise<IPlaylistDoc>;
    getUserPlaylists(userId: string, page: number, limit: number): Promise<{
        playlists: (import("mongoose").FlattenMaps<IPlaylistDoc> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    addSongToPlaylist(playlistId: string, songId: string, userId: string): Promise<IPlaylistDoc>;
    removeSongFromPlaylist(playlistId: string, songId: string, userId: string): Promise<IPlaylistDoc>;
    deletePlaylist(playlistId: string, userId: string): Promise<void>;
}
//# sourceMappingURL=playlist.service.d.ts.map