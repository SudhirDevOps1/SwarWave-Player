import { cn } from '@/utils/cn';
import { trendingSearches } from '@/data/artists';

interface TrendingSearchesProps {
  onSearch: (query: string) => void;
  isDark: boolean;
}

export function TrendingSearches({ onSearch, isDark }: TrendingSearchesProps) {
  return (
    <section className="mt-6">
      <h3 className={cn(
        'text-sm font-medium mb-3',
        isDark ? 'text-gray-400' : 'text-gray-500'
      )}>
        🔥 Trending Searches
      </h3>
      <div className="flex flex-wrap gap-2">
        {trendingSearches.map((search) => (
          <button
            key={search}
            onClick={() => onSearch(search)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm transition-all',
              isDark
                ? 'bg-white/5 text-gray-300 hover:bg-violet-500/20 hover:text-violet-400 border border-white/10'
                : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-600'
            )}
          >
            {search}
          </button>
        ))}
      </div>
    </section>
  );
}
