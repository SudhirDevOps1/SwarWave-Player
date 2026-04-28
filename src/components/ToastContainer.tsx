import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Toast } from '@/types';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  isDark: boolean;
}

export function ToastContainer({ toasts, onRemove, isDark }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = (type: Toast['type']) => {
    if (isDark) {
      switch (type) {
        case 'success':
          return 'bg-emerald-500/10 border-emerald-500/30';
        case 'error':
          return 'bg-red-500/10 border-red-500/30';
        case 'warning':
          return 'bg-yellow-500/10 border-yellow-500/30';
        default:
          return 'bg-blue-500/10 border-blue-500/30';
      }
    }
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg animate-slide-in-right',
            getColors(toast.type)
          )}
        >
          {getIcon(toast.type)}
          <p className={cn(
            'flex-1 text-sm',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {toast.message}
          </p>
          <button
            onClick={() => onRemove(toast.id)}
            className={cn(
              'p-1 rounded transition-colors flex-shrink-0',
              isDark
                ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
