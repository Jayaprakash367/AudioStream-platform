'use client';

import React from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Pause, Music2 } from 'lucide-react';

interface TrackCardProps {
  trackId: string;
  trackUri: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  contextUri?: string;
  index?: number;
  compact?: boolean;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function TrackCard({
  trackId, trackUri, name, artist, album, albumArt, duration,
  contextUri, index, compact = false,
}: TrackCardProps) {
  const { playback, controls } = usePlayer();
  const { isPremium } = useAuth();

  const isCurrentTrack = playback.track?.id === trackId;
  const isPlaying = isCurrentTrack && playback.isPlaying;

  const handlePlay = async () => {
    if (!isPremium) return;
    if (isCurrentTrack) {
      await controls.togglePlay();
    } else if (contextUri && index !== undefined) {
      await controls.play(undefined, contextUri, index);
    } else {
      await controls.play(trackUri);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handlePlay}
        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer group transition-colors ${
          isCurrentTrack ? 'bg-neon-pink/10' : 'hover:bg-white/5'
        }`}
      >
        <div className="w-8 text-center flex-shrink-0">
          {isPlaying ? (
            <div className="flex items-center justify-center gap-0.5">
              <span className="w-0.5 h-3 bg-neon-pink rounded-full animate-equalizer-1" />
              <span className="w-0.5 h-4 bg-neon-pink rounded-full animate-equalizer-2" />
              <span className="w-0.5 h-2 bg-neon-pink rounded-full animate-equalizer-3" />
            </div>
          ) : (
            <>
              <span className={`text-sm group-hover:hidden ${isCurrentTrack ? 'text-neon-pink' : 'text-surface-400'}`}>
                {index !== undefined ? index + 1 : <Music2 className="w-4 h-4 inline" />}
              </span>
              <Play className="w-4 h-4 text-white hidden group-hover:inline" />
            </>
          )}
        </div>

        <img src={albumArt} alt={album} className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-neon-pink' : 'text-white'}`}>
            {name}
          </p>
          <p className="text-xs text-surface-400 truncate">{artist}</p>
        </div>

        <span className="text-xs text-surface-400 tabular-nums flex-shrink-0">
          {formatDuration(duration)}
        </span>

        {!isPremium && (
          <span className="text-[10px] text-neon-orange bg-neon-orange/10 px-1.5 py-0.5 rounded flex-shrink-0">
            PREVIEW
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative bg-surface-800/50 hover:bg-surface-700/50 rounded-2xl p-4 transition-all cursor-pointer hover-lift ${
        isCurrentTrack ? 'ring-2 ring-neon-pink/50' : ''
      }`}
      onClick={handlePlay}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-xl">
        <img
          src={albumArt}
          alt={album}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple flex items-center justify-center shadow-2xl shadow-neon-pink/50 hover:scale-110 transition-transform">
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </div>
        </div>

        {isPlaying && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5">
            <span className="w-1 h-3 bg-neon-pink rounded-full animate-equalizer-1" />
            <span className="w-1 h-4 bg-neon-pink rounded-full animate-equalizer-2" />
            <span className="w-1 h-2 bg-neon-pink rounded-full animate-equalizer-3" />
          </div>
        )}
      </div>

      <h3 className={`font-semibold text-sm truncate mb-1 ${isCurrentTrack ? 'text-neon-pink' : 'text-white'}`}>
        {name}
      </h3>
      <p className="text-xs text-surface-400 truncate">{artist}</p>

      {!isPremium && (
        <div className="mt-2">
          <span className="text-[10px] text-neon-orange bg-neon-orange/10 px-2 py-1 rounded-full">
            30s Preview Only
          </span>
        </div>
      )}
    </div>
  );
}
