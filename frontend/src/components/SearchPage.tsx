'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, X, Loader2, Music2, Zap, Flame, Sparkles, TrendingUp } from 'lucide-react';
import { searchAll, LANGUAGE_LIST, type Track } from '@/lib/music-api';
import { TrackRow, TrackCard, GenreCard, SectionHeader, LanguagePill, TrackSkeleton } from '@/components/Cards';
import { GENRES } from '@/lib/data';
import { usePlayerStore } from '@/lib/store';

const TRENDING_SEARCHES = [
  'Arijit Singh', 'Coldplay', 'BTS', 'Taylor Swift', 'AR Rahman',
  'The Weeknd', 'Dua Lipa', 'Shreya Ghoshal', 'Bad Bunny', 'Kendrick Lamar',
];

const RECENT_SEARCHES_KEY = 'auralux_recent_searches';

function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
}

function addRecent(q: string) {
  if (typeof window === 'undefined') return;
  const prev = getRecent().filter(s => s !== q);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...prev].slice(0, 8)));
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ saavn: Track[]; itunes: Track[]; deezer: Track[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => getRecent());
  const [activeSource, setActiveSource] = useState<'all' | 'saavn' | 'itunes' | 'deezer'>('all');
  const { play } = usePlayerStore();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    setResults(null);
    try {
      const res = await searchAll(q.trim());
      setResults(res);
      addRecent(q.trim());
      setRecent(getRecent());
    } catch {
      setResults({ saavn: [], itunes: [], deezer: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when query changes
  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(() => {
        doSearch(query);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults(null);
    }
  }, [query, doSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch(query);
  };

  const allTracks = results
    ? [
        ...results.saavn,
        ...results.itunes,
        ...results.deezer,
      ]
    : [];

  const filteredTracks =
    activeSource === 'all'
      ? allTracks
      : activeSource === 'saavn'
      ? results?.saavn || []
      : activeSource === 'itunes'
      ? results?.itunes || []
      : results?.deezer || [];

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* ── Search bar header ── */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-surface-950 via-surface-950/95 to-transparent backdrop-blur-lg px-6 py-6 border-b border-white/[0.04] shadow-xl">
        <div className="max-w-4xl">
          <div className="relative group">
            <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-pink group-focus-within:scale-110 transition-transform duration-300" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="🔍 Search songs, artists, albums, playlists..."
              className="w-full bg-gradient-to-r from-surface-800/80 to-surface-700/60 border-2 border-white/[0.08] rounded-2xl pl-14 pr-12 py-4 text-lg text-white placeholder-surface-400 focus:outline-none focus:border-neon-pink/50 focus:from-surface-800 focus:to-surface-700 focus:shadow-2xl focus:shadow-neon-pink/30 transition-all duration-300 hover:border-neon-pink/20 hover:from-surface-800 hover:to-surface-700/80 backdrop-blur-sm group-focus-within:ring-2 group-focus-within:ring-neon-pink/20 font-semibold"
              autoFocus
            />
            {loading && (
              <Loader2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-neon-pink animate-spin" />
            )}
            {query && !loading && (
              <button
                onClick={() => { setQuery(''); setResults(null); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors hover:bg-surface-700/50 p-1 rounded-full"
                aria-label="Clear search"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Source tabs */}
          {results && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide pb-2">
              {(['all', 'saavn', 'itunes', 'deezer'] as const).map(src => (
                <button
                  key={src}
                  onClick={() => setActiveSource(src)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                    activeSource === src
                      ? 'bg-gradient-to-r from-neon-pink/80 to-neon-purple/80 text-white shadow-lg shadow-neon-pink/40 scale-105'
                      : 'bg-surface-800/60 text-surface-300 hover:text-white hover:bg-surface-700/80'
                  }`}
                >
                  {src === 'all' ? `All (${allTracks.length})` :
                   src === 'saavn' ? `Auralux X HQ (${results.saavn.length})` :
                   src === 'itunes' ? `iTunes (${results.itunes.length})` :
                   `Deezer (${results.deezer.length})`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-8 space-y-10 max-w-7xl mx-auto">
        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            <div className="h-3 bg-surface-800/40 rounded-lg w-32 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square bg-surface-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            {filteredTracks.length > 0 ? (
              <>
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-full bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30">
                      <TrendingUp size={16} className="text-neon-pink" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-black text-white">
                        Results for <span className="text-transparent bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text">"{query}"</span>
                      </h1>
                      <p className="text-surface-400 text-sm mt-1">
                        Found {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''} across all sources
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top card picks */}
                {filteredTracks.slice(0, 6).length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Sparkles size={20} className="text-neon-pink" />
                      Top Picks
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredTracks.slice(0, 6).map(t => (
                        <TrackCard key={t.id} track={t} queue={filteredTracks} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Full list */}
                {filteredTracks.length > 6 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Zap size={20} className="text-neon-cyan" />
                      All Tracks ({filteredTracks.length})
                    </h2>
                    <div className="space-y-1 bg-surface-900/40 rounded-2xl p-4 border border-white/[0.05]">
                      {filteredTracks.map((t, i) => (
                        <TrackRow key={t.id} track={t} index={i} queue={filteredTracks} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl" />
                  <Music2 size={64} className="text-surface-700 relative" />
                </div>
                <p className="text-surface-300 font-bold text-2xl mb-2">No results for "<span className="text-neon-pink">{query}</span>"</p>
                <p className="text-surface-600 text-sm max-w-md">Try different keywords, check spelling, or explore trending searches below</p>
              </div>
            )}
          </>
        )}

        {/* Pre-search state */}
        {!results && !loading && (
          <>
            {/* Recent searches */}
            {recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold font-display flex items-center gap-2">
                    <Sparkles size={20} className="text-neon-purple" />
                    Recent Searches
                  </h2>
                  <button
                    onClick={() => { localStorage.removeItem(RECENT_SEARCHES_KEY); setRecent([]); }}
                    className="text-xs text-surface-500 hover:text-white transition-colors hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-8">
                  {recent.map(r => (
                    <button
                      key={r}
                      onClick={() => { setQuery(r); doSearch(r); }}
                      className="group flex items-center gap-2 bg-gradient-to-r from-surface-800/80 to-surface-700/60 hover:from-neon-pink/10 hover:to-neon-purple/10 border border-white/[0.08] hover:border-neon-pink/30 px-4 py-2 rounded-2xl text-sm text-surface-300 hover:text-white transition-all duration-200"
                    >
                      <Search size={14} className="text-surface-500 group-hover:text-neon-pink transition-colors" />
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending searches */}
            <div>
              <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                <Flame size={20} className="text-neon-pink" />
                Trending Now
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-10">
                {TRENDING_SEARCHES.map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); doSearch(s); }}
                    className="group relative bg-gradient-to-br from-neon-pink/15 via-neon-purple/10 to-surface-900/50 hover:from-neon-pink/30 hover:via-neon-purple/20 to-surface-800/50 border border-white/[0.08] hover:border-neon-pink/40 px-4 py-3 rounded-2xl text-sm text-surface-200 hover:text-white transition-all duration-200 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/0 via-neon-pink/0 to-neon-pink/0 group-hover:from-neon-pink/5 group-hover:to-neon-pink/10 transition-all duration-200" />
                    <span className="relative flex items-center gap-2">
                      <span className="text-neon-pink font-bold">🔥</span>
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Browse languages */}
            <div>
              <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                <Music2 size={20} className="text-neon-cyan" />
                Search by Language
              </h2>
              <div className="flex flex-wrap gap-2 mb-10">
                {LANGUAGE_LIST.map(lang => (
                  <LanguagePill
                    key={lang}
                    language={lang}
                    active={false}
                    onClick={() => { setQuery(`${lang} hits 2025`); doSearch(`${lang} hits 2025`); }}
                  />
                ))}
              </div>
            </div>

            {/* Browse genres */}
            <div>
              <SectionHeader title="Browse Genres" subtitle="Explore music by category" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {GENRES.map(g => (
                  <div key={g.id} onClick={() => { setQuery(g.name); doSearch(g.name); }} className="cursor-pointer">
                    <GenreCard genre={g} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
