// Cache for artist images
const IMAGE_CACHE_KEY = 'artist_images_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedImage {
  url: string;
  timestamp: number;
}

type ImageCache = Record<string, CachedImage>;

// Get cached images from localStorage
function getCachedImages(): ImageCache {
  try {
    const cached = localStorage.getItem(IMAGE_CACHE_KEY);
    if (cached) {
      const parsed: ImageCache = JSON.parse(cached);
      const now = Date.now();
      
      // Filter out expired entries
      const valid: ImageCache = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (now - value.timestamp < CACHE_DURATION) {
          valid[key] = value;
        }
      }
      return valid;
    }
  } catch {}
  return {};
}

// Save image to cache
function cacheImage(artistName: string, url: string) {
  try {
    const cache = getCachedImages();
    cache[artistName.toLowerCase()] = { url, timestamp: Date.now() };
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// Generate SVG avatar with gradient
export function generateAvatarUrl(name: string): string {
  const colors = [
    ['#8b5cf6', '#ec4899'],
    ['#3b82f6', '#8b5cf6'],
    ['#10b981', '#3b82f6'],
    ['#f59e0b', '#ef4444'],
    ['#ec4899', '#f59e0b'],
    ['#6366f1', '#8b5cf6'],
    ['#14b8a6', '#22c55e'],
    ['#f43f5e', '#fb923c'],
  ];
  
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const [color1, color2] = colors[hash % colors.length];
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#grad)"/>
      <text x="50" y="55" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${initials}
      </text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Search Deezer for artist image using JSONP
function fetchDeezerImage(artistName: string): Promise<string | null> {
  return new Promise((resolve) => {
    const callbackName = `deezer_callback_${Date.now()}`;
    const timeout = setTimeout(() => {
      delete (window as any)[callbackName];
      resolve(null);
    }, 5000);

    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      const script = document.getElementById(callbackName);
      if (script) script.remove();
      
      if (data?.data?.[0]?.picture_medium) {
        resolve(data.data[0].picture_medium);
      } else {
        resolve(null);
      }
    };

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&output=jsonp&callback=${callbackName}`;
    script.onerror = () => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

// Main function to get artist image
export async function getArtistImage(artistName: string, directUrl?: string): Promise<string> {
  // Check direct URL first
  if (directUrl) {
    cacheImage(artistName, directUrl);
    return directUrl;
  }

  // Check cache
  const cache = getCachedImages();
  const cached = cache[artistName.toLowerCase()];
  if (cached) {
    return cached.url;
  }

  // Try Deezer
  const deezerUrl = await fetchDeezerImage(artistName);
  if (deezerUrl) {
    cacheImage(artistName, deezerUrl);
    return deezerUrl;
  }

  // Fallback to generated avatar
  const avatar = generateAvatarUrl(artistName);
  cacheImage(artistName, avatar);
  return avatar;
}
