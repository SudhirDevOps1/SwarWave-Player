// Song type for music/video playback
export interface Song {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number | string;
  album?: string;
  durationSeconds?: number;
}

// Radio station type
export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  country: string;
  countrycode: string;
  language: string;
  tags: string;
  codec: string;
  bitrate: number;
  votes: number;
  lastcheckok: number;
}

// Search providers
export type SearchProvider = 'piped' | 'invidious' | 'youtube';

// Active tab
export type ActiveTab = 'home' | 'music' | 'radio' | 'favorites' | 'offline';

// Player state
export type PlayerState = -1 | 0 | 1 | 2 | 3 | 5;

// Repeat modes
export type RepeatMode = 'none' | 'one' | 'all';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Artist type
export interface Artist {
  name: string;
  image?: string;
  category: 'bollywood' | 'bhojpuri' | 'punjabi' | 'haryanvi' | 'english' | 'rap' | 'legends';
}

// Mood type
export interface Mood {
  name: string;
  emoji: string;
  query: string;
  color: string;
}

// Cached search result
export interface CachedSearch {
  query: string;
  results: Song[];
  provider: SearchProvider;
  timestamp: number;
}

// Offline song with blob
export interface OfflineSong extends Song {
  audioBlob?: Blob;
  cachedAt: number;
}

// Listening stats
export interface ListeningStats {
  totalSongs: number;
  totalPlayTime: number; // in seconds
  favoriteCount: number;
  playlistCount: number;
  offlineCount: number;
  topArtists: Array<{ name: string; count: number }>;
  topSongs: Array<{ videoId: string; title: string; artist: string; playCount: number }>;
  dailyPlays: Array<{ date: string; count: number }>;
}

// Theme colors
export type ThemeColor = 'violet' | 'blue' | 'green' | 'orange' | 'pink' | 'red' | 'teal';

// Playback speed
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

// Car mode
export interface CarMode {
  enabled: boolean;
  largeControls: boolean;
  simplifiedUI: boolean;
}
