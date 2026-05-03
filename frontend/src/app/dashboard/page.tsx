'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNavStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import Player from '@/components/Player';
import TopBar from '@/components/TopBar';
import HomePage from '@/components/HomePage';
import SearchPage from '@/components/SearchPage';
import LibraryPage from '@/components/LibraryPage';
import BrowsePage from '@/components/BrowsePage';
import TrendingPage from '@/components/TrendingPage';

export default function DashboardPage() {
  const { activeTab } = useNavStore();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated (after auth check completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while auth state is being resolved
  if (isLoading) {
    return (
      <div className="flex h-screen bg-surface-950 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neon-pink/30 border-t-neon-pink rounded-full animate-spin" />
          <p className="text-sm text-surface-400">Loading Auralux X…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return <SearchPage />;
      case 'library':
        return <LibraryPage />;
      case 'browse':
        return <BrowsePage />;
      case 'trending':
        return <TrendingPage />;
      case 'liked':
        return <LibraryPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex h-screen bg-surface-950 text-surface-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar showSearch={activeTab !== 'search'} />
        {renderContent()}
        <Player />
      </div>
    </div>
  );
}
