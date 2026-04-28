import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2, Wifi, WifiOff, Server, Globe, Play } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SearchProvider } from '@/types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  provider: SearchProvider | null;
  isDark: boolean;
  placeholder?: string;
  preferredProvider?: SearchProvider;
}

export function SearchBar({
  onSearch,
  isLoading,
  provider,
  isDark,
  placeholder = 'Search songs, artists, albums...',
  preferredProvider = 'piped',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'checking' | 'failed'>('idle');
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback((value: string) => {
    setSearchStatus(value.trim() ? 'checking' : 'idle');
    onSearch(value.trim());
  }, [onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Update status based on input
    if (!value.trim()) {
      setSearchStatus('idle');
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onSearch('');
      return;
    }

    setSearchStatus('checking');

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      handleSearch(value);
    }, 300);
  }, [handleSearch, onSearch]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (query.trim()) {
      setSearchStatus('searching');
      handleSearch(query);
    }
  }, [query, handleSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchStatus('idle');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Update search status based on loading state
  useEffect(() => {
    if (isLoading) {
      setSearchStatus(prev => prev === 'idle' ? 'checking' : prev);
    } else {
      setSearchStatus(prev => prev === 'checking' || prev === 'searching' ? 'idle' : prev);
    }
  }, [isLoading]);

  const providerConfig = {
    piped: {
      label: 'Piped',
      icon: <Server className="w-3 h-3" />,
      color: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
      desc: 'Free, privacy-focused',
    },
    invidious: {
      label: 'Invidious',
      icon: <Globe className="w-3 h-3" />,
      color: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200',
      desc: 'Alternative frontend',
    },
    youtube: {
      label: 'YouTube API',
      icon: <Play className="w-3 h-3" />,
      color: isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200',
      desc: 'Official API (requires key)',
    },
  } as const;

  const currentConfig = provider ? providerConfig[provider] : providerConfig[preferredProvider];

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        {/* Search icon */}
        <Search
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
            isLoading
              ? 'text-violet-400 animate-pulse'
              : isDark
              ? 'text-gray-400'
              : 'text-gray-500'
          )}
        />

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'w-full pl-12 pr-24 sm:pr-36 py-3 rounded-xl border transition-all outline-none text-sm sm:text-base',
            isLoading
              ? isDark
                ? 'bg-white/10 border-violet-500/50 text-white'
                : 'bg-violet-50 border-violet-400 text-gray-900'
              : isDark
              ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50 focus:bg-white/10'
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20'
          )}
        />

        {/* Right side controls */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {/* Loading spinner */}
          {isLoading && (
            <div className="flex items-center gap-1.5 px-2 py-1">
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              <span className={cn('hidden sm:inline text-xs font-medium', isDark ? 'text-violet-400' : 'text-violet-600')}>
                {searchStatus === 'checking' ? 'Checking providers...' : 'Searching...'}
              </span>
            </div>
          )}

          {/* Clear button */}
          {!isLoading && query && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDark
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              )}
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Provider badge with live status */}
          {!isLoading && provider && (
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all',
                currentConfig.color
              )}
              title={currentConfig.desc}
            >
              {currentConfig.icon}
              <span className="hidden sm:inline">{currentConfig.label}</span>
              <span className="sm:hidden">{currentConfig.label.slice(0, 3)}</span>
            </div>
          )}

          {/* Preferred provider indicator when idle */}
          {!isLoading && !provider && (
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium',
                isDark ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-100 text-gray-500 border-gray-200'
              )}
              title={`Using ${providerConfig[preferredProvider].label} as default`}
            >
              {providerConfig[preferredProvider].icon}
              <span className="hidden sm:inline">{providerConfig[preferredProvider].label}</span>
              <span className="sm:hidden">{providerConfig[preferredProvider].label.slice(0, 3)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search status indicator below input */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className={cn('flex items-center gap-1.5', isDark ? 'text-violet-400' : 'text-violet-600')}>
              <div className="flex gap-0.5">
                <span className="w-1 h-1.5 rounded-full bg-current animate-[barBounce_0.5s_ease-in-out_infinite]" />
                <span className="w-1 h-1.5 rounded-full bg-current animate-[barBounce_0.5s_ease-in-out_infinite_0.1s]" />
                <span className="w-1 h-1.5 rounded-full bg-current animate-[barBounce_0.5s_ease-in-out_infinite_0.2s]" />
              </div>
              <span>Searching via {currentConfig.label}...</span>
            </div>
          ) : provider ? (
            <div className={cn('flex items-center gap-1.5', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
              <Wifi className="w-3.5 h-3.5" />
              <span>Results from {currentConfig.label}</span>
            </div>
          ) : (
            <div className={cn('flex items-center gap-1.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Type to search...</span>
            </div>
          )}
        </div>

        {/* Provider switch hint */}
        {!isLoading && (
          <div className={cn('hidden sm:block text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Change in Settings →
          </div>
        )}
      </div>
    </form>
  );
}
