import { cn } from '@/utils/cn';
import { moods } from '@/data/artists';

interface MoodSectionProps {
  onMoodClick: (query: string) => void;
  isDark: boolean;
}

export function MoodSection({ onMoodClick, isDark }: MoodSectionProps) {
  return (
    <section className="mt-8">
      <h2 className={cn(
        'text-xl font-bold mb-4',
        isDark ? 'text-white' : 'text-gray-900'
      )}>
        🎭 Discover by Mood
      </h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {moods.map((mood) => (
          <button
            key={mood.name}
            onClick={() => onMoodClick(mood.query)}
            className={cn(
              'group relative flex flex-col items-center justify-center p-4 rounded-xl overflow-hidden transition-all',
              'bg-gradient-to-br',
              mood.color,
              'hover:scale-105 hover:shadow-lg'
            )}
          >
            <span className="text-3xl mb-2">{mood.emoji}</span>
            <span className="text-white font-semibold text-sm drop-shadow-md">
              {mood.name}
            </span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </section>
  );
}
