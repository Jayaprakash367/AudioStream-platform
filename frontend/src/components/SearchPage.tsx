'use client';

import { useState, useCallback } from 'react';
import { Search, X, Loader2, Music2 } from 'lucide-react';
import { searchAll, LANGUAGE_LIST, type Track } from '@/lib/music-api';
import { TrackRow, TrackCard, GenreCard, SectionHeader, LanguagePill, TrackSkeleton, CardSkeleton } from '@/components/Cards';
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch(query);
  };

  const allTracks = results
    ? [...results.saavn, ...results.itunes, ...results.deezer]
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
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-8">
      {/* ── Search bar ── */}
      <div className="sticky top-0 z-20 bg-surface-950/90 backdrop-blur-xl -mx-6 px-6 py-4 border-b border-white/[0.04]">
        <div className="relative max-w-2xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search songs, artists, albums, languages…"
            className="w-full bg-surface-800/60 border border-white/[0.06] rounded-2xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/10 transition-all"
            autoFocus
          />
          {loading && (
            <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neon-pink animate-spin" />
          )}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Source tabs */}
        {results && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto">
            {(['all', 'saavn', 'itunes', 'deezer'] as const).map(src => (
              <button
                key={src}
                onClick={() => setActiveSource(src)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSource === src
                    ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                    : 'bg-surface-800/60 text-surface-400 hover:text-white'
                }`}
              >
                {src === 'all' ? `All (${allTracks.length})` :
                 src === 'saavn' ? `JioSaavn (${results.saavn.length})` :
                 src === 'itunes' ? `Apple Music (${results.itunes.length})` :
                 `Deezer (${results.deezer.length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading skeletons ── */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <TrackSkeleton key={i} />)}
        </div>
      )}

      {/* ── Results ── */}
      {results && !loading && (
        <>
          {filteredTracks.length > 0 ? (
            <div>
              <SectionHeader
                title={`Results for "${query}"`}
                subtitle={`${filteredTracks.length} tracks found`}
              />
              {/* Top card picks */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                {filteredTracks.slice(0, 6).map(t => (
                  <TrackCard key={t.id} track={t} queue={filteredTracks} />
                ))}
              </div>
              {/* Full list */}
              <SectionHeader title="All Tracks" />
              <div className="space-y-1">
                {filteredTracks.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i} queue={filteredTracks} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Music2 size={48} className="text-surface-700 mb-4" />
              <p className="text-surface-300 font-semibold mb-1">No results for "{query}"</p>
              <p className="text-surface-600 text-sm">Try different keywords or check spelling</p>
            </div>
          )}
        </>
      )}

      {/* ── Pre-search state ── */}
      {!results && !loading && (
        <>
          {/* Recent searches */}
          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-display">Recent Searches</h2>
                <button
                  onClick={() => { localStorage.removeItem(RECENT_SEARCHES_KEY); setRecent([]); }}
                  className="text-xs text-surface-500 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map(r => (
                  <button
                    key={r}
                    onClick={() => { setQuery(r); doSearch(r); }}
                    className="flex items-center gap-2 bg-surface-800/60 hover:bg-surface-700/60 border border-white/[0.04] px-3 py-2 rounded-xl text-sm text-surface-300 hover:text-white transition-all"
                  >
                    <Search size={12} className="text-surface-500" />
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending searches */}
          <div>
            <h2 className="text-lg font-bold font-display mb-4">Trending Searches</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {TRENDING_SEARCHES.map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); doSearch(s); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-neon-pink/5 to-neon-purple/5 hover:from-neon-pink/10 hover:to-neon-purple/10 border border-white/[0.06] px-4 py-2 rounded-xl text-sm text-surface-200 hover:text-white transition-all group"
                >
                  <span className="text-neon-pink group-hover:scale-110 transition-transform">🔥</span>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Browse languages */}
          <div>
            <h2 className="text-lg font-bold font-display mb-4">Search by Language</h2>
            <div className="flex flex-wrap gap-2 mb-6">
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
                <div key={g.id} onClick={() => { setQuery(g.name); doSearch(g.name); }}>
                  <GenreCard genre={g} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
