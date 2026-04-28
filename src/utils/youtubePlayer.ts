// YouTube IFrame API loader
let ytApiLoaded = false;
let ytApiPromise: Promise<void> | null = null;

export function loadYouTubeAPI(): Promise<void> {
  if ((window as any).YT?.Player) {
    ytApiLoaded = true;
    return Promise.resolve();
  }
  if (ytApiLoaded) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    // Create script element
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;

    // Define global callback
    (window as any).onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      resolve();
    };

    tag.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
    document.head.appendChild(tag);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!ytApiLoaded) {
        ytApiPromise = null;
        reject(new Error('YouTube IFrame API load timeout'));
      }
    }, 10000);
  });

  return ytApiPromise;
}

export interface YTPlayerOptions {
  videoId: string;
  onReady?: (event: any) => void;
  onStateChange?: (event: any) => void;
  onError?: (event: any) => void;
  width?: number;
  height?: number;
}

export function createYTPlayer(
  elementId: string,
  options: YTPlayerOptions
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadYouTubeAPI();

      const player = new (window as any).YT.Player(elementId, {
        height: options.height || 360,
        width: options.width || 640,
        videoId: options.videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event: any) => {
            options.onReady?.(event);
            resolve(player);
          },
          onStateChange: options.onStateChange,
          onError: options.onError,
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Unlock audio for Android WebView
export function unlockAudio() {
  const silentAudio = document.getElementById('silent-audio') as HTMLAudioElement;
  if (silentAudio) {
    silentAudio.play().catch(() => {});
  }
}
