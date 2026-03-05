"use strict";
/**
 * Music Service — Song & Album Models
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Artist = exports.Song = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SongSchema = new mongoose_1.Schema({
    title: { type: String, required: true, index: 'text' },
    artistId: { type: String, required: true, index: true },
    artistName: { type: String, required: true, index: 'text' },
    albumId: { type: String, index: true },
    albumName: { type: String },
    genre: { type: String, required: true, index: true },
    duration: { type: Number, required: true },
    releaseDate: { type: Date, required: true },
    coverArtUrl: { type: String, required: true },
    audioFileKey: { type: String, required: true },
    availableQualities: { type: [String], default: ['128kbps'] },
    isExplicit: { type: Boolean, default: false },
    playCount: { type: Number, default: 0, index: true },
    likeCount: { type: Number, default: 0 },
    tags: { type: [String], default: [], index: true },
}, { timestamps: true, collection: 'songs' });
/** Compound indexes for common query patterns */
SongSchema.index({ genre: 1, playCount: -1 });
SongSchema.index({ artistId: 1, releaseDate: -1 });
SongSchema.index({ title: 'text', artistName: 'text', tags: 'text' });
exports.Song = mongoose_1.default.model('Song', SongSchema);
const ArtistSchema = new mongoose_1.Schema({
    name: { type: String, required: true, index: 'text' },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    genres: { type: [String], default: [] },
    monthlyListeners: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    socialLinks: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true, collection: 'artists' });
exports.Artist = mongoose_1.default.model('Artist', ArtistSchema);
//# sourceMappingURL=song.model.js.map