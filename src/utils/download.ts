import type { Song } from '@/types';
import { getStreamUrl } from './api';

export async function downloadMedia(song: Song, type: 'audio' | 'video') {
  let url = '';
  try {
    const streams = await getStreamUrl(song.videoId);
    url = type === 'audio' ? streams.audioUrl : (streams.videoUrl || streams.audioUrl);
  } catch {
    url = '';
  }

  if (!url) {
    // Last-resort fallback: opens the YouTube page so user can still access the media.
    url = `https://www.youtube.com/watch?v=${song.videoId}`;
  }

  // Open stream URL in new tab — browser will play or download it
  const w = window.open(url, '_blank');
  if (!w) {
    // popup blocked, try location.href fallback
    window.location.href = url;
  }
}
