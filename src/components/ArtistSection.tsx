import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { artists } from '@/data/artists';
import { getArtistImage, generateAvatarUrl } from '@/utils/artistImages';

interface ArtistSectionProps {
  onArtistClick: (artistName: string) => void;
  isDark: boolean;
}

type Category = 'bollywood' | 'bhojpuri' | 'punjabi' | 'haryanvi' | 'english' | 'rap' | 'legends';

const categoryLabels: Record<Category, string> = {
  bollywood: 'Bollywood',
  bhojpuri: 'Bhojpuri',
  punjabi: 'Punjabi',
  haryanvi: 'Haryanvi',
  english: 'English',
  rap: 'Rap/Hip-Hop',
  legends: 'Legends',
};

export function ArtistSection({ onArtistClick, isDark }: ArtistSectionProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('bollywood');
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});

  const filteredArtists = artists.filter((a) => a.category === activeCategory);

  // Load artist images
  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, string> = {};
      for (const artist of filteredArtists) {
        if (artist.image) {
          images[artist.name] = artist.image;
        } else {
          images[artist.name] = generateAvatarUrl(artist.name);
          // Lazy load real image
          getArtistImage(artist.name).then((url) => {
            setArtistImages((prev) => ({ ...prev, [artist.name]: url }));
          });
        }
      }
      setArtistImages(images);
    };
    loadImages();
  }, [activeCategory]);

  const categories: Category[] = ['bollywood', 'bhojpuri', 'punjabi', 'haryanvi', 'english', 'rap', 'legends'];

  return (
    <section className="mt-8">
      <h2 className={cn(
        'text-xl font-bold mb-4',
        isDark ? 'text-white' : 'text-gray-900'
      )}>
        🎤 Curated Artists
      </h2>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              activeCategory === cat
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                : isDark
                ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            )}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Artist grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filteredArtists.map((artist) => (
          <button
            key={artist.name}
            onClick={() => onArtistClick(artist.name)}
            className={cn(
              'group flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
              isDark
                ? 'hover:bg-white/5 border border-transparent hover:border-white/10'
                : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
            )}
          >
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-violet-500/50 transition-all">
              <img
                src={artistImages[artist.name] || generateAvatarUrl(artist.name)}
                alt={artist.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className={cn(
              'text-xs font-medium text-center line-clamp-2',
              isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
            )}>
              {artist.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
