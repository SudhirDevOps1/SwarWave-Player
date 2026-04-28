import { useState, useEffect, useCallback } from 'react';
import type { Song, ListeningStats } from '@/types';

const STATS_KEY = 'privmitlab_stats_v1';

export function useStats() {
  const [stats, setStats] = useState<ListeningStats>({
    totalSongs: 0,
    totalPlayTime: 0,
    favoriteCount: 0,
    playlistCount: 0,
    offlineCount: 0,
    topArtists: [],
    topSongs: [],
    dailyPlays: [],
  });

  // Load stats on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) {
        setStats(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save stats when changed
  useEffect(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }, [stats]);

  // Record a play
  const recordPlay = useCallback((song: Song, duration: number) => {
    setStats(prev => {
      const today = new Date().toISOString().split('T')[0];

      // Update top songs
      const songIndex = prev.topSongs.findIndex(s => s.videoId === song.videoId);
      let newTopSongs = [...prev.topSongs];
      if (songIndex >= 0) {
        newTopSongs[songIndex] = {
          ...newTopSongs[songIndex],
          playCount: newTopSongs[songIndex].playCount + 1,
        };
      } else {
        newTopSongs.push({
          videoId: song.videoId,
          title: song.title,
          artist: song.artist,
          playCount: 1,
        });
      }
      newTopSongs.sort((a, b) => b.playCount - a.playCount);
      newTopSongs = newTopSongs.slice(0, 10);

      // Update top artists
      const artistIndex = prev.topArtists.findIndex(a => a.name === song.artist);
      let newTopArtists = [...prev.topArtists];
      if (artistIndex >= 0) {
        newTopArtists[artistIndex] = {
          ...newTopArtists[artistIndex],
          count: newTopArtists[artistIndex].count + 1,
        };
      } else {
        newTopArtists.push({ name: song.artist, count: 1 });
      }
      newTopArtists.sort((a, b) => b.count - a.count);
      newTopArtists = newTopArtists.slice(0, 10);

      // Update daily plays
      const todayIndex = prev.dailyPlays.findIndex(d => d.date === today);
      let newDailyPlays = [...prev.dailyPlays];
      if (todayIndex >= 0) {
        newDailyPlays[todayIndex] = { ...newDailyPlays[todayIndex], count: newDailyPlays[todayIndex].count + 1 };
      } else {
        newDailyPlays.push({ date: today, count: 1 });
      }
      newDailyPlays = newDailyPlays.slice(-30); // Keep last 30 days

      return {
        ...prev,
        totalSongs: prev.totalSongs + 1,
        totalPlayTime: prev.totalPlayTime + duration,
        topSongs: newTopSongs,
        topArtists: newTopArtists,
        dailyPlays: newDailyPlays,
      };
    });
  }, []);

  // Update counts from external sources
  const updateCounts = useCallback((favorites: number, playlists: number, offline: number) => {
    setStats(prev => ({
      ...prev,
      favoriteCount: favorites,
      playlistCount: playlists,
      offlineCount: offline,
    }));
  }, []);

  // Reset all stats
  const resetStats = useCallback(() => {
    setStats({
      totalSongs: 0,
      totalPlayTime: 0,
      favoriteCount: 0,
      playlistCount: 0,
      offlineCount: 0,
      topArtists: [],
      topSongs: [],
      dailyPlays: [],
    });
    localStorage.removeItem(STATS_KEY);
  }, []);

  // Format play time
  const formatPlayTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }, []);

  return {
    stats,
    recordPlay,
    updateCounts,
    resetStats,
    formatPlayTime,
  };
}
