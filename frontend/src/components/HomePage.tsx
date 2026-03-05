'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Globe2, Zap, Sparkles } from 'lucide-react';
import {
  searchITunes, getITunesTrending, getByLanguage,
  LANGUAGE_LIST, type Track,
} from '@/lib/music-api';
import {
  TrackRow, TrackCard, SectionHeader, LanguagePill,
  TrackSkeleton, CardSkeleton,
} from '@/components/Cards';
import { PLAYLISTS, ARTISTS, GENRES } from '@/lib/data';
import { PlaylistCard, ArtistCard, GenreCard } from '@/components/Cards';
import { usePlayerStore } from '@/lib/store';

const MOODS = [
  { label: '😄 Happy', query: 'happy upbeat pop' },
  { label: '💕 Romantic', query: 'romantic love songs' },
  { label: '🔥 Party', query: 'party dance hits' },
  { label: '🧘 Chill', query: 'lo-fi chill beats' },
  { label: '💪 Workout', query: 'workout gym motivation' },
  { label: '📚 Focus', query: 'focus study concentration' },
];

/* ── Quick Play Card ────────────────────────────────────────── */
function QuickPlayCard({ track, queue }: { track: Track; queue: Track[] }) {
  const { currentTrack, isPlaying, play, togglePlay } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;
  return (
    <div
      className={`flex items-center gap-3 bg-surface-800/50 hover:bg-surface-700/60 rounded-xl px-3 py-2.5 cursor-pointer transition-all group ${isCurrent ? 'ring-1 ring-neon-pink/40' : ''}`}
      onClick={() => (isCurrent ? togglePlay() : play(track, queue))}
    >
      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-700">
        {track.artwork && <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{track.title}</p>
        <p className="text-[10px] text-surface-500 truncate">{track.artist}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-[2px] h-4 pr-1">
            <div className="w-[2px] bg-neon-pink rounded-full animate-equalizer-1" />
            <div className="w-[2px] bg-neon-pink rounded-full animate-equalizer-2" />
            <div className="w-[2px] bg-neon-pink rounded-full animate-equalizer-3" />
          </div>
        ) : (
          <Play size={14} fill="currentColor" className="text-white" />
        )}
      </div>
    </div>
  );
}

/* ── Home Page ──────────────────────────────────────────────── */
export default function HomePage() {
  const [trending, setTrending] = useState<Track[]>([]);
  const [featured, setFeatured] = useState<Track[]>([]);
  const [langSongs, setLangSongs] = useState<Track[]>([]);
  const [moodSongs, setMoodSongs] = useState<Track[]>([]);
  const [activeLang, setActiveLang] = useState('Hindi');
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingLang, setLoadingLang] = useState(true);
  const [loadingMood, setLoadingMood] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // ── Trending + Featured ──
  useEffect(() => {
    let cancelled = false;
    setLoadingTrending(true);
    getITunesTrending(20)
      .then((res) => { if (!cancelled) setTrending(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingTrending(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingFeatured(true);
    searchITunes('top global 2025', 8)
      .then((res) => { if (!cancelled) setFeatured(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingFeatured(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Language songs ──
  useEffect(() => {
    let cancelled = false;
    setLoadingLang(true);
    setLangSongs([]);
    getByLanguage(activeLang, 18)
      .then((res) => { if (!cancelled) setLangSongs(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingLang(false); });
    return () => { cancelled = true; };
  }, [activeLang]);

  // ── Mood songs ──
  useEffect(() => {
    let cancelled = false;
    setLoadingMood(true);
    searchITunes(activeMood.query, 12)
      .then((res) => { if (!cancelled) setMoodSongs(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingMood(false); });
    return () => { cancelled = true; };
  }, [activeMood]);

  const featuredTrack = trending[0] || featured[0];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-10">
      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">{greeting} 👋</h1>
          <p className="text-sm text-surface-400 mt-0.5">What do you want to listen to today?</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-800/40 border border-white/[0.06] px-3 py-1.5 rounded-full">
            <Globe2 size={12} className="text-neon-cyan" />
            <span className="text-xs text-surface-400">Streaming</span>
            <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Quick play grid ── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loadingTrending
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface-800/50 rounded-xl animate-pulse" />
              ))
            : trending.slice(0, 6).map((t) => (
                <QuickPlayCard key={t.id} track={t} queue={trending} />
              ))}
        </div>
      </section>

      {/* ── Featured banner ── */}
      {featuredTrack && (
        <section>
          <div className="relative rounded-2xl overflow-hidden bg-surface-900 min-h-[200px]">
            {featuredTrack.artwork && (
              <div
                className="absolute inset-0 opacity-[0.2] bg-cover bg-center blur-xl scale-105"
                style={{ backgroundImage: `url(${featuredTrack.artwork})` }}
              />
            )}
            <div className="relative flex items-center gap-6 p-6">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl shadow-black/50">
                {featuredTrack.artwork ? (
                  <img src={featuredTrack.artwork} alt={featuredTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface-800 flex items-center justify-center text-4xl">🎵</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded-full">Featured</span>
                  <Sparkles size={12} className="text-neon-yellow" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold font-display truncate">{featuredTrack.title}</h3>
                <p className="text-surface-400 text-sm truncate mt-0.5">{featuredTrack.artist}</p>
                {featuredTrack.album && (
                  <p className="text-surface-600 text-xs mt-1 truncate">{featuredTrack.album}</p>
                )}
                <button
                  onClick={() => usePlayerStore.getState().play(featuredTrack, trending)}
                  className="mt-4 flex items-center gap-2 bg-gradient-to-r from-neon-pink to-neon-purple text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-neon-pink/20"
                >
                  <Play size={16} fill="white" />
                  Play Now
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Music by Language ── */}
      <section>
        <SectionHeader title="Music by Language" subtitle="Songs in every language — powered by Apple Music" />
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {LANGUAGE_LIST.map((lang) => (
            <LanguagePill key={lang} language={lang} active={activeLang === lang} onClick={() => setActiveLang(lang)} />
          ))}
        </div>
        {loadingLang ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : langSongs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-surface-500 text-sm">No songs found for {activeLang}. Try another language.</p>
            <button
              onClick={() => { setLangSongs([]); setLoadingLang(true); setActiveLang(activeLang === 'Hindi' ? 'English' : 'Hindi'); }}
              className="mt-3 px-4 py-2 text-xs font-semibold rounded-full bg-surface-800 text-surface-300 hover:bg-surface-700 transition-colors"
            >
              Try another language
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {langSongs.map((t) => <TrackCard key={t.id} track={t} queue={langSongs} />)}
          </div>
        )}
      </section>

      {/* ── Trending now ── */}
      <section>
        <SectionHeader title="🔥 Trending Now" subtitle="Live trending from Apple Music" action="See all" />
        {loadingTrending ? (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => <TrackSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <div className="hidden md:flex items-center gap-3 px-3 py-2 text-[11px] text-surface-500 uppercase tracking-widest font-semibold border-b border-white/[0.04] mb-1">
              <div className="w-8 text-center">#</div>
              <div className="w-10" />
              <div className="flex-1">Title</div>
              <div className="hidden lg:block w-40">Album</div>
              <div className="w-10" />
            </div>
            <div className="space-y-1">
              {trending.map((t, i) => <TrackRow key={t.id} track={t} index={i} queue={trending} />)}
            </div>
          </>
        )}
      </section>

      {/* ── New Releases ── */}
      <section>
        <SectionHeader title="✨ New Releases" subtitle="Fresh from Apple Music" action="See all" />
        {loadingFeatured ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured.map((t) => <TrackCard key={t.id} track={t} queue={featured} />)}
          </div>
        )}
      </section>

      {/* ── Mood mixes ── */}
      <section>
        <SectionHeader title="🎭 Mood Mixes" subtitle="Pick your vibe and start listening" />
        <div className="flex gap-2 flex-wrap mb-5">
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => setActiveMood(m)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeMood.label === m.label
                  ? 'bg-gradient-to-r from-neon-cyan to-neon-blue text-white shadow-lg'
                  : 'bg-surface-800/60 text-surface-300 hover:bg-surface-700/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {loadingMood ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <TrackSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-1">
            {moodSongs.map((t, i) => <TrackRow key={t.id} track={t} index={i} queue={moodSongs} />)}
          </div>
        )}
      </section>

      {/* ── Artists ── */}
      <section>
        <SectionHeader title="Popular Artists" subtitle="Featured artists on Auralux X" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {ARTISTS.slice(0, 8).map((a) => <ArtistCard key={a.id} artist={a} />)}
        </div>
      </section>

      {/* ── Playlists ── */}
      <section>
        <SectionHeader title="Featured Playlists" action="See all" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {PLAYLISTS.slice(0, 6).map((p) => <PlaylistCard key={p.id} playlist={p} />)}
        </div>
      </section>

      {/* ── Genres ── */}
      <section>
        <SectionHeader title="Browse by Genre" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {GENRES.slice(0, 12).map((g) => <GenreCard key={g.id} genre={g} />)}
        </div>
      </section>

      {/* ── Stats banner ── */}
      <section className="bg-gradient-to-r from-neon-pink/10 via-neon-purple/10 to-neon-blue/10 border border-white/[0.06] rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={18} className="text-neon-yellow" />
          <span className="font-bold font-display text-gradient-pink">Auralux X — Music Streaming</span>
        </div>
        <p className="text-sm text-surface-400">Streaming from Apple Music · JioSaavn</p>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-surface-500">
          <span>🎵 100M+ songs</span>
          <span>🌍 17+ languages</span>
          <span>🎧 High quality audio</span>
          <span>⚡ Zero ads</span>
        </div>
      </section>
    </div>
  );
}
