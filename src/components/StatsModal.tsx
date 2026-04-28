import { BarChart3, Music, Heart, Clock, TrendingUp, Calendar, Trash2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ListeningStats } from '@/types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  stats: ListeningStats;
  onReset: () => void;
  formatPlayTime: (seconds: number) => string;
}

export function StatsModal({ isOpen, onClose, isDark, stats, onReset, formatPlayTime }: StatsModalProps) {
  if (!isOpen) return null;

  const StatCard = ({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string | number; subValue?: string }) => (
    <div className={cn(
      'p-4 rounded-xl border backdrop-blur-xl',
      isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-gray-200/80'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600')}>
          {icon}
        </div>
        <div>
          <p className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>{value}</p>
          <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{label}</p>
          {subValue && <p className={cn('text-[10px] mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>{subValue}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4',
        isDark ? 'text-white' : 'text-gray-900'
      )}>
        <div className={cn(
          'w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto',
          isDark ? 'bg-slate-900 border border-white/10' : 'bg-white border border-gray-200'
        )}>
          {/* Header */}
          <div className={cn('flex items-center justify-between p-4 border-b sticky top-0 backdrop-blur-xl', isDark ? 'border-white/10 bg-slate-900/95' : 'border-gray-200 bg-white/95')}>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              Listening Statistics
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className={cn('p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors')}
                title="Reset all stats"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className={cn('p-2 rounded-lg', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Music className="w-5 h-5" />}
                label="Songs Played"
                value={stats.totalSongs.toLocaleString()}
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Total Play Time"
                value={formatPlayTime(stats.totalPlayTime)}
              />
              <StatCard
                icon={<Heart className="w-5 h-5" />}
                label="Favorites"
                value={stats.favoriteCount}
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Playlists"
                value={stats.playlistCount}
              />
            </div>

            {/* Top Artists */}
            {stats.topArtists.length > 0 && (
              <div>
                <h3 className={cn('text-sm font-semibold mb-3 flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  Top Artists
                </h3>
                <div className="space-y-2">
                  {stats.topArtists.slice(0, 5).map((artist, idx) => (
                    <div key={artist.name} className={cn('flex items-center gap-3 p-3 rounded-lg', isDark ? 'bg-white/5' : 'bg-gray-50')}>
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                        isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{artist.name}</p>
                      </div>
                      <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{artist.count} plays</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Songs */}
            {stats.topSongs.length > 0 && (
              <div>
                <h3 className={cn('text-sm font-semibold mb-3 flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  <Music className="w-4 h-4 text-violet-400" />
                  Most Played Songs
                </h3>
                <div className="space-y-2">
                  {stats.topSongs.slice(0, 5).map((song, idx) => (
                    <div key={song.videoId} className={cn('flex items-center gap-3 p-3 rounded-lg', isDark ? 'bg-white/5' : 'bg-gray-50')}>
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                        isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{song.title}</p>
                        <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>{song.artist}</p>
                      </div>
                      <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{song.playCount}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Activity */}
            {stats.dailyPlays.length > 0 && (
              <div>
                <h3 className={cn('text-sm font-semibold mb-3 flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  <Calendar className="w-4 h-4 text-violet-400" />
                  Recent Activity
                </h3>
                <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
                  {stats.dailyPlays.slice(-14).map(day => (
                    <div key={day.date} className="flex flex-col items-center gap-1 min-w-[36px]">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium',
                        day.count > 10 ? 'bg-violet-500 text-white' :
                        day.count > 5 ? 'bg-violet-500/60 text-white' :
                        day.count > 0 ? isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700' :
                        isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'
                      )}>
                        {day.count}
                      </div>
                      <span className={cn('text-[9px]', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {stats.totalSongs === 0 && (
              <div className={cn('text-center py-12 rounded-xl', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                <BarChart3 className={cn('w-12 h-12 mx-auto mb-3 opacity-40', isDark ? 'text-gray-400' : 'text-gray-500')} />
                <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Start listening to see your stats!
                </p>
                <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-400')}>
                  Play songs to track your listening habits
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
