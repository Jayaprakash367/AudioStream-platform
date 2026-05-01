# 🚀 Frontend-Backend Integration Guide

## ✅ Current Setup

### Frontend Configuration
- **API Base URL**: `http://localhost:3000` (API Gateway)
- **Auth Service**: `http://localhost:3001`
- **User Service**: `http://localhost:3002`
- **Music Service**: `http://localhost:3003`
- **Streaming Service**: `http://localhost:3004`
- **Playlist Service**: `http://localhost:3005`

### Files Configured
- ✅ `src/lib/config.ts` - Centralized configuration
- ✅ `src/lib/api-hooks.ts` - Custom hooks for API calls
- ✅ `src/lib/api-client.ts` - Generic API client
- ✅ `src/lib/backend-api.ts` - Backend API definitions

## 🔧 How UI Components Connect to Backend

### 1. **HomePage.tsx** - Music Catalog
```typescript
// Gets trending tracks
const { data: trending } = useTrendingTracks(20);

// Gets featured tracks
const { data: featured } = useFeaturedTracks(8);

// Gets tracks by language
const { data: langSongs } = useTracksByLanguage(activeLang, 18);

// Gets songs matching mood
const { data: moodSongs } = useSongSearch(activeMood.query, 12);
```

### 2. **Player.tsx** - Music Playback
```typescript
// Streams audio from backend
const streamUrl = await getStreamingUrl(songId, quality);

// Tracks playback events
await trackPlaybackEvent(songId, 'play', position);
```

### 3. **LibraryPage.tsx** - User's Music Library
```typescript
// Gets user's playlists
const { data: playlists } = useUserPlaylists();

// Gets liked songs
const { data: liked } = useLikedSongs();

// Gets recently played
const { data: recent } = useRecentlyPlayed();
```

### 4. **Cards.tsx** - Track Management
```typescript
// Like/unlike songs
await likeSong(trackId);
await unlikeSong(trackId);

// Add to playlist
await addToPlaylist(playlistId, songId);
```

## 🎯 Backend Endpoints Required

### Music Service (`/music/*`)
- `GET /music/trending?limit=20` - Trending songs
- `GET /music/featured?limit=8` - Featured songs
- `GET /music/language/:lang?limit=20` - Songs by language
- `GET /music/languages` - Available languages
- `GET /music/new-releases?language=:lang` - New releases
- `GET /music/search?q=:query` - Search songs
- `GET /music/popular?genre=:genre` - Popular songs

### User Service (`/user/*`)
- `GET /user/me` - Current user profile
- `GET /user/playlists` - User's playlists
- `GET /user/library` - User's library
- `GET /user/liked-songs` - Liked songs
- `GET /user/recently-played` - Recently played
- `POST /user/library` - Add to library
- `DELETE /user/library/:songId` - Remove from library
- `POST /user/likes` - Like a song
- `DELETE /user/likes/:songId` - Unlike a song

### Streaming Service (`/stream/*`)
- `GET /stream/:songId?quality=:quality` - Get streaming URL
- `POST /stream/track-event` - Track playback event

### Playlist Service (`/playlist/*`)
- `GET /playlist/:id` - Get playlist
- `POST /playlist` - Create playlist
- `PUT /playlist/:id` - Update playlist
- `DELETE /playlist/:id` - Delete playlist
- `POST /playlist/:id/songs` - Add song to playlist
- `DELETE /playlist/:id/songs/:songId` - Remove song from playlist

## 🐛 Troubleshooting

### Services Not Starting
```bash
# Check if API Gateway is running
curl http://localhost:3000/health/live

# Start API Gateway manually
cd services/api-gateway && npm run dev

# Start other services
cd services/auth-service && npm run dev
cd services/music-service && npm run dev
cd services/user-service && npm run dev
cd services/streaming-service && npm run dev
```

### API Calls Failing
1. Check browser console for errors
2. Verify service URLs in `config.ts`
3. Check CORS headers in backend responses
4. Verify API Gateway is routing correctly

### Data Not Loading
1. Check Network tab in browser DevTools
2. Verify API responses match expected format
3. Check error messages in console
4. Ensure service is returning `{ data: {...} }` format

## 📱 Component Integration Checklist

- [ ] HomePage - Load trending/featured/language songs
- [ ] Player - Stream and track playback
- [ ] Library - Load user's playlists and likes
- [ ] Search - Search for songs
- [ ] Sidebar - Load navigation and playlists
- [ ] TopBar - Show user profile
- [ ] Cards - Like/unlike and playlist actions

## 🔌 Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_SERVICE=http://localhost:3001
NEXT_PUBLIC_MUSIC_SERVICE=http://localhost:3003
NEXT_PUBLIC_STREAMING_SERVICE=http://localhost:3004
```

## ✨ Features Implemented

✅ Centralized API configuration
✅ Custom React hooks for API calls
✅ Error handling and loading states
✅ TypeScript types for all API responses
✅ Automatic data fetching on component mount
✅ Refetch capability
✅ CORS and credentials support

## 🚀 Next Steps

1. Ensure all backend services are running
2. Verify API endpoints are responding correctly
3. Test components in browser
4. Check browser console for any errors
5. Debug API calls using Network tab
6. Implement authentication if needed
