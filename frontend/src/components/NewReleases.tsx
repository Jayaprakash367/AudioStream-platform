/**
 * Real-Time New Releases Component
 * Shows live updates of newly added songs with animations
 */

'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Clock, Music2, Play, Plus, Heart, Bell, BellRing, ChevronRight } from 'lucide-react';
import { useNewSongs, useRealtime, useNotifications, useRealtimeStore, type NewSong } from '@/lib/realtime';
import { usePlayerStore } from '@/lib/store';

interface NewReleasesProps {
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function NewReleases({ maxItems = 10, showHeader = true, compact = false }: NewReleasesProps) {
  const newSongs = useNewSongs();
  const { isConnected } = useRealtime();
  const displaySongs = newSongs.slice(0, maxItems);

  if (compact) {
    return (
      <div className="space-y-2">
        {displaySongs.map((song, idx) => (
          <NewSongCardCompact key={song.songId} song={song} isNew={idx === 0} />
        ))}
        {displaySongs.length === 0 && (
          <div className="text-center py-8 text-surface-500">
            <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">New songs will appear here in real-time</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                New Releases
                {isConnected && (
                  <span className="flex items-center gap-1 text-xs font-normal text-neon-green">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                    Live
                  </span>
                )}
              </h2>
              <p className="text-xs text-surface-500">Songs added in real-time</p>
            </div>
          </div>
          <button className="flex items-center gap-1 text-sm text-surface-400 hover:text-white transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {displaySongs.map((song, idx) => (
          <NewSongCard key={song.songId} song={song} isNew={idx === 0} />
        ))}
      </div>

      {displaySongs.length === 0 && (
        <div className="text-center py-12 bg-surface-800/30 rounded-2xl border border-surface-700/50">
          <Music2 className="w-12 h-12 mx-auto mb-3 text-surface-600" />
          <p className="text-surface-400 font-medium">No new releases yet</p>
          <p className="text-sm text-surface-500 mt-1">New songs will appear here instantly</p>
        </div>
      )}
    </div>
  );
}

// ─── Song Card ───────────────────────────────────────────────────────────────

function NewSongCard({ song, isNew }: { song: NewSong; isNew: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(isNew);
  const { play } = usePlayerStore();

  useEffect(() => {
    if (isNew) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isNew, song.songId]);

  const handlePlay = () => {
    play({
      id: song.songId,
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: song.coverArtUrl,
      previewUrl: null,
      streamUrl: null, // Will be fetched from API
      duration: song.duration,
      source: 'jiosaavn',
      language: song.language,
      genre: song.genre,
      isFullTrack: true,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`group flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${
        isAnimating ? 'bg-neon-pink/10 ring-1 ring-neon-pink/30 animate-pulse' : 'hover:bg-surface-800/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlay}
    >
      {/* Artwork */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
        {song.coverArtUrl ? (
          <img
            src={song.coverArtUrl}
            alt={song.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.className = 'hidden';
            }}
          />
        ) : (
          <div className="w-full h-full bg-surface-700 flex items-center justify-center">
            <Music2 className="w-6 h-6 text-surface-500" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Play className="w-6 h-6 fill-current" />
        </div>

        {/* New badge */}
        {isAnimating && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-neon-pink text-[10px] font-bold rounded-md">
            NEW
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{song.title}</h3>
        <p className="text-xs text-surface-400 truncate">{song.artist}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 bg-surface-700 rounded text-surface-400">
            {song.language}
          </span>
          <span className="text-[10px] text-surface-500">{song.genre}</span>
        </div>
      </div>

      {/* Duration & Actions */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-surface-500">{formatDuration(song.duration)}</span>
        
        <button
          className="p-2 rounded-full hover:bg-surface-700 transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); }}
          title="Add to favorites"
          aria-label="Add to favorites"
        >
          <Heart className="w-4 h-4" />
        </button>
        
        <button
          className="p-2 rounded-full hover:bg-surface-700 transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); }}
          title="Add to playlist"
          aria-label="Add to playlist"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quality badges */}
      {song.availableQualities?.includes('lossless') && (
        <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded font-bold">
          HI-RES
        </span>
      )}
    </div>
  );
}

// ─── Compact Card ────────────────────────────────────────────────────────────

function NewSongCardCompact({ song, isNew }: { song: NewSong; isNew: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
      isNew ? 'bg-neon-pink/5' : 'hover:bg-surface-800/30'
    }`}>
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-700">
        {song.coverArtUrl ? (
          <img src={song.coverArtUrl} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="w-4 h-4 text-surface-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{song.title}</p>
        <p className="text-xs text-surface-500 truncate">{song.artist}</p>
      </div>
      {isNew && (
        <span className="px-1.5 py-0.5 bg-neon-pink/20 text-neon-pink text-[10px] font-bold rounded">NEW</span>
      )}
    </div>
  );
}

// ─── Notification Bell ───────────────────────────────────────────────────────

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markRead, clearAll } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-surface-800 transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-neon-pink" />
        ) : (
          <Bell className="w-5 h-5 text-surface-400" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-neon-pink text-[10px] font-bold rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-80 bg-surface-900 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-surface-700">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-surface-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`flex items-start gap-3 px-3 py-2.5 hover:bg-surface-800 cursor-pointer transition-colors ${
                      !notif.read ? 'bg-neon-pink/5' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      !notif.read ? 'bg-neon-pink' : 'bg-surface-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {formatTimeAgo(notif.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-surface-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default NewReleases;
