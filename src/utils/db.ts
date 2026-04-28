import type { OfflineSong, Song } from '@/types';

const DB_NAME = 'privmitlab-db';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

let db: IDBDatabase | null = null;

// Open IndexedDB connection
export async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'videoId' });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
  });
}

// Save song to IndexedDB
export async function saveSong(song: Song, audioBlob?: Blob): Promise<void> {
  const database = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const offlineSong: OfflineSong = {
      ...song,
      audioBlob,
      cachedAt: Date.now(),
    };

    const request = store.put(offlineSong);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get all cached songs
export async function getAllCachedSongs(): Promise<OfflineSong[]> {
  const database = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Get single cached song
export async function getCachedSong(videoId: string): Promise<OfflineSong | null> {
  const database = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(videoId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Delete song from cache
export async function deleteCachedSong(videoId: string): Promise<void> {
  const database = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(videoId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Clear all cached songs
export async function clearAllCachedSongs(): Promise<void> {
  const database = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Check if song is cached
export async function isSongCached(videoId: string): Promise<boolean> {
  const song = await getCachedSong(videoId);
  return song !== null && song.audioBlob !== undefined;
}
