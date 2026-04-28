import { X, Volume2, VolumeX, Maximize2, PictureInPicture2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface VideoOverlayProps {
  isVisible: boolean;
  videoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onTogglePiP?: () => void;
}

export function VideoOverlay({
  isVisible,
  videoId,
  isPlaying,
  currentTime,
  duration,
  isMuted,
  onClose,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onToggleMute,
  onTogglePiP,
}: VideoOverlayProps) {
  if (!isVisible || !videoId) return null;

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    const wrapper = document.getElementById('yt-player-wrapper');
    if (wrapper) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        wrapper.requestFullscreen?.().catch(() => {});
      }
    }
  };

  return (
    <>
      {/* Backdrop dim layer (lower z than yt-player-wrapper) */}
      <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm pointer-events-none sm:pointer-events-auto" onClick={onClose} />

      {/* Floating control bar */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-full px-2 py-1.5 shadow-lg pointer-events-auto">
        <button
          onClick={onToggleMute}
          className="p-2 rounded-full hover:bg-white/15 text-white transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        {onTogglePiP && (
          <button
            onClick={onTogglePiP}
            className="p-2 rounded-full hover:bg-white/15 text-white transition-colors"
            title="Picture in Picture"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleFullscreen}
          className="p-2 rounded-full hover:bg-white/15 text-white transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Close
        </button>
      </div>

      {/* Bottom custom video controls */}
      <div className="fixed left-1/2 bottom-24 sm:bottom-8 -translate-x-1/2 z-[60] w-[min(94vw,900px)] pointer-events-auto">
        <div className="rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 p-3 shadow-2xl">
          <div
            className="relative h-2 rounded-full bg-white/15 overflow-hidden cursor-pointer touch-none"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const pct = (event.clientX - rect.left) / rect.width;
              onSeek(Math.max(0, Math.min(duration || 0, pct * (duration || 0))));
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/70 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : 'Loading...'}</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-3">
            <button onClick={onPrevious} className="p-2 rounded-full hover:bg-white/15 text-white" title="Previous">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={onTogglePlay} className="p-3 rounded-full text-white shadow-lg active:scale-95" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button onClick={onNext} className="p-2 rounded-full hover:bg-white/15 text-white" title="Next">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
