import type { Song } from '@/types';
import { APP_NAME } from '@/config/app';

export async function shareSong(song: Song) {
  const shareData = {
    title: song.title,
    text: `Check out "${song.title}" by ${song.artist} on ${APP_NAME}`,
    url: `https://www.youtube.com/watch?v=${song.videoId}`,
  };

  // Try Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (e) {
      if ((e as any).name === 'AbortError') {
        return { success: false, method: 'aborted' };
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(shareData.url);
    return { success: true, method: 'clipboard' };
  } catch {
    // Final fallback: open in new window
    window.open(shareData.url, '_blank', 'noopener,noreferrer');
    return { success: true, method: 'popup' };
  }
}

export function downloadAsJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importFromJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
