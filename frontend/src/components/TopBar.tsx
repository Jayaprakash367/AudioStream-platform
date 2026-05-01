'use client';

import { Search, Bell, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavStore } from '@/lib/store';

interface TopBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export default function TopBar({ searchValue = '', onSearchChange, showSearch = true }: TopBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const { setActiveTab } = useNavStore();

  const handleChange = (val: string) => {
    setLocalSearch(val);
    onSearchChange?.(val);

    // Auto-navigate to search page when user types
    if (val.trim() && val.length > 0) {
      setActiveTab('search');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && localSearch.trim()) {
      setActiveTab('search');
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-surface-900/80 to-surface-950/60 backdrop-blur-xl border-b border-white/[0.06] flex-shrink-0 sticky top-0 z-10 shadow-sm">
      {/* Navigation arrows */}
      <div className="flex items-center gap-3 mr-6">
        <button className="w-9 h-9 rounded-full bg-gradient-to-r from-white/10 to-white/5 hover:from-neon-pink/20 hover:to-neon-purple/20 flex items-center justify-center text-surface-400 hover:text-neon-pink transition-all duration-300 border border-white/10 hover:border-neon-pink/30 group">
          <ChevronLeft size={18} className="group-hover:scale-110 transition-transform" />
        </button>
        <button className="w-9 h-9 rounded-full bg-gradient-to-r from-white/10 to-white/5 hover:from-neon-pink/20 hover:to-neon-purple/20 flex items-center justify-center text-surface-400 hover:text-neon-pink transition-all duration-300 border border-white/10 hover:border-neon-pink/30 group">
          <ChevronRight size={18} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="relative flex-1 max-w-2xl group">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 group-focus-within:text-neon-pink transition-colors duration-300" />
          <input
            value={localSearch}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search songs, artists, albums..."
            className="w-full bg-gradient-to-r from-surface-800/60 to-surface-800/30 border-2 border-white/[0.08] rounded-full pl-12 pr-5 py-2.5 text-sm text-surface-200 placeholder-surface-400 focus:outline-none focus:border-neon-pink/40 focus:from-surface-800/80 focus:to-surface-800/50 focus:shadow-lg focus:shadow-neon-pink/20 transition-all duration-300 hover:border-white/[0.12] hover:from-surface-800/70 hover:to-surface-800/40 backdrop-blur-sm group-focus-within:ring-2 group-focus-within:ring-neon-pink/10"
          />
          {localSearch && (
            <Sparkles size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neon-pink animate-pulse" />
          )}
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-4 ml-6">
        <button className="relative text-surface-400 hover:text-neon-cyan p-2.5 rounded-full hover:bg-neon-cyan/10 transition-all duration-300 border border-transparent hover:border-neon-cyan/30 group">
          <Bell size={20} className="group-hover:scale-110 transition-transform" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-neon-pink to-neon-purple rounded-full animate-pulse shadow-lg shadow-neon-pink/50" />
        </button>
        <button className="flex items-center gap-3 bg-gradient-to-r from-surface-800/50 to-surface-900/50 hover:from-surface-700/50 hover:to-surface-800/50 rounded-full pl-1.5 pr-4 py-1.5 transition-all duration-300 border border-white/[0.08] hover:border-neon-pink/30 hover:shadow-lg hover:shadow-neon-pink/10 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-pink via-neon-purple to-neon-blue flex items-center justify-center text-[11px] font-bold shadow-lg shadow-neon-pink/30 group-hover:scale-110 transition-transform">
            JK
          </div>
          <span className="text-sm font-semibold text-surface-200 group-hover:text-white transition-colors">
            Jayaprakash
          </span>
        </button>
      </div>
    </header>
  );
}
