'use client';

import React, { useState, useCallback, useRef } from 'react';
import { usePlayerStore } from '@/lib/store';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Volume1,
  Shuffle, Repeat, Repeat1, Heart, ListMusic, Music2,
} from 'lucide-react';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    progress,
    duration,
    volume,
    shuffle,
    repeat,
    liked,
    queue,
    pause,
    resume,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
  } = usePlayerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const displayProgress = isDragging ? dragValue : progress;
  const progressPct = duration > 0 ? (displayProgress / duration) * 100 : 0;

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(pct * duration);
    },
    [duration, seek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setDragValue(pct * duration);
    },
    [isDragging, duration]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      seek(dragValue);
      setIsDragging(false);
    }
  }, [isDragging, dragValue, seek]);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 40 ? Volume1 : Volume2;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const isLiked = currentTrack ? liked.has(currentTrack.id) : false;

  // Don't render when nothing is playing
  if (!currentTrack) return null;

  return (
    <>
      {/* Fixed bottom player bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-950/95 backdrop-blur-xl border-t border-white/5 z-50">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="h-1 bg-surface-800 cursor-pointer group relative hover:h-1.5 transition-all duration-150"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="h-full bg-gradient-to-r from-neon-pink to-neon-purple transition-all relative"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>

        <div className="h-[72px] px-4 flex items-center justify-between gap-4">
          {/* Left: Track info */}
          <div className="flex items-center gap-3 min-w-[200px] w-[30%]">
            {currentTrack.artwork ? (
              <img
                src={currentTrack.artwork}
                alt={currentTrack.album}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-lg shadow-black/40"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0">
                <Music2 size={20} className="text-surface-500" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
              <p className="text-xs text-surface-400 truncate">{currentTrack.artist}</p>
              {!currentTrack.isFullTrack && (
                <p className="text-[10px] text-neon-orange/70">30s preview</p>
              )}
            </div>
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className="flex-shrink-0 ml-1"
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked ? 'text-neon-pink fill-neon-pink' : 'text-surface-400 hover:text-white'
                }`}
              />
            </button>
          </div>

          {/* Center: Controls */}
          <div className="flex flex-col items-center gap-1 w-[40%] max-w-[600px]">
            <div className="flex items-center gap-5">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${shuffle ? 'text-neon-cyan' : 'text-surface-400 hover:text-white'}`}
                aria-label="Toggle shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Previous */}
              <button
                onClick={previous}
                className="text-surface-400 hover:text-white transition-colors"
                aria-label="Previous track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-9 h-9 rounded-full bg-white hover:scale-105 transition-transform flex items-center justify-center shadow-lg disabled:opacity-60"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 text-black" />
                ) : (
                  <Play className="w-5 h-5 text-black ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={next}
                className="text-surface-400 hover:text-white transition-colors"
                aria-label="Next track"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Repeat */}
              <button
                onClick={toggleRepeat}
                className={`transition-colors relative ${repeat !== 'off' ? 'text-neon-cyan' : 'text-surface-400 hover:text-white'}`}
                aria-label="Toggle repeat"
              >
                <RepeatIcon className="w-4 h-4" />
                {repeat !== 'off' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full" />
                )}
              </button>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 w-full text-xs text-surface-400">
              <span className="w-10 text-right tabular-nums">{formatTime(displayProgress)}</span>
              <div className="flex-1" />
              <span className="w-10 tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume */}
          <div className="flex items-center justify-end gap-3 min-w-[200px] w-[30%]">
            {/* Queue toggle */}
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`transition-colors ${showQueue ? 'text-neon-cyan' : 'text-surface-400 hover:text-white'}`}
              aria-label="Show queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Mute */}
            <button
              onClick={() => setVolume(volume === 0 ? 75 : 0)}
              className="text-surface-400 hover:text-white transition-colors"
              aria-label="Toggle mute"
            >
              <VolumeIcon className="w-4 h-4" />
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="w-24 accent-neon-pink"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      {/* Queue panel */}
      {showQueue && queue.length > 1 && (
        <div className="fixed bottom-[88px] right-4 w-80 max-h-96 glass rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Queue ({queue.length} tracks)</h3>
          </div>
          <div className="overflow-y-auto max-h-[320px]">
            {queue.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                className={`flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors ${
                  track.id === currentTrack?.id ? 'bg-neon-pink/5' : ''
                }`}
              >
                <img src={track.artwork} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${track.id === currentTrack?.id ? 'text-neon-pink font-medium' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-surface-400 truncate">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
