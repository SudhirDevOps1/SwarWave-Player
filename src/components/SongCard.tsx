import { useState, useCallback } from 'react';
import { Play, Pause, Heart, Plus, Download, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Song } from '@/types';

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  isCurrentSong: boolean;
  isFavorite: boolean;
  isCached: boolean;
  isCaching: boolean;
  isDark: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (videoId: string) => void;
  onAddToQueue: (song: Song) => void;
  onCache: (song: Song) => void;
  onRemoveCache?: (videoId: string) => void;
  layout?: 'grid' | 'list';
}

export function SongCard({
  song,
  isPlaying,
  isCurrentSong,
  isFavorite,
  isCached,
  isCaching,
  isDark,
  onPlay,
  onToggleFavorite,
  onAddToQueue,
  onCache,
  onRemoveCache,
  layout = 'grid',
}: SongCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDuration = (val: number | string | undefined) => {
    if (!val) return '';
    const n = typeof val === 'string' ? parseInt(val, 10) : val;
    if (!n || isNaN(n) || n <= 0) return '';
    const mins = Math.floor(n / 60);
    const secs = Math.floor(n % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = useCallback(() => {
    onPlay(song);
  }, [song, onPlay]);

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(song.videoId);
  }, [song.videoId, onToggleFavorite]);

  const handleAddToQueue = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQueue(song);
  }, [song, onAddToQueue]);

  const handleCache = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCached && onRemoveCache) {
      onRemoveCache(song.videoId);
    } else {
      onCache(song);
    }
  }, [song, isCached, isCaching, onCache, onRemoveCache]);

  const thumbnailUrl = song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`;

  if (layout === 'list') {
    return (
      <div
        className={cn(
          'group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer',
          isDark
            ? 'hover:bg-white/5 border border-transparent hover:border-white/10'
            : 'hover:bg-gray-50 border border-transparent hover:border-gray-200',
          isCurrentSong && (isDark ? 'bg-violet-500/10 border-violet-500/30' : 'bg-violet-50 border-violet-300')
        )}
        onClick={handlePlay}
      >
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={song.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              'w-full h-full object-cover transition-all',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
          {(!imageLoaded || imageError) && (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-pink-500/30 animate-pulse" />
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {isPlaying && isCurrentSong ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-medium truncate',
            isDark ? 'text-white' : 'text-gray-900',
            isCurrentSong && 'text-violet-400'
          )}>
            {song.title}
          </h3>
          <p className={cn(
            'text-sm truncate',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            {song.artist}
          </p>
        </div>

        {/* Duration */}
        {song.duration ? (
          <span className={cn(
            'text-sm',
            isDark ? 'text-gray-500' : 'text-gray-400'
          )}>
            {formatDuration(song.duration)}
          </span>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFavorite}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isFavorite
                ? 'text-pink-500 hover:bg-pink-500/20'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
          </button>
          <button
            onClick={handleAddToQueue}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
            title="Add to queue"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleCache}
            disabled={isCaching}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isCached
                ? 'text-emerald-500 hover:bg-emerald-500/20'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
            title={isCached ? 'Remove from offline' : 'Download for offline'}
          >
            {isCached ? (
              <Check className="w-4 h-4" />
            ) : isCaching ? (
              <Download className="w-4 h-4 animate-bounce" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden transition-all cursor-pointer',
        isDark
          ? 'bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-white/10'
          : 'bg-white border border-gray-200 hover:border-violet-400 hover:shadow-lg',
        isCurrentSong && (isDark ? 'border-violet-500/50 bg-violet-500/10' : 'border-violet-400 bg-violet-50')
      )}
      onClick={handlePlay}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={song.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={cn(
            'w-full h-full object-cover transition-all group-hover:scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
        {(!imageLoaded || imageError) && (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-pink-500/30 animate-pulse" />
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/50 transform scale-90 group-hover:scale-100 transition-transform">
            {isPlaying && isCurrentSong ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </div>
        </div>

        {/* Now playing indicator */}
        {isCurrentSong && isPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/90 text-white text-xs font-medium">
            <span className="flex gap-0.5">
              <span className="w-1 h-3 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite]" />
              <span className="w-1 h-3 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.1s]" />
              <span className="w-1 h-3 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.2s]" />
            </span>
            <span>Playing</span>
          </div>
        )}

        {/* Duration badge */}
        {song.duration ? (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs">
            {formatDuration(song.duration)}
          </span>
        ) : null}

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFavorite}
            className={cn(
              'p-2 rounded-lg backdrop-blur-sm transition-colors',
              isFavorite
                ? 'bg-pink-500/90 text-white'
                : 'bg-black/50 text-white hover:bg-pink-500/90'
            )}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
          </button>
          <button
            onClick={handleAddToQueue}
            className="p-2 rounded-lg bg-black/50 text-white hover:bg-violet-500/90 backdrop-blur-sm transition-colors"
            title="Add to queue"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleCache}
            disabled={isCaching}
            className={cn(
              'p-2 rounded-lg backdrop-blur-sm transition-colors',
              isCached
                ? 'bg-emerald-500/90 text-white'
                : 'bg-black/50 text-white hover:bg-emerald-500/90'
            )}
            title={isCached ? 'Remove from offline' : 'Download for offline'}
          >
            {isCached ? (
              <Check className="w-4 h-4" />
            ) : isCaching ? (
              <Download className="w-4 h-4 animate-bounce" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className={cn(
          'font-medium text-sm line-clamp-2',
          isDark ? 'text-white' : 'text-gray-900',
          isCurrentSong && 'text-violet-400'
        )}>
          {song.title}
        </h3>
        <p className={cn(
          'text-xs mt-1 truncate',
          isDark ? 'text-gray-400' : 'text-gray-500'
        )}>
          {song.artist}
        </p>
      </div>
    </div>
  );
}
