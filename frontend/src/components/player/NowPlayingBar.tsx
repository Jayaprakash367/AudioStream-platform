'use client';

import React, { useState, useCallback, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Volume1,
  Shuffle, Repeat, Repeat1, Heart, ListMusic, Maximize2, Wifi,
} from 'lucide-react';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function NowPlayingBar() {
  const { playback, controls, error } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const position = isDragging ? dragPosition : playback.position;
  const progress = playback.duration > 0 ? (position / playback.duration) * 100 : 0;

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || playback.duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      controls.seek(Math.floor(percent * playback.duration));
    },
    [playback.duration, controls]
  );

  const handleProgressDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setDragPosition(Math.floor(percent * playback.duration));
    },
    [isDragging, playback.duration]
  );

  const handleProgressDragEnd = useCallback(() => {
    if (isDragging) {
      controls.seek(dragPosition);
      setIsDragging(false);
    }
  }, [isDragging, dragPosition, controls]);

  const VolumeIcon = playback.volume === 0 ? VolumeX : playback.volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = playback.repeatMode === 2 ? Repeat1 : Repeat;

  if (!playback.isReady && !error) return null;

  if (error) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-surface-950 border-t border-red-500/30 flex items-center justify-center px-4 z-50">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-surface-950/95 backdrop-blur-xl border-t border-white/5 z-50">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="h-1 bg-surface-800 cursor-pointer group relative -mt-0.5 hover:h-1.5 transition-all"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleProgressDrag}
          onMouseUp={handleProgressDragEnd}
          onMouseLeave={handleProgressDragEnd}
        >
          <div
            className="h-full bg-gradient-to-r from-neon-pink to-neon-purple group-hover:from-neon-cyan group-hover:to-neon-blue transition-colors relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>

        <div className="h-[72px] px-4 flex items-center justify-between gap-4">
          {/* Left: Track info */}
          <div className="flex items-center gap-3 min-w-[200px] w-[30%]">
            {playback.track ? (
              <>
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 group shadow-lg shadow-black/40">
                  <img
                    src={playback.track.albumArt}
                    alt={playback.track.album}
                    className="w-full h-full object-cover"
                  />
                  <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
                    {playback.track.name}
                  </p>
                  <p className="text-xs text-surface-400 truncate hover:underline cursor-pointer">
                    {playback.track.artist}
                  </p>
                </div>
                <button onClick={() => setIsLiked(!isLiked)} className="flex-shrink-0 ml-2">
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isLiked ? 'text-neon-pink fill-neon-pink' : 'text-surface-400 hover:text-white'
                    }`}
                  />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-surface-800 rounded-lg animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-surface-800 rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-surface-800 rounded animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* Center: Controls */}
          <div className="flex flex-col items-center gap-1 w-[40%] max-w-[600px]">
            <div className="flex items-center gap-4">
              <button
                onClick={controls.toggleShuffle}
                className={`transition-colors ${
                  playback.shuffle ? 'text-neon-cyan' : 'text-surface-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button onClick={controls.previous} className="text-surface-400 hover:text-white transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={controls.togglePlay}
                className="w-9 h-9 rounded-full bg-white hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
              >
                {playback.isPlaying ? (
                  <Pause className="w-5 h-5 text-black" />
                ) : (
                  <Play className="w-5 h-5 text-black ml-0.5" />
                )}
              </button>

              <button onClick={controls.next} className="text-surface-400 hover:text-white transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={() => controls.setRepeatMode((playback.repeatMode + 1) % 3)}
                className={`transition-colors relative ${
                  playback.repeatMode > 0 ? 'text-neon-cyan' : 'text-surface-400 hover:text-white'
                }`}
              >
                <RepeatIcon className="w-4 h-4" />
                {playback.repeatMode > 0 && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 w-full text-xs text-surface-400">
              <span className="w-10 text-right tabular-nums">{formatTime(position)}</span>
              <div className="flex-1" />
              <span className="w-10 tabular-nums">{formatTime(playback.duration)}</span>
            </div>
          </div>

          {/* Right: Volume & extras */}
          <div className="flex items-center justify-end gap-3 min-w-[200px] w-[30%]">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`transition-colors ${
                showQueue ? 'text-neon-cyan' : 'text-surface-400 hover:text-white'
              }`}
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {playback.deviceId && <Wifi className="w-4 h-4 text-neon-cyan" />}

            <button
              onClick={() => controls.setVolume(playback.volume === 0 ? 0.5 : 0)}
              className="text-surface-400 hover:text-white transition-colors"
            >
              <VolumeIcon className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={playback.volume}
              onChange={(e) => controls.setVolume(parseFloat(e.target.value))}
              className="w-24 accent-neon-pink"
            />
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && playback.nextTracks.length > 0 && (
        <div className="fixed bottom-[88px] right-4 w-80 max-h-96 glass rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Queue</h3>
          </div>
          <div className="overflow-y-auto max-h-[320px]">
            {playback.track && (
              <div className="px-4 py-2 bg-neon-pink/5">
                <p className="text-xs text-neon-pink font-medium mb-1">Now Playing</p>
                <div className="flex items-center gap-3">
                  <img src={playback.track.albumArt} alt="" className="w-10 h-10 rounded-lg" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{playback.track.name}</p>
                    <p className="text-xs text-surface-400 truncate">{playback.track.artist}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="px-4 py-2">
              <p className="text-xs text-surface-400 font-medium mb-2">Next Up</p>
              {playback.nextTracks.map((track, i) => (
                <div key={`${track.id}-${i}`} className="flex items-center gap-3 py-2 hover:bg-white/5 rounded-lg px-2 -mx-2">
                  <img src={track.albumArt} alt="" className="w-10 h-10 rounded-lg" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{track.name}</p>
                    <p className="text-xs text-surface-400 truncate">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
