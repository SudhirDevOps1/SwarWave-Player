import { Sun, Moon, Music, Radio, Heart, HardDrive, Settings, Home } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ActiveTab } from '@/types';
import { APP_AUTHOR, APP_NAME, APP_TAGLINE } from '@/config/app';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  isOnline: boolean;
  isPlayerReady: boolean;
  onSettingsClick: () => void;
  apiKeyStatus?: 'connected' | 'invalid' | 'quota' | 'error' | 'unknown';
}

export function Header({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  isOnline,
  isPlayerReady,
  onSettingsClick,
  apiKeyStatus = 'unknown',
}: HeaderProps) {
  const statusDot =
    apiKeyStatus === 'connected' ? { color: 'bg-emerald-400', title: 'YouTube API · Connected' } :
    apiKeyStatus === 'invalid'   ? { color: 'bg-red-400',     title: 'YouTube API · Invalid Key' } :
    apiKeyStatus === 'quota'     ? { color: 'bg-orange-400',  title: 'YouTube API · Quota Exceeded' } :
    apiKeyStatus === 'error'     ? { color: 'bg-red-400',     title: 'YouTube API · Disconnected' } :
                                   { color: 'bg-gray-400',    title: 'YouTube API · Not Set' };
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'music', label: 'Music', icon: <Music className="w-4 h-4" /> },
    { id: 'radio', label: 'Radio', icon: <Radio className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4" /> },
    { id: 'offline', label: 'Offline', icon: <HardDrive className="w-4 h-4" /> },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-xl border-b',
        isDark
          ? 'bg-slate-900/80 border-white/10'
          : 'bg-white/80 border-gray-200/80'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
              >
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className={cn(
                'text-lg font-black tracking-tight bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent',
                !isDark && 'from-violet-700 via-fuchsia-600 to-pink-600'
              )}>
                {APP_NAME}
              </h1>
              <div className="flex items-center gap-2" aria-label={`${APP_TAGLINE}. Developer ${APP_AUTHOR}`}>
                <span
                  className={cn(
                    'inline-block w-2 h-2 rounded-full',
                    isOnline ? 'bg-emerald-400' : 'bg-red-400'
                  )}
                  title={isOnline ? 'Online' : 'Offline'}
                />
                <span
                  className={cn(
                    'inline-block w-2 h-2 rounded-full',
                    isPlayerReady ? 'bg-violet-400' : 'bg-yellow-400'
                  )}
                  title={isPlayerReady ? 'Player Ready' : 'Player Loading'}
                />
                <span
                  className={cn('inline-block w-2 h-2 rounded-full', statusDot.color)}
                  title={statusDot.title}
                />
              </div>
              <p className={cn('hidden sm:block text-[10px] -mt-0.5', isDark ? 'text-gray-500' : 'text-gray-500')}>
                by {APP_AUTHOR}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="hidden sm:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              )}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={onSettingsClick}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              )}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <nav className="flex sm:hidden items-center gap-1 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
