'use client';

import { Search, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export default function TopBar({ searchValue = '', onSearchChange, showSearch = true }: TopBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleChange = (val: string) => {
    setLocalSearch(val);
    onSearchChange?.(val);
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-surface-950/60 backdrop-blur-xl border-b border-white/[0.03] flex-shrink-0 sticky top-0 z-10">
      {/* Navigation arrows */}
      <div className="flex items-center gap-2 mr-4">
        <button className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-surface-400 hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <button className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-surface-400 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            value={localSearch}
            onChange={e => handleChange(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full bg-surface-800/60 border border-white/[0.06] rounded-full pl-11 pr-5 py-2.5 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-neon-pink/30 focus:bg-surface-800/80 transition-all"
          />
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-3 ml-4">
        <button className="relative text-surface-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-neon-pink rounded-full animate-pulse" />
        </button>
        <button className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-full pl-1 pr-3 py-1 transition-colors group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-[10px] font-bold shadow-md">
            JK
          </div>
          <span className="text-xs font-medium text-surface-200 group-hover:text-white transition-colors">
            Jayaprakash
          </span>
        </button>
      </div>
    </header>
  );
}
