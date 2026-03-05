'use client';

import { Heart, Play, Pause, MoreHorizontal, Clock, Loader2, Music2 } from 'lucide-react';
import { usePlayerStore } from '@/lib/store';
import type { Track } from '@/lib/music-api';
import type { Artist as ArtistType, Playlist as PlaylistType, Album as AlbumType } from '@/lib/data';

function fmtTime(s: number) {
  if (!s || isNaN(s)) return '--:--';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function SourceDot({ source }: { source?: string }) {
  const cols: Record<string, string> = { itunes: 'bg-pink-400', jiosaavn: 'bg-blue-400', deezer: 'bg-cyan-400' };
  if (!source || !cols[source]) return null;
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cols[source]} opacity-60 flex-shrink-0`} />;
}

/* ─── Track Row (list view) ──────────────────────────────────────────────── */
export function TrackRow({
  track,
  index,
  queue,
  compact = false,
}: {
  track: Track;
  index: number;
  queue: Track[];
  compact?: boolean;
}) {
  const { currentTrack, isPlaying, isLoading, liked, play, togglePlay, toggleLike } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;
  const isLikedTrack = liked.has(track.id);

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
        isCurrent ? 'bg-white/[0.06] shadow-lg shadow-neon-pink/5' : 'hover:bg-white/[0.04]'
      }`}
      onClick={() => (isCurrent ? togglePlay() : play(track, queue))}
    >
      {/* Number / Equalizer / Loading */}
      <div className="w-8 text-center flex-shrink-0">
        {isCurrent && isLoading ? (
          <Loader2 size={14} className="animate-spin text-neon-pink mx-auto" />
        ) : isCurrent && isPlaying ? (
          <div className="flex items-end justify-center gap-[2px] h-4">
            <div className="w-[3px] bg-neon-pink rounded-full animate-equalizer-1" />
            <div className="w-[3px] bg-neon-pink rounded-full animate-equalizer-2" />
            <div className="w-[3px] bg-neon-pink rounded-full animate-equalizer-3" />
          </div>
        ) : (
          <>
            <span className="text-sm text-surface-500 group-hover:hidden block">{index + 1}</span>
            <Play size={14} className="hidden group-hover:block text-white mx-auto" fill="currentColor" />
          </>
        )}
      </div>

      {/* Artwork */}
      {!compact && (
        <div className="w-10 h-10 rounded-lg bg-surface-800 flex-shrink-0 overflow-hidden">
          {track.artwork ? (
            <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 size={16} className="text-surface-600" />
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium truncate transition-colors ${isCurrent ? 'text-neon-pink' : 'text-surface-100 group-hover:text-white'}`}>
            {track.title}
          </span>
          <SourceDot source={track.source} />
        </div>
        <div className="text-xs text-surface-500 truncate">{track.artist}</div>
      </div>

      {/* Album (desktop) */}
      {!compact && (
        <div className="hidden lg:block w-40 text-xs text-surface-500 truncate">{track.album}</div>
      )}

      {/* Language tag */}
      {track.language && track.language !== 'Unknown' && (
        <span className="hidden md:block text-[10px] text-surface-600 bg-surface-800/60 px-2 py-0.5 rounded-full">
          {track.language}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
          className={`p-1 rounded-lg transition-all ${isLikedTrack ? 'text-neon-pink opacity-100' : 'text-surface-600 opacity-0 group-hover:opacity-100 hover:text-surface-300'}`}
        >
          <Heart size={14} fill={isLikedTrack ? 'currentColor' : 'none'} />
        </button>
        <span className="text-xs text-surface-500 w-10 text-right font-mono">{fmtTime(track.duration)}</span>
        {track.isFullTrack === false && (
          <span className="text-[9px] text-neon-orange bg-neon-orange/10 px-1 py-0.5 rounded">30s</span>
        )}
        <button onClick={(e) => e.stopPropagation()} className="text-surface-600 opacity-0 group-hover:opacity-100 hover:text-surface-300 p-1 rounded-lg transition-all">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Track Card (grid view) ──────────────────────────────────────────────── */
export function TrackCard({ track, queue }: { track: Track; queue: Track[] }) {
  const { currentTrack, isPlaying, isLoading, play, togglePlay } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;

  return (
    <div
      className="group relative bg-surface-900/60 hover:bg-surface-800/80 rounded-xl p-3.5 transition-all duration-300 hover-lift cursor-pointer"
      onClick={() => (isCurrent ? togglePlay() : play(track, queue))}
    >
      {/* Artwork */}
      <div className="relative aspect-square rounded-lg bg-surface-800 mb-3 overflow-hidden">
        {track.artwork ? (
          <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={32} className="text-surface-600" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); isCurrent ? togglePlay() : play(track, queue); }}
            className="w-12 h-12 rounded-full bg-neon-pink flex items-center justify-center shadow-xl shadow-neon-pink/30 hover:scale-110 transition-transform translate-y-2 group-hover:translate-y-0"
          >
            {isCurrent && isLoading ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : isCurrent && isPlaying ? (
              <Pause size={20} fill="white" className="text-white" />
            ) : (
              <Play size={20} fill="white" className="text-white ml-0.5" />
            )}
          </button>
        </div>
        {/* Equalizer indicator */}
        {isCurrent && isPlaying && (
          <div className="absolute bottom-2 right-2 flex items-end gap-[2px] h-3">
            <div className="w-[2px] bg-neon-pink rounded-full animate-equalizer-1" />
            <div className="w-[2px] bg-neon-pink rounded-full animate-equalizer-2" />
            <div className="w-[2px] bg-neon-pink rounded-full animate-equalizer-3" />
          </div>
        )}
        {/* Source badge */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <SourceDot source={track.source} />
        </div>
        {/* Full / Preview badge */}
        <div className="absolute top-2 right-2">
          {track.isFullTrack ? (
            <span className="text-[9px] font-bold bg-neon-cyan/20 text-neon-cyan px-1.5 py-0.5 rounded-full backdrop-blur-sm">FULL</span>
          ) : (
            <span className="text-[9px] font-bold bg-neon-orange/20 text-neon-orange px-1.5 py-0.5 rounded-full backdrop-blur-sm">30s</span>
          )}
        </div>
      </div>
      <div className={`text-sm font-semibold truncate ${isCurrent ? 'text-neon-pink' : 'text-surface-100'}`}>{track.title}</div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-xs text-surface-500 truncate">{track.artist}</span>
        <span className="text-[10px] text-surface-600">· {fmtTime(track.duration)}</span>
      </div>
    </div>
  );
}

/* backward compat aliases for pages that might use old names */
export { TrackRow as SongRow, TrackCard as SongCard };

/* ─── Artist Card ─────────────────────────────────── */
export function ArtistCard({ artist }: { artist: ArtistType }) {
  return (
    <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-neon-pink/20 via-neon-purple/30 to-neon-blue/20 flex items-center justify-center text-5xl mb-3 shadow-xl group-hover:shadow-neon-purple/20 transition-all group-hover:scale-105">
        {artist.avatar}
      </div>
      <div className="text-sm font-semibold text-center flex items-center gap-1">
        {artist.name}
        {artist.verified && (
          <svg className="w-3.5 h-3.5 text-neon-blue" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="text-[10px] text-surface-500 mt-0.5">{artist.followers} followers</div>
    </div>
  );
}

/* ─── Playlist Card ────────────────────────────────── */
export function PlaylistCard({ playlist }: { playlist: PlaylistType }) {
  return (
    <div className="group relative bg-surface-900/60 hover:bg-surface-800/80 rounded-xl p-3.5 transition-all duration-300 hover-lift cursor-pointer">
      <div className={`aspect-square rounded-lg bg-gradient-to-br ${playlist.gradient} flex items-center justify-center text-4xl mb-3 shadow-lg`}>
        {playlist.cover}
      </div>
      <div className="absolute top-1/2 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <button className="w-11 h-11 rounded-full bg-neon-pink flex items-center justify-center shadow-xl shadow-neon-pink/30 hover:scale-110 transition-transform">
          <Play size={18} fill="white" className="text-white ml-0.5" />
        </button>
      </div>
      <div className="text-sm font-semibold text-surface-100 truncate">{playlist.name}</div>
      <div className="text-xs text-surface-500 truncate mt-0.5">{playlist.description}</div>
    </div>
  );
}

/* ─── Album Card ──────────────────────────────────── */
export function AlbumCard({ album }: { album: AlbumType }) {
  return (
    <div className="group relative bg-surface-900/60 hover:bg-surface-800/80 rounded-xl p-3.5 transition-all duration-300 hover-lift cursor-pointer">
      <div className={`aspect-square rounded-lg bg-gradient-to-br ${album.color} flex items-center justify-center text-4xl mb-3 shadow-lg`}>
        {album.cover}
      </div>
      <div className="absolute top-1/2 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <button className="w-11 h-11 rounded-full bg-neon-pink flex items-center justify-center shadow-xl shadow-neon-pink/30 hover:scale-110 transition-transform">
          <Play size={18} fill="white" className="text-white ml-0.5" />
        </button>
      </div>
      <div className="text-sm font-semibold text-surface-100 truncate">{album.title}</div>
      <div className="text-xs text-surface-500 truncate mt-0.5">{album.artist} · {album.year}</div>
    </div>
  );
}

/* ─── Genre Card ────────────────────────────────────  */
export function GenreCard({ genre }: { genre: { id: string; name: string; color: string; icon: string } }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${genre.color} p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl min-h-[100px]`}>
      <div className="text-3xl absolute -bottom-1 -right-1 opacity-30 group-hover:opacity-50 transition-opacity text-6xl">{genre.icon}</div>
      <div className="relative">
        <div className="text-base font-bold">{genre.name}</div>
      </div>
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────  */
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-xl font-bold font-display">{title}</h2>
        {subtitle && <p className="text-sm text-surface-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <button className="text-xs font-semibold text-surface-400 hover:text-white transition-colors uppercase tracking-wider">{action}</button>
      )}
    </div>
  );
}

/* ─── Language Pill ────────────────────────────────────  */
export function LanguagePill({ language, active, onClick }: { language: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/20'
          : 'bg-surface-800/60 text-surface-300 hover:bg-surface-700/60 hover:text-white'
      }`}
    >
      {language}
    </button>
  );
}

/* ─── Stats Badge ──────────────────────────────────────  */
export function StatsBadge({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-3 py-2">
      <Icon size={14} className="text-neon-cyan" />
      <div>
        <div className="text-xs font-bold">{value}</div>
        <div className="text-[10px] text-surface-500">{label}</div>
      </div>
    </div>
  );
}

/* ─── Loading Skeleton ─────────────────────────────────  */
export function TrackSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
      <div className="w-8 h-4 bg-surface-800 rounded" />
      <div className="w-10 h-10 bg-surface-800 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-surface-800 rounded w-3/4" />
        <div className="h-2 bg-surface-800/60 rounded w-1/2" />
      </div>
      <div className="w-10 h-3 bg-surface-800 rounded" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface-900/60 rounded-xl p-3.5 animate-pulse">
      <div className="aspect-square bg-surface-800 rounded-lg mb-3" />
      <div className="h-3 bg-surface-800 rounded w-3/4 mb-2" />
      <div className="h-2 bg-surface-800/60 rounded w-1/2" />
    </div>
  );
}
