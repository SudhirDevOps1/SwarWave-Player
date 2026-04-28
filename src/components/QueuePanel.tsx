import { X, Play, Trash2, ListMusic, Music2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Song } from '@/types';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Song[];
  currentIndex: number;
  currentSong: Song | null;
  isDark: boolean;
  onPlaySong: (index: number) => void;
  onRemoveSong: (index: number) => void;
  onClearQueue: () => void;
}

export function QueuePanel({
  isOpen,
  onClose,
  queue,
  currentIndex,
  currentSong,
  isDark,
  onPlaySong,
  onRemoveSong,
  onClearQueue,
}: QueuePanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - z-[70] to appear above Now Playing (z-[60]) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-full sm:max-w-md z-[71] flex flex-col',
          'animate-slide-in-right',
          isDark
            ? 'bg-slate-900 border-l border-white/10'
            : 'bg-white border-l border-gray-200'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between p-4 border-b flex-shrink-0',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'p-2 rounded-lg',
                isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'
              )}
            >
              <ListMusic className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                Play Queue
              </h2>
              <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                {queue.length} song{queue.length !== 1 ? 's' : ''}
                {currentSong && ` · Now: ${currentIndex + 1}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
                )}
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              )}
              aria-label="Close queue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center mb-4',
                  isDark ? 'bg-white/5' : 'bg-gray-100'
                )}
              >
                <Music2 className={cn('w-10 h-10', isDark ? 'text-gray-500' : 'text-gray-400')} />
              </div>
              <p
                className={cn('font-semibold text-base', isDark ? 'text-gray-300' : 'text-gray-700')}
              >
                Queue is empty
              </p>
              <p className={cn('text-sm mt-1', isDark ? 'text-gray-500' : 'text-gray-400')}>
                Tap any song to add it here automatically
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((song, index) => {
                const isCurrentSong =
                  currentSong?.videoId === song.videoId && index === currentIndex;
                return (
                  <div
                    key={`${song.videoId}-${index}`}
                    className={cn(
                      'group flex items-center gap-3 p-2.5 rounded-xl transition-all border',
                      isCurrentSong
                        ? isDark
                          ? 'bg-violet-500/15 border-violet-500/40'
                          : 'bg-violet-50 border-violet-300'
                        : isDark
                        ? 'border-transparent hover:bg-white/5 active:bg-white/10'
                        : 'border-transparent hover:bg-gray-50 active:bg-gray-100'
                    )}
                  >
                    {/* Index / Now Playing indicator */}
                    <div
                      className={cn(
                        'w-7 text-center text-xs font-bold flex-shrink-0',
                        isCurrentSong
                          ? 'text-violet-400'
                          : isDark
                          ? 'text-gray-500'
                          : 'text-gray-400'
                      )}
                    >
                      {isCurrentSong ? (
                        <span className="flex justify-center items-end gap-0.5 h-4">
                          <span className="w-0.5 h-2 bg-current rounded-full animate-[barBounce_0.5s_ease-in-out_infinite]" />
                          <span className="w-0.5 h-3 bg-current rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.1s]" />
                          <span className="w-0.5 h-2.5 bg-current rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.2s]" />
                        </span>
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Thumbnail - click to play */}
                    <button
                      onClick={() => onPlaySong(index)}
                      className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden group/img"
                      aria-label={`Play ${song.title}`}
                    >
                      <img
                        src={
                          song.thumbnail ||
                          `https://i.ytimg.com/vi/${song.videoId}/default.jpg`
                        }
                        alt={song.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/50 transition-colors flex items-center justify-center">
                        <Play className="w-5 h-5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                      </div>
                    </button>

                    {/* Info - click to play */}
                    <button
                      onClick={() => onPlaySong(index)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <h4
                        className={cn(
                          'text-sm font-medium truncate',
                          isCurrentSong
                            ? 'text-violet-400'
                            : isDark
                            ? 'text-white'
                            : 'text-gray-900'
                        )}
                      >
                        {song.title}
                      </h4>
                      <p
                        className={cn(
                          'text-xs truncate',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        {song.artist}
                      </p>
                    </button>

                    {/* Delete button - always visible on mobile */}
                    <button
                      onClick={() => onRemoveSong(index)}
                      className={cn(
                        'p-2 rounded-lg transition-colors flex-shrink-0',
                        isDark
                          ? 'text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                          : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                      )}
                      aria-label="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
