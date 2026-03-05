// ─────────────────────────────────────────────────────────────────────────────
// Music API Service — iTunes Primary (reliable) + JioSaavn bonus
//
// iTunes: Always works, returns metadata + 30s preview audio with artwork
// JioSaavn: Full songs but API is unreliable — tried as bonus
//
// All external calls go through /api/music server proxy to avoid CORS.
// ─────────────────────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl: string | null;
  streamUrl: string | null;
  duration: number; // seconds
  source: 'itunes' | 'jiosaavn' | 'deezer';
  language?: string;
  genre?: string;
  isFullTrack: boolean;
}

// ─── Safe Fetch with Timeout ─────────────────────────────────────────────────

async function fetchJSON(url: string, timeoutMs = 10000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ─── iTunes (Primary — always works) ────────────────────────────────────────

function parseITunesResults(results: any[], langTag?: string): Track[] {
  return (results || [])
    .filter((r: any) => r.previewUrl)
    .map((r: any): Track => ({
      id: `itunes-${r.trackId}`,
      title: r.trackName || 'Unknown',
      artist: r.artistName || 'Unknown',
      album: r.collectionName || '',
      artwork: r.artworkUrl100?.replace('100x100', '500x500') || '',
      previewUrl: r.previewUrl,
      streamUrl: r.previewUrl,
      duration: Math.round((r.trackTimeMillis || 30000) / 1000),
      source: 'itunes',
      genre: r.primaryGenreName || '',
      language: langTag || detectLanguage(r.primaryGenreName) || 'English',
      isFullTrack: false,
    }));
}

function detectLanguage(genre?: string): string {
  if (!genre) return 'English';
  const g = genre.toLowerCase();
  if (g.includes('bollywood') || g.includes('hindi')) return 'Hindi';
  if (g.includes('tamil')) return 'Tamil';
  if (g.includes('telugu')) return 'Telugu';
  if (g.includes('punjabi')) return 'Punjabi';
  if (g.includes('malayalam')) return 'Malayalam';
  if (g.includes('kannada')) return 'Kannada';
  if (g.includes('bengali')) return 'Bengali';
  if (g.includes('marathi')) return 'Marathi';
  if (g.includes('k-pop') || g.includes('korean')) return 'Korean';
  if (g.includes('j-pop') || g.includes('japanese') || g.includes('anime')) return 'Japanese';
  if (g.includes('latin') || g.includes('reggaeton') || g.includes('spanish')) return 'Spanish';
  if (g.includes('arabic')) return 'Arabic';
  if (g.includes('french')) return 'French';
  if (g.includes('chinese') || g.includes('mandarin') || g.includes('c-pop')) return 'Chinese';
  if (g.includes('brazilian') || g.includes('sertanejo') || g.includes('portuguese')) return 'Portuguese';
  if (g.includes('turkish')) return 'Turkish';
  return 'English';
}

/** Search iTunes via server proxy */
export async function searchITunes(query: string, limit = 20): Promise<Track[]> {
  // Try proxy first (avoids any CORS from iTunes CDN)
  const proxyData = await fetchJSON(
    `/api/music?source=itunes&q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (proxyData?.results?.length > 0) {
    return parseITunesResults(proxyData.results);
  }

  // Direct fallback
  const directData = await fetchJSON(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${limit}&entity=song`
  );
  return parseITunesResults(directData?.results || []);
}

export async function getITunesTrending(limit = 20): Promise<Track[]> {
  const queries = ['top hits 2025', 'pop hits 2025', 'trending music 2025'];
  const query = queries[Math.floor(Math.random() * queries.length)];
  return searchITunes(query, limit);
}

export async function getITunesByGenre(genre: string, limit = 20): Promise<Track[]> {
  return searchITunes(genre, limit);
}

// ─── JioSaavn (Bonus — full songs if API is up) ─────────────────────────────

interface SaavnSong {
  id: string;
  name: string;
  artists?: { primary?: Array<{ name: string }> };
  album?: { name: string; image?: Array<{ quality: string; url: string }> };
  image?: Array<{ quality: string; url: string }>;
  downloadUrl?: Array<{ quality: string; url: string }>;
  duration?: number;
  language?: string;
}

function parseSaavnSong(s: SaavnSong, langTag?: string): Track {
  const artistNames = (s.artists?.primary || []).map((a) => a.name).join(', ') || 'Unknown';
  const images = s.album?.image || s.image || [];
  const artwork =
    images.find((i) => i.quality === '500x500')?.url ||
    images.find((i) => i.quality === '150x150')?.url ||
    images[images.length - 1]?.url ||
    '';
  const downloads = s.downloadUrl || [];
  const streamUrl =
    downloads.find((d) => d.quality === '320kbps')?.url ||
    downloads.find((d) => d.quality === '160kbps')?.url ||
    downloads.find((d) => d.quality === '96kbps')?.url ||
    downloads[downloads.length - 1]?.url ||
    null;
  return {
    id: `saavn-${s.id}`,
    title: s.name || 'Unknown',
    artist: artistNames,
    album: s.album?.name || '',
    artwork,
    previewUrl: streamUrl,
    streamUrl,
    duration: s.duration || 210,
    source: 'jiosaavn',
    language: langTag || s.language || 'Hindi',
    genre: '',
    isFullTrack: !!streamUrl,
  };
}

/** Try JioSaavn via proxy — returns empty array if API is down */
export async function searchJioSaavn(query: string, limit = 20): Promise<Track[]> {
  const data = await fetchJSON(
    `/api/music?source=saavn&q=${encodeURIComponent(query)}&limit=${limit}`,
    6000
  );
  const songs: SaavnSong[] = data?.data?.results || [];
  return songs.map((s) => parseSaavnSong(s)).filter((t) => t.streamUrl);
}

export async function getJioSaavnTrending(limit = 20): Promise<Track[]> {
  return searchJioSaavn('trending bollywood 2025', limit);
}

// ─── Language-Specific Search (iTunes artist queries) ────────────────────────

const LANGUAGE_QUERIES: Record<string, string[]> = {
  Hindi: [
    'arijit singh', 'neha kakkar', 'jubin nautiyal',
    'shreya ghoshal bollywood', 'atif aslam hindi', 'lata mangeshkar',
  ],
  English: [
    'taylor swift', 'ed sheeran', 'the weeknd',
    'dua lipa', 'billie eilish', 'drake',
  ],
  Tamil: [
    'anirudh ravichander tamil', 'sid sriram tamil', 'ar rahman tamil',
    'yuvan shankar raja', 'dhanush tamil songs', 'shreya ghoshal tamil',
  ],
  Telugu: [
    'sid sriram telugu', 'anirudh telugu', 'thaman telugu',
    'armaan malik telugu', 'sp balasubrahmanyam', 'devi sri prasad',
  ],
  Punjabi: [
    'ap dhillon', 'diljit dosanjh', 'sidhu moose wala',
    'karan aujla', 'guru randhawa', 'harrdy sandhu',
  ],
  Malayalam: [
    'vineeth sreenivasan', 'sushin shyam', 'kj yesudas malayalam',
    'shreya ghoshal malayalam', 'vidyasagar malayalam', 'berny ignatius',
  ],
  Kannada: [
    'sanjith hegde kannada', 'vijay prakash kannada', 'rajesh krishnan',
    'sp balasubrahmanyam kannada', 'hamsalekha songs', 'kiccha sudeep',
  ],
  Bengali: [
    'arijit singh bengali', 'anupam roy', 'nachiketa bangla',
    'rabindra sangeet', 'hemanta mukherjee', 'manna dey bengali',
  ],
  Marathi: [
    'ajay atul marathi', 'avadhoot gupte', 'shankar mahadevan marathi',
    'lata mangeshkar marathi', 'suresh wadkar marathi', 'amitabh bhattacharya',
  ],
  Korean: [
    'bts', 'blackpink', 'newjeans kpop',
    'stray kids', 'seventeen kpop', 'aespa',
  ],
  Japanese: [
    'yoasobi', 'fujii kaze', 'ado japanese',
    'lisa anime', 'kenshi yonezu', 'one ok rock',
  ],
  Spanish: [
    'bad bunny', 'shakira', 'rosalia',
    'ozuna', 'daddy yankee', 'j balvin',
  ],
  Arabic: [
    'amr diab', 'nancy ajram', 'mohamed hamaki',
    'tamer hosny', 'fairuz arabic', 'hussain al jassmi',
  ],
  French: [
    'stromae', 'aya nakamura', 'indila',
    'maitre gims', 'edith piaf', 'angele french',
  ],
  Chinese: [
    'jay chou', 'eason chan', 'jj lin',
    'deng ziqi', 'wang leehom', 'cpop mandarin',
  ],
  Portuguese: [
    'anitta', 'marilia mendonca', 'gusttavo lima',
    'jorge ben jor', 'caetano veloso', 'brazilian pop',
  ],
  Turkish: [
    'tarkan', 'sezen aksu', 'murat boz',
    'hadise turkish', 'manga rock turkish', 'ebru gundes',
  ],
};

/**
 * Get songs for a specific language by searching iTunes with artist-specific queries.
 * Fires multiple queries in parallel and deduplicates.
 */
export async function getByLanguage(language: string, limit = 18): Promise<Track[]> {
  const queries = LANGUAGE_QUERIES[language] || [`${language.toLowerCase()} music`, `${language.toLowerCase()} songs`];
  const perQuery = Math.ceil(limit / queries.length) + 2;

  // Fire all queries in parallel via Promise.allSettled
  const results = await Promise.allSettled(
    queries.map((q) => searchITunes(q, perQuery))
  );

  // Also try JioSaavn (bonus; may return empty)
  const saavnResult = await Promise.allSettled(
    queries.slice(0, 2).map((q) => searchJioSaavn(q, perQuery))
  );

  // Combine and deduplicate by title+artist
  const seen = new Set<string>();
  const tracks: Track[] = [];

  // JioSaavn first (full songs)
  for (const r of saavnResult) {
    if (r.status === 'fulfilled') {
      for (const t of r.value) {
        const key = `${t.title.toLowerCase().trim()}-${t.artist.toLowerCase().trim()}`;
        if (!seen.has(key) && t.streamUrl) {
          seen.add(key);
          t.language = language;
          tracks.push(t);
        }
      }
    }
  }

  // iTunes
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const t of r.value) {
        const key = `${t.title.toLowerCase().trim()}-${t.artist.toLowerCase().trim()}`;
        if (!seen.has(key) && t.previewUrl) {
          seen.add(key);
          t.language = language;
          tracks.push(t);
        }
      }
    }
  }

  return tracks.slice(0, limit);
}

// Keep old name for backward compatibility
export const getJioSaavnByLanguage = getByLanguage;

// ─── Unified Search ──────────────────────────────────────────────────────────

export async function searchAll(query: string): Promise<{
  saavn: Track[];
  itunes: Track[];
  deezer: Track[];
}> {
  const [saavn, itunes] = await Promise.allSettled([
    searchJioSaavn(query, 15),
    searchITunes(query, 20),
  ]);
  return {
    saavn: saavn.status === 'fulfilled' ? saavn.value : [],
    itunes: itunes.status === 'fulfilled' ? itunes.value : [],
    deezer: [],
  };
}

// ─── Deezer (disabled — API is geo-restricted) ──────────────────────────────

export async function searchDeezer(_query: string, _limit = 20): Promise<Track[]> {
  return []; // Deezer API returns empty in India region
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const LANGUAGE_LIST = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Punjabi', 'Malayalam',
  'Kannada', 'Bengali', 'Marathi', 'Korean', 'Japanese', 'Spanish',
  'Arabic', 'French', 'Chinese', 'Portuguese', 'Turkish',
];

export async function getTrendingByLanguage(language: string): Promise<Track[]> {
  return getByLanguage(language, 25);
}

export async function getGlobalTopCharts(): Promise<Track[]> {
  const [a, b] = await Promise.allSettled([
    searchITunes('top hits global 2025', 15),
    searchITunes('worldwide trending 2025', 10),
  ]);
  const s1 = a.status === 'fulfilled' ? a.value : [];
  const s2 = b.status === 'fulfilled' ? b.value : [];
  return [...s1, ...s2].slice(0, 25);
}

export const MOOD_QUERIES: Record<string, string> = {
  Happy: 'happy upbeat pop songs',
  Romantic: 'romantic love songs',
  Party: 'party dance hits',
  Chill: 'lo-fi chill beats',
  Workout: 'workout gym motivation songs',
  Focus: 'focus study concentration music',
  Sad: 'sad emotional songs',
  Devotional: 'devotional peaceful songs',
};

export async function getByMood(mood: string): Promise<Track[]> {
  const query = MOOD_QUERIES[mood] || `${mood} music`;
  return searchITunes(query, 20);
}
