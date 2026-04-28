import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Moon, Sun, Key, Globe, CheckCircle2, XCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SearchProvider } from '@/types';
import { validateYouTubeKey, type YouTubeKeyStatus } from '@/utils/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  provider: SearchProvider;
  setProvider: (provider: SearchProvider) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  onClearCache: () => void;
  onClearOffline: () => void;
  cacheSize: number;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDark,
  toggleTheme,
  provider,
  setProvider,
  apiKey,
  setApiKey,
  onClearCache,
  onClearOffline,
  cacheSize,
}: SettingsModalProps) {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<YouTubeKeyStatus>('unknown');
  const [keyMsg, setKeyMsg] = useState('');

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  // Auto-validate saved key on open
  useEffect(() => {
    if (!isOpen) return;
    if (apiKey?.trim()) {
      validateKey(apiKey);
    } else {
      setKeyStatus('unknown');
      setKeyMsg('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const validateKey = useCallback(async (key: string) => {
    setKeyStatus('checking');
    setKeyMsg('Checking API key…');
    const result = await validateYouTubeKey(key);
    setKeyStatus(result.status);
    setKeyMsg(result.message);
  }, []);

  const handleSaveApiKey = async () => {
    const trimmed = localApiKey.trim();
    setLocalApiKey(trimmed);
    setApiKey(trimmed);
    localStorage.setItem('yt_api_key', trimmed);
    if (trimmed) {
      await validateKey(trimmed);
    } else {
      setKeyStatus('unknown');
      setKeyMsg('No API key set');
    }
  };

  const handleClearApiKey = () => {
    setLocalApiKey('');
    setApiKey('');
    localStorage.removeItem('yt_api_key');
    setKeyStatus('unknown');
    setKeyMsg('');
    if (provider === 'youtube') {
      setProvider('piped');
      localStorage.setItem('search_provider', 'piped');
    }
  };

  if (!isOpen) return null;

  const providers: { id: SearchProvider; label: string; description: string }[] = [
    { id: 'piped', label: 'Piped', description: 'Free, privacy-focused API' },
    { id: 'invidious', label: 'Invidious', description: 'Alternative frontend API' },
    { id: 'youtube', label: 'YouTube API', description: 'Requires API key' },
  ];

  // Status badge config
  const statusConfig = {
    unknown:   { icon: <Globe className="w-3.5 h-3.5" />,        text: 'Not Set',     cls: isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-200 text-gray-600' },
    checking:  { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, text: 'Checking…', cls: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700' },
    connected: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: 'Connected',   cls: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700' },
    invalid:   { icon: <XCircle className="w-3.5 h-3.5" />,      text: 'Invalid Key', cls: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700' },
    quota:     { icon: <AlertCircle className="w-3.5 h-3.5" />,  text: 'Quota Exceeded', cls: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700' },
    error:     { icon: <XCircle className="w-3.5 h-3.5" />,      text: 'Disconnected', cls: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700' },
  } as const;

  const sc = statusConfig[keyStatus];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className={cn(
            'w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] flex flex-col',
            isDark
              ? 'bg-slate-900 border border-white/10'
              : 'bg-white border border-gray-200'
          )}
        >
          {/* Header */}
          <div className={cn(
            'flex items-center justify-between p-4 border-b flex-shrink-0',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}>
            <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Settings
            </h2>
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6 overflow-y-auto scrollbar-hide flex-1">
            {/* Theme */}
            <div>
              <h3 className={cn(
                'text-sm font-medium mb-3 flex items-center gap-2',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                Theme
              </h3>
              <button
                onClick={toggleTheme}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                )}
              >
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'
                )}>
                  Toggle
                </span>
              </button>
            </div>

            {/* Search Provider */}
            <div>
              <h3 className={cn(
                'text-sm font-medium mb-3 flex items-center gap-2',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                <Globe className="w-4 h-4" />
                Search Provider
              </h3>
              <div className="space-y-2">
                {providers.map((p) => {
                  const disabled = p.id === 'youtube' && (!apiKey || (keyStatus !== 'connected' && keyStatus !== 'unknown' && keyStatus !== 'checking'));
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (p.id === 'youtube' && !apiKey) {
                          // Don't allow selecting YouTube if no key
                          return;
                        }
                        setProvider(p.id);
                        localStorage.setItem('search_provider', p.id);
                      }}
                      disabled={p.id === 'youtube' && !apiKey}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg transition-all text-left',
                        provider === p.id
                          ? isDark
                            ? 'bg-violet-500/20 border border-violet-500/30'
                            : 'bg-violet-50 border border-violet-300'
                          : isDark
                          ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                            {p.label}
                          </span>
                          {p.id === 'youtube' && apiKey && (
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1', sc.cls)}>
                              {sc.icon} {sc.text}
                            </span>
                          )}
                          {p.id === 'youtube' && !apiKey && (
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-200 text-gray-600')}>
                              No Key
                            </span>
                          )}
                        </div>
                        <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
                          {p.description}
                        </p>
                      </div>
                      {provider === p.id && (
                        <span className="w-3 h-3 rounded-full bg-violet-500 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* YouTube API Key */}
            <div>
              <h3 className={cn(
                'text-sm font-medium mb-3 flex items-center gap-2',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                <Key className="w-4 h-4" />
                YouTube API Key
              </h3>

              {/* Status badge */}
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg mb-2 text-xs font-medium',
                sc.cls
              )}>
                {sc.icon}
                <span>{sc.text}</span>
                {keyMsg && <span className="opacity-75 truncate">· {keyMsg}</span>}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="Enter your YouTube API key"
                    className={cn(
                      'w-full px-3 py-2 pr-16 rounded-lg border text-sm outline-none transition-all',
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(s => !s)}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-medium',
                      isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {showKey ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveApiKey}
                    disabled={keyStatus === 'checking'}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
                  >
                    {keyStatus === 'checking' ? 'Checking…' : 'Save & Test'}
                  </button>
                  {apiKey && (
                    <button
                      onClick={handleClearApiKey}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'
                      )}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'mt-2 text-xs flex items-center gap-1 hover:underline',
                  isDark ? 'text-violet-400' : 'text-violet-600'
                )}
              >
                <ExternalLink className="w-3 h-3" />
                Get a free YouTube API key
              </a>
            </div>

            {/* Cache Management */}
            <div>
              <h3 className={cn(
                'text-sm font-medium mb-3 flex items-center gap-2',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                <Trash2 className="w-4 h-4" />
                Cache Management
              </h3>
              <div className="space-y-2">
                <button
                  onClick={onClearCache}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                    isDark
                      ? 'bg-white/5 hover:bg-red-500/20 border border-white/10'
                      : 'bg-gray-50 hover:bg-red-50 border border-gray-200'
                  )}
                >
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    Clear Search Cache
                  </span>
                  <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    In-memory
                  </span>
                </button>
                <button
                  onClick={onClearOffline}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                    isDark
                      ? 'bg-white/5 hover:bg-red-500/20 border border-white/10'
                      : 'bg-gray-50 hover:bg-red-50 border border-gray-200'
                  )}
                >
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    Clear Offline Songs
                  </span>
                  <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    {cacheSize} songs
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer with Back button for mobile */}
          <div className={cn(
            'p-4 border-t flex items-center justify-between flex-shrink-0',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}>
            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
              Made with ❤️ by{' '}
              <a
                href="https://github.com/wherewhere"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline"
              >
                Sudhir Kumar
              </a>
            </p>
            <button
              onClick={onClose}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50'
              )}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
