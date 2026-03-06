'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Play, Pause, Loader2, Music2 } from 'lucide-react';
import { getTrendingByLanguage, LANGUAGE_LIST, type Track } from '@/lib/music-api';
import { TrackRow, SectionHeader, LanguagePill, TrackSkeleton } from '@/components/Cards';
import { usePlayerStore } from '@/lib/store';

export default function TrendingPage() {
  const [activeLang, setActiveLang] = useState('Hindi');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, play, togglePlay } = usePlayerStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTracks([]);
    getTrendingByLanguage(activeLang)
      .then(res => { if (!cancelled) setTracks(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeLang]);

  const top3 = tracks.slice(0, 3);
  const rest = tracks.slice(3);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center">
          <TrendingUp size={24} className="text-neon-pink" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Trending Charts</h1>
          <p className="text-sm text-surface-400">Live trending on Auralux X</p>
        </div>
      </div>

      {/* Language pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {LANGUAGE_LIST.map(lang => (
          <LanguagePill key={lang} language={lang} active={activeLang === lang} onClick={() => setActiveLang(lang)} />
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => <TrackSkeleton key={i} />)}
        </div>
      )}

      {/* Top 3 showcase */}
      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((t, i) => {
            const gradients = [
              'from-neon-pink/20 to-neon-purple/10 border-neon-pink/20',
              'from-neon-cyan/20 to-neon-blue/10 border-neon-cyan/20',
              'from-neon-yellow/20 to-neon-orange/10 border-neon-yellow/20',
            ];
            const isCurrent = currentTrack?.id === t.id;
            return (
              <div key={t.id} className={`relative rounded-2xl bg-gradient-to-br ${gradients[i]} border p-5 cursor-pointer group transition-all hover:scale-[1.02]`} onClick={() => (isCurrent ? togglePlay() : play(t, tracks))}>
                <span className="text-5xl font-black text-white/10 absolute top-3 right-4 select-none font-display">
                  {i + 1}
                </span>
                <div className="w-16 h-16 rounded-xl overflow-hidden mb-3 shadow-lg">
                  {t.artwork ? (
                    <img src={t.artwork} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-800 flex items-center justify-center">
                      <Music2 size={24} className="text-surface-600" />
                    </div>
                  )}
                </div>
                <p className={`font-bold text-sm truncate ${isCurrent ? 'text-neon-pink' : 'text-white'}`}>{t.title}</p>
                <p className="text-xs text-surface-400 truncate mt-0.5">{t.artist}</p>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/20 transition-all">
                    {isCurrent && isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    {isCurrent && isPlaying ? 'Pause' : 'Play'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {!loading && tracks.length > 0 && (
        <div>
          <SectionHeader title={`${activeLang} Charts`} subtitle={`${tracks.length} tracks`} />
          <div className="space-y-1">
            {tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} queue={tracks} />)}
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && tracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Music2 size={48} className="text-surface-700 mb-4" />
          <p className="text-surface-300 font-semibold">No trending tracks found for {activeLang}</p>
          <p className="text-surface-600 text-sm mt-1">Try a different language</p>
        </div>
      )}
    </div>
  );
}
