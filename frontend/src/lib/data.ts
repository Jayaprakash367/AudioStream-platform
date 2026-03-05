/* ─── Music Data Store ────────────────────────────────────── */
/* Comprehensive mock data for all languages and genres */

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSec: number;
  cover: string;
  plays: string;
  language: string;
  genre: string;
  year: number;
  isExplicit?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year: number;
  songs: number;
  color: string;
}

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  followers: string;
  genre: string;
  verified: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: string;
  songCount: number;
  gradient: string;
  creator: string;
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  icon: string;
}

/* ─── Songs: Multi-Language Catalog ──────────────────────── */
export const ALL_SONGS: Song[] = [
  // ── English ──
  { id: 'en-1', title: 'Midnight Mirage', artist: 'Stellar Echo', album: 'Neon Nights', duration: '3:42', durationSec: 222, cover: '🌙', plays: '124.5M', language: 'English', genre: 'Pop', year: 2025 },
  { id: 'en-2', title: 'Electric Heartbeat', artist: 'Nova Pulse', album: 'Voltage', duration: '4:11', durationSec: 251, cover: '⚡', plays: '98.2M', language: 'English', genre: 'Electronic', year: 2025 },
  { id: 'en-3', title: 'Velvet Thunder', artist: 'Crimson Tide', album: 'Storm Chaser', duration: '3:58', durationSec: 238, cover: '🌊', plays: '87.1M', language: 'English', genre: 'Rock', year: 2024 },
  { id: 'en-4', title: 'Golden Frequency', artist: 'Synth Matrix', album: 'Digital Dawn', duration: '5:02', durationSec: 302, cover: '✨', plays: '156.3M', language: 'English', genre: 'Synthwave', year: 2025 },
  { id: 'en-5', title: 'Fading Lights', artist: 'Amber Skye', album: 'Twilight Hours', duration: '3:27', durationSec: 207, cover: '🌅', plays: '73.8M', language: 'English', genre: 'Indie', year: 2024 },
  { id: 'en-6', title: 'Crystal Waves', artist: 'Ocean Drive', album: 'Coastal Vibes', duration: '4:35', durationSec: 275, cover: '💎', plays: '112.9M', language: 'English', genre: 'Chill', year: 2025 },
  { id: 'en-7', title: 'Binary Dreams', artist: 'Pixel Storm', album: 'Code Red', duration: '3:19', durationSec: 199, cover: '🎮', plays: '65.4M', language: 'English', genre: 'EDM', year: 2024 },
  { id: 'en-8', title: 'Solar Winds', artist: 'Cosmos Band', album: 'Infinite Space', duration: '4:58', durationSec: 298, cover: '☀️', plays: '91.7M', language: 'English', genre: 'Alternative', year: 2025 },
  { id: 'en-9', title: 'Neon Paradise', artist: 'Retro Future', album: 'Synthscape', duration: '3:44', durationSec: 224, cover: '🎆', plays: '203.1M', language: 'English', genre: 'Pop', year: 2025 },
  { id: 'en-10', title: 'Dark Matter', artist: 'Void Walker', album: 'Event Horizon', duration: '5:21', durationSec: 321, cover: '🕳️', plays: '45.6M', language: 'English', genre: 'Metal', year: 2024 },
  { id: 'en-11', title: 'Whispers in Rain', artist: 'Misty Collins', album: 'Rainy Days', duration: '3:33', durationSec: 213, cover: '🌧️', plays: '178.4M', language: 'English', genre: 'R&B', year: 2025 },
  { id: 'en-12', title: 'City Lights', artist: 'Metro Beats', album: 'Urban Dreams', duration: '3:15', durationSec: 195, cover: '🏙️', plays: '134.2M', language: 'English', genre: 'Hip-Hop', year: 2025 },

  // ── Hindi ──
  { id: 'hi-1', title: 'Rang De Tu Mohe', artist: 'Arijit Singh', album: 'Ishq Unplugged', duration: '4:22', durationSec: 262, cover: '🎨', plays: '312.7M', language: 'Hindi', genre: 'Bollywood', year: 2025 },
  { id: 'hi-2', title: 'Sapno Ki Galiyan', artist: 'Shreya Ghoshal', album: 'Dilruba', duration: '4:45', durationSec: 285, cover: '🌸', plays: '245.1M', language: 'Hindi', genre: 'Romantic', year: 2025 },
  { id: 'hi-3', title: 'Tu Hi Mera Jahan', artist: 'Jubin Nautiyal', album: 'Dil Se Dil Tak', duration: '3:55', durationSec: 235, cover: '💕', plays: '189.3M', language: 'Hindi', genre: 'Bollywood', year: 2024 },
  { id: 'hi-4', title: 'Dhadkan Re', artist: 'Atif Aslam', album: 'Jazbaat', duration: '4:30', durationSec: 270, cover: '❤️', plays: '276.8M', language: 'Hindi', genre: 'Pop', year: 2025 },
  { id: 'hi-5', title: 'Raat Ki Rani', artist: 'Sunidhi Chauhan', album: 'Chandni Raat', duration: '3:48', durationSec: 228, cover: '🌹', plays: '156.2M', language: 'Hindi', genre: 'Dance', year: 2024 },
  { id: 'hi-6', title: 'Tere Naina', artist: 'Neha Kakkar', album: 'Dil Ki Awaaz', duration: '3:32', durationSec: 212, cover: '👁️', plays: '298.4M', language: 'Hindi', genre: 'Pop', year: 2025 },

  // ── Tamil ──
  { id: 'ta-1', title: 'Kanave Kanave', artist: 'Anirudh', album: 'David OST', duration: '4:15', durationSec: 255, cover: '🎭', plays: '178.5M', language: 'Tamil', genre: 'Kollywood', year: 2025 },
  { id: 'ta-2', title: 'Nenjame Nenjame', artist: 'Sid Sriram', album: 'Kadhalan', duration: '4:33', durationSec: 273, cover: '💫', plays: '145.2M', language: 'Tamil', genre: 'Romantic', year: 2024 },
  { id: 'ta-3', title: 'Vaathi Coming', artist: 'Anirudh', album: 'Master', duration: '3:42', durationSec: 222, cover: '🔥', plays: '456.7M', language: 'Tamil', genre: 'Dance', year: 2024 },
  { id: 'ta-4', title: 'Kaathalae Kaathalae', artist: 'GV Prakash', album: '96 OST', duration: '4:22', durationSec: 262, cover: '🌺', plays: '234.1M', language: 'Tamil', genre: 'Melody', year: 2024 },
  { id: 'ta-5', title: 'Enna Solla', artist: 'AR Rahman', album: 'Thangamagan', duration: '4:50', durationSec: 290, cover: '🎶', plays: '198.3M', language: 'Tamil', genre: 'Melody', year: 2025 },

  // ── Telugu ──
  { id: 'te-1', title: 'Inkem Inkem', artist: 'Sid Sriram', album: 'Geetha Govindam', duration: '4:12', durationSec: 252, cover: '🌻', plays: '567.8M', language: 'Telugu', genre: 'Tollywood', year: 2024 },
  { id: 'te-2', title: 'Buttabomma', artist: 'Armaan Malik', album: 'Ala Vaikunthapurramuloo', duration: '3:58', durationSec: 238, cover: '🦋', plays: '432.1M', language: 'Telugu', genre: 'Dance', year: 2024 },
  { id: 'te-3', title: 'Samajavaragamana', artist: 'Sid Sriram', album: 'Ala Vaikunthapurramuloo', duration: '4:35', durationSec: 275, cover: '🎵', plays: '389.5M', language: 'Telugu', genre: 'Melody', year: 2024 },
  { id: 'te-4', title: 'Naatu Naatu', artist: 'Rahul Sipligunj', album: 'RRR', duration: '3:22', durationSec: 202, cover: '💃', plays: '890.2M', language: 'Telugu', genre: 'Dance', year: 2024 },

  // ── Korean (K-Pop) ──
  { id: 'ko-1', title: 'Dynamite', artist: 'BTS', album: 'BE', duration: '3:19', durationSec: 199, cover: '💥', plays: '1.8B', language: 'Korean', genre: 'K-Pop', year: 2024 },
  { id: 'ko-2', title: 'Pink Venom', artist: 'BLACKPINK', album: 'Born Pink', duration: '3:07', durationSec: 187, cover: '🖤', plays: '923.4M', language: 'Korean', genre: 'K-Pop', year: 2024 },
  { id: 'ko-3', title: 'Super Shy', artist: 'NewJeans', album: 'Get Up', duration: '2:34', durationSec: 154, cover: '🐰', plays: '567.8M', language: 'Korean', genre: 'K-Pop', year: 2025 },
  { id: 'ko-4', title: 'Magnetic', artist: 'ILLIT', album: 'SUPER REAL ME', duration: '2:42', durationSec: 162, cover: '🧲', plays: '345.6M', language: 'Korean', genre: 'K-Pop', year: 2025 },
  { id: 'ko-5', title: 'Love Dive', artist: 'IVE', album: 'After Like', duration: '3:01', durationSec: 181, cover: '🤿', plays: '678.9M', language: 'Korean', genre: 'K-Pop', year: 2024 },

  // ── Japanese ──
  { id: 'ja-1', title: 'Idol', artist: 'YOASOBI', album: 'Oshi no Ko OST', duration: '3:32', durationSec: 212, cover: '⭐', plays: '789.3M', language: 'Japanese', genre: 'J-Pop', year: 2025 },
  { id: 'ja-2', title: 'Shinunoga E-Wa', artist: 'Fujii Kaze', album: 'HELP EVER HURT NEVER', duration: '3:22', durationSec: 202, cover: '🗾', plays: '456.7M', language: 'Japanese', genre: 'J-Pop', year: 2024 },
  { id: 'ja-3', title: 'Suzume', artist: 'RADWIMPS', album: 'Suzume OST', duration: '4:05', durationSec: 245, cover: '🐦', plays: '345.2M', language: 'Japanese', genre: 'Anime', year: 2024 },
  { id: 'ja-4', title: 'Kaikai Kitan', artist: 'Eve', album: 'Jujutsu Kaisen OST', duration: '3:29', durationSec: 209, cover: '👁️‍🗨️', plays: '567.1M', language: 'Japanese', genre: 'Anime', year: 2024 },

  // ── Spanish (Latin) ──
  { id: 'es-1', title: 'Despacito Remix', artist: 'Luis Fonsi', album: 'Vida', duration: '3:48', durationSec: 228, cover: '🌶️', plays: '2.1B', language: 'Spanish', genre: 'Reggaeton', year: 2024 },
  { id: 'es-2', title: 'Corazón Salvaje', artist: 'Rosalía', album: 'MOTOMAMI', duration: '3:15', durationSec: 195, cover: '🌹', plays: '456.3M', language: 'Spanish', genre: 'Flamenco Pop', year: 2025 },
  { id: 'es-3', title: 'Ella Baila Sola', artist: 'Peso Pluma', album: 'Genesis', duration: '2:55', durationSec: 175, cover: '🎪', plays: '678.9M', language: 'Spanish', genre: 'Regional', year: 2025 },
  { id: 'es-4', title: 'La Noche Eterna', artist: 'Bad Bunny', album: 'Nadie Sabe', duration: '3:33', durationSec: 213, cover: '🐰', plays: '1.2B', language: 'Spanish', genre: 'Reggaeton', year: 2025 },

  // ── Arabic ──
  { id: 'ar-1', title: 'Habibi Ya Nour', artist: 'Amr Diab', album: 'Sahran', duration: '4:22', durationSec: 262, cover: '🏜️', plays: '234.5M', language: 'Arabic', genre: 'Arabic Pop', year: 2024 },
  { id: 'ar-2', title: 'Ya Lili', artist: 'Balti', album: 'Ya Lili', duration: '3:45', durationSec: 225, cover: '🌙', plays: '1.5B', language: 'Arabic', genre: 'Rap', year: 2024 },
  { id: 'ar-3', title: 'Nour El Ein', artist: 'Amr Diab', album: 'Classics', duration: '4:33', durationSec: 273, cover: '👁️', plays: '567.8M', language: 'Arabic', genre: 'Arabic Pop', year: 2024 },

  // ── French ──
  { id: 'fr-1', title: 'Dernière Danse', artist: 'Indila', album: 'Mini World', duration: '3:33', durationSec: 213, cover: '🗼', plays: '1.2B', language: 'French', genre: 'Pop', year: 2024 },
  { id: 'fr-2', title: 'Papaoutai', artist: 'Stromae', album: 'Racine Carrée', duration: '3:52', durationSec: 232, cover: '🎩', plays: '789.4M', language: 'French', genre: 'Electronic', year: 2024 },
  { id: 'fr-3', title: 'Formidable', artist: 'Stromae', album: 'Racine Carrée', duration: '3:22', durationSec: 202, cover: '🇫🇷', plays: '567.1M', language: 'French', genre: 'Pop', year: 2024 },

  // ── Punjabi ──
  { id: 'pa-1', title: 'Brown Munde', artist: 'AP Dhillon', album: 'Hidden Gems', duration: '3:29', durationSec: 209, cover: '🦁', plays: '1.1B', language: 'Punjabi', genre: 'Punjabi Pop', year: 2024 },
  { id: 'pa-2', title: 'Excuses', artist: 'AP Dhillon', album: 'Hidden Gems', duration: '3:05', durationSec: 185, cover: '🔥', plays: '789.3M', language: 'Punjabi', genre: 'Punjabi Pop', year: 2024 },
  { id: 'pa-3', title: 'Lover', artist: 'Diljit Dosanjh', album: 'GOAT', duration: '3:18', durationSec: 198, cover: '💛', plays: '456.7M', language: 'Punjabi', genre: 'Bhangra', year: 2025 },

  // ── Malayalam ──
  { id: 'ml-1', title: 'Jeevamshamayi', artist: 'KS Harisankar', album: 'Theevandi', duration: '4:22', durationSec: 262, cover: '🌴', plays: '234.5M', language: 'Malayalam', genre: 'Melody', year: 2024 },
  { id: 'ml-2', title: 'Illuminati', artist: 'Dabzee', album: 'Aavesham', duration: '3:15', durationSec: 195, cover: '🔺', plays: '189.3M', language: 'Malayalam', genre: 'Hip-Hop', year: 2025 },

  // ── Kannada ──
  { id: 'kn-1', title: 'Belageddu', artist: 'Anuradha Bhat', album: 'Kirik Party', duration: '4:05', durationSec: 245, cover: '🎪', plays: '345.6M', language: 'Kannada', genre: 'Melody', year: 2024 },

  // ── Bengali ──
  { id: 'bn-1', title: 'Ami Je Tomar', artist: 'Arijit Singh', album: 'Bhool Bhulaiyaa', duration: '4:15', durationSec: 255, cover: '🏵️', plays: '289.4M', language: 'Bengali', genre: 'Romantic', year: 2024 },

  // ── Mandarin Chinese ──
  { id: 'zh-1', title: 'Dao Xiang', artist: 'Jay Chou', album: 'Fantasy', duration: '4:02', durationSec: 242, cover: '🏯', plays: '456.7M', language: 'Chinese', genre: 'C-Pop', year: 2024 },
  { id: 'zh-2', title: 'Tian Mi Mi', artist: 'Teresa Teng', album: 'Classics', duration: '3:45', durationSec: 225, cover: '🎋', plays: '234.1M', language: 'Chinese', genre: 'Ballad', year: 2024 },

  // ── Portuguese ──
  { id: 'pt-1', title: 'Ai Ai Ai', artist: 'Vanessa da Mata', album: 'Sim', duration: '3:38', durationSec: 218, cover: '🇧🇷', plays: '345.2M', language: 'Portuguese', genre: 'Bossa Nova', year: 2024 },

  // ── Turkish ──
  { id: 'tr-1', title: 'Leylim Ley', artist: 'Tarkan', album: 'Karma', duration: '4:12', durationSec: 252, cover: '🌷', plays: '234.5M', language: 'Turkish', genre: 'Pop', year: 2024 },

  // ── German ──
  { id: 'de-1', title: '99 Luftballons', artist: 'Nena', album: 'Nena', duration: '3:50', durationSec: 230, cover: '🎈', plays: '567.8M', language: 'German', genre: 'Pop', year: 2024 },

  // ── Italian ──
  { id: 'it-1', title: 'Soldi', artist: 'Mahmood', album: 'Gioventù Bruciata', duration: '3:13', durationSec: 193, cover: '💰', plays: '345.6M', language: 'Italian', genre: 'Pop', year: 2024 },

  // ── Marathi ──
  { id: 'mr-1', title: 'Zingaat', artist: 'Ajay-Atul', album: 'Sairat', duration: '3:42', durationSec: 222, cover: '🎊', plays: '467.8M', language: 'Marathi', genre: 'Dance', year: 2024 },
];

/* ─── Languages ──────────────────────────────────────────── */
export const LANGUAGES = [
  'All', 'English', 'Hindi', 'Tamil', 'Telugu', 'Korean', 'Japanese',
  'Spanish', 'Arabic', 'French', 'Punjabi', 'Malayalam', 'Kannada',
  'Bengali', 'Chinese', 'Portuguese', 'Turkish', 'German', 'Italian', 'Marathi',
];

/* ─── Genres ─────────────────────────────────────────────── */
export const GENRES: Genre[] = [
  { id: 'pop', name: 'Pop', color: 'from-pink-500 to-rose-600', icon: '🎤' },
  { id: 'hiphop', name: 'Hip-Hop', color: 'from-amber-500 to-orange-600', icon: '🎧' },
  { id: 'rock', name: 'Rock', color: 'from-red-600 to-red-800', icon: '🎸' },
  { id: 'electronic', name: 'Electronic', color: 'from-cyan-500 to-blue-600', icon: '🎹' },
  { id: 'rnb', name: 'R&B', color: 'from-purple-500 to-violet-700', icon: '🎵' },
  { id: 'bollywood', name: 'Bollywood', color: 'from-yellow-500 to-amber-600', icon: '🎬' },
  { id: 'kpop', name: 'K-Pop', color: 'from-fuchsia-500 to-pink-600', icon: '💜' },
  { id: 'jpop', name: 'J-Pop', color: 'from-sky-400 to-indigo-600', icon: '🗾' },
  { id: 'reggaeton', name: 'Reggaeton', color: 'from-lime-500 to-green-600', icon: '🌶️' },
  { id: 'classical', name: 'Classical', color: 'from-emerald-500 to-teal-700', icon: '🎻' },
  { id: 'jazz', name: 'Jazz', color: 'from-indigo-400 to-blue-700', icon: '🎷' },
  { id: 'metal', name: 'Metal', color: 'from-gray-600 to-zinc-900', icon: '🤘' },
  { id: 'indie', name: 'Indie', color: 'from-teal-400 to-emerald-600', icon: '🌿' },
  { id: 'dance', name: 'Dance', color: 'from-violet-500 to-purple-700', icon: '💃' },
  { id: 'anime', name: 'Anime', color: 'from-rose-400 to-pink-600', icon: '🌸' },
  { id: 'chill', name: 'Chill', color: 'from-blue-400 to-cyan-600', icon: '🧊' },
];

/* ─── Playlists ──────────────────────────────────────────── */
export const PLAYLISTS: Playlist[] = [
  { id: 'pl-1', name: 'Today\'s Top Hits', description: 'The hottest tracks right now', cover: '🔥', songCount: 50, gradient: 'from-orange-500 to-red-600', creator: 'Auralux' },
  { id: 'pl-2', name: 'Chill Vibes', description: 'Kick back and relax', cover: '🧊', songCount: 42, gradient: 'from-cyan-500 to-blue-600', creator: 'Auralux' },
  { id: 'pl-3', name: 'Bollywood Central', description: 'Best of Bollywood', cover: '🎬', songCount: 80, gradient: 'from-amber-500 to-yellow-600', creator: 'Auralux' },
  { id: 'pl-4', name: 'K-Pop Rising', description: 'Trending K-Pop tracks', cover: '💜', songCount: 35, gradient: 'from-fuchsia-500 to-purple-600', creator: 'Auralux' },
  { id: 'pl-5', name: 'Late Night Drive', description: 'Songs for the open road', cover: '🌃', songCount: 28, gradient: 'from-indigo-600 to-violet-800', creator: 'Auralux' },
  { id: 'pl-6', name: 'Workout Energy', description: 'Push harder, go further', cover: '💪', songCount: 45, gradient: 'from-red-500 to-rose-600', creator: 'Auralux' },
  { id: 'pl-7', name: 'Tamil Melody', description: 'Soulful Tamil melodies', cover: '🌺', songCount: 60, gradient: 'from-emerald-500 to-teal-600', creator: 'Auralux' },
  { id: 'pl-8', name: 'Arab Nights', description: 'Best Arabic tracks', cover: '🏜️', songCount: 32, gradient: 'from-yellow-600 to-amber-800', creator: 'Auralux' },
  { id: 'pl-9', name: 'Reggaeton Fire', description: 'Latin heat 🔥', cover: '🌶️', songCount: 38, gradient: 'from-lime-500 to-green-700', creator: 'Auralux' },
  { id: 'pl-10', name: 'Anime OST', description: 'Best anime soundtracks', cover: '🌸', songCount: 55, gradient: 'from-rose-400 to-pink-600', creator: 'Auralux' },
  { id: 'pl-11', name: 'Morning Coffee', description: 'Start your day right', cover: '☕', songCount: 30, gradient: 'from-amber-400 to-orange-500', creator: 'You' },
  { id: 'pl-12', name: 'Focus Flow', description: 'Deep concentration', cover: '🧠', songCount: 25, gradient: 'from-blue-600 to-indigo-700', creator: 'You' },
];

/* ─── Featured Artists ───────────────────────────────────── */
export const ARTISTS: Artist[] = [
  { id: 'ar-arijit', name: 'Arijit Singh', avatar: '🎤', followers: '85.2M', genre: 'Bollywood', verified: true },
  { id: 'ar-bts', name: 'BTS', avatar: '💜', followers: '72.8M', genre: 'K-Pop', verified: true },
  { id: 'ar-anirudh', name: 'Anirudh', avatar: '🎵', followers: '45.3M', genre: 'Kollywood', verified: true },
  { id: 'ar-taylor', name: 'Taylor Swift', avatar: '✨', followers: '115.6M', genre: 'Pop', verified: true },
  { id: 'ar-badbunny', name: 'Bad Bunny', avatar: '🐰', followers: '68.4M', genre: 'Reggaeton', verified: true },
  { id: 'ar-blackpink', name: 'BLACKPINK', avatar: '🖤', followers: '56.7M', genre: 'K-Pop', verified: true },
  { id: 'ar-arrahman', name: 'AR Rahman', avatar: '🎶', followers: '42.1M', genre: 'Film', verified: true },
  { id: 'ar-drake', name: 'Drake', avatar: '🦉', followers: '91.3M', genre: 'Hip-Hop', verified: true },
  { id: 'ar-rosalia', name: 'Rosalía', avatar: '🌹', followers: '34.5M', genre: 'Flamenco Pop', verified: true },
  { id: 'ar-yoasobi', name: 'YOASOBI', avatar: '⭐', followers: '28.9M', genre: 'J-Pop', verified: true },
  { id: 'ar-apdhillon', name: 'AP Dhillon', avatar: '🦁', followers: '32.1M', genre: 'Punjabi Pop', verified: true },
  { id: 'ar-stromae', name: 'Stromae', avatar: '🎩', followers: '25.6M', genre: 'Electronic', verified: true },
  { id: 'ar-sidsriram', name: 'Sid Sriram', avatar: '🎙️', followers: '38.4M', genre: 'Melody', verified: true },
  { id: 'ar-amrdiab', name: 'Amr Diab', avatar: '🏜️', followers: '22.3M', genre: 'Arabic Pop', verified: true },
  { id: 'ar-weeknd', name: 'The Weeknd', avatar: '🌙', followers: '98.7M', genre: 'R&B', verified: true },
  { id: 'ar-neha', name: 'Neha Kakkar', avatar: '🌟', followers: '55.8M', genre: 'Bollywood', verified: true },
];

/* ─── Albums ─────────────────────────────────────────────── */
export const ALBUMS: Album[] = [
  { id: 'al-1', title: 'Neon Nights', artist: 'Stellar Echo', cover: '🌙', year: 2025, songs: 12, color: 'from-indigo-500 to-purple-700' },
  { id: 'al-2', title: 'Ishq Unplugged', artist: 'Arijit Singh', cover: '🎨', year: 2025, songs: 10, color: 'from-rose-500 to-pink-700' },
  { id: 'al-3', title: 'Born Pink', artist: 'BLACKPINK', cover: '🖤', year: 2024, songs: 8, color: 'from-fuchsia-500 to-pink-700' },
  { id: 'al-4', title: 'Master', artist: 'Anirudh', cover: '🔥', year: 2024, songs: 14, color: 'from-orange-500 to-red-700' },
  { id: 'al-5', title: 'MOTOMAMI', artist: 'Rosalía', cover: '🌹', year: 2025, songs: 16, color: 'from-red-500 to-rose-700' },
  { id: 'al-6', title: 'Voltage', artist: 'Nova Pulse', cover: '⚡', year: 2025, songs: 11, color: 'from-yellow-500 to-amber-700' },
  { id: 'al-7', title: 'Genesis', artist: 'Peso Pluma', cover: '🎪', year: 2025, songs: 18, color: 'from-lime-500 to-green-700' },
  { id: 'al-8', title: 'GOAT', artist: 'Diljit Dosanjh', cover: '💛', year: 2025, songs: 12, color: 'from-amber-400 to-yellow-600' },
  { id: 'al-9', title: 'BE', artist: 'BTS', cover: '💥', year: 2024, songs: 8, color: 'from-purple-500 to-violet-700' },
  { id: 'al-10', title: 'Fantasy', artist: 'Jay Chou', cover: '🏯', year: 2024, songs: 15, color: 'from-teal-500 to-emerald-700' },
];

/* ─── Moods ──────────────────────────────────────────────── */
export const MOODS = [
  { name: 'Happy', emoji: '😊', color: 'from-yellow-400 to-amber-500' },
  { name: 'Sad', emoji: '😢', color: 'from-blue-500 to-indigo-600' },
  { name: 'Energetic', emoji: '⚡', color: 'from-orange-500 to-red-500' },
  { name: 'Romantic', emoji: '💕', color: 'from-pink-400 to-rose-500' },
  { name: 'Chill', emoji: '🧊', color: 'from-cyan-400 to-teal-500' },
  { name: 'Party', emoji: '🎉', color: 'from-purple-500 to-fuchsia-500' },
  { name: 'Focus', emoji: '🧠', color: 'from-emerald-500 to-green-600' },
  { name: 'Sleep', emoji: '😴', color: 'from-indigo-600 to-blue-800' },
];

/* ─── Helpers ────────────────────────────────────────────── */
export function getSongsByLanguage(lang: string): Song[] {
  if (lang === 'All') return ALL_SONGS;
  return ALL_SONGS.filter(s => s.language === lang);
}

export function getSongsByGenre(genre: string): Song[] {
  return ALL_SONGS.filter(s => s.genre.toLowerCase() === genre.toLowerCase());
}

export function searchSongs(query: string): Song[] {
  const q = query.toLowerCase();
  return ALL_SONGS.filter(
    s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q) ||
      s.language.toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q)
  );
}

export function getTopSongs(count: number = 10): Song[] {
  return [...ALL_SONGS]
    .sort((a, b) => {
      const parseVal = (v: string) => {
        const num = parseFloat(v);
        if (v.includes('B')) return num * 1000;
        return num;
      };
      return parseVal(b.plays) - parseVal(a.plays);
    })
    .slice(0, count);
}

export function getRecentlyAdded(count: number = 10): Song[] {
  return ALL_SONGS.filter(s => s.year === 2025).slice(0, count);
}
