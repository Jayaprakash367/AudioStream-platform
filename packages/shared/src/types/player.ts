export interface PlaybackState {
  trackId: string | null;
  trackUri: string | null;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArt: string;
  duration: number;
  position: number;
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  deviceId: string | null;
  isActive: boolean;
  timestamp: number;
}

export enum RepeatMode {
  OFF = 0,
  CONTEXT = 1,
  TRACK = 2,
}

export interface PlayerControls {
  play: (uri?: string, contextUri?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (percent: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => Promise<void>;
  transferPlayback: (deviceId: string, autoPlay?: boolean) => Promise<void>;
}

export interface QueueItem {
  uri: string;
  trackId: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  addedAt: number;
}

export interface PlayerConfig {
  name: string;
  volume: number;
  enableMediaSession: boolean;
  autoConnect: boolean;
}

export enum PlayerEvent {
  READY = 'ready',
  NOT_READY = 'not_ready',
  STATE_CHANGED = 'player_state_changed',
  ERROR = 'initialization_error',
  AUTH_ERROR = 'authentication_error',
  ACCOUNT_ERROR = 'account_error',
  PLAYBACK_ERROR = 'playback_error',
  AUTOPLAY_FAILED = 'autoplay_failed',
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: Array<{ id: string; name: string; uri: string }>;
  album: {
    id: string;
    name: string;
    uri: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; height: number; width: number }>;
  owner: { id: string; display_name: string };
  tracks: { total: number; href: string };
  uri: string;
  public: boolean;
}
