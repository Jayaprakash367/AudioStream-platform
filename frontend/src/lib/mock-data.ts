/**
 * Mock API Data Provider
 * Provides fallback data when backend services are unavailable
 * This ensures UI works and demonstrates all features
 */

export const MOCK_SONGS = [
  {
    id: '1',
    title: 'Midnight Dreams',
    artist: 'Luna Echo',
    album: 'Neon Nights',
    duration: 243,
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    source: 'itunes',
    language: 'English',
    isFullTrack: true,
  },
  {
    id: '2',
    title: 'Electric Soul',
    artist: 'Neon Lights',
    album: 'Future Sounds',
    duration: 287,
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    source: 'itunes',
    language: 'English',
    isFullTrack: true,
  },
  {
    id: '3',
    title: 'Cosmic Vibes',
    artist: 'Space Traveler',
    album: 'Astronomy',
    duration: 256,
    artwork: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
    source: 'itunes',
    language: 'English',
    isFullTrack: true,
  },
  {
    id: '4',
    title: 'Raag Yaman',
    artist: 'Ravi Shankar',
    album: 'Classical Masters',
    duration: 420,
    artwork: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop',
    source: 'jiosaavn',
    language: 'Hindi',
    isFullTrack: true,
  },
  {
    id: '5',
    title: 'Bollywood Dreams',
    artist: 'A.R. Rahman',
    album: 'Dil Se',
    duration: 298,
    artwork: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    source: 'jiosaavn',
    language: 'Hindi',
    isFullTrack: true,
  },
  {
    id: '6',
    title: 'K-pop Sensation',
    artist: 'BTS',
    album: 'Dynamite',
    duration: 203,
    artwork: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
    source: 'itunes',
    language: 'Korean',
    isFullTrack: true,
  },
];

export const MOCK_PLAYLISTS = [
  {
    id: 'p1',
    name: 'Morning Vibes',
    description: 'Start your day right',
    cover: '🌅',
    creator: 'You',
    songCount: 42,
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'p2',
    name: 'Late Night Study',
    description: 'Focus and flow',
    cover: '📚',
    creator: 'You',
    songCount: 67,
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'p3',
    name: 'Workout Energy',
    description: 'Get pumped',
    cover: '💪',
    creator: 'You',
    songCount: 53,
    gradient: 'from-red-500 to-pink-500',
  },
  {
    id: 'p4',
    name: 'Indian Classics',
    description: 'Timeless treasures',
    cover: '🎻',
    creator: 'Spotify',
    songCount: 128,
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'p5',
    name: 'K-Pop Hits',
    description: 'Latest Korean hits',
    cover: '🎤',
    creator: 'Spotify',
    songCount: 95,
    gradient: 'from-pink-500 to-rose-500',
  },
];

export const MOCK_TRENDING = MOCK_SONGS.map((song, idx) => ({
  ...song,
  rank: idx + 1,
  change: idx % 2 === 0 ? 'up' : 'down' as const,
  playCount: 1000000 - idx * 100000,
}));

export const MOCK_USER = {
  id: 'user-1',
  name: 'Jayaprakash K',
  email: 'jayaprakash@auralux.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jayaprakash',
  subscription: 'premium',
  likedSongsCount: 234,
  playlistsCount: 12,
  followersCount: 542,
};

export const MOCK_LANGUAGES = [
  { language: 'English', songCount: 2500000, totalPlays: 50000000 },
  { language: 'Hindi', songCount: 500000, totalPlays: 30000000 },
  { language: 'Tamil', songCount: 200000, totalPlays: 5000000 },
  { language: 'Telugu', songCount: 180000, totalPlays: 4000000 },
  { language: 'Korean', songCount: 150000, totalPlays: 20000000 },
  { language: 'Japanese', songCount: 300000, totalPlays: 15000000 },
  { language: 'Spanish', songCount: 400000, totalPlays: 12000000 },
];

export function getMockTrendingTracks(limit = 20) {
  return Promise.resolve({ data: MOCK_TRENDING.slice(0, limit) });
}

export function getMockFeaturedTracks(limit = 8) {
  return Promise.resolve({ data: MOCK_SONGS.slice(0, limit) });
}

export function getMockTracksByLanguage(language: string, limit = 18) {
  const languageSongs = MOCK_SONGS.filter(s => s.language === language || language === 'All');
  return Promise.resolve({ data: languageSongs.length > 0 ? languageSongs : MOCK_SONGS.slice(0, limit) });
}

export function getMockUserPlaylists() {
  return Promise.resolve({ data: MOCK_PLAYLISTS.filter(p => p.creator === 'You') });
}

export function getMockUserLibrary() {
  return Promise.resolve({ data: MOCK_SONGS });
}

export function getMockLikedSongs() {
  return Promise.resolve({ data: MOCK_SONGS.filter((_, i) => i % 2 === 0) });
}

export function getMockRecentlyPlayed() {
  return Promise.resolve({ data: [...MOCK_SONGS].reverse() });
}

export function getMockLanguages() {
  return Promise.resolve({ data: MOCK_LANGUAGES });
}

export function getMockSearch(query: string) {
  const results = MOCK_SONGS.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.artist.toLowerCase().includes(query.toLowerCase())
  );
  return Promise.resolve({ data: results.length > 0 ? results : MOCK_SONGS });
}
