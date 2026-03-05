"use strict";
/**
 * History Service — Listening History Model
 * TTL index auto-deletes records after 7 days.
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
exports.ListeningHistory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HistorySchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true },
    songTitle: { type: String, required: true },
    artistName: { type: String, required: true },
    listenedAt: { type: Date, default: Date.now, index: true },
    duration: { type: Number, required: true },
    completionRate: { type: Number, default: 0 },
    source: { type: String, default: 'search' },
    expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true, collection: 'listening_history' });
/** TTL index: MongoDB auto-deletes documents when expiresAt is reached */
HistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
HistorySchema.index({ userId: 1, listenedAt: -1 });
exports.ListeningHistory = mongoose_1.default.model('ListeningHistory', HistorySchema);
//# sourceMappingURL=history.model.js.map