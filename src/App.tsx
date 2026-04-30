import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Heart, Plus, Trash2, Edit2, Check, X, Play, Share2, Mic, BarChart3, FileDown, FileUp, Car } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Song, ActiveTab, SearchProvider, ThemeColor, CarMode } from '@/types';

// Components
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { SongCard } from '@/components/SongCard';
import { ArtistSection } from '@/components/ArtistSection';
import { MoodSection } from '@/components/MoodSection';
import { TrendingSearches } from '@/components/TrendingSearches';
import { RadioSection } from '@/components/RadioSection';
import { PlayerBar } from '@/components/PlayerBar';
import { QueuePanel } from '@/components/QueuePanel';
import { SettingsModal } from '@/components/SettingsModal';
import { ToastContainer } from '@/components/ToastContainer';
import { Footer } from '@/components/Footer';
import { StatsModal } from '@/components/StatsModal';
import { CommandPalette, type CommandAction } from '@/components/CommandPalette';
import { ExperiencePanel } from '@/components/ExperiencePanel';
import { VideoOverlay } from '@/components/VideoOverlay';

// Hooks
import { usePlayer } from '@/hooks/usePlayer';
import { useQueue } from '@/hooks/useQueue';
import { useToast } from '@/hooks/useToast';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { useStats } from '@/hooks/useStats';
import { usePwaInstall } from '@/hooks/usePwaInstall';

// Utils
import { clearSearchCache, searchSongs, validateYouTubeKey, type YouTubeKeyStatus } from '@/utils/api';
import { downloadMedia } from '@/utils/download';
import { shareSong, downloadAsJSON, importFromJSON } from '@/utils/share';

interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

const ACCENT_PALETTE: Record<ThemeColor, { accent: string; accent2: string; rgb: string }> = {
  violet: { accent: '#8b5cf6', accent2: '#ec4899', rgb: '139 92 246' },
  blue: { accent: '#3b82f6', accent2: '#06b6d4', rgb: '59 130 246' },
  green: { accent: '#22c55e', accent2: '#14b8a6', rgb: '34 197 94' },
  orange: { accent: '#f97316', accent2: '#f59e0b', rgb: '249 115 22' },
  pink: { accent: '#ec4899', accent2: '#f472b6', rgb: '236 72 153' },
  red: { accent: '#ef4444', accent2: '#f97316', rgb: '239 68 68' },
  teal: { accent: '#14b8a6', accent2: '#22c55e', rgb: '20 184 166' },
};

function App() {
  // ── theme ────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // ── state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<SearchProvider | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => {
    try { return JSON.parse(localStorage.getItem('recently_played') || '[]'); } catch { return []; }
  });
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiKey, setApiKey] = useState(localStorage.getItem('yt_api_key') || '');
  // Default to invidious - works better on both PC and mobile
  const [preferredProvider, setPreferredProvider] = useState<SearchProvider>(
    (localStorage.getItem('search_provider') as SearchProvider) || 'invidious'
  );
  const [apiKeyStatus, setApiKeyStatus] = useState<YouTubeKeyStatus>('unknown');
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try { return JSON.parse(localStorage.getItem('privmitlab_playlists') || '[]'); } catch { return []; }
  });
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState('');
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [activePlaylistView, setActivePlaylistView] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  // ── NEW FEATURES state ───────────────────────────────────
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isVoiceSearch, setIsVoiceSearch] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => (localStorage.getItem('theme_color') as ThemeColor) || 'violet');
  const [carMode, setCarMode] = useState<CarMode>(() => {
    try { return JSON.parse(localStorage.getItem('car_mode') || '{"enabled":false,"largeControls":true,"simplifiedUI":true}'); } catch { return { enabled: false, largeControls: true, simplifiedUI: true }; }
  });
  const [ecoMode, setEcoMode] = useState(() => localStorage.getItem('eco_mode') === 'true');
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('focus_mode') === 'true');
  const [adaptiveMode, setAdaptiveMode] = useState(() => localStorage.getItem('adaptive_mode') === 'true');

  // ── hooks ────────────────────────────────────────────────
  const toast = useToast();
  const queue = useQueue();
  const offlineCache = useOfflineCache();
  const stats = useStats();
  const pwa = usePwaInstall();

  // ── all songs (search + recent + offline + playlists) for favorites lookup
  const allKnownSongs = useMemo<Song[]>(() => {
    const map = new Map<string, Song>();
    [...searchResults, ...recentlyPlayed, ...offlineCache.cachedSongs].forEach(s => {
      if (s?.videoId) map.set(s.videoId, s);
    });
    playlists.forEach(p => p.songs.forEach(s => { if (s?.videoId) map.set(s.videoId, s); }));
    return Array.from(map.values());
  }, [searchResults, recentlyPlayed, offlineCache.cachedSongs, playlists]);

  // ── player ───────────────────────────────────────────────
  const player = usePlayer({
    onSongEnd: () => {
      const nextSong = queue.nextSong(playerRef.current.shuffle, playerRef.current.repeat);
      if (nextSong) {
        playerRef.current.playSong(nextSong);
        addRecent(nextSong);
      } else if (playerRef.current.repeat === 'one' && playerRef.current.currentSong) {
        playerRef.current.playSong(playerRef.current.currentSong);
      }
    },
    onNext: () => {
      const nextSong = queue.nextSong(playerRef.current.shuffle, playerRef.current.repeat);
      if (nextSong) {
        playerRef.current.playSong(nextSong);
        addRecent(nextSong);
      }
    },
    onPrevious: () => {
      const prev = queue.previousSong();
      if (prev) playerRef.current.playSong(prev);
    },
  });

  const playerRef = useRef(player);
  playerRef.current = player;
  const searchRunRef = useRef(0);

  // ── recently played ──────────────────────────────────────
  const addRecent = useCallback((song: Song) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.videoId !== song.videoId);
      return [song, ...filtered].slice(0, 20);
    });
  }, []);

  // ── effects ──────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const palette = ACCENT_PALETTE[themeColor];
    document.documentElement.style.setProperty('--accent', palette.accent);
    document.documentElement.style.setProperty('--accent-2', palette.accent2);
    document.documentElement.style.setProperty('--accent-rgb', palette.rgb);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', palette.accent);
  }, [themeColor]);

  useEffect(() => {
    if (!apiKey) { setApiKeyStatus('unknown'); return; }
    let cancelled = false;
    setApiKeyStatus('checking');
    validateYouTubeKey(apiKey).then(r => { if (!cancelled) setApiKeyStatus(r.status); });
    return () => { cancelled = true; };
  }, [apiKey]);

  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('recently_played', JSON.stringify(recentlyPlayed.slice(0, 20))); }, [recentlyPlayed]);
  useEffect(() => { localStorage.setItem('privmitlab_playlists', JSON.stringify(playlists)); }, [playlists]);

  const toggleTheme = useCallback(() => setIsDark(p => !p), []);

  // ── search ───────────────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    const runId = ++searchRunRef.current;
    if (!query.trim()) { setSearchResults([]); setSearchQuery(''); setCurrentProvider(null); return; }
    setSearchQuery(query);
    setIsSearching(true);
    try {
      const result = await searchSongs(query, preferredProvider, apiKey);
      if (runId !== searchRunRef.current) return;
      setSearchResults(result.songs);
      const p = result.provider;
      const finalProvider: SearchProvider = (p === 'piped' || p === 'invidious' || p === 'youtube') ? p : preferredProvider;
      setCurrentProvider(finalProvider);
      if (result.songs.length === 0) toast.showInfo('No results found.');
      else toast.showInfo(`Found ${result.songs.length} results`);
    } catch {
      if (runId !== searchRunRef.current) return;
      toast.showError('Search failed. Please try again.');
    } finally {
      if (runId === searchRunRef.current) setIsSearching(false);
    }
  }, [preferredProvider, apiKey, toast]);

  // ── play ─────────────────────────────────────────────────
  const handlePlaySong = useCallback((song: Song) => {
    player.playSong(song);
    queue.playNow(song);
    addRecent(song);
  }, [player.playSong, queue.playNow, addRecent]);

  // ── favorites ────────────────────────────────────────────
  const handleToggleFavorite = useCallback((videoId: string) => {
    setFavorites(prev => {
      if (prev.includes(videoId)) {
        toast.showInfo('Removed from favorites');
        return prev.filter(id => id !== videoId);
      }
      toast.showSuccess('Added to favorites');
      return [...prev, videoId];
    });
  }, [toast]);

  // Get favorite songs from ALL known sources (search, recent, offline, playlists)
  const favoriteSongs = useMemo(() => {
    return allKnownSongs.filter(s => favorites.includes(s.videoId));
  }, [allKnownSongs, favorites]);

  // ── playlists ────────────────────────────────────────────
  const createPlaylist = useCallback(() => {
    const name = newPlaylistName.trim();
    if (!name) return;
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    setPlaylists(prev => [...prev, { id, name, songs: [] }]);
    setNewPlaylistName('');
    toast.showSuccess('Playlist created');
  }, [newPlaylistName, toast]);

  const addSongToPlaylist = useCallback((playlistId: string, song: Song | null) => {
    if (!song) { toast.showInfo('Play a song first'); return; }
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      if (p.songs.some(s => s.videoId === song.videoId)) {
        toast.showInfo('Already in playlist');
        return p;
      }
      toast.showSuccess(`Added to "${p.name}"`);
      return { ...p, songs: [song, ...p.songs] };
    }));
  }, [toast]);

  const playPlaylist = useCallback((playlist: Playlist) => {
    if (playlist.songs.length === 0) { toast.showInfo('Playlist is empty'); return; }
    queue.replaceQueue(playlist.songs, 0);
    player.playSong(playlist.songs[0]);
    addRecent(playlist.songs[0]);
    toast.showSuccess(`Playing "${playlist.name}"`);
  }, [addRecent, player, queue, toast]);

  const playPlaylistSong = useCallback((playlist: Playlist, song: Song) => {
    const startIndex = playlist.songs.findIndex(item => item.videoId === song.videoId);
    queue.replaceQueue(playlist.songs, Math.max(0, startIndex));
    player.playSong(song);
    addRecent(song);
  }, [addRecent, player, queue]);

  const removePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (activePlaylistView === id) setActivePlaylistView(null);
    toast.showInfo('Playlist removed');
  }, [activePlaylistView, toast]);

  const renamePlaylist = useCallback((id: string) => {
    const name = editingPlaylistName.trim();
    if (!name) return;
    setPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    setEditingPlaylistId(null);
    setEditingPlaylistName('');
    toast.showSuccess('Renamed');
  }, [editingPlaylistName, toast]);

  const removeSongFromPlaylist = useCallback((pid: string, vid: string) => {
    setPlaylists(prev => prev.map(p => p.id === pid ? { ...p, songs: p.songs.filter(s => s.videoId !== vid) } : p));
  }, []);

  // ── offline ──────────────────────────────────────────────
  const handleCacheSong = useCallback(async (song: Song) => {
    try { await offlineCache.cacheSong(song); toast.showSuccess('Song saved for offline'); }
    catch { toast.showError('Failed to save song'); }
  }, [offlineCache, toast]);

  const handleRemoveCache = useCallback(async (videoId: string) => {
    try { await offlineCache.removeCachedSong(videoId); toast.showInfo('Removed from offline'); }
    catch { toast.showError('Failed to remove'); }
  }, [offlineCache, toast]);

  // ── download ─────────────────────────────────────────────
  const handleDownloadMedia = useCallback(async (song: Song | null, type: 'audio' | 'video') => {
    if (!song) return;
    try {
      toast.showInfo(`${type} download preparing...`);
      await downloadMedia(song, type);
      toast.showSuccess(`${type} download started`);
    } catch {
      toast.showError(`${type} download failed`);
    }
  }, [toast]);

  const handleClearSearchCache = useCallback(() => { clearSearchCache(); toast.showSuccess('Search cache cleared'); }, [toast]);
  const handleClearOffline = useCallback(async () => {
    try { await offlineCache.clearCache(); toast.showSuccess('Offline cleared'); }
    catch { toast.showError('Failed'); }
  }, [offlineCache, toast]);

  const handleArtistClick = useCallback((name: string) => { setActiveTab('music'); handleSearch(name); }, [handleSearch]);
  const handleMoodClick = useCallback((q: string) => { setActiveTab('music'); handleSearch(q); }, [handleSearch]);

  const handleTogglePiP = useCallback(() => { player.togglePiP(); }, [player.togglePiP]);

  // ── NEW FEATURES handlers ────────────────────────────────
  const handleShare = useCallback(async () => {
    const song = player.currentSong;
    if (!song) { toast.showInfo('Play a song first'); return; }
    const result = await shareSong(song);
    if (result.success) {
      if (result.method === 'clipboard') toast.showSuccess('Link copied to clipboard!');
      else toast.showSuccess('Shared successfully!');
    }
  }, [player.currentSong, toast]);

  const handleVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.showError('Voice search not supported in this browser');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => { setIsVoiceSearch(true); toast.showInfo('Listening...'); };
    recognition.onend = () => setIsVoiceSearch(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      toast.showSuccess(`Searching for: ${transcript}`);
      handleSearch(transcript);
    };
    recognition.onerror = () => { toast.showError('Voice search failed'); setIsVoiceSearch(false); };
    recognition.start();
  }, [handleSearch, toast]);

  const handleExportData = useCallback(() => {
    const data = {
      favorites,
      playlists,
      recentlyPlayed,
      exportedAt: new Date().toISOString(),
    };
    downloadAsJSON(data, 'privmitlab-backup.json');
    toast.showSuccess('Data exported!');
  }, [favorites, playlists, recentlyPlayed, toast]);

  const handleImportData = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromJSON(file);
      if (data.favorites) setFavorites(data.favorites);
      if (data.playlists) setPlaylists(data.playlists);
      if (data.recentlyPlayed) setRecentlyPlayed(data.recentlyPlayed);
      toast.showSuccess('Data imported successfully!');
    } catch (err) {
      toast.showError('Failed to import data');
    }
    e.target.value = '';
  }, [toast]);

  const toggleCarMode = useCallback(() => {
    setCarMode(prev => {
      const next = { ...prev, enabled: !prev.enabled };
      localStorage.setItem('car_mode', JSON.stringify(next));
      toast.showInfo(next.enabled ? 'Car mode enabled' : 'Car mode disabled');
      return next;
    });
  }, [toast]);

  const changeThemeColor = useCallback((color: ThemeColor) => {
    setThemeColor(color);
    localStorage.setItem('theme_color', color);
    toast.showSuccess(`${color} theme applied`);
  }, [toast]);

  const toggleEcoMode = useCallback(() => {
    setEcoMode(prev => {
      const next = !prev;
      localStorage.setItem('eco_mode', String(next));
      toast.showInfo(next ? 'Eco mode enabled' : 'Eco mode disabled');
      return next;
    });
  }, [toast]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => {
      const next = !prev;
      localStorage.setItem('focus_mode', String(next));
      toast.showInfo(next ? 'Focus mode enabled' : 'Focus mode disabled');
      return next;
    });
  }, [toast]);

  const toggleAdaptiveMode = useCallback(() => {
    setAdaptiveMode(prev => {
      const next = !prev;
      localStorage.setItem('adaptive_mode', String(next));
      toast.showInfo(next ? 'Adaptive UI enabled' : 'Adaptive UI disabled');
      return next;
    });
  }, [toast]);

  const handleInstallApp = useCallback(async () => {
    if (pwa.isInstalled) {
      toast.showInfo('SwarWave is already installed');
      return;
    }
    if (!pwa.canInstall) {
      toast.showInfo('Use your browser menu to install this PWA');
      return;
    }
    const accepted = await pwa.install();
    toast[accepted ? 'showSuccess' : 'showInfo'](accepted ? 'Install started' : 'Install dismissed');
  }, [pwa, toast]);

  // Update stats when counts change
  useEffect(() => {
    stats.updateCounts(favorites.length, playlists.length, offlineCache.cachedSongs.length);
  }, [favorites.length, playlists.length, offlineCache.cachedSongs.length, stats.updateCounts]);

  const commandActions = useMemo<CommandAction[]>(() => [
    { id: 'play-pause', label: player.isPlaying ? 'Pause playback' : 'Play playback', hint: 'Space', keywords: ['music', 'player'], run: () => player.togglePlay() },
    { id: 'next', label: 'Next song', hint: 'N', keywords: ['skip'], run: () => {
      const nx = queue.nextSong(player.shuffle, player.repeat);
      if (nx) { player.playSong(nx); addRecent(nx); }
    }},
    { id: 'previous', label: 'Previous song', hint: 'P', keywords: ['back'], run: () => {
      const pv = queue.previousSong();
      if (pv) player.playSong(pv);
    }},
    { id: 'favorite', label: 'Favorite current song', hint: 'F', keywords: ['heart', 'like'], run: () => player.currentSong && handleToggleFavorite(player.currentSong.videoId) },
    { id: 'video', label: player.videoMode ? 'Close video mode' : 'Open video mode', keywords: ['youtube', 'watch'], run: () => player.toggleVideoMode() },
    { id: 'pip', label: 'Open Picture-in-Picture', keywords: ['popup', 'floating'], run: () => player.togglePiP() },
    { id: 'queue', label: 'Open queue', keywords: ['list'], run: () => setIsQueueOpen(true) },
    { id: 'settings', label: 'Open settings', keywords: ['provider', 'api', 'theme'], run: () => setIsSettingsOpen(true) },
    { id: 'stats', label: 'Open listening stats', keywords: ['analytics', 'history'], run: () => setIsStatsOpen(true) },
    { id: 'install', label: 'Install SwarWave app', keywords: ['pwa', 'app'], run: handleInstallApp },
    { id: 'eco', label: ecoMode ? 'Disable Eco mode' : 'Enable Eco mode', keywords: ['battery', 'performance'], run: toggleEcoMode },
    { id: 'focus', label: focusMode ? 'Disable Focus mode' : 'Enable Focus mode', keywords: ['clean', 'minimal'], run: toggleFocusMode },
    { id: 'adaptive', label: adaptiveMode ? 'Disable Adaptive UI' : 'Enable Adaptive UI', keywords: ['responsive', 'auto', 'performance'], run: toggleAdaptiveMode },
    { id: 'radio', label: 'Go to Radio', keywords: ['station'], run: () => setActiveTab('radio') },
    { id: 'music', label: 'Go to Music', keywords: ['songs', 'search'], run: () => setActiveTab('music') },
    { id: 'favorites', label: 'Go to Favorites', keywords: ['liked', 'heart'], run: () => setActiveTab('favorites') },
    { id: 'offline', label: 'Go to Offline songs', keywords: ['downloaded'], run: () => setActiveTab('offline') },
    { id: 'clear-cache', label: 'Clear search cache', keywords: ['reset'], run: handleClearSearchCache },
    { id: 'export', label: 'Export my data', keywords: ['backup'], run: handleExportData },
  ], [
    addRecent,
    handleClearSearchCache,
    handleExportData,
    handleInstallApp,
    handleToggleFavorite,
    adaptiveMode,
    ecoMode,
    focusMode,
    player,
    queue,
    toggleEcoMode,
    toggleAdaptiveMode,
    toggleFocusMode,
  ]);

  // Record play once per song after duration is known
  const recordedSongRef = useRef<string | null>(null);
  useEffect(() => {
    if (!player.currentSong) {
      recordedSongRef.current = null;
      return;
    }
    if (
      player.currentSong.videoId !== recordedSongRef.current &&
      player.isPlaying &&
      player.duration > 0
    ) {
      stats.recordPlay(player.currentSong, player.duration);
      recordedSongRef.current = player.currentSong.videoId;
    }
  }, [player.currentSong, player.isPlaying, player.duration, stats.recordPlay]);

  // ── keyboard shortcuts (PC) ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const p = playerRef.current;
      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault(); p.togglePlay(); break;
        case 'KeyN': {
          e.preventDefault();
          const nx = queue.nextSong(p.shuffle, p.repeat);
          if (nx) { p.playSong(nx); addRecent(nx); }
          break;
        }
        case 'KeyP': {
          e.preventDefault();
          const pv = queue.previousSong();
          if (pv) p.playSong(pv);
          break;
        }
        case 'KeyM': e.preventDefault(); p.toggleMute(); break;
        case 'KeyS': e.preventDefault(); p.toggleShuffle(); break;
        case 'KeyR': e.preventDefault(); p.cycleRepeat(); break;
        case 'KeyF':
          e.preventDefault(); if (p.currentSong) handleToggleFavorite(p.currentSong.videoId); break;
        case 'ArrowUp': e.preventDefault(); p.changeVolume(p.volume + 10); break;
        case 'ArrowDown': e.preventDefault(); p.changeVolume(p.volume - 10); break;
        case 'ArrowLeft':
          if (e.shiftKey) { e.preventDefault(); p.seekTo(p.currentTime - 10); } break;
        case 'ArrowRight':
          if (e.shiftKey) { e.preventDefault(); p.seekTo(p.currentTime + 10); } break;
        case 'Escape':
          if (showFullScreen) { e.preventDefault(); setShowFullScreen(false); }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queue, addRecent, handleToggleFavorite, showFullScreen]);

  const isHome = activeTab === 'home';
  const isMusicSurface = activeTab === 'home' || activeTab === 'music';
  const showHomeContent = isHome && !searchQuery && searchResults.length === 0;

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className={cn(
      'min-h-screen pb-32 sm:pb-28 transition-colors',
      isDark ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-purple-50 to-gray-100 text-gray-900',
      carMode.enabled && 'text-lg',
      ecoMode && 'eco-mode',
      adaptiveMode && 'adaptive-mode'
    )}
      style={{
        ['--accent' as any]: themeColor === 'violet' ? '#8b5cf6' :
          themeColor === 'blue' ? '#3b82f6' :
          themeColor === 'green' ? '#22c55e' :
          themeColor === 'orange' ? '#f97316' :
          themeColor === 'pink' ? '#ec4899' :
          themeColor === 'red' ? '#ef4444' : '#14b8a6',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-50"
        style={{
          background: `radial-gradient(circle at 15% 15%, color-mix(in srgb, var(--accent) 22%, transparent) 0, transparent 28%), radial-gradient(circle at 85% 0%, color-mix(in srgb, var(--accent-2) 18%, transparent) 0, transparent 24%)`,
        }}
      />
      {/* YT Player Wrapper - always visible in DOM, position depends on videoMode */}
      <div
        id="yt-player-wrapper"
        style={
          player.videoMode
            ? {
                position: 'fixed',
                left: '50%',
                top: '8vh',
                transform: 'translateX(-50%)',
                width: 'min(95vw, 900px)',
                aspectRatio: '16/9',
                zIndex: 55,
                background: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              }
            : { position: 'fixed', left: '-9999px', top: '-9999px', width: '320px', height: '180px', zIndex: -1 }
        }
      >
        <div ref={player.playerContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Video mode close button */}
      {player.videoMode && (
        <button
          onClick={() => player.toggleVideoMode()}
          className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[60] p-2.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white shadow-lg backdrop-blur-sm"
          aria-label="Close video"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <Header
        activeTab={activeTab} setActiveTab={setActiveTab}
        isDark={isDark} toggleTheme={toggleTheme}
        isOnline={isOnline} isPlayerReady={player.isReady}
        onSettingsClick={() => setIsSettingsOpen(true)}
        apiKeyStatus={apiKeyStatus === 'checking' ? 'unknown' : apiKeyStatus}
      />

      {/* Experience Panel - Home only */}
      {showHomeContent && (
        <ExperiencePanel
          isDark={isDark}
          isOnline={isOnline}
          apiStatus={apiKeyStatus === 'checking' ? 'unknown' : apiKeyStatus}
          canInstall={pwa.canInstall}
          isInstalled={pwa.isInstalled}
          onInstall={handleInstallApp}
          ecoMode={ecoMode}
          onEcoMode={toggleEcoMode}
          focusMode={focusMode}
          onFocusMode={toggleFocusMode}
          adaptiveMode={adaptiveMode}
          onAdaptiveMode={toggleAdaptiveMode}
        />
      )}

      {/* Quick Actions Bar - Home only */}
      {showHomeContent && !focusMode && <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-3 backdrop-blur-xl bg-white/70 border-gray-200/80 dark:bg-white/5 dark:border-white/10 shadow-sm">
          <button
            onClick={() => setIsCommandOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95',
              isDark ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300' : 'bg-violet-100 hover:bg-violet-200 text-violet-700'
            )}
          >
            Command
          </button>
          <button
            onClick={() => setIsStatsOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95',
              isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
          <button
            onClick={handleVoiceSearch}
            disabled={isVoiceSearch}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95',
              isVoiceSearch
                ? 'bg-red-500 text-white animate-pulse'
                : isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            <Mic className="w-4 h-4" />
            {isVoiceSearch ? 'Listening...' : 'Voice'}
          </button>
          <button
            onClick={handleShare}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95',
              isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleExportData}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95',
              isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            <FileDown className="w-4 h-4" />
            Export
          </button>
          <label className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer',
            isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          )}>
            <FileUp className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
          <button
            onClick={toggleCarMode}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95',
              carMode.enabled
                ? 'bg-orange-500 text-white'
                : isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            <Car className="w-4 h-4" />
            Car
          </button>
          {/* Theme Colors */}
          <div className="flex items-center gap-1 ml-auto">
            {(['violet', 'blue', 'green', 'orange', 'pink', 'red', 'teal'] as ThemeColor[]).map(color => (
              <button
                key={color}
                onClick={() => changeThemeColor(color)}
                className={cn(
                  'w-5 h-5 rounded-full transition-transform active:scale-110',
                  color === 'violet' ? 'bg-violet-500' :
                  color === 'blue' ? 'bg-blue-500' :
                  color === 'green' ? 'bg-green-500' :
                  color === 'orange' ? 'bg-orange-500' :
                  color === 'pink' ? 'bg-pink-500' :
                  color === 'red' ? 'bg-red-500' :
                  'bg-teal-500',
                  themeColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : 'opacity-60 hover:opacity-100'
                )}
                title={`${color} theme`}
              />
            ))}
          </div>
        </div>
      </div>}

      {/* Home guide - simple onboarding for first-time users */}
      {showHomeContent && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
          <div className={cn(
            'rounded-2xl border p-4 sm:p-5 backdrop-blur-xl',
            isDark ? 'bg-white/[0.045] border-white/10' : 'bg-white/75 border-gray-200/80'
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className={cn('text-lg sm:text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  How to use SwarWave
                </h2>
                <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Search a song, tap any result to play, use the bottom player for video, PiP, queue, favorite, EQ and sleep timer.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  ['1', 'Search music'],
                  ['2', 'Tap to play'],
                  ['3', 'Open player'],
                  ['4', 'Save playlist'],
                ].map(([step, label]) => (
                  <div key={step} className={cn('rounded-xl px-3 py-2 border', isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700')}>
                    <span className="font-bold" style={{ color: 'var(--accent)' }}>{step}.</span> {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Search bar */}
        {(isMusicSurface || activeTab === 'favorites' || activeTab === 'offline') && (
          <SearchBar
            onSearch={handleSearch} isLoading={isSearching}
            provider={currentProvider} isDark={isDark}
            preferredProvider={preferredProvider}
            placeholder={activeTab === 'favorites' ? 'Search in favorites...'
              : activeTab === 'offline' ? 'Search offline songs...'
              : 'Search songs, artists, albums...'}
          />
        )}

        {/* Welcome */}
        {showHomeContent && (
          <>
            <TrendingSearches onSearch={handleSearch} isDark={isDark} />
            <MoodSection onMoodClick={handleMoodClick} isDark={isDark} />
            <ArtistSection onArtistClick={handleArtistClick} isDark={isDark} />
          </>
        )}

        {/* PLAYLISTS — Home only so search results stay first */}
        {showHomeContent && (
          <section className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>📋 My Playlists</h2>
              <div className="flex gap-2">
                <input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createPlaylist(); }}
                  placeholder="New playlist name"
                  className={cn(
                    'min-w-0 flex-1 sm:w-56 px-3 py-2 rounded-lg border text-sm outline-none',
                    isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  )}
                />
                <button onClick={createPlaylist} className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 active:scale-95 transition-transform">
                  Create
                </button>
              </div>
            </div>

            {playlists.length === 0 ? (
              <div className={cn('text-center py-8 rounded-xl', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  No playlists yet. Create one above to organize your favorite songs!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {playlists.map(playlist => (
                  <div key={playlist.id} className={cn(
                    'p-4 rounded-xl border backdrop-blur-xl',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-gray-200/80'
                  )}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        {editingPlaylistId === playlist.id ? (
                          <div className="flex gap-1">
                            <input
                              value={editingPlaylistName}
                              onChange={(e) => setEditingPlaylistName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') renamePlaylist(playlist.id); if (e.key === 'Escape') setEditingPlaylistId(null); }}
                              autoFocus
                              className={cn('min-w-0 flex-1 px-2 py-1 rounded border text-sm', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200')}
                            />
                            <button onClick={() => renamePlaylist(playlist.id)} className="p-1.5 rounded bg-violet-500 text-white">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingPlaylistId(null)} className={cn('p-1.5 rounded', isDark ? 'bg-white/10' : 'bg-gray-100')}>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className={cn('font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>{playlist.name}</h3>
                            <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>{playlist.songs.length} songs</p>
                          </>
                        )}
                      </div>
                      {editingPlaylistId !== playlist.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingPlaylistId(playlist.id); setEditingPlaylistName(playlist.name); }}
                            className={cn('p-1.5 rounded', isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100')}
                            aria-label="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removePlaylist(playlist.id)}
                            className={cn('p-1.5 rounded', isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50')}
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        onClick={() => playPlaylist(playlist)}
                        disabled={playlist.songs.length === 0}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Play All
                      </button>
                      <button
                        onClick={() => addSongToPlaylist(playlist.id, player.currentSong)}
                        disabled={!player.currentSong}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 active:scale-95 transition-transform',
                          isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        + Now Playing
                      </button>
                      <button
                        onClick={() => setActivePlaylistView(activePlaylistView === playlist.id ? null : playlist.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95 transition-transform',
                          isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {activePlaylistView === playlist.id ? 'Hide' : 'View'}
                      </button>
                    </div>

                    {/* Add from search results */}
                    {searchResults.length > 0 && (
                      <div className="mb-3">
                        <button
                          onClick={() => setShowAddToPlaylist(showAddToPlaylist === playlist.id ? null : playlist.id)}
                          className={cn(
                            'w-full px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1',
                            isDark ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                          )}
                        >
                          <Plus className="w-3 h-3" />
                          Add from search results
                        </button>
                        {showAddToPlaylist === playlist.id && (
                          <div className={cn('mt-2 max-h-48 overflow-y-auto rounded-lg p-2 space-y-1', isDark ? 'bg-black/30' : 'bg-gray-50')}>
                            {searchResults.map(song => (
                              <button
                                key={song.videoId}
                                onClick={() => addSongToPlaylist(playlist.id, song)}
                                className={cn(
                                  'w-full flex items-center gap-2 p-2 rounded text-left hover:bg-violet-500/20',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                <img src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/default.jpg`} alt="" className="w-8 h-8 rounded object-cover" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">{song.title}</p>
                                  <p className="text-[10px] opacity-70 truncate">{song.artist}</p>
                                </div>
                                <Plus className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Songs list */}
                    {activePlaylistView === playlist.id && playlist.songs.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                        {playlist.songs.map(song => (
                          <div key={song.videoId} className={cn(
                            'flex items-center gap-2 p-2 rounded-lg',
                            isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                          )}>
                            <img src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/default.jpg`} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => playPlaylistSong(playlist, song)}>
                              <p className={cn('text-xs font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{song.title}</p>
                              <p className={cn('text-[10px] truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>{song.artist}</p>
                            </div>
                            <button
                              onClick={() => playPlaylistSong(playlist, song)}
                              className="p-1.5 rounded-full bg-violet-500 text-white"
                              aria-label="Play"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleToggleFavorite(song.videoId)}
                              className={cn(
                                'p-1.5 rounded',
                                favorites.includes(song.videoId)
                                  ? 'text-pink-500'
                                  : isDark ? 'text-gray-400' : 'text-gray-500'
                              )}
                              aria-label="Favorite"
                            >
                              <Heart className={cn('w-3.5 h-3.5', favorites.includes(song.videoId) && 'fill-current')} />
                            </button>
                            <button
                              onClick={() => removeSongFromPlaylist(playlist.id, song.videoId)}
                              className={cn('p-1.5 rounded', isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50')}
                              aria-label="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Favorites */}
        {activeTab === 'favorites' && (
          <div className="mt-6">
            <h2 className={cn('text-xl font-bold mb-4 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
              ❤️ Your Favorites
              <span className={cn('text-sm font-normal', isDark ? 'text-gray-400' : 'text-gray-500')}>
                ({favorites.length} songs)
              </span>
            </h2>
            {favoriteSongs.length === 0 ? (
              <div className={cn('text-center py-12 rounded-xl', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No favorites yet. Tap the ❤️ icon on any song.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {favoriteSongs.map(song => (
                  <SongCard key={song.videoId} song={song}
                    isPlaying={player.isPlaying} isCurrentSong={player.currentSong?.videoId === song.videoId}
                    isFavorite={true} isCached={offlineCache.isCached(song.videoId)}
                    isCaching={offlineCache.isCaching[song.videoId] || false} isDark={isDark}
                    onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite}
                    onAddToQueue={queue.addToQueue} onCache={handleCacheSong} onRemoveCache={handleRemoveCache} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Offline */}
        {activeTab === 'offline' && (
          <div className="mt-6">
            <h2 className={cn('text-xl font-bold mb-4 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
              📴 Offline Songs
              <span className={cn('text-sm font-normal', isDark ? 'text-gray-400' : 'text-gray-500')}>
                ({offlineCache.cachedSongs.length} songs)
              </span>
            </h2>
            {offlineCache.loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={cn('aspect-square rounded-xl animate-pulse', isDark ? 'bg-white/5' : 'bg-gray-200')} />
                ))}
              </div>
            ) : offlineCache.cachedSongs.length === 0 ? (
              <div className={cn('text-center py-12 rounded-xl', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No offline songs. Tap the download icon on any song.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {offlineCache.cachedSongs.map(song => (
                  <SongCard key={song.videoId} song={song}
                    isPlaying={player.isPlaying} isCurrentSong={player.currentSong?.videoId === song.videoId}
                    isFavorite={favorites.includes(song.videoId)} isCached={true} isCaching={false}
                    isDark={isDark} onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite}
                    onAddToQueue={queue.addToQueue} onCache={handleCacheSong} onRemoveCache={handleRemoveCache} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search results */}
        {isMusicSurface && !showHomeContent && (
          <div className="mt-6">
            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={cn('aspect-square rounded-xl animate-pulse', isDark ? 'bg-white/5' : 'bg-gray-200')} />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {searchResults.map(song => (
                  <SongCard key={song.videoId} song={song}
                    isPlaying={player.isPlaying} isCurrentSong={player.currentSong?.videoId === song.videoId}
                    isFavorite={favorites.includes(song.videoId)}
                    isCached={offlineCache.isCached(song.videoId)}
                    isCaching={offlineCache.isCaching[song.videoId] || false} isDark={isDark}
                    onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite}
                    onAddToQueue={queue.addToQueue} onCache={handleCacheSong} onRemoveCache={handleRemoveCache} />
                ))}
              </div>
            ) : searchQuery ? (
              <div className={cn('text-center py-12 rounded-xl', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No results found for "{searchQuery}"</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Radio */}
        {activeTab === 'radio' && (
          <RadioSection isDark={isDark}
            showToast={(message, type) => {
              if (type === 'error') toast.showError(message);
              else if (type === 'success') toast.showSuccess(message);
              else toast.showInfo(message);
            }} />
        )}

        {/* Recently played */}
        {isMusicSurface && recentlyPlayed.length > 0 && (
          <section className="mt-8">
            <h2 className={cn('text-xl font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>⏱️ Recently Played</h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4">
              {recentlyPlayed.slice(0, 10).map(song => (
                <div key={song.videoId} className="flex-shrink-0 w-28 sm:w-32 cursor-pointer" onClick={() => handlePlaySong(song)}>
                  <div className={cn('relative aspect-square rounded-xl overflow-hidden mb-2', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                    <img src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`}
                      alt={song.title} className="w-full h-full object-cover" loading="lazy" />
                    {player.currentSong?.videoId === song.videoId && player.isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-3 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite]" />
                          <span className="w-1 h-3 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.1s]" />
                          <span className="w-1 h-3 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.2s]" />
                        </span>
                      </div>
                    )}
                  </div>
                  <h4 className={cn('text-xs sm:text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{song.title}</h4>
                  <p className={cn('text-[10px] sm:text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>{song.artist}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Footer isDark={isDark} />
      </main>

      {/* Player bar */}
      <PlayerBar
        currentSong={player.currentSong} isPlaying={player.isPlaying}
        currentTime={player.currentTime} duration={player.duration}
        volume={player.volume} isMuted={player.isMuted}
        shuffle={player.shuffle} repeat={player.repeat}
        videoMode={player.videoMode} isDark={isDark}
        isFavorite={player.currentSong ? favorites.includes(player.currentSong.videoId) : false}
        onToggleFavorite={() => player.currentSong && handleToggleFavorite(player.currentSong.videoId)}
        onTogglePlay={player.togglePlay}
        onNext={() => {
          const nx = queue.nextSong(player.shuffle, player.repeat);
          if (nx) { player.playSong(nx); addRecent(nx); }
        }}
        onPrevious={() => { const pv = queue.previousSong(); if (pv) player.playSong(pv); }}
        onSeek={player.seekTo} onVolumeChange={player.changeVolume}
        onToggleMute={player.toggleMute} onToggleShuffle={player.toggleShuffle}
        onCycleRepeat={player.cycleRepeat} onToggleVideoMode={player.toggleVideoMode}
        onTogglePiP={handleTogglePiP}
        onDownloadAudio={() => handleDownloadMedia(player.currentSong, 'audio')}
        onDownloadVideo={() => handleDownloadMedia(player.currentSong, 'video')}
        eqPreset={player.eqPreset}
        onEqChange={player.setEqPreset}
        sleepRemaining={player.sleepRemaining}
        onSleepTimer={player.setSleepTimer}
        onToggleQueue={() => setIsQueueOpen(true)}
        queueCount={queue.queue.length}
        onExpand={() => setShowFullScreen(true)}
        showFullScreen={showFullScreen}
        onCloseFullScreen={() => setShowFullScreen(false)}
      />

      <VideoOverlay
        isVisible={player.videoMode && Boolean(player.currentSong)}
        videoId={player.currentSong?.videoId ?? null}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        isMuted={player.isMuted}
        onClose={player.toggleVideoMode}
        onTogglePlay={player.togglePlay}
        onNext={() => {
          const nx = queue.nextSong(player.shuffle, player.repeat);
          if (nx) { player.playSong(nx); addRecent(nx); }
        }}
        onPrevious={() => { const pv = queue.previousSong(); if (pv) player.playSong(pv); }}
        onSeek={player.seekTo}
        onToggleMute={player.toggleMute}
        onTogglePiP={handleTogglePiP}
      />

      {/* Queue panel */}
      <QueuePanel isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)}
        queue={queue.queue} currentIndex={queue.currentIndex} currentSong={player.currentSong}
        isDark={isDark} onPlaySong={(idx) => {
          queue.playAtIndex(idx);
          const song = queue.queue[idx];
          if (song) { player.playSong(song); addRecent(song); }
        }}
        onRemoveSong={queue.removeFromQueue} onClearQueue={queue.clearQueue} />

      {/* Settings */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        isDark={isDark} toggleTheme={toggleTheme}
        provider={preferredProvider} setProvider={setPreferredProvider}
        apiKey={apiKey} setApiKey={setApiKey}
        onClearCache={handleClearSearchCache} onClearOffline={handleClearOffline}
        cacheSize={offlineCache.cachedSongs.length} />

      {/* Statistics Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        isDark={isDark}
        stats={stats.stats}
        onReset={stats.resetStats}
        formatPlayTime={stats.formatPlayTime}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        isDark={isDark}
        actions={commandActions}
        onClose={() => setIsCommandOpen(false)}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} isDark={isDark} />
    </div>
  );
}

export default App;
