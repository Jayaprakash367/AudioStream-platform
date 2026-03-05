'use client';

import { useNavStore } from '@/lib/store';
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
