import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Search, X, Radio as RadioIcon, Volume2, Globe, Heart, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RadioStation } from '@/types';
import { radioCategories, searchStations } from '@/utils/radio';

interface RadioSectionProps {
  isDark: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function RadioSection({ isDark, showToast }: RadioSectionProps) {
  const [activeCategory, setActiveCategory] = useState('Top');
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('radio_volume') || 80));
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('radio_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('radio_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Apply volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    localStorage.setItem('radio_volume', String(volume));
  }, [volume]);

  // Load stations for active category
  useEffect(() => {
    if (searchQuery) return;
    void loadCategory(activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, searchQuery]);

  const loadCategory = async (category: string) => {
    try {
      setIsLoading(true);
      const loader = radioCategories[category as keyof typeof radioCategories];
      if (loader) {
        const data = await loader();
        setStations(data);
      }
    } catch {
      showToast('Failed to load radio stations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      void loadCategory(activeCategory);
      return;
    }

    try {
      setIsSearching(true);
      setIsLoading(true);
      const results = await searchStations(query);
      setStations(results);
    } catch {
      showToast('Search failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const playStation = useCallback(
    (station: RadioStation) => {
      if (!audioRef.current) return;

      const url = station.url_resolved || station.url;

      if (currentStation?.stationuuid === station.stationuuid) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          void audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
        return;
      }

      setCurrentStation(station);
      setIsStreamLoading(true);
      audioRef.current.src = url;
      audioRef.current.volume = volume / 100;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsStreamLoading(false);
          showToast(`Now playing: ${station.name}`, 'success');
        })
        .catch(() => {
          setIsStreamLoading(false);
          showToast('Station unavailable. Try another.', 'error');
        });
    },
    [currentStation, isPlaying, showToast, volume]
  );

  const stopRadio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentStation(null);
    setIsPlaying(false);
    setIsStreamLoading(false);
  }, []);

  const retryStream = useCallback(() => {
    if (!currentStation || !audioRef.current) return;
    const url = currentStation.url_resolved || currentStation.url;
    setIsStreamLoading(true);
    audioRef.current.src = url;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsStreamLoading(false);
        showToast(`Reconnected to ${currentStation.name}`, 'success');
      })
      .catch(() => {
        setIsStreamLoading(false);
        showToast('Stream error', 'error');
      });
  }, [currentStation, showToast]);

  const toggleFavorite = useCallback(
    (stationId: string) => {
      setFavorites(prev => {
        if (prev.includes(stationId)) {
          showToast('Removed from radio favorites', 'info');
          return prev.filter(id => id !== stationId);
        }
        showToast('Added to radio favorites', 'success');
        return [...prev, stationId];
      });
    },
    [showToast]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSearch(searchQuery);
  };

  const categories = Object.keys(radioCategories);

  return (
    <section className="mt-6">
      {/* Now Playing Bar - Sticky on top of section */}
      {currentStation && (
        <div
          className={cn(
            'mb-4 p-3 sm:p-4 rounded-2xl border backdrop-blur-xl',
            isDark
              ? 'bg-violet-500/10 border-violet-500/30'
              : 'bg-violet-50 border-violet-200'
          )}
        >
          <div className="flex items-center gap-3">
            {/* Animated icon */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center',
                  isPlaying ? 'pulse-glow' : ''
                )}
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent), var(--accent-2))',
                }}
              >
                {isStreamLoading ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : isPlaying ? (
                  <span className="flex items-end gap-0.5 h-5">
                    <span className="w-1 h-3 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite]" />
                    <span className="w-1 h-4 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.1s]" />
                    <span className="w-1 h-2.5 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.2s]" />
                    <span className="w-1 h-3.5 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.15s]" />
                  </span>
                ) : (
                  <RadioIcon className="w-5 h-5 text-white" />
                )}
              </div>
            </div>

            {/* Station info */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-[10px] sm:text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-violet-300' : 'text-violet-700'
                )}
              >
                {isStreamLoading ? 'Connecting...' : isPlaying ? 'On Air' : 'Paused'}
              </p>
              <h3 className={cn('font-bold text-sm sm:text-base truncate', isDark ? 'text-white' : 'text-gray-900')}>
                {currentStation.name}
              </h3>
              <div className={cn('flex items-center gap-2 text-[11px] sm:text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                {currentStation.country && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {currentStation.country}
                  </span>
                )}
                {currentStation.bitrate > 0 && <span>{currentStation.bitrate}kbps</span>}
                {currentStation.codec && <span className="uppercase">{currentStation.codec}</span>}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => toggleFavorite(currentStation.stationuuid)}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  favorites.includes(currentStation.stationuuid)
                    ? 'text-pink-500'
                    : isDark
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
                aria-label="Favorite"
              >
                <Heart
                  className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5',
                    favorites.includes(currentStation.stationuuid) && 'fill-current'
                  )}
                />
              </button>
              {!isStreamLoading && (
                <button
                  onClick={retryStream}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
                  )}
                  aria-label="Reconnect"
                  title="Reconnect"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => playStation(currentStation)}
                className="p-2.5 sm:p-3 rounded-full text-white shadow-lg active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button
                onClick={stopRadio}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
                )}
                aria-label="Stop"
                title="Stop"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2 mt-3">
            <Volume2 className={cn('w-4 h-4 flex-shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1 h-1.5 cursor-pointer"
            />
            <span className={cn('text-xs font-mono w-8 text-right', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {volume}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className={cn(
            'text-xl sm:text-2xl font-bold flex items-center gap-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          <RadioIcon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          Live Radio
          <span className={cn('text-xs sm:text-sm font-normal', isDark ? 'text-gray-400' : 'text-gray-500')}>
            (50,000+ stations)
          </span>
        </h2>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <Search
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search radio stations by name..."
            className={cn(
              'w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all',
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400'
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                void loadCategory(activeCategory);
              }}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded',
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              )}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Category chips */}
      {!isSearching && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95',
                activeCategory === cat
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : isDark
                  ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Station list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-20 rounded-xl animate-pulse',
                isDark ? 'bg-white/5' : 'bg-gray-100'
              )}
            />
          ))}
        </div>
      ) : stations.length === 0 ? (
        <div className={cn('text-center py-12 rounded-xl', isDark ? 'bg-white/5' : 'bg-gray-100')}>
          <RadioIcon className={cn('w-12 h-12 mx-auto mb-3 opacity-40', isDark ? 'text-gray-400' : 'text-gray-500')} />
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
            No stations found. Try another search or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto scrollbar-hide pb-4">
          {stations.map(station => {
            const isCurrent = currentStation?.stationuuid === station.stationuuid;
            const isFav = favorites.includes(station.stationuuid);
            return (
              <div
                key={station.stationuuid}
                className={cn(
                  'group flex items-center gap-3 p-3 rounded-xl transition-all border',
                  isDark
                    ? 'hover:bg-white/5 border-white/10'
                    : 'hover:bg-gray-50 border-gray-200',
                  isCurrent &&
                    isPlaying &&
                    (isDark
                      ? 'bg-violet-500/10 border-violet-500/40'
                      : 'bg-violet-50 border-violet-300')
                )}
              >
                {/* Favicon - click to play */}
                <button
                  onClick={() => playStation(station)}
                  className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/30 to-pink-500/30"
                  aria-label={`Play ${station.name}`}
                >
                  {station.favicon ? (
                    <img
                      src={station.favicon}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <RadioIcon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                    </div>
                  )}
                  {isCurrent && isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="flex gap-0.5 items-end">
                        <span className="w-1 h-3 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite]" />
                        <span className="w-1 h-4 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.1s]" />
                        <span className="w-1 h-2 bg-white rounded-full animate-[barBounce_0.5s_ease-in-out_infinite_0.2s]" />
                      </span>
                    </div>
                  )}
                </button>

                {/* Info - click to play */}
                <button
                  onClick={() => playStation(station)}
                  className="flex-1 min-w-0 text-left"
                >
                  <h3
                    className={cn(
                      'font-medium text-sm truncate',
                      isDark ? 'text-white' : 'text-gray-900',
                      isCurrent && 'text-violet-400'
                    )}
                  >
                    {station.name}
                  </h3>
                  <div
                    className={cn(
                      'flex items-center gap-2 text-xs mt-0.5',
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    )}
                  >
                    {station.country && <span>{station.country}</span>}
                    {station.codec && <span className="uppercase">{station.codec}</span>}
                    {station.bitrate > 0 && <span>{station.bitrate}kbps</span>}
                  </div>
                </button>

                {/* Favorite */}
                <button
                  onClick={() => toggleFavorite(station.stationuuid)}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    isFav
                      ? 'text-pink-500'
                      : isDark
                      ? 'text-gray-400 hover:bg-white/10'
                      : 'text-gray-500 hover:bg-gray-100'
                  )}
                  aria-label="Favorite"
                >
                  <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
                </button>

                {/* Play button */}
                <button
                  onClick={() => playStation(station)}
                  className={cn(
                    'p-2 rounded-full transition-all flex-shrink-0',
                    isCurrent && isPlaying
                      ? 'bg-violet-500 text-white'
                      : isDark
                      ? 'bg-white/10 text-gray-400 hover:bg-violet-500 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-violet-500 hover:text-white'
                  )}
                  aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onError={() => {
          setIsPlaying(false);
          setIsStreamLoading(false);
          showToast('Stream error. Click reconnect or try another.', 'error');
        }}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsStreamLoading(true)}
        onPlaying={() => setIsStreamLoading(false)}
      />
    </section>
  );
}
