import { useState, useCallback, useEffect } from 'react';
import type { Song, OfflineSong } from '@/types';
import {
  getAllCachedSongs,
  saveSong,
  deleteCachedSong,
  clearAllCachedSongs,
  isSongCached,
} from '@/utils/db';
import { getStreamUrl } from '@/utils/api';

export function useOfflineCache() {
  const [cachedSongs, setCachedSongs] = useState<OfflineSong[]>([]);
  const [isCaching, setIsCaching] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Load cached songs on mount
  useEffect(() => {
    loadCachedSongs();
  }, []);

  const loadCachedSongs = useCallback(async () => {
    try {
      setLoading(true);
      const songs = await getAllCachedSongs();
      setCachedSongs(songs);
    } catch (error) {
      console.error('Failed to load cached songs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const cacheSong = useCallback(async (song: Song) => {
    const videoId = song.videoId;
    
    try {
      setIsCaching((prev) => ({ ...prev, [videoId]: true }));
      
      // Check if already cached
      const alreadyCached = await isSongCached(videoId);
      if (alreadyCached) {
        return true;
      }

      // Get stream URL
      const { audioUrl } = await getStreamUrl(videoId);
      if (!audioUrl) {
        throw new Error('No audio stream available');
      }

      // Fetch audio blob
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch audio');
      }
      const blob = await response.blob();

      // Save to IndexedDB
      await saveSong(song, blob);
      await loadCachedSongs();
      
      return true;
    } catch (error) {
      console.error('Failed to cache song:', error);
      throw error;
    } finally {
      setIsCaching((prev) => ({ ...prev, [videoId]: false }));
    }
  }, [loadCachedSongs]);

  const removeCachedSong = useCallback(async (videoId: string) => {
    try {
      await deleteCachedSong(videoId);
      await loadCachedSongs();
    } catch (error) {
      console.error('Failed to remove cached song:', error);
      throw error;
    }
  }, [loadCachedSongs]);

  const clearCache = useCallback(async () => {
    try {
      await clearAllCachedSongs();
      setCachedSongs([]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, []);

  const isCached = useCallback((videoId: string) => {
    return cachedSongs.some((s) => s.videoId === videoId && s.audioBlob);
  }, [cachedSongs]);

  const getBlobUrl = useCallback((videoId: string) => {
    const song = cachedSongs.find((s) => s.videoId === videoId);
    if (song?.audioBlob) {
      return URL.createObjectURL(song.audioBlob);
    }
    return null;
  }, [cachedSongs]);

  return {
    cachedSongs,
    isCaching,
    loading,
    cacheSong,
    removeCachedSong,
    clearCache,
    isCached,
    getBlobUrl,
    refreshCache: loadCachedSongs,
  };
}
