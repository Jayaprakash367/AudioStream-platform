// ─────────────────────────────────────────────────────────────────────────────
// Server-Side Music API Proxy
// Routes: /api/music?source=saavn&q=...&limit=...
// JioSaavn Native Fetch + Decryption
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

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

function decryptUrl(encrypted: string) {
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encrypted) } as any,
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    const url = decrypted.toString(CryptoJS.enc.Utf8);
    // Upgrade to 320kbps
    return url.replace(/_96\.mp4$/, '_320.mp4').replace(/_160\.mp4$/, '_320.mp4');
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q') || '';
  const limit = searchParams.get('limit') || '20';

  if (!query) {
    return NextResponse.json({ results: [] }, { headers: HEADERS });
  }

  // Check cache
  const cacheKey = `saavn:${query}:${limit}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: HEADERS });
  }

  try {
    // JioSaavn Direct API
    const url = `https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0&__call=search.getResults&q=${encodeURIComponent(query)}`;
    const res = await timedFetch(url, 5000);
    
    if (res.ok) {
      const text = await res.text();
      // JioSaavn often prepends extra characters or comments
      const jsonStr = text.substring(text.indexOf('{'));
      const data = JSON.parse(jsonStr);
      
      const results = (data?.results || []).slice(0, parseInt(limit)).map((s: any) => {
        let streamUrl = null;
        if (s.media?.encryptedUrl) {
           streamUrl = decryptUrl(s.media.encryptedUrl);
        } else if (s.more_info?.encrypted_media_url) {
           streamUrl = decryptUrl(s.more_info.encrypted_media_url);
        }
        
        const images = s.image || s.more_info?.album?.image || [];
        const artwork = typeof s.image === 'string' ? s.image.replace('150x150', '500x500') : '';

        return {
          id: s.id,
          title: s.title || s.name || 'Unknown',
          artist: s.more_info?.music || s.subtitle || 'Unknown',
          album: s.more_info?.album || '',
          artwork,
          streamUrl,
          duration: s.more_info?.duration ? parseInt(s.more_info.duration) : 210,
          language: s.language || 'English',
        };
      }).filter((t: any) => t.streamUrl);

      if (results.length > 0) {
        const resp = { data: { results } };
        CACHE.set(cacheKey, { data: resp, ts: Date.now() });
        return NextResponse.json(resp, { headers: HEADERS });
      }
    }

    return NextResponse.json({ data: { results: [] } }, { headers: HEADERS });
  } catch (err) {
    console.error('Saavn API error:', err);
    return NextResponse.json({ results: [] }, { headers: HEADERS, status: 502 });
  }
}
