import { useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, ListMusic, PictureInPicture2,
  Download, Video, Music, ChevronUp, ChevronDown, Sliders, Moon, Heart,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Song, RepeatMode } from '@/types';

interface PlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  videoMode: boolean;
  isDark: boolean;
  isFavorite?: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleVideoMode: () => void;
  onTogglePiP: () => void;
  onToggleFavorite?: () => void;
  onDownloadAudio?: () => void;
  onDownloadVideo?: () => void;
  eqPreset?: string;
  onEqChange?: (preset: 'flat' | 'bass' | 'pop' | 'rock' | 'vocal' | 'night') => void;
  sleepRemaining?: number;
  onSleepTimer?: (minutes: number) => void;
  onToggleQueue: () => void;
  queueCount: number;
  onExpand?: () => void;
  showFullScreen?: boolean;
  onCloseFullScreen?: () => void;
}

export function PlayerBar(props: PlayerBarProps) {
  const {
    currentSong, isPlaying, currentTime, duration, volume, isMuted,
    shuffle, repeat, videoMode, isDark, isFavorite,
    onTogglePlay, onNext, onPrevious, onSeek, onVolumeChange, onToggleMute,
    onToggleShuffle, onCycleRepeat, onToggleVideoMode, onTogglePiP,
    onToggleFavorite, onDownloadAudio, onDownloadVideo,
    eqPreset = 'flat', onEqChange, sleepRemaining = 0, onSleepTimer,
    onToggleQueue, queueCount, onExpand, showFullScreen, onCloseFullScreen,
  } = props;

  const progressRef = useRef<HTMLDivElement>(null);
  const [showExtras, setShowExtras] = useState(false);

  if (!currentSong) return null;

  const formatTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const sleepLabel = sleepRemaining > 0
    ? `${Math.floor(sleepRemaining / 60)}:${String(sleepRemaining % 60).padStart(2, '0')}`
    : 'Off';

  const handleSeek = (clientX: number) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    onSeek((x / rect.width) * duration);
  };

  const thumb = currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/mqdefault.jpg`;

  // ── FULL-SCREEN NOW PLAYING ────────────────────────────────
  if (showFullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 z-[60] flex flex-col overflow-y-auto',
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white'
          : 'bg-gradient-to-br from-white via-purple-50 to-gray-100 text-gray-900'
      )}>
        {/* Header — Close button always visible */}
        <div className="flex items-center justify-between p-4 flex-shrink-0 sticky top-0 z-10 backdrop-blur-md">
          <button
            onClick={onCloseFullScreen}
            className={cn(
              'p-3 rounded-full active:scale-95 transition-transform',
              isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
            )}
            aria-label="Close Now Playing"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider opacity-60">Now Playing</p>
          </div>
          <button
            onClick={onToggleQueue}
            className={cn(
              'p-3 rounded-full relative active:scale-95 transition-transform',
              isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
            )}
            aria-label="Queue"
          >
            <ListMusic className="w-5 h-5" />
            {queueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center font-bold">
                {queueCount > 9 ? '9+' : queueCount}
              </span>
            )}
          </button>
        </div>

        {/* Album art - Spinning CD style (MX Player style) */}
        <div className="flex-1 flex items-center justify-center px-6 py-2 min-h-[35vh]">
          <div className="relative aspect-square w-full max-w-sm">
            {/* Outer glow ring */}
            <div
              className={cn(
                'absolute inset-0 rounded-full transition-all duration-700',
                isPlaying && 'pulse-glow'
              )}
              style={{
                background: 'conic-gradient(from 0deg, var(--accent), var(--accent-2), var(--accent))',
                padding: '4px',
              }}
            >
              {/* CD body with thumbnail */}
              <div
                className={cn(
                  'relative w-full h-full rounded-full overflow-hidden bg-black',
                  'spin-cd',
                  !isPlaying && 'spin-cd-paused'
                )}
              >
                <img
                  src={thumb}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
                {/* Vinyl rings */}
                <div className="absolute inset-0 rounded-full border-2 border-black/20" />
                <div className="absolute inset-[8%] rounded-full border border-white/10" />
                <div className="absolute inset-[16%] rounded-full border border-white/5" />
                {/* Center hole */}
                <div className="absolute inset-[44%] rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Title + Favorite */}
        <div className="px-6 text-center flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold line-clamp-2">{currentSong.title}</h2>
          <p className={cn('text-sm mt-1 truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
            {currentSong.artist}
          </p>
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={cn(
                'mt-3 p-2.5 rounded-full transition-all active:scale-95',
                isFavorite
                  ? 'bg-pink-500/20 text-pink-500'
                  : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
              )}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
            </button>
          )}
        </div>

        {/* Progress - Colorful & visible */}
        <div className="px-6 mt-6 flex-shrink-0">
          <div
            ref={progressRef}
            onClick={(e) => handleSeek(e.clientX)}
            onTouchStart={(e) => e.touches[0] && handleSeek(e.touches[0].clientX)}
            className={cn(
              'relative h-3 cursor-pointer rounded-full overflow-hidden touch-none group',
              isDark ? 'bg-white/10' : 'bg-gray-200'
            )}
          >
            {/* Filled progress - vibrant gradient (only animated when playing) */}
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-linear',
                isPlaying && 'gradient-shift'
              )}
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent))',
                willChange: isPlaying ? 'width' : 'auto',
              }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 w-4 h-4 -translate-y-1/2 rounded-full bg-white shadow-lg ring-2"
              style={{
                left: `calc(${progress}% - 8px)`,
                ['--tw-ring-color' as any]: 'var(--accent)',
                opacity: duration > 0 ? 1 : 0,
              }}
            />
          </div>
          <div className={cn('flex justify-between items-center text-sm mt-3 font-medium tabular-nums', isDark ? 'text-gray-300' : 'text-gray-700')}>
            <span style={{ color: 'var(--accent)' }}>{formatTime(currentTime)}</span>
            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              {duration > 0 ? formatTime(duration) : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-around px-6 py-5 flex-shrink-0">
          <button onClick={onToggleShuffle} className={cn('p-3 rounded-full active:scale-90 transition-transform', shuffle ? 'text-violet-400' : isDark ? 'text-gray-400' : 'text-gray-600')}>
            <Shuffle className="w-5 h-5" />
          </button>
          <button onClick={onPrevious} className={cn('p-3 rounded-full active:scale-90 transition-transform', isDark ? 'text-white' : 'text-gray-900')}>
            <SkipBack className="w-7 h-7" />
          </button>
          <button onClick={onTogglePlay} className="p-5 rounded-full bg-violet-500 text-white shadow-2xl shadow-violet-500/40 hover:bg-violet-600 active:scale-90 transition-all">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          <button onClick={onNext} className={cn('p-3 rounded-full active:scale-90 transition-transform', isDark ? 'text-white' : 'text-gray-900')}>
            <SkipForward className="w-7 h-7" />
          </button>
          <button onClick={onCycleRepeat} className={cn('p-3 rounded-full active:scale-90 transition-transform', repeat !== 'none' ? 'text-violet-400' : isDark ? 'text-gray-400' : 'text-gray-600')}>
            {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume */}
        <div className="px-6 pb-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={onToggleMute} className="p-1">
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range" min="0" max="100" value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="flex-1 h-1.5 accent-violet-500"
          />
        </div>

        {/* Action buttons */}
        <div className={cn(
          'flex items-center justify-around px-2 py-3 border-t flex-shrink-0',
          isDark ? 'border-white/10' : 'border-gray-200'
        )}>
          <button onClick={onToggleVideoMode} className={cn('flex flex-col items-center gap-1 p-2 active:scale-90 transition-transform', videoMode ? 'text-violet-400' : isDark ? 'text-gray-400' : 'text-gray-600')}>
            {videoMode ? <Music className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            <span className="text-[10px]">{videoMode ? 'Audio' : 'Video'}</span>
          </button>
          <button onClick={onTogglePiP} className={cn('flex flex-col items-center gap-1 p-2 active:scale-90 transition-transform', isDark ? 'text-gray-400' : 'text-gray-600')}>
            <PictureInPicture2 className="w-5 h-5" />
            <span className="text-[10px]">PiP</span>
          </button>
          <button onClick={onDownloadAudio} className={cn('flex flex-col items-center gap-1 p-2 active:scale-90 transition-transform', isDark ? 'text-gray-400' : 'text-gray-600')}>
            <Download className="w-5 h-5" />
            <span className="text-[10px]">Audio</span>
          </button>
          <button onClick={onDownloadVideo} className={cn('flex flex-col items-center gap-1 p-2 active:scale-90 transition-transform', isDark ? 'text-gray-400' : 'text-gray-600')}>
            <Video className="w-5 h-5" />
            <span className="text-[10px]">Video</span>
          </button>
          <button onClick={() => setShowExtras(s => !s)} className={cn('flex flex-col items-center gap-1 p-2 active:scale-90 transition-transform', showExtras ? 'text-violet-400' : isDark ? 'text-gray-400' : 'text-gray-600')}>
            <Sliders className="w-5 h-5" />
            <span className="text-[10px]">EQ</span>
          </button>
        </div>

        {/* EQ + Sleep panel */}
        {showExtras && (
          <div className={cn('px-4 pb-4 flex flex-wrap gap-3 flex-shrink-0 border-t pt-3', isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50/50')}>
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <Sliders className="w-4 h-4 opacity-70" />
              <select
                value={eqPreset}
                onChange={(e) => onEqChange?.(e.target.value as any)}
                className={cn(
                  'flex-1 h-9 rounded-lg px-2 text-xs outline-none border',
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
                )}
              >
                <option value="flat">Flat</option>
                <option value="bass">Bass Boost</option>
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="vocal">Vocal</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <Moon className="w-4 h-4 opacity-70" />
              <select
                value={sleepRemaining > 0 ? 'active' : '0'}
                onChange={(e) => { if (e.target.value !== 'active') onSleepTimer?.(Number(e.target.value)); }}
                className={cn(
                  'flex-1 h-9 rounded-lg px-2 text-xs outline-none border',
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
                )}
              >
                {sleepRemaining > 0 && <option value="active">Sleep: {sleepLabel}</option>}
                <option value="0">Sleep Off</option>
                <option value="5">5 min</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── COMPACT BAR (default) ──────────────────────────────────
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom)]',
      isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-gray-200'
    )}>
      {/* Progress bar - colorful */}
      <div
        ref={progressRef}
        className={cn(
          'h-2 cursor-pointer relative touch-none group',
          isDark ? 'bg-white/10' : 'bg-gray-200'
        )}
        onClick={(e) => handleSeek(e.clientX)}
        onTouchStart={(e) => e.touches[0] && handleSeek(e.touches[0].clientX)}
      >
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-200 ease-linear"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
          }}
        />
        {/* Thumb on hover */}
        <div
          className="absolute top-1/2 w-3 h-3 -translate-y-1/2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Song info — tap to expand */}
          <button onClick={onExpand} className="flex items-center gap-2 flex-1 min-w-0 text-left active:scale-[0.98] transition-transform">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img src={thumb} alt={currentSong.title} className="w-full h-full object-cover" />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="flex gap-0.5">
                    <span className="w-0.5 h-2.5 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite]" />
                    <span className="w-0.5 h-2.5 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.1s]" />
                    <span className="w-0.5 h-2.5 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.2s]" />
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={cn('font-medium text-xs sm:text-sm truncate', isDark ? 'text-white' : 'text-gray-900')}>
                {currentSong.title}
              </h3>
              <p className={cn('text-[10px] sm:text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
                {currentSong.artist}
              </p>
            </div>
            <ChevronUp className={cn('w-4 h-4 flex-shrink-0 hidden sm:block', isDark ? 'text-gray-500' : 'text-gray-400')} />
          </button>

          {/* Mobile favorite button */}
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={cn(
                'sm:hidden p-2 active:scale-90 transition-transform',
                isFavorite ? 'text-pink-500' : isDark ? 'text-gray-400' : 'text-gray-500'
              )}
              aria-label="Favorite"
            >
              <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
            </button>
          )}

          {/* Mobile compact controls */}
          <div className="flex sm:hidden items-center gap-0.5">
            <button onClick={onPrevious} className={cn('p-2 active:scale-90', isDark ? 'text-gray-300' : 'text-gray-700')}>
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={onTogglePlay} className="p-2.5 rounded-full bg-violet-500 text-white shadow-lg active:scale-90 transition-transform">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={onNext} className={cn('p-2 active:scale-90', isDark ? 'text-gray-300' : 'text-gray-700')}>
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop full controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={onToggleShuffle} className={cn('p-2 rounded-lg', shuffle ? 'text-violet-400 bg-violet-500/20' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')} title="Shuffle">
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={onPrevious} className={cn('p-2 rounded-lg', isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}>
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={onTogglePlay} className="p-3 rounded-full bg-violet-500 text-white hover:bg-violet-600 shadow-lg shadow-violet-500/30">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={onNext} className={cn('p-2 rounded-lg', isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}>
              <SkipForward className="w-5 h-5" />
            </button>
            <button onClick={onCycleRepeat} className={cn('p-2 rounded-lg', repeat !== 'none' ? 'text-violet-400 bg-violet-500/20' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}>
              {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Time — desktop */}
          <div className={cn('hidden lg:flex items-center gap-1 text-xs min-w-[80px] justify-center', isDark ? 'text-gray-400' : 'text-gray-500')}>
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Desktop secondary */}
          <div className="hidden md:flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={cn(
                  'p-2 rounded-lg',
                  isFavorite ? 'text-pink-500' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                )}
                title="Favorite"
              >
                <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
              </button>
            )}
            <button onClick={onToggleMute} className={cn('p-2 rounded-lg', isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}>
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={(e) => onVolumeChange(parseInt(e.target.value))} className="w-20 h-1 accent-violet-500 cursor-pointer" />
            <button onClick={onToggleVideoMode} className={cn('p-2 rounded-lg', videoMode ? 'text-violet-400 bg-violet-500/20' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')} title="Video mode">
              {videoMode ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
            <button onClick={onTogglePiP} className={cn('p-2 rounded-lg', isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')} title="PiP">
              <PictureInPicture2 className="w-4 h-4" />
            </button>
            <button onClick={onDownloadAudio} className={cn('p-2 rounded-lg', isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')} title="Download">
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Queue */}
          <button onClick={onToggleQueue} className={cn('p-2 rounded-lg relative', isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')} title="Queue">
            <ListMusic className="w-5 h-5" />
            {queueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center font-bold">
                {queueCount > 9 ? '9+' : queueCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
