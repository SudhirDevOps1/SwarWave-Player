import { Activity, BatteryCharging, Download, Eye, EyeOff, Gauge, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { cn } from '@/utils/cn';
import { APP_NAME } from '@/config/app';

interface ExperiencePanelProps {
  isDark: boolean;
  isOnline: boolean;
  apiStatus: 'connected' | 'invalid' | 'quota' | 'error' | 'unknown';
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => void;
  ecoMode: boolean;
  onEcoMode: () => void;
  focusMode: boolean;
  onFocusMode: () => void;
  adaptiveMode: boolean;
  onAdaptiveMode: () => void;
}

export function ExperiencePanel({
  isDark,
  isOnline,
  apiStatus,
  canInstall,
  isInstalled,
  onInstall,
  ecoMode,
  onEcoMode,
  focusMode,
  onFocusMode,
  adaptiveMode,
  onAdaptiveMode,
}: ExperiencePanelProps) {
  const statusText = apiStatus === 'connected' ? 'YouTube connected'
    : apiStatus === 'quota' ? 'YouTube quota limit'
    : apiStatus === 'invalid' ? 'YouTube key invalid'
    : apiStatus === 'error' ? 'YouTube disconnected'
    : 'Free providers active';

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-4">
      <div className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-xl p-4 sm:p-5',
        isDark ? 'bg-white/[0.045] border-white/10' : 'bg-white/75 border-gray-200/80'
      )}>
        <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,.18),transparent_30%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]', isDark ? 'text-violet-300' : 'text-violet-700')}>
              <Sparkles className="w-4 h-4" />
              2026 Ready Experience
            </div>
            <h2 className={cn('mt-2 text-2xl sm:text-3xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-950')}>
              {APP_NAME} Studio
            </h2>
            <p className={cn('mt-1 text-sm max-w-2xl', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Faster search, privacy-first playback, adaptive performance, installable PWA, command palette, playlists, stats, radio and offline music in one clean interface.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border', isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}>
                <Wifi className="w-3.5 h-3.5" /> {isOnline ? 'Online' : 'Offline ready'}
              </span>
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border', isDark ? 'bg-violet-500/10 text-violet-300 border-violet-500/20' : 'bg-violet-50 text-violet-700 border-violet-200')}>
                <ShieldCheck className="w-3.5 h-3.5" /> Zero tracking
              </span>
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border', isDark ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200')}>
                <Activity className="w-3.5 h-3.5" /> {statusText}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 lg:w-72 flex-shrink-0">
            <button
              onClick={onInstall}
              disabled={!canInstall && !isInstalled}
              className={cn(
                'min-h-16 rounded-xl px-3 py-2 text-left border transition-all active:scale-[.98]',
                isInstalled
                  ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : canInstall
                    ? 'bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/25'
                    : isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'
              )}
            >
              <Download className="w-4 h-4 mb-1" />
              <div className="text-xs font-bold">{isInstalled ? 'Installed' : canInstall ? 'Install App' : 'PWA Ready'}</div>
            </button>
            <button
              onClick={onEcoMode}
              className={cn(
                'min-h-16 rounded-xl px-3 py-2 text-left border transition-all active:scale-[.98]',
                ecoMode
                  ? isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
                  : isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              <BatteryCharging className="w-4 h-4 mb-1" />
              <div className="text-xs font-bold">Eco {ecoMode ? 'On' : 'Off'}</div>
            </button>
            <button
              onClick={onFocusMode}
              className={cn(
                'min-h-16 rounded-xl px-3 py-2 text-left border transition-all active:scale-[.98]',
                focusMode
                  ? isDark ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'
                  : isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              {focusMode ? <Eye className="w-4 h-4 mb-1" /> : <EyeOff className="w-4 h-4 mb-1" />}
              <div className="text-xs font-bold">Focus {focusMode ? 'On' : 'Off'}</div>
            </button>
            <button
              onClick={onAdaptiveMode}
              className={cn(
                'min-h-16 rounded-xl px-3 py-2 text-left border transition-all active:scale-[.98]',
                adaptiveMode
                  ? isDark ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'
                  : isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              <Gauge className="w-4 h-4 mb-1" />
              <div className="text-xs font-bold">Adaptive {adaptiveMode ? 'On' : 'Off'}</div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}