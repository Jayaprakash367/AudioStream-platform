'use client';

import { create } from 'zustand';
import type { Track } from './music-api';

// ─── Singleton Audio Engine ──────────────────────────────────────────────────
let _audio: HTMLAudioElement | null = null;
let _listeners: (() => void)[] = [];

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = 'auto';
  }
  return _audio;
}

function teardownListeners() {
  _listeners.forEach((fn) => fn());
  _listeners = [];
}

// ─── Player Store ─────────────────────────────────────────────────────────────

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  liked: Set<string>;
  error: string | null;

  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (id: string) => void;
  isLiked: (id: string) => boolean;
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  function attachAudio(audio: HTMLAudioElement) {
    teardownListeners();
    const onTimeUpdate = () => set({ progress: audio.currentTime, duration: audio.duration || 0 });
    const onDurationChange = () => set({ duration: audio.duration || 0 });
    const onPlaying = () => set({ isPlaying: true, isLoading: false, error: null });
    const onPause = () => set({ isPlaying: false });
    const onWaiting = () => set({ isLoading: true });
    const onCanPlay = () => set({ isLoading: false });
    const onError = (e: Event) => {
      const err = (e.target as HTMLAudioElement).error;
      set({ isLoading: false, isPlaying: false, error: err?.message || 'Playback error' });
    };
    const onEnded = () => {
      const { repeat, queue, queueIndex } = get();
      if (repeat === 'one') { audio.currentTime = 0; audio.play().catch(() => {}); return; }
      if (repeat === 'all' || queueIndex < queue.length - 1) {
        get().next();
      } else {
        set({ isPlaying: false, progress: 0 });
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    _listeners = [
      () => audio.removeEventListener('timeupdate', onTimeUpdate),
      () => audio.removeEventListener('durationchange', onDurationChange),
      () => audio.removeEventListener('playing', onPlaying),
      () => audio.removeEventListener('pause', onPause),
      () => audio.removeEventListener('waiting', onWaiting),
      () => audio.removeEventListener('canplay', onCanPlay),
      () => audio.removeEventListener('error', onError),
      () => audio.removeEventListener('ended', onEnded),
    ];
  }

  return {
    currentTrack: null,
    queue: [],
    queueIndex: 0,
    isPlaying: false,
    isLoading: false,
    progress: 0,
    duration: 0,
    volume: 75,
    shuffle: false,
    repeat: 'off',
    liked: new Set(),
    error: null,

    play: (track, queue) => {
      const audio = getAudio();
      if (!audio) return;

      const q = queue || get().queue;
      const idx = q.findIndex((t) => t.id === track.id);

      set({
        currentTrack: track,
        queue: q.length > 0 ? q : [track],
        queueIndex: idx >= 0 ? idx : 0,
        isLoading: true,
        error: null,
        progress: 0,
        duration: 0,
      });

      attachAudio(audio);
      audio.volume = get().volume / 100;

      const url = track.streamUrl || track.previewUrl;
      if (!url) {
        set({ isLoading: false, error: 'No audio URL for this track' });
        return;
      }

      audio.src = url;
      audio.load();
      audio.play().catch((err) => {
        set({ isLoading: false, isPlaying: false, error: err?.message || 'Could not play' });
      });
    },

    pause: () => { getAudio()?.pause(); set({ isPlaying: false }); },

    resume: () => { if (get().currentTrack) getAudio()?.play().catch(() => {}); },

    togglePlay: () => {
      const { isPlaying, currentTrack } = get();
      if (!currentTrack) return;
      isPlaying ? get().pause() : get().resume();
    },

    next: () => {
      const { queue, queueIndex, shuffle } = get();
      if (!queue.length) return;
      const nextIdx = shuffle ? Math.floor(Math.random() * queue.length) : (queueIndex + 1) % queue.length;
      get().play(queue[nextIdx], queue);
      set({ queueIndex: nextIdx });
    },

    previous: () => {
      const { queue, queueIndex } = get();
      const audio = getAudio();
      if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
      if (!queue.length) return;
      const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
      get().play(queue[prevIdx], queue);
      set({ queueIndex: prevIdx });
    },

    seek: (seconds) => {
      const audio = getAudio();
      if (audio && audio.duration > 0) {
        audio.currentTime = Math.min(Math.max(0, seconds), audio.duration);
        set({ progress: audio.currentTime });
      }
    },

    setVolume: (v) => {
      const audio = getAudio();
      if (audio) audio.volume = v / 100;
      set({ volume: v });
    },

    toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
    toggleRepeat: () =>
      set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),
    toggleLike: (id) =>
      set((s) => { const n = new Set(s.liked); n.has(id) ? n.delete(id) : n.add(id); return { liked: n }; }),
    isLiked: (id) => get().liked.has(id),
    addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
    clearQueue: () => set({ queue: [], queueIndex: 0 }),
  };
});

/* ─── Navigation Store ────────────────────────────────────── */
interface NavState {
  activeTab: string;
  sidebarOpen: boolean;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeTab: 'home',
  sidebarOpen: true,
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

/* ─── Auth Store ──────────────────────────────────────────── */
interface AuthState {
  isAuthenticated: boolean;
  user: { name: string; email: string; avatar: string; tier: string } | null;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (_email, _password) =>
    set({ isAuthenticated: true, user: { name: 'Jayaprakash K', email: _email, avatar: 'JK', tier: 'Premium' } }),
  signup: (name, email, _password) =>
    set({ isAuthenticated: true, user: { name, email, avatar: name.substring(0, 2).toUpperCase(), tier: 'Free' } }),
  logout: () => set({ isAuthenticated: false, user: null }),
}));
