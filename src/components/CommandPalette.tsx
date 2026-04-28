import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  keywords?: string[];
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  isDark: boolean;
  actions: CommandAction[];
  onClose: () => void;
}

export function CommandPalette({ isOpen, isDark, actions, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((action) => {
      const haystack = [action.label, action.hint, ...(action.keywords || [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [actions, query]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-3 top-20 z-[71] mx-auto max-w-xl">
        <div className={cn(
          'rounded-2xl border overflow-hidden shadow-2xl',
          isDark ? 'bg-slate-950/95 border-white/10 text-white' : 'bg-white/95 border-gray-200 text-gray-900'
        )}>
          <div className={cn('flex items-center gap-3 px-4 py-3 border-b', isDark ? 'border-white/10' : 'border-gray-200')}>
            <Search className={cn('w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-500')} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commands, actions, tabs..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button onClick={onClose} className={cn('p-1.5 rounded-lg', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-[55vh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className={cn('px-3 py-8 text-center text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>No command found</p>
            ) : filtered.map((action) => (
              <button
                key={action.id}
                onClick={() => { action.run(); onClose(); }}
                className={cn(
                  'w-full text-left px-3 py-3 rounded-xl transition-colors',
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{action.label}</span>
                  {action.hint && <span className={cn('text-[11px]', isDark ? 'text-gray-500' : 'text-gray-400')}>{action.hint}</span>}
                </div>
              </button>
            ))}
          </div>
          <div className={cn('px-4 py-2 border-t text-[11px]', isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400')}>
            Tip: press Ctrl+K anytime to open this menu.
          </div>
        </div>
      </div>
    </>
  );
}