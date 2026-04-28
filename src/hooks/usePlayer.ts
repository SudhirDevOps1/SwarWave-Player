import { useCallback, useEffect, useRef, useState } from 'react';
import type { RepeatMode, Song } from '@/types';

type EqPreset = 'flat' | 'bass' | 'pop' | 'rock' | 'vocal' | 'night';

interface UsePlayerOptions {
  onSongEnd?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let ytApiLoaded = false;
let ytApiLoading: Promise<void> | null = null;

function loadYTApi(): Promise<void> {
  if (ytApiLoaded && window.YT?.Player) return Promise.resolve();
  if (ytApiLoading) return ytApiLoading;

  ytApiLoading = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      ytApiLoaded = true;
      resolve();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      if (prevCallback) prevCallback();
      resolve();
    };

    tag.onerror = () => reject(new Error('YT API load failed'));
    document.head.appendChild(tag);

    setTimeout(() => {
      if (!ytApiLoaded) reject(new Error('YT API timeout'));
    }, 15000);
  });

  return ytApiLoading;
}

export function usePlayer(options: UsePlayerOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('player_volume') || 80));
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('none');
  const [videoMode, setVideoMode] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [eqPreset, setEqPresetState] = useState<EqPreset>(() => (localStorage.getItem('eq_preset') as EqPreset) || 'flat');
  const [sleepRemaining, setSleepRemaining] = useState(0);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef(options);
  const pollRef = useRef<number | null>(null);
  const sleepRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const forcePausedRef = useRef(false);
  const currentSongRef = useRef<Song | null>(null);
  const isReadyRef = useRef(false);

  optionsRef.current = options;
  currentSongRef.current = currentSong;

  const unlockAudio = useCallback(() => {
    try {
      const silent = document.getElementById('silent-audio') as HTMLAudioElement | null;
      if (silent) {
        silent.volume = 0.01;
        silent.play().catch(() => {});
      }
    } catch {}
  }, []);

  // Track last values so we only re-render when meaningful change happens
  const lastTimeRef = useRef(0);
  const lastDurationRef = useRef(0);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== 'function') return;
      try {
        const t = p.getCurrentTime() || 0;
        const d = p.getDuration() || 0;

        // Only update state if value actually changed (rounded to 1 sec for time)
        const tRounded = Math.floor(t);
        if (Number.isFinite(t) && tRounded !== lastTimeRef.current) {
          lastTimeRef.current = tRounded;
          setCurrentTime(t);
        }
        if (Number.isFinite(d) && d > 0 && d !== lastDurationRef.current) {
          lastDurationRef.current = d;
          setDuration(d);
        }

        // Update Media Session less frequently (every 2 seconds)
        if (
          tRounded % 2 === 0 &&
          'mediaSession' in navigator &&
          navigator.mediaSession.setPositionState &&
          d > 0 &&
          Number.isFinite(t) &&
          Number.isFinite(d)
        ) {
          try {
            navigator.mediaSession.setPositionState({
              duration: d,
              position: Math.min(t, d),
              playbackRate: 1,
            });
          } catch {}
        }
      } catch {}
    }, 500); // 500ms is smooth enough and saves CPU/battery
  }, []);

  const ensurePlayer = useCallback(async () => {
    if (playerRef.current && isReadyRef.current) return playerRef.current;
    await loadYTApi();
    if (!containerRef.current) throw new Error('Player container not ready');

    return await new Promise<any>((resolve) => {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          enablejsapi: 1,
          fs: 1,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
            setIsReady(true);
            isReadyRef.current = true;
            startPolling();
            resolve(event.target);
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === 1) {
              if (forcePausedRef.current) {
                event.target.pauseVideo?.();
                setIsPlaying(false);
                return;
              }
              startPolling();
              setIsPlaying(true);
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            } else if (state === 2) {
              // Keep polling slowly while paused so duration stays visible
              setIsPlaying(false);
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            } else if (state === 0) {
              setIsPlaying(false);
              if (!endedRef.current) {
                endedRef.current = true;
                optionsRef.current.onSongEnd?.();
              }
            } else if (state === 3 || state === 5) {
              // BUFFERING or CUED - update duration
              startPolling();
            }
          },
        },
      });
    });
  }, [startPolling, volume]);

  // Update Media Session metadata when song changes
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;
    
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: [
          { src: currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/hqdefault.jpg`, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        playerRef.current?.playVideo?.();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        playerRef.current?.pauseVideo?.();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        optionsRef.current.onNext?.() ?? optionsRef.current.onSongEnd?.();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        optionsRef.current.onPrevious?.();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null) playerRef.current?.seekTo?.(details.seekTime, true);
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        const t = playerRef.current?.getCurrentTime?.() || 0;
        playerRef.current?.seekTo?.(Math.max(0, t - offset), true);
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        const t = playerRef.current?.getCurrentTime?.() || 0;
        playerRef.current?.seekTo?.(t + offset, true);
      });
    } catch {}
  }, [currentSong]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (sleepRef.current) clearInterval(sleepRef.current);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      }
      try { playerRef.current?.destroy?.(); } catch {}
    };
  }, []);

  // Visibility change - resume audio
  useEffect(() => {
    const fn = () => { if (!document.hidden) unlockAudio(); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, [unlockAudio]);

  // ── PLAY SONG ──────────────────────────────────────────────
  const playSong = useCallback(async (song: Song) => {
    unlockAudio();
    forcePausedRef.current = false;
    endedRef.current = false;
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(0);

    try {
      const player = await ensurePlayer();
      player.loadVideoById(song.videoId);
      player.setVolume(volume);
      if (isMuted) player.mute();
      else player.unMute?.();
      startPolling();
      setIsPlaying(true);
    } catch (e) {
      console.error('playSong error:', e);
    }
  }, [volume, isMuted, unlockAudio, ensurePlayer, startPolling]);

  // ── CONTROLS ───────────────────────────────────────────────
  const play = useCallback(() => {
    unlockAudio();
    try {
      forcePausedRef.current = false;
      playerRef.current?.playVideo?.();
      startPolling();
      setIsPlaying(true);
    } catch {}
  }, [startPolling, unlockAudio]);

  const pause = useCallback(() => {
    try {
      const p = playerRef.current;
      forcePausedRef.current = true;
      if (p && typeof p.pauseVideo === 'function') {
        p.pauseVideo();
        p.getIframe?.()?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        // Force state sync immediately
        setIsPlaying(false);
        // Also update media session
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      }
    } catch (e) {
      console.error('Pause error:', e);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((time: number) => {
    try {
      playerRef.current?.seekTo?.(Math.max(0, time), true);
      setCurrentTime(Math.max(0, time));
    } catch {}
  }, []);

  const changeVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setVolume(clamped);
    localStorage.setItem('player_volume', String(clamped));
    try {
      playerRef.current?.setVolume?.(clamped);
      if (clamped > 0 && isMuted) {
        playerRef.current?.unMute?.();
        setIsMuted(false);
      }
    } catch {}
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        if (next) playerRef.current?.mute?.();
        else playerRef.current?.unMute?.();
      } catch {}
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(p => !p), []);
  const cycleRepeat = useCallback(() => {
    setRepeat(p => p === 'none' ? 'one' : p === 'one' ? 'all' : 'none');
  }, []);

  const toggleVideoMode = useCallback(() => {
    setVideoMode(p => !p);
  }, []);

  // ── PiP ────────────────────────────────────────────────────
  const togglePiP = useCallback(async () => {
    const song = currentSongRef.current;
    if (!song) return;

    // PRIMARY: Pop-out YouTube window (most reliable - works everywhere)
    try {
      const t = playerRef.current?.getCurrentTime?.() || 0;
      const w = window.open(
        `https://www.youtube.com/watch?v=${song.videoId}&t=${Math.floor(t)}`,
        'swarwave-pip',
        'width=480,height=360,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
      );
      if (w) {
        setIsPiP(true);
        // Monitor popup close
        const checkClosed = setInterval(() => {
          if (w.closed) {
            setIsPiP(false);
            clearInterval(checkClosed);
          }
        }, 1000);
      } else {
        // Pop-up blocked - user needs to allow pop-ups
        console.warn('PiP pop-up blocked by browser');
      }
      return;
    } catch (e) {
      console.error('Pop-out PiP failed:', e);
    }

    // FALLBACK: Try Document PiP API (Chrome 116+)
    try {
      const docPiP = (window as any).documentPictureInPicture;
      if (docPiP?.requestWindow) {
        const pipWin = await docPiP.requestWindow({ width: 480, height: 320 });
        pipWin.document.body.style.cssText = 'margin:0;background:#000;overflow:hidden;';
        const ifr = pipWin.document.createElement('iframe');
        const t = playerRef.current?.getCurrentTime?.() || 0;
        ifr.src = `https://www.youtube.com/embed/${song.videoId}?autoplay=1&start=${Math.floor(t)}&controls=1`;
        ifr.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        ifr.style.cssText = 'width:100%;height:100%;border:0;';
        pipWin.document.body.appendChild(ifr);
        setIsPiP(true);
        pipWin.addEventListener('pagehide', () => setIsPiP(false));
        return;
      }
    } catch (e) {
      console.error('Document PiP failed:', e);
    }

    // LAST RESORT: Native PiP on iframe (usually blocked by YouTube CORS)
    try {
      const wrapper = document.getElementById('yt-player-wrapper');
      const iframe = wrapper?.querySelector('iframe') as HTMLIFrameElement | null;
      if (iframe?.contentDocument) {
        const video = iframe.contentDocument.querySelector('video') as HTMLVideoElement | null;
        if (video?.requestPictureInPicture) {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            setIsPiP(false);
          } else {
            await video.requestPictureInPicture();
            setIsPiP(true);
          }
          return;
        }
      }
    } catch (e) {
      console.error('Native PiP failed:', e);
    }

    // All methods failed - PiP not available in this browser
    console.warn('All PiP methods failed');
  }, []);

  const setEqPreset = useCallback((preset: EqPreset) => {
    setEqPresetState(preset);
    localStorage.setItem('eq_preset', preset);
  }, []);

  const setSleepTimer = useCallback((minutes: number) => {
    if (sleepRef.current) {
      clearInterval(sleepRef.current);
      sleepRef.current = null;
    }
    if (minutes <= 0) {
      setSleepRemaining(0);
      return;
    }
    const endAt = Date.now() + minutes * 60 * 1000;
    setSleepRemaining(Math.ceil((endAt - Date.now()) / 1000));
    sleepRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        if (sleepRef.current) clearInterval(sleepRef.current);
        sleepRef.current = null;
        try { playerRef.current?.pauseVideo?.(); } catch {}
        setIsPlaying(false);
      }
    }, 1000);
  }, []);

  const resetGuards = useCallback(() => {
    endedRef.current = false;
  }, []);

  return {
    isPlaying,
    currentSong,
    currentTime,
    duration,
    volume,
    isMuted,
    isReady,
    shuffle,
    repeat,
    videoMode,
    isPiP,
    eqPreset,
    sleepRemaining,
    setIsPiP,
    playerContainerRef: containerRef,
    playSong,
    play,
    pause,
    togglePlay,
    seekTo,
    changeVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleVideoMode,
    togglePiP,
    setEqPreset,
    setSleepTimer,
    resetGuards,
  };
}
