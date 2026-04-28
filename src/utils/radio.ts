import type { RadioStation } from '@/types';

// Radio Browser API hosts
const RADIO_HOSTS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://fr1.api.radio-browser.info',
];

// CORS proxy fallback
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// In-memory cache with 30 min TTL
const radioCache = new Map<string, { data: RadioStation[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

function getCached(key: string): RadioStation[] | null {
  const cached = radioCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) radioCache.delete(key);
  return null;
}

function setCache(key: string, data: RadioStation[]) {
  radioCache.set(key, { data, timestamp: Date.now() });
}

function deduplicateStations(stations: RadioStation[]): RadioStation[] {
  const seen = new Set<string>();
  return stations.filter(s => {
    const url = s.url_resolved || s.url;
    if (!url || seen.has(url)) return false;
    if (url.includes('localhost') || url.includes('example.com')) return false;
    seen.add(url);
    return true;
  });
}

async function fetchFromHost(host: string, endpoint: string): Promise<RadioStation[]> {
  const response = await fetch(`${host}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.filter((s: RadioStation) => s.lastcheckok === 1);
}

async function fetchWithCorsProxy(endpoint: string): Promise<RadioStation[]> {
  const url = RADIO_HOSTS[0] + endpoint;
  const response = await fetch(CORS_PROXY + encodeURIComponent(url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.filter((s: RadioStation) => s.lastcheckok === 1);
}

async function fetchStations(endpoint: string, cacheKey: string): Promise<RadioStation[]> {
  // Check cache
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Try Promise.any if available
  try {
    if (typeof (Promise as any).any === 'function') {
      const results = await (Promise as any).any(
        RADIO_HOSTS.map(host => fetchFromHost(host, endpoint))
      );
      const stations = deduplicateStations(results);
      setCache(cacheKey, stations);
      return stations;
    }
  } catch {
    // All failed, continue to sequential fallback
  }

  // Sequential fallback
  for (const host of RADIO_HOSTS) {
    try {
      const results = await fetchFromHost(host, endpoint);
      const stations = deduplicateStations(results);
      setCache(cacheKey, stations);
      return stations;
    } catch {
      continue;
    }
  }

  // CORS proxy fallback
  try {
    const results = await fetchWithCorsProxy(endpoint);
    const stations = deduplicateStations(results);
    setCache(cacheKey, stations);
    return stations;
  } catch {
    throw new Error('All radio API sources failed');
  }
}

// Get top stations by votes
export async function getTopStations(limit = 50): Promise<RadioStation[]> {
  const stations = await fetchStations(
    `/json/stations/topvote/${limit}`,
    'top'
  );
  return stations.slice(0, limit);
}

// Search stations by name
export async function searchStations(query: string, limit = 50): Promise<RadioStation[]> {
  const stations = await fetchStations(
    `/json/stations/search?name=${encodeURIComponent(query)}&limit=${limit}&order=votes&reverse=true`,
    `search:${query}`
  );
  return stations.slice(0, limit);
}

// Get stations by country
export async function getStationsByCountry(countryCode: string, limit = 50): Promise<RadioStation[]> {
  const stations = await fetchStations(
    `/json/stations/search?countrycode=${countryCode}&limit=${limit}&order=votes&reverse=true`,
    `country:${countryCode}`
  );
  return stations.slice(0, limit);
}

// Get stations by tag/genre
export async function getStationsByTag(tag: string, limit = 50): Promise<RadioStation[]> {
  const stations = await fetchStations(
    `/json/stations/search?tag=${encodeURIComponent(tag)}&limit=${limit}&order=votes&reverse=true`,
    `tag:${tag}`
  );
  return stations.slice(0, limit);
}

// Get stations by language
export async function getStationsByLanguage(language: string, limit = 50): Promise<RadioStation[]> {
  const stations = await fetchStations(
    `/json/stations/search?language=${encodeURIComponent(language)}&limit=${limit}&order=votes&reverse=true`,
    `lang:${language}`
  );
  return stations.slice(0, limit);
}

// Category presets
export const radioCategories = {
  'Top': () => getTopStations(50),
  'Hindi': () => getStationsByLanguage('hindi', 50),
  'Bollywood': () => getStationsByTag('bollywood', 50),
  'Bhojpuri': () => getStationsByTag('bhojpuri', 30),
  'Punjabi': () => getStationsByTag('punjabi', 30),
  'Classical': () => getStationsByTag('classical', 30),
  'Devotional': () => getStationsByTag('devotional', 30),
  'Pop': () => getStationsByTag('pop', 50),
  'News': () => getStationsByTag('news', 30),
  'English': () => getStationsByLanguage('english', 50),
};
