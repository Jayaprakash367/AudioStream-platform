'use client';

import { useState, useEffect } from 'react';
import { Compass } from 'lucide-react';
import { searchITunes, LANGUAGE_LIST, type Track } from '@/lib/music-api';
import { TrackCard, GenreCard, SectionHeader, LanguagePill, CardSkeleton } from '@/components/Cards';
import { GENRES, PLAYLISTS, ARTISTS, MOODS } from '@/lib/data';
import { PlaylistCard, ArtistCard } from '@/components/Cards';

const MOOD_LIST = ['Happy', 'Romantic', 'Party', 'Chill', 'Workout', 'Focus', 'Sad', 'Devotional'];

export default function BrowsePage() {
  const [activeLang, setActiveLang] = useState('All');
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = activeGenre
      ? `${activeGenre} music`
      : activeLang === 'All'
      ? 'trending music 2025'
      : `${activeLang} hits 2025`;

    setLoading(true);
    setTracks([]);

    let cancelled = false;

    // Always try iTunes first — JioSaavn is currently down
    searchITunes(query, 18)
      .then(res => {
        if (!cancelled) setTracks(res);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeLang, activeGenre]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 flex items-center justify-center">
          <Compass size={24} className="text-neon-cyan" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Browse Music</h1>
          <p className="text-sm text-surface-400">Explore genres, languages, and moods</p>
        </div>
      </div>

      {/* Language filter */}
      <section>
        <h2 className="text-lg font-bold font-display mb-3">By Language</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <LanguagePill language="All" active={activeLang === 'All' && !activeGenre} onClick={() => { setActiveLang('All'); setActiveGenre(null); }} />
          {LANGUAGE_LIST.map(lang => (
            <LanguagePill key={lang} language={lang} active={activeLang === lang && !activeGenre} onClick={() => { setActiveLang(lang); setActiveGenre(null); }} />
          ))}
        </div>
      </section>

      {/* Genres */}
      <section>
        <SectionHeader title="Browse by Genre" subtitle="Click any genre to explore" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {GENRES.map(g => (
            <div key={g.id} onClick={() => { setActiveGenre(activeGenre === g.name ? null : g.name); setActiveLang('All'); }} className={`rounded-xl transition-all ${activeGenre === g.name ? 'ring-2 ring-neon-pink scale-[1.02]' : ''}`}>
              <GenreCard genre={g} />
            </div>
          ))}
        </div>
      </section>

      {/* Track results */}
      {(activeLang !== 'All' || activeGenre) && (
        <section>
          <SectionHeader
            title={activeGenre ? `${activeGenre} Music` : `${activeLang} Music`}
            subtitle={loading ? 'Loading…' : `${tracks.length} tracks`}
          />
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tracks.map(t => <TrackCard key={t.id} track={t} queue={tracks} />)}
            </div>
          )}
        </section>
      )}

      {/* Moods */}
      <section>
        <SectionHeader title="Vibes & Moods" subtitle="Music for every feeling" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOODS.map(m => (
            <div
              key={m.name}
              onClick={() => { setActiveGenre(m.name); setActiveLang('All'); }}
              className={`group relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] min-h-[90px] bg-gradient-to-br ${m.color}`}
            >
              <div className="text-5xl absolute -bottom-2 -right-2 opacity-20 group-hover:opacity-40 transition-opacity select-none">{m.emoji}</div>
              <div className="relative">
                <div className="text-base font-bold">{m.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Playlists */}
      <section>
        <SectionHeader title="Featured Playlists" action="See all" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {PLAYLISTS.slice(0, 6).map(p => <PlaylistCard key={p.id} playlist={p} />)}
        </div>
      </section>

      {/* Featured Artists */}
      <section>
        <SectionHeader title="Featured Artists" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {ARTISTS.slice(0, 8).map(a => <ArtistCard key={a.id} artist={a} />)}
        </div>
      </section>
    </div>
  );
}
