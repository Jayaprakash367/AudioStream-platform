'use client';

import { useState, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Heart, ListMusic, ChevronDown, ChevronUp,
  Loader2, Music2, AlertCircle, ExternalLink,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/store';

function fmtTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) return <VolumeX size={16} />;
  if (volume < 50) return <Volume1 size={16} />;
  return <Volume2 size={16} />;
}

// ─── Source Badge ─────────────────────────────────────────────────────────────
function SourceBadge({ source, isFullTrack }: { source?: string; isFullTrack?: boolean }) {
  const map: Record<string, { label: string; color: string }> = {
    itunes: { label: 'Auralux X', color: 'text-neon-pink' },
    jiosaavn: { label: 'Auralux X', color: 'text-neon-pink' },
    deezer: { label: 'Auralux X', color: 'text-neon-cyan' },
  };
  const b = map[source || ''];
  return (
    <span className="flex items-center gap-1">
      {b && <span className={`text-[10px] font-medium ${b.color} opacity-70`}>{b.label}</span>}
    </span>
  );
}

export default function Player() {
  const {
    currentTrack, isPlaying, isLoading, progress, duration, volume, shuffle,
    repeat, liked, error,
    togglePlay, next, previous, seek, setVolume, toggleShuffle, toggleRepeat,
    toggleLike, queue,
  } = usePlayerStore();

  const [expanded, setExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;

  const pct = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = progressBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVolume(Number(e.target.value));
  }

  const isLikedTrack = liked.has(currentTrack.id);

  return (
    <>
      {/* ── Full-Screen Expanded Player ──────────────────────────────────── */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-surface-950 flex flex-col overflow-hidden">
          {/* Blurred backdrop from artwork */}
          <div
            className="absolute inset-0 opacity-[0.15] bg-cover bg-center blur-3xl scale-110"
            style={{ backgroundImage: `url(${currentTrack.artwork})` }}
          />
          <div className="relative flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <button
                onClick={() => setExpanded(false)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center transition-all"
                aria-label="Collapse player"
              >
                <ChevronDown size={18} />
              </button>
              <div className="text-center">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest">Now Playing</p>
                <SourceBadge source={currentTrack.source} isFullTrack={currentTrack.isFullTrack} />
              </div>
              <button
                onClick={() => setShowQueue(!showQueue)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center transition-all"
                aria-label={showQueue ? 'Hide queue' : 'Show queue'}
              >
                <ListMusic size={18} />
              </button>
            </div>

            {/* Queue panel */}
            {showQueue ? (
              <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Queue ({queue.length})</p>
                {queue.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${t.id === currentTrack.id ? 'bg-neon-pink/10 border border-neon-pink/20' : 'hover:bg-white/[0.04]'}`}
                    onClick={() => usePlayerStore.getState().play(t, queue)}
                  >
                    <span className="text-xs text-surface-500 w-5 text-center">{i + 1}</span>
                    <img src={t.artwork} alt={t.title} className="w-9 h-9 rounded-lg object-cover" onError={e => (e.currentTarget.src = '')} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${t.id === currentTrack.id ? 'text-neon-pink' : 'text-white'}`}>{t.title}</p>
                      <p className="text-xs text-surface-500 truncate">{t.artist}</p>
                    </div>
                    <span className="text-xs text-surface-600">{fmtTime(t.duration)}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* Album art + controls */
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <div className={`w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 mb-8 ${isPlaying ? 'ring-2 ring-neon-pink/40 ring-offset-4 ring-offset-surface-950' : ''}`}>
                  {currentTrack.artwork ? (
                    <img src={currentTrack.artwork} alt={currentTrack.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-800 flex items-center justify-center">
                      <Music2 size={64} className="text-surface-600" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="w-full max-w-xs text-center mb-6">
                  <h2 className="text-xl font-bold truncate mb-1">{currentTrack.title}</h2>
                  <p className="text-surface-400 text-sm truncate">{currentTrack.artist}</p>
                  {currentTrack.album && <p className="text-surface-600 text-xs truncate mt-0.5">{currentTrack.album}</p>}
                </div>

                {/* Progress */}
                <div className="w-full max-w-xs mb-5">
                  <div
                    ref={progressBarRef}
                    className="h-1.5 bg-surface-700 rounded-full cursor-pointer group mb-1.5"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-neon-pink to-neon-purple rounded-full relative transition-all"
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-surface-500">
                    <span>{fmtTime(progress)}</span>
                    <span>{fmtTime(duration || currentTrack.duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 mb-6">
                  <button onClick={toggleShuffle} className={`transition-all ${shuffle ? 'text-neon-pink' : 'text-surface-500 hover:text-white'}`} aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}>
                    <Shuffle size={20} />
                  </button>
                  <button onClick={previous} className="text-surface-300 hover:text-white hover:scale-110 transition-all" aria-label="Previous track">
                    <SkipBack size={28} fill="currentColor" />
                  </button>
                  <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple flex items-center justify-center hover:scale-105 transition-all shadow-xl shadow-neon-pink/30 disabled:opacity-70"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isLoading ? (
                      <Loader2 size={28} className="animate-spin text-white" />
                    ) : isPlaying ? (
                      <Pause size={28} fill="white" className="text-white" />
                    ) : (
                      <Play size={28} fill="white" className="text-white translate-x-0.5" />
                    )}
                  </button>
                  <button onClick={next} className="text-surface-300 hover:text-white hover:scale-110 transition-all" aria-label="Next track">
                    <SkipForward size={28} fill="currentColor" />
                  </button>
                  <button onClick={toggleRepeat} className={`transition-all ${repeat !== 'off' ? 'text-neon-cyan' : 'text-surface-500 hover:text-white'}`} aria-label={repeat === 'off' ? 'Enable repeat' : repeat === 'one' ? 'Repeat all' : 'Disable repeat'}>
                    {repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                  </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3 w-full max-w-xs">
                  <VolumeIcon volume={volume} />
                  <input
                    type="range" min={0} max={100} value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 accent-neon-pink cursor-pointer"
                    aria-label="Volume"
                  />
                  <button
                    onClick={() => toggleLike(currentTrack.id)}
                    className={`ml-2 transition-all ${isLikedTrack ? 'text-neon-pink scale-110' : 'text-surface-500 hover:text-white'}`}
                    aria-label={isLikedTrack ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={20} fill={isLikedTrack ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 mt-4 text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg max-w-xs w-full">
                    <AlertCircle size={14} />
                    <span className="truncate">{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mini Player Bar ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-950/95 backdrop-blur-xl border-t border-white/[0.06]">
        {/* Thin progress strip at very top */}
        <div
          className="h-0.5 bg-surface-800 cursor-pointer group"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seek(ratio * (duration || currentTrack.duration));
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-neon-pink to-neon-purple transition-all group-hover:h-1"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3 max-w-screen-2xl mx-auto">
          {/* Track info */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            <div className={`relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${isPlaying ? 'ring-1 ring-neon-pink/60' : ''}`}>
              {currentTrack.artwork ? (
                <img src={currentTrack.artwork} alt={currentTrack.title} className={`w-full h-full object-cover ${isPlaying ? 'animate-slow-spin' : ''}`} />
              ) : (
                <div className="w-full h-full bg-surface-800 flex items-center justify-center">
                  <Music2 size={20} className="text-surface-500" />
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{currentTrack.title}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-surface-400 truncate">{currentTrack.artist}</p>
                <SourceBadge source={currentTrack.source} isFullTrack={currentTrack.isFullTrack} />
              </div>
            </div>
            <ChevronUp size={14} className="text-surface-500 flex-shrink-0" />
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggleShuffle} className={`hidden sm:block transition-all p-1.5 rounded-lg ${shuffle ? 'text-neon-pink bg-neon-pink/10' : 'text-surface-500 hover:text-white hover:bg-white/[0.04]'}`} aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}>
              <Shuffle size={15} />
            </button>
            <button onClick={previous} className="text-surface-300 hover:text-white transition-all p-1.5 rounded-lg hover:bg-white/[0.04]" aria-label="Previous track">
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-neon-pink/20 disabled:opacity-70"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : isPlaying ? (
                <Pause size={18} fill="white" className="text-white" />
              ) : (
                <Play size={18} fill="white" className="text-white translate-x-0.5" />
              )}
            </button>
            <button onClick={next} className="text-surface-300 hover:text-white transition-all p-1.5 rounded-lg hover:bg-white/[0.04]" aria-label="Next track">
              <SkipForward size={20} fill="currentColor" />
            </button>
            <button onClick={toggleRepeat} className={`hidden sm:block transition-all p-1.5 rounded-lg ${repeat !== 'off' ? 'text-neon-cyan bg-neon-cyan/10' : 'text-surface-500 hover:text-white hover:bg-white/[0.04]'}`} aria-label={repeat === 'off' ? 'Enable repeat' : repeat === 'one' ? 'Repeat all' : 'Disable repeat'}>
              {repeat === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="hidden md:flex items-center gap-2 text-xs text-surface-500">
              <span>{fmtTime(progress)}</span>
              <span>/</span>
              <span>{fmtTime(duration || currentTrack.duration)}</span>
            </div>
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className={`transition-all p-1.5 rounded-lg ${isLikedTrack ? 'text-neon-pink bg-neon-pink/10' : 'text-surface-500 hover:text-neon-pink hover:bg-neon-pink/5'}`}
              aria-label={isLikedTrack ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={16} fill={isLikedTrack ? 'currentColor' : 'none'} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <VolumeIcon volume={volume} />
              <input
                type="range" min={0} max={100} value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 accent-neon-pink cursor-pointer"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
