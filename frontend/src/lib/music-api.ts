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
  source: 'itunes' | 'jiosaavn' | 'deezer' | 'audius';
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

// ─── iTunes (Replaced by Audius for Full Songs) ──────────────────────────────

export async function searchITunes(query: string, limit = 20): Promise<Track[]> {
  return searchJioSaavn(query, limit);
}

export async function getITunesTrending(limit = 20): Promise<Track[]> {
  return getJioSaavnTrending(limit);
}

export async function getITunesByGenre(genre: string, limit = 20): Promise<Track[]> {
  return searchJioSaavn(genre, limit);
}

// ─── JioSaavn (All Mainstream Songs via Proxy) ──────────────────────────────

export async function searchJioSaavn(query: string, limit = 20): Promise<Track[]> {
  try {
    const data = await fetchJSON(
      `/api/music?source=saavn&q=${encodeURIComponent(query)}&limit=${limit}`,
      8000
    );
    const tracks = data?.data?.results || [];
    return tracks.map((t: any) => ({
      id: `saavn-${t.id}`,
      title: t.title,
      artist: t.artist,
      album: t.album,
      artwork: t.artwork,
      previewUrl: t.streamUrl,
      streamUrl: t.streamUrl,
      duration: t.duration,
      source: 'jiosaavn',
      language: t.language,
      genre: '',
      isFullTrack: true,
    }));
  } catch {
    return [];
  }
}

export async function getJioSaavnTrending(limit = 20): Promise<Track[]> {
  return searchJioSaavn('trending 2025', limit);
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

  const results = await Promise.allSettled(
    queries.map((q) => searchJioSaavn(q, perQuery))
  );

  const seen = new Set<string>();
  const tracks: Track[] = [];

  for (const r of results) {
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
  const saavn = await searchJioSaavn(query, 30);

  return {
    saavn,
    itunes: [],
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
    searchJioSaavn('top hits global 2025', 15),
    searchJioSaavn('worldwide trending 2025', 10),
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
  return searchJioSaavn(query, 20);
}

// ─── Classic Songs (80s-2000s) ──────────────────────────────────────────────

export const CLASSIC_QUERIES: Record<string, string[]> = {
  '80s': [
    'michael jackson', 'prince 80s', 'david bowie', 'queen 80s', 'billie jean',
    'a-ha', 'duran duran', 'depeche mode', 'new order', 'the cure 80s',
  ],
  '90s': [
    'nirvana', 'pearl jam', 'soundgarden', 'radiohead 90s', 'oasis',
    'britney spears', 'backstreet boys', 'spice girls', 'eminem 90s', 'metallica',
  ],
  '2000s': [
    'britney spears 2000s', 'usher', 'beyonce 2000s', 'usher yeah', 'nelly 2000s',
    'eminem slim shady', 'outkast', 'missy elliott', 'jay-z 2000s', '50 cent',
  ],
};

export async function getClassicByDecade(decade: '80s' | '90s' | '2000s', limit = 25): Promise<Track[]> {
  const queries = CLASSIC_QUERIES[decade] || [];
  const perQuery = Math.ceil(limit / queries.length) + 1;

  const results = await Promise.allSettled(
    queries.map((q) => searchJioSaavn(q, perQuery))
  );

  const seen = new Set<string>();
  const tracks: Track[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const t of r.value) {
        const key = `${t.title.toLowerCase().trim()}-${t.artist.toLowerCase().trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          tracks.push(t);
        }
      }
    }
  }

  return tracks.slice(0, limit);
}
