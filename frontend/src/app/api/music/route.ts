// ─────────────────────────────────────────────────────────────────────────────
// Server-Side Music API Proxy
// Routes: /api/music?source=itunes|saavn&q=...&limit=...
// iTunes is primary (always works). JioSaavn tried as bonus.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const CACHE = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

const HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

async function timedFetch(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const source = searchParams.get('source') || 'itunes';
  const query = searchParams.get('q') || '';
  const limit = searchParams.get('limit') || '20';

  if (!query) {
    return NextResponse.json({ results: [] }, { headers: HEADERS });
  }

  // Check cache
  const cacheKey = `${source}:${query}:${limit}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: HEADERS });
  }

  try {
    if (source === 'itunes') {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${limit}&entity=song`;
      const res = await timedFetch(url, 10000);
      if (res.ok) {
        const data = await res.json();
        CACHE.set(cacheKey, { data, ts: Date.now() });
        return NextResponse.json(data, { headers: HEADERS });
      }
      return NextResponse.json({ results: [] }, { headers: HEADERS });
    }

    // JioSaavn — try the main endpoint with a short timeout
    try {
      const url = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`;
      const res = await timedFetch(url, 5000);
      if (res.ok) {
        const text = await res.text();
        if (text && text.startsWith('{')) {
          const data = JSON.parse(text);
          const results = data?.data?.results || [];
          if (results.length > 0) {
            const resp = { data: { results } };
            CACHE.set(cacheKey, { data: resp, ts: Date.now() });
            return NextResponse.json(resp, { headers: HEADERS });
          }
        }
      }
    } catch {
      // JioSaavn unavailable
    }

    return NextResponse.json({ data: { results: [] } }, { headers: HEADERS });
  } catch {
    return NextResponse.json({ results: [] }, { headers: HEADERS, status: 502 });
  }
}
