'use client';

import { useState } from 'react';
import { Heart, Library, LayoutGrid, List, Search, Music2 } from 'lucide-react';
import { PLAYLISTS, ALBUMS, ARTISTS } from '@/lib/data';
import { PlaylistCard, AlbumCard, ArtistCard, SectionHeader, TrackRow } from '@/components/Cards';
import { usePlayerStore } from '@/lib/store';

type Tab = 'playlists' | 'albums' | 'artists' | 'liked';

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>('playlists');
  const [viewGrid, setViewGrid] = useState(true);
  const [filterQ, setFilterQ] = useState('');

  const { liked: likedIds, queue, currentTrack } = usePlayerStore();

  // liked tracks are all tracks in all queues that are liked
  // We collect all tracks seen in queues + currentTrack
  const allKnownTracks = [
    ...(currentTrack ? [currentTrack] : []),
    ...queue,
  ];
  const uniqueLiked = Array.from(
    new Map(
      allKnownTracks
        .filter(t => likedIds.has(t.id))
        .map(t => [t.id, t])
    ).values()
  );

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'playlists', label: 'Playlists', count: PLAYLISTS.length },
    { key: 'albums', label: 'Albums', count: ALBUMS.length },
    { key: 'artists', label: 'Artists', count: ARTISTS.length },
    { key: 'liked', label: 'Liked Songs', count: likedIds.size },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 flex items-center justify-center">
          <Library size={24} className="text-neon-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Your Library</h1>
          <p className="text-sm text-surface-400">Your music collection</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-900/60 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            {t.key === 'liked' && <Heart size={14} fill={tab === t.key ? 'currentColor' : 'none'} />}
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-surface-800'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            value={filterQ}
            onChange={e => setFilterQ(e.target.value)}
            placeholder="Filter…"
            className="w-full bg-surface-800/60 border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-neon-pink/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-900/60 p-1 rounded-xl">
          <button onClick={() => setViewGrid(true)} className={`p-1.5 rounded-lg transition-all ${viewGrid ? 'bg-white/10 text-white' : 'text-surface-500 hover:text-white'}`} aria-label="Grid view">
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setViewGrid(false)} className={`p-1.5 rounded-lg transition-all ${!viewGrid ? 'bg-white/10 text-white' : 'text-surface-500 hover:text-white'}`} aria-label="List view">
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'playlists' && (
        <section>
          <SectionHeader title="Your Playlists" subtitle={`${PLAYLISTS.length} playlists`} action="Create new" />
          <div className={viewGrid ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 'space-y-2'}>
            {PLAYLISTS.filter(p => !filterQ || p.name.toLowerCase().includes(filterQ.toLowerCase()))
              .map(p => <PlaylistCard key={p.id} playlist={p} />)}
          </div>
        </section>
      )}

      {tab === 'albums' && (
        <section>
          <SectionHeader title="Your Albums" subtitle={`${ALBUMS.length} albums`} />
          <div className={viewGrid ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 'space-y-2'}>
            {ALBUMS.filter(a => !filterQ || a.title.toLowerCase().includes(filterQ.toLowerCase()) || a.artist.toLowerCase().includes(filterQ.toLowerCase()))
              .map(a => <AlbumCard key={a.id} album={a} />)}
          </div>
        </section>
      )}

      {tab === 'artists' && (
        <section>
          <SectionHeader title="Following Artists" subtitle={`${ARTISTS.length} artists`} />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {ARTISTS.filter(a => !filterQ || a.name.toLowerCase().includes(filterQ.toLowerCase()))
              .map(a => <ArtistCard key={a.id} artist={a} />)}
          </div>
        </section>
      )}

      {tab === 'liked' && (
        <section>
          {likedIds.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-neon-pink/10 flex items-center justify-center mb-4">
                <Heart size={36} className="text-neon-pink" />
              </div>
              <h3 className="text-lg font-bold mb-2">Songs you like will appear here</h3>
              <p className="text-sm text-surface-500">Start playing music and hit the heart button to save tracks.</p>
            </div>
          ) : uniqueLiked.length === 0 ? (
            /* Liked songs exist but we lost references (page refresh) */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-neon-pink/10 flex items-center justify-center mb-4">
                <Music2 size={36} className="text-neon-pink" />
              </div>
              <h3 className="text-lg font-bold mb-2">{likedIds.size} liked songs</h3>
              <p className="text-sm text-surface-500">Go play some music to see your liked tracks here.</p>
            </div>
          ) : (
            <>
              {/* Banner */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-neon-pink/20 to-neon-purple/10 p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center shadow-xl shadow-neon-pink/20">
                    <Heart size={36} fill="white" className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 uppercase tracking-widest mb-1">Playlist</p>
                    <h2 className="text-2xl font-bold font-display">Liked Songs</h2>
                    <p className="text-sm text-surface-400 mt-0.5">{uniqueLiked.length} songs</p>
                  </div>
                </div>
                <button
                  onClick={() => usePlayerStore.getState().play(uniqueLiked[0], uniqueLiked)}
                  className="mt-4 flex items-center gap-2 bg-gradient-to-r from-neon-pink to-neon-purple text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
                >
                  Play All
                </button>
              </div>
              <div className="space-y-1">
                {uniqueLiked
                  .filter(t => !filterQ || t.title.toLowerCase().includes(filterQ.toLowerCase()) || t.artist.toLowerCase().includes(filterQ.toLowerCase()))
                  .map((t, i) => <TrackRow key={t.id} track={t} index={i} queue={uniqueLiked} />)}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
