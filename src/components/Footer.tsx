import { Heart } from 'lucide-react';
import { cn } from '@/utils/cn';
import { APP_AUTHOR, APP_AUTHOR_URL, APP_COPYRIGHT, APP_NAME, APP_REPO_URL } from '@/config/app';

interface FooterProps {
  isDark: boolean;
}

export function Footer({ isDark }: FooterProps) {
  return (
    <footer
      className={cn(
        'py-8 mt-16 border-t',
        isDark ? 'border-white/10' : 'border-gray-200'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className={cn(
          'flex items-center justify-center gap-2 text-sm flex-wrap',
          isDark ? 'text-gray-400' : 'text-gray-500'
        )}>
          {APP_NAME} made with <Heart className="w-4 h-4 text-pink-500 fill-current" /> by{' '}
          <a
            href={APP_AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'font-medium transition-colors',
              isDark
                ? 'text-violet-400 hover:text-violet-300'
                : 'text-violet-600 hover:text-violet-700'
            )}
          >
            {APP_AUTHOR}
          </a>
        </p>
        <div className={cn(
          'flex items-center justify-center gap-4 mt-3 text-sm',
          isDark ? 'text-gray-500' : 'text-gray-400'
        )}>
          <span>© {APP_COPYRIGHT}</span>
          <span>·</span>
          <a
            href={APP_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-1 transition-colors',
              isDark
                ? 'hover:text-violet-400'
                : 'hover:text-violet-600'
            )}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
        <p className={cn(
          'mt-3 text-xs',
          isDark ? 'text-gray-600' : 'text-gray-400'
        )}>
          Privacy-first · Zero tracking · All data stays on your device
        </p>
      </div>
    </footer>
  );
}
