import { useState, useCallback } from 'react';
import type { Song } from '@/types';

export function useQueue() {
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToQueue = useCallback((songs: Song | Song[]) => {
    setQueue((prev) => {
      const songsToAdd = Array.isArray(songs) ? songs : [songs];
      // Filter out duplicates - don't add if same videoId already in queue
      const uniqueSongs = songsToAdd.filter(
        newSong => !prev.some(existing => existing.videoId === newSong.videoId)
      );
      if (uniqueSongs.length === 0) return prev;
      return [...prev, ...uniqueSongs];
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });
    setCurrentIndex((prev) => {
      if (index < prev) return Math.max(0, prev - 1);
      if (index === prev) return Math.min(prev, queue.length - 2);
      return prev;
    });
  }, [queue.length]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  const playNow = useCallback((song: Song) => {
    setQueue((prev) => {
      const existingIndex = prev.findIndex(item => item.videoId === song.videoId);
      if (existingIndex >= 0) {
        setCurrentIndex(existingIndex);
        return prev;
      }
      setCurrentIndex(prev.length);
      return [...prev, song];
    });
  }, []);

  const replaceQueue = useCallback((songs: Song[], startIndex = 0) => {
    const uniqueSongs = songs.filter((song, index, arr) =>
      arr.findIndex(item => item.videoId === song.videoId) === index
    );
    setQueue(uniqueSongs);
    setCurrentIndex(Math.max(0, Math.min(startIndex, uniqueSongs.length - 1)));
  }, []);

  const playAtIndex = useCallback((index: number) => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
    }
  }, []);

  const nextSong = useCallback((shuffle: boolean, repeat: 'none' | 'one' | 'all') => {
    if (queue.length === 0) return null;

    if (shuffle) {
      let newIndex = Math.floor(Math.random() * queue.length);
      if (queue.length > 1) {
        while (newIndex === currentIndex) {
          newIndex = Math.floor(Math.random() * queue.length);
        }
      }
      setCurrentIndex(newIndex);
      return queue[newIndex];
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      return queue[nextIndex];
    }

    if (repeat === 'all') {
      setCurrentIndex(0);
      return queue[0];
    }

    return null;
  }, [queue, currentIndex]);

  const previousSong = useCallback(() => {
    if (queue.length === 0) return null;

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      return queue[prevIndex];
    }

    return queue[currentIndex];
  }, [queue, currentIndex]);

  const getCurrentSong = useCallback(() => {
    return queue[currentIndex] || null;
  }, [queue, currentIndex]);

  return {
    queue,
    currentIndex,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNow,
    replaceQueue,
    playAtIndex,
    nextSong,
    previousSong,
    getCurrentSong,
  };
}
