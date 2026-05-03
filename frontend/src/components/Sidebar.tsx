'use client';

import { useState } from 'react';
import {
  Home, Search, Library, TrendingUp, Clock, Plus, Heart, Radio, Mic2,
  Settings, LogOut, ChevronLeft, ChevronRight, Disc3, Music2,
} from 'lucide-react';
import { usePlayerStore, useNavStore } from '@/lib/store';
import { PLAYLISTS } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'library', icon: Library, label: 'Your Library' },
  { id: 'browse', icon: Disc3, label: 'Browse' },
  { id: 'trending', icon: TrendingUp, label: 'Trending' },
  { id: 'liked', icon: Heart, label: 'Liked Songs' },
  { id: 'recent', icon: Clock, label: 'Recently Played' },
  { id: 'radio', icon: Radio, label: 'Radio' },
  { id: 'podcasts', icon: Mic2, label: 'Podcasts' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar } = useNavStore();
  const { liked } = usePlayerStore();
  const { user, logout } = useAuth();
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);

  const myPlaylists = PLAYLISTS.filter(p => p.creator === 'You');
  const featuredPlaylists = PLAYLISTS.filter(p => p.creator !== 'You').slice(0, 5);

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-72' : 'w-20'
      } flex-shrink-0 bg-gradient-to-b from-surface-900/60 to-surface-950/80 flex flex-col transition-all duration-300 relative z-20 border-r border-white/[0.06] backdrop-blur-xl`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-neon-pink via-neon-purple to-neon-blue flex items-center justify-center flex-shrink-0 shadow-lg shadow-neon-pink/30 hover:scale-110 transition-transform">
          <Music2 className="text-white" size={22} />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in">
            <span className="text-lg font-bold font-display">
              Aura<span className="text-transparent bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text">lux</span>
            </span>
            <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-neon-pink font-semibold border border-neon-pink/30">
              X
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto text-surface-500 hover:text-neon-pink transition-all p-2 rounded-lg hover:bg-neon-pink/10 active:scale-95"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="px-3 py-5 space-y-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden ${
              activeTab === id
                ? 'bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-white border border-neon-pink/30 shadow-lg shadow-neon-pink/10'
                : 'text-surface-400 hover:text-white hover:bg-white/[0.05] hover:border border-transparent'
            }`}
          >
            {activeTab === id && (
              <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/5 to-neon-purple/5 blur-md opacity-50" />
            )}
            <Icon
              size={20}
              className={
                activeTab === id
                  ? 'text-neon-pink transition-all group-hover:scale-110'
                  : 'text-surface-500 group-hover:text-surface-300 group-hover:scale-105 transition-transform'
              }
            />
            {sidebarOpen && <span className="relative">{label}</span>}
            {id === 'liked' && sidebarOpen && liked.size > 0 && (
              <span className="ml-auto text-xs bg-gradient-to-r from-neon-pink/30 to-neon-purple/30 text-neon-pink px-2 py-1 rounded-full font-bold border border-neon-pink/20">
                {liked.size}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Playlists */}
      {sidebarOpen && (
        <div className="flex-1 flex flex-col min-h-0 px-3 pt-2 animate-fade-in">
          {/* My Playlists */}
          <div className="mb-2">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-surface-500 uppercase tracking-[0.15em]">
                My Playlists
              </span>
              <button className="text-surface-600 hover:text-neon-cyan transition-colors p-1 rounded-lg hover:bg-white/5" aria-label="Create new playlist">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {myPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onMouseEnter={() => setHoveredPlaylist(pl.id)}
                  onMouseLeave={() => setHoveredPlaylist(null)}
                  onClick={() => setActiveTab('playlist')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${pl.gradient} flex items-center justify-center text-sm flex-shrink-0 shadow-md transition-transform ${
                      hoveredPlaylist === pl.id ? 'scale-105' : ''
                    }`}
                  >
                    {pl.cover}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-semibold text-surface-200 truncate group-hover:text-white transition-colors">
                      {pl.name}
                    </div>
                    <div className="text-[10px] text-surface-500">{pl.songCount} songs</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Featured Playlists */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center px-3 mb-2">
              <span className="text-[10px] font-bold text-surface-500 uppercase tracking-[0.15em]">
                Featured
              </span>
            </div>
            <div className="space-y-0.5">
              {featuredPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onMouseEnter={() => setHoveredPlaylist(pl.id)}
                  onMouseLeave={() => setHoveredPlaylist(null)}
                  onClick={() => setActiveTab('playlist')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${pl.gradient} flex items-center justify-center text-sm flex-shrink-0 shadow-md transition-transform ${
                      hoveredPlaylist === pl.id ? 'scale-105' : ''
                    }`}
                  >
                    {pl.cover}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-semibold text-surface-200 truncate group-hover:text-white transition-colors">
                      {pl.name}
                    </div>
                    <div className="text-[10px] text-surface-500">{pl.songCount} songs</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/[0.04] mt-auto">
        {user ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-lg shadow-neon-pink/20 uppercase">
              {user.displayName
                ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2)
                : user.username?.substring(0, 2) || 'AU'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <div className="text-xs font-semibold truncate">{user.displayName || user.username}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    user.subscription?.toUpperCase() === 'PREMIUM' 
                      ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20' 
                      : 'bg-surface-800 text-surface-400 border border-white/5'
                  }`}>
                    {user.subscription || 'Free'}
                  </span>
                </div>
              </div>
            )}
            {sidebarOpen && (
              <div className="flex gap-1 animate-fade-in">
                <button className="text-surface-600 hover:text-surface-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors" aria-label="Settings">
                  <Settings size={14} />
                </button>
                <button onClick={logout} className="text-surface-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors" aria-label="Log out">
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-surface-800 flex items-center justify-center text-xs font-bold flex-shrink-0 text-surface-500">
              ?
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <div className="text-xs font-semibold text-surface-400 truncate">Not Logged In</div>
              </div>
            )}
            {sidebarOpen && (
              <div className="flex gap-1 animate-fade-in">
                <button onClick={() => window.location.href = '/login'} className="text-neon-pink hover:text-neon-pink/80 p-1.5 rounded-lg hover:bg-white/5 transition-colors" aria-label="Log in">
                  <LogOut size={14} className="rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
