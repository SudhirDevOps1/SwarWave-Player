import type { Song } from '@/types';

let lastPosition = 0;

// Set Media Session metadata for lock screen controls
export function setMediaSession(
  song: Song,
  actions: {
    play: () => void;
    pause: () => void;
    next: () => void;
    previous: () => void;
    seekTo?: (time: number) => void;
  }
) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    artwork: [
      {
        src: song.thumbnail || 'https://via.placeholder.com/512',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  });

  navigator.mediaSession.setActionHandler('play', actions.play);
  navigator.mediaSession.setActionHandler('pause', actions.pause);
  navigator.mediaSession.setActionHandler('nexttrack', actions.next);
  navigator.mediaSession.setActionHandler('previoustrack', actions.previous);
  
  if (actions.seekTo) {
    const seekTo = actions.seekTo;
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seekTo(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const offset = details.seekOffset || 10;
      seekTo(Math.max(0, lastPosition - offset));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const offset = details.seekOffset || 10;
      seekTo(lastPosition + offset);
    });
  }
}

export function setMediaPosition(duration: number, position: number, playbackRate = 1) {
  lastPosition = position;
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(position)) return;
  try {
    navigator.mediaSession.setPositionState({ duration, position: Math.min(position, duration), playbackRate });
  } catch {
    // Some browsers throw if values are out of range.
  }
}

// Clear Media Session
export function clearMediaSession() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.setActionHandler('play', null);
  navigator.mediaSession.setActionHandler('pause', null);
  navigator.mediaSession.setActionHandler('nexttrack', null);
  navigator.mediaSession.setActionHandler('previoustrack', null);
}

// Update playback state
export function setPlaybackState(state: 'playing' | 'paused' | 'none') {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = state;
}

// Keep-alive interval for background playback
let keepAliveInterval: number | null = null;

export function startKeepAlive() {
  if (keepAliveInterval) return;
  navigator.serviceWorker?.controller?.postMessage({ type: 'KEEP_ALIVE_START' });
  
  keepAliveInterval = window.setInterval(() => {
    // Touch the title to prevent browser from killing the page
    const originalTitle = document.title;
    document.title = '● ' + new Date().toLocaleTimeString();
    requestAnimationFrame(() => {
      document.title = originalTitle;
    });
  }, 15000);
}

export function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  navigator.serviceWorker?.controller?.postMessage({ type: 'KEEP_ALIVE_STOP' });
}
