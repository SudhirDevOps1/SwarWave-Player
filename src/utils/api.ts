import type { Song, SearchProvider } from '@/types';

// ─── Cache ──────────────────────────────────────────────────────────────────
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedResult {
    data: Song[];
    timestamp: number;
    provider: string;
}

function getCacheKey(query: string): string {
    return `music_search_v6_${query.toLowerCase().trim().replace(/\s+/g, '_')}`;
}

function getCachedResult(query: string): Song[] | null {
    try {
        const key = getCacheKey(query);
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        const parsed: CachedResult = JSON.parse(cached);
        if (Date.now() - parsed.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch {
        return null;
    }
}

function cacheResult(query: string, songs: Song[], provider: string): void {
    try {
        localStorage.setItem(
            getCacheKey(query),
            JSON.stringify({ data: songs, timestamp: Date.now(), provider }),
        );
    } catch {
        // storage full
    }
}

// ─── Instance Health Tracker ────────────────────────────────────────────────
const HEALTH_KEY = 'music_instance_health';

interface HealthScore {
    piped: Record<string, number>;
    invidious: Record<string, number>;
}

function getHealth(): HealthScore {
    try {
        const raw = localStorage.getItem(HEALTH_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return { piped: {}, invidious: {} };
}

function saveHealth(h: HealthScore): void {
    try {
        localStorage.setItem(HEALTH_KEY, JSON.stringify(h));
    } catch { }
}

function recordSuccess(type: 'piped' | 'invidious', base: string): void {
    const h = getHealth();
    if (!h[type]) h[type] = {};
    h[type][base] = (h[type][base] || 0) + 1;
    saveHealth(h);
}

function recordFail(type: 'piped' | 'invidious', base: string): void {
    const h = getHealth();
    if (!h[type]) h[type] = {};
    h[type][base] = Math.max((h[type][base] || 0) - 1, -5);
    saveHealth(h);
}

function sortInstancesByHealth(instances: string[], type: 'piped' | 'invidious'): string[] {
    const h = getHealth();
    const scores = h[type] || {};
    return [...instances].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
}

// ─── Network ────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);
    try {
        const res = await fetch(url, {
            signal: ac.signal,
            headers: { Accept: 'application/json' },
        });
        clearTimeout(timer);
        return res;
    } catch (e) {
        clearTimeout(timer);
        throw e;
    }
}

const SEARCH_PROXIES = [
    (url: string) => `/__cors?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDuration(seconds: number | string): string {
    if (!seconds) return '0:00';
    const n = typeof seconds === 'string' ? parseInt(seconds, 10) : Math.floor(seconds);
    if (!n || isNaN(n) || n <= 0) return '0:00';
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

const ENT_MAP: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
};
const ENT_RE = /&(?:amp|lt|gt|quot|#39);/g;

function cleanTitle(raw: string): string {
    return (raw || 'Unknown').replace(ENT_RE, (m) => ENT_MAP[m] || m).trim();
}

function extractVideoId(item: { id?: string; url?: string }): string {
    let vid = item.id || '';
    if (!vid && item.url) {
        const m = item.url.match(/[?&]v=([^&]+)/) || item.url.match(/\/([a-zA-Z0-9_-]{11})$/);
        vid = m ? m[1] : '';
    }
    return vid.replace(/^\/watch\?v=/, '').trim();
}

const FALLBACK_VIDEO_IDS = [
    'JGwWNGJdvx8', 'kJQP7kiw5Fk', '9bZkp7q19f0', 'OPf0YbXqDm0', 'YqeW9_5kURI',
    'RgKAFK5djSk', 'fRh_vgS2dFE', 'kffacxfA7G4', 'hTWKbfoikeg', 'fJ9rUzIMcZQ',
    '284Ov7ysmfA', 'VAdGW7QDJiU', 'hoNb6HuNmU0', 'sAzlWScHTc4', 'gvyUuxdRdR4',
    'OPazrdwYAm0', 'ElZfdU54Cp8', 'cl0a3i2wFcc', 'YxWlaYCA8MU', 'GgmFC8y8q3k',
    'T94PHkuydcw', 'Gr8G_ldltDE', 'Zxgvob1fVxM', 'SF-7fY6nK0A',
];

const FALLBACK_BY_CATEGORY: Record<string, Array<{ title: string; artist: string; videoId?: string }>> = {
    bollywood: [
        { title: 'Kala Chashma', artist: 'Amar Arshi, Badshah, Neha Kakkar' },
        { title: 'Nashe Si Chadh Gayi', artist: 'Arijit Singh' },
        { title: 'Badtameez Dil', artist: 'Benny Dayal, Shefali Alvares' },
        { title: 'London Thumakda', artist: 'Labh Janjua, Sonu Kakkar, Neha Kakkar' },
        { title: 'Saturday Saturday', artist: 'Badshah, Indeep Bakshi' },
        { title: 'Kar Gayi Chull', artist: 'Badshah, Amaal Mallik, Neha Kakkar' },
        { title: 'Ghungroo', artist: 'Arijit Singh, Shilpa Rao' },
        { title: 'The Breakup Song', artist: 'Arijit Singh, Badshah, Jonita Gandhi' },
        { title: 'Aankh Marey', artist: 'Neha Kakkar, Mika Singh' },
        { title: 'High Heels', artist: 'Jaz Dhami, Yo Yo Honey Singh' },
        { title: 'Hookah Bar', artist: 'Himesh Reshammiya' },
        { title: 'Lungi Dance', artist: 'Yo Yo Honey Singh' },
        { title: 'Balam Pichkari', artist: 'Vishal Dadlani, Shalmali Kholgade' },
        { title: 'Dilliwali Girlfriend', artist: 'Arijit Singh, Sunidhi Chauhan' },
        { title: 'Chittiyaan Kalaiyaan', artist: 'Meet Bros, Kanika Kapoor' },
        { title: 'Baby Doll', artist: 'Kanika Kapoor' },
        { title: 'Kamariya', artist: 'Aastha Gill, Sachin Sanghvi' },
        { title: 'Dilbar', artist: 'Neha Kakkar, Dhvani Bhanushali' },
        { title: 'Swag Se Swagat', artist: 'Vishal Dadlani, Neha Bhasin' },
        { title: 'Jhoome Jo Pathaan', artist: 'Arijit Singh, Sukriti Kakar' },
    ],
    bhojpuri: [
        { title: 'Lollipop Lagelu', artist: 'Pawan Singh', videoId: 'Gr8G_ldltDE' },
        { title: 'Raja Ji Ke Dilwa', artist: 'Pawan Singh' },
        { title: 'Aara Ke Hothlali Lagawalu', artist: 'Pawan Singh' },
        { title: 'Chhalakata Hamro Jawaniya', artist: 'Pawan Singh, Priyanka Singh' },
        { title: 'Saj Ke Sawar Ke', artist: 'Khesari Lal Yadav' },
        { title: 'Thik Hai', artist: 'Khesari Lal Yadav' },
        { title: 'Le Le Aayi Coca Cola', artist: 'Khesari Lal Yadav' },
        { title: 'Nathuniya', artist: 'Khesari Lal Yadav' },
        { title: 'Palang Sagwan Ke', artist: 'Khesari Lal Yadav' },
        { title: 'Laal Ghaghra', artist: 'Khesari Lal Yadav' },
        { title: 'Rinkiya Ke Papa', artist: 'Manoj Tiwari' },
        { title: 'Bhojpuri DJ Song', artist: 'Shilpi Raj' },
        { title: 'Kajra Lagawlu', artist: 'Pawan Singh' },
        { title: 'Kamariya Kare Lapalap', artist: 'Pawan Singh' },
        { title: 'Piyawa Se Pahile', artist: 'Ritesh Pandey' },
        { title: 'Bhojpuri Holi Song', artist: 'Khesari Lal Yadav' },
        { title: 'Bhojpuri Party Mix', artist: 'Pawan Singh, Khesari Lal' },
        { title: 'Bhojpuri Dance Hits', artist: 'Various Artists' },
        { title: 'Bhojpuri Romantic Hits', artist: 'Various Artists' },
        { title: 'Bhojpuri Superhit Songs', artist: 'Various Artists' },
    ],
    punjabi: [
        { title: 'Brown Munde', artist: 'AP Dhillon', videoId: 'cl0a3i2wFcc' },
        { title: 'Excuses', artist: 'AP Dhillon, Gurinder Gill', videoId: 'YxWlaYCA8MU' },
        { title: 'Lover', artist: 'Diljit Dosanjh', videoId: 'GgmFC8y8q3k' },
        { title: 'Bijlee Bijlee', artist: 'Harrdy Sandhu', videoId: 'T94PHkuydcw' },
        { title: 'Do You Know', artist: 'Diljit Dosanjh' },
        { title: 'GOAT', artist: 'Diljit Dosanjh' },
        { title: 'Born To Shine', artist: 'Diljit Dosanjh' },
        { title: '295', artist: 'Sidhu Moose Wala' },
        { title: 'So High', artist: 'Sidhu Moose Wala' },
        { title: 'Lahore', artist: 'Guru Randhawa' },
        { title: 'High Rated Gabru', artist: 'Guru Randhawa' },
        { title: 'Kya Baat Ay', artist: 'Harrdy Sandhu' },
        { title: 'Prada', artist: 'Jass Manak' },
        { title: 'Lehanga', artist: 'Jass Manak' },
        { title: 'Tauba Tauba', artist: 'Karan Aujla' },
        { title: 'Softly', artist: 'Karan Aujla' },
        { title: 'White Brown Black', artist: 'Karan Aujla' },
        { title: 'Insane', artist: 'AP Dhillon' },
        { title: 'Punjabi Party Mix', artist: 'Various Artists' },
        { title: 'Punjabi Dance Hits', artist: 'Various Artists' },
    ],
    haryanvi: [
        { title: '52 Gaj Ka Daman', artist: 'Renuka Panwar', videoId: 'Zxgvob1fVxM' },
        { title: 'Teri Aakhya Ka Yo Kajal', artist: 'Sapna Choudhary' },
        { title: 'Chatak Matak', artist: 'Renuka Panwar' },
        { title: 'Gajban', artist: 'Vishvajeet Choudhary' },
        { title: 'Bahu Kale Ki', artist: 'Gajender Phogat' },
        { title: 'Solid Body', artist: 'Ajay Hooda' },
        { title: 'Kallo', artist: 'Komal Chaudhary' },
        { title: 'Jale', artist: 'Shiva Choudhary' },
        { title: 'Haryanvi DJ Song', artist: 'Various Artists' },
        { title: 'Haryanvi Dance Hits', artist: 'Various Artists' },
        { title: 'Sapna Choudhary Dance', artist: 'Sapna Choudhary' },
        { title: 'Renuka Panwar Hits', artist: 'Renuka Panwar' },
        { title: 'Haryanvi Party Mix', artist: 'Various Artists' },
        { title: 'Haryanvi Romantic Song', artist: 'Various Artists' },
        { title: 'Haryanvi Superhit Songs', artist: 'Various Artists' },
        { title: 'Desi Haryanvi Beat', artist: 'Various Artists' },
        { title: 'Haryanvi Folk Dance', artist: 'Various Artists' },
        { title: 'Haryanvi DJ Remix', artist: 'Various Artists' },
        { title: 'New Haryanvi Song', artist: 'Various Artists' },
        { title: 'Best Haryanvi Hits', artist: 'Various Artists' },
    ],
};

function smartFallback(query: string): Song[] {
    // Disabled by default because users reported fake-looking fallback results.
    // Keep the catalog available only for manual emergency fallback/testing.
    if (localStorage.getItem('allow_smart_fallback') !== 'true') return [];

    const q = query.toLowerCase();
    let list = FALLBACK_BY_CATEGORY.bollywood;
    if (/bhojpuri|pawan|khesari|shilpi|manoj tiwari/.test(q)) list = FALLBACK_BY_CATEGORY.bhojpuri;
    else if (/punjabi|diljit|sidhu|ap dhillon|guru randhawa|karan aujla|jass manak/.test(q)) list = FALLBACK_BY_CATEGORY.punjabi;
    else if (/haryanvi|haryani|sapna|renuka|daman|gajban/.test(q)) list = FALLBACK_BY_CATEGORY.haryanvi;
    else if (/party|dance|bollywood|dj|remix/.test(q)) list = FALLBACK_BY_CATEGORY.bollywood;

    return list.slice(0, 20).map((item, index) => {
        const videoId = item.videoId || FALLBACK_VIDEO_IDS[index % FALLBACK_VIDEO_IDS.length];
        return {
            videoId,
            title: cleanTitle(item.title),
            artist: cleanTitle(item.artist),
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            duration: '0:00',
            durationSeconds: 0,
        };
    });
}

// ─── Parallel Race Helper ───────────────────────────────────────────────────
// Runs multiple async tasks, returns first successful non-empty result
function raceFirst<T>(
    tasks: Promise<T>[],
    isValid: (r: T) => boolean,
): Promise<T | null> {
    return new Promise((resolve) => {
        if (tasks.length === 0) { resolve(null); return; }
        let done = false;
        let pending = tasks.length;

        for (const task of tasks) {
            task
                .then((result) => {
                    if (!done) {
                        if (isValid(result)) {
                            done = true;
                            resolve(result);
                        } else {
                            pending--;
                            if (pending === 0) resolve(null);
                        }
                    }
                })
                .catch(() => {
                    if (!done) {
                        pending--;
                        if (pending === 0) resolve(null);
                    }
                });
        }
    });
}

// ─── Piped ──────────────────────────────────────────────────────────────────
const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt',
    'https://pipedapi.r4fo.com',
    'https://pipedapi.syncpundit.io',
    'https://pipedapi.leptons.xyz',
    'https://pipedapi.astre.me',
    'https://pipedapi.projectsegfau.lt',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.rivo.world',
    'https://pipedapi.mosesm.org',
    'https://pipedapi-libre.kavin.rocks',
];

async function tryPiped(base: string, encoded: string): Promise<Song[]> {
    try {
        const res = await fetchWithTimeout(`${base}/search?q=${encoded}&filter=videos`);
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data?.items) || data.items.length === 0) return [];

        const songs: Song[] = data.items
            .filter((i: any) => i.url || i.id)
            .slice(0, 20)
            .map((i: any): Song => {
                const videoId = extractVideoId(i);
                return {
                    videoId,
                    title: cleanTitle(i.title),
                    artist: cleanTitle(i.uploaderName || i.uploader || 'Unknown Artist'),
                    thumbnail: i.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                    duration: i.duration ? formatDuration(i.duration) : '0:00',
                    durationSeconds: typeof i.duration === 'number' ? Math.floor(i.duration) : 0,
                };
            })
            .filter((s: Song) => s.videoId && s.videoId.length >= 8);

        if (songs.length > 0) {
            recordSuccess('piped', base);
        }
        return songs;
    } catch {
        recordFail('piped', base);
        return [];
    }
}

async function searchPiped(query: string): Promise<Song[]> {
    const encoded = encodeURIComponent(query);
    const sorted = sortInstancesByHealth(PIPED_INSTANCES, 'piped');

    // Batch 1: race top 4 (health-sorted) in parallel
    const batch1 = await raceFirst(
        sorted.slice(0, 4).map((b) => tryPiped(b, encoded)),
        (r): r is Song[] => Array.isArray(r) && r.length > 0,
    );
    if (batch1) return batch1;

    // Batch 2: race next 4
    const batch2 = await raceFirst(
        sorted.slice(4, 8).map((b) => tryPiped(b, encoded)),
        (r): r is Song[] => Array.isArray(r) && r.length > 0,
    );
    if (batch2) return batch2;

    // Batch 3: remaining sequentially
    for (const base of sorted.slice(8)) {
        const songs = await tryPiped(base, encoded);
        if (songs.length > 0) return songs;
    }

    return [];
}

// ─── Invidious ──────────────────────────────────────────────────────────────
const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://iv.melmac.space',
    'https://iv.ggtyler.dev',
    'https://invidious.projectsegfau.lt',
    'https://inv.vern.cc',
    'https://invidious.privacyredirect.com',
    'https://invidious.slipfox.xyz',
];

async function tryInvidious(base: string, encoded: string): Promise<Song[]> {
    try {
        const res = await fetchWithTimeout(
            `${base}/api/v1/search?q=${encoded}&type=video&fields=videoId,title,author,lengthSeconds,videoThumbnails`,
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return [];

        const songs: Song[] = data
            .filter((i: any) => i.videoId && i.title)
            .slice(0, 20)
            .map((i: any): Song => {
                const thumb =
                    i.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url ||
                    i.videoThumbnails?.[0]?.url ||
                    `https://i.ytimg.com/vi/${i.videoId}/mqdefault.jpg`;
                return {
                    videoId: i.videoId,
                    title: cleanTitle(i.title),
                    artist: cleanTitle(i.author || 'Unknown Artist'),
                    thumbnail: thumb.startsWith('//') ? `https:${thumb}` : thumb,
                    duration: i.lengthSeconds ? formatDuration(i.lengthSeconds) : '0:00',
                    durationSeconds: i.lengthSeconds || 0,
                };
            });

        if (songs.length > 0) {
            recordSuccess('invidious', base);
        }
        return songs;
    } catch {
        recordFail('invidious', base);
        return [];
    }
}

async function searchInvidious(query: string): Promise<Song[]> {
    const encoded = encodeURIComponent(query);
    const sorted = sortInstancesByHealth(INVIDIOUS_INSTANCES, 'invidious');

    // Batch 1: race top 3
    const batch1 = await raceFirst(
        sorted.slice(0, 3).map((b) => tryInvidious(b, encoded)),
        (r): r is Song[] => Array.isArray(r) && r.length > 0,
    );
    if (batch1) return batch1;

    // Batch 2: race next 3
    const batch2 = await raceFirst(
        sorted.slice(3, 6).map((b) => tryInvidious(b, encoded)),
        (r): r is Song[] => Array.isArray(r) && r.length > 0,
    );
    if (batch2) return batch2;

    // Batch 3: remaining
    for (const base of sorted.slice(6)) {
        const songs = await tryInvidious(base, encoded);
        if (songs.length > 0) return songs;
    }

    return [];
}

// ─── YouTube Data API v3 ────────────────────────────────────────────────────
async function searchYouTube(query: string, apiKey: string): Promise<Song[]> {
    if (!apiKey) return [];
    try {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', query);
        url.searchParams.set('type', 'video');
        url.searchParams.set('videoCategoryId', '10'); // Music
        url.searchParams.set('maxResults', '20');
        url.searchParams.set('key', apiKey);

        const res = await fetchWithTimeout(url.toString(), 8000);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data?.items)) throw new Error('Invalid YouTube response');

        const songs: Song[] = data.items
            .filter((i: any) => i.id?.videoId)
            .map((i: any): Song => ({
                videoId: i.id.videoId,
                title: cleanTitle(i.snippet?.title),
                artist: cleanTitle(i.snippet?.channelTitle || 'Unknown Artist'),
                thumbnail:
                    i.snippet?.thumbnails?.high?.url ||
                    i.snippet?.thumbnails?.medium?.url ||
                    `https://i.ytimg.com/vi/${i.id.videoId}/mqdefault.jpg`,
                duration: '0:00',
                durationSeconds: 0,
            }));

        return songs;
    } catch (e) {
        console.error('[YouTube] search error:', e);
        return [];
    }
}

// Keyless YouTube page parser. It only returns real videoIds extracted from
// YouTube's search page, so it avoids fake title/thumbnail combinations.
async function searchYouTubeHtml(query: string): Promise<Song[]> {
    const target = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    for (const buildUrl of SEARCH_PROXIES) {
        try {
            const res = await fetchWithTimeout(buildUrl(target), 8000);
            if (!res.ok) continue;
            const html = await res.text();
            if (!html || html.length < 1000) continue;

            const ids: string[] = [];
            const re = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
            let match: RegExpExecArray | null;
            while ((match = re.exec(html)) && ids.length < 25) {
                if (!ids.includes(match[1])) ids.push(match[1]);
            }

            const songs = ids.slice(0, 20).map((videoId, index): Song => {
                const at = html.indexOf(`"videoId":"${videoId}"`);
                const chunk = html.slice(Math.max(0, at - 1600), at + 4000);
                const rawTitle = chunk.match(/"title":\{"runs":\[\{"text":"([^"]+)"/)?.[1]
                    || chunk.match(/"title":\{"simpleText":"([^"]+)"/)?.[1]
                    || `${query} result ${index + 1}`;
                const rawArtist = chunk.match(/"ownerText":\{"runs":\[\{"text":"([^"]+)"/)?.[1]
                    || chunk.match(/"longBylineText":\{"runs":\[\{"text":"([^"]+)"/)?.[1]
                    || 'YouTube';

                return {
                    videoId,
                    title: cleanTitle(rawTitle.replace(/\\u0026/g, '&')),
                    artist: cleanTitle(rawArtist.replace(/\\u0026/g, '&')),
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    duration: '0:00',
                    durationSeconds: 0,
                };
            });

            if (songs.length > 0) return songs;
        } catch {
            continue;
        }
    }

    return [];
}

// ─── Streams ────────────────────────────────────────────────────────────────
export async function getStreamUrl(videoId: string): Promise<{ audioUrl: string; videoUrl?: string }> {
    const sorted = sortInstancesByHealth(PIPED_INSTANCES, 'piped');
    for (const base of sorted) {
        try {
            const res = await fetchWithTimeout(`${base}/streams/${videoId}`);
            if (!res.ok) continue;
            const data = await res.json();

            const audioStream = data.audioStreams?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
            const videoStream = data.videoStreams?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

            const audioUrl = audioStream?.url || data.hls || '';
            if (audioUrl || videoStream?.url) {
                recordSuccess('piped', base);
                return { audioUrl, videoUrl: videoStream?.url || data.hls };
            }
        } catch {
            recordFail('piped', base);
        }
    }
    throw new Error('All stream instances failed');
}

// ─── Main search export ────────────────────────────────────────────────────
export async function searchSongs(
    query: string,
    provider: SearchProvider = 'piped',
    apiKey = '',
): Promise<{ songs: Song[]; provider: SearchProvider | 'cache' | 'failed' | 'none' }> {
    if (!query?.trim()) return { songs: [], provider: 'none' };

    const q = query.trim();

    // Cache hit
    const cached = getCachedResult(q);
    if (cached?.length) {
        return { songs: cached, provider: 'cache' };
    }

    const providerFlow = async (): Promise<{ songs: Song[]; provider: SearchProvider }> => {
        const order: { name: SearchProvider; fn: () => Promise<Song[]> }[] = [];

        if (provider === 'youtube' && apiKey) {
            order.push({ name: 'youtube', fn: () => searchYouTube(q, apiKey) });
            order.push({ name: 'piped', fn: () => searchPiped(q) });
            order.push({ name: 'invidious', fn: () => searchInvidious(q) });
        } else if (provider === 'invidious') {
            order.push({ name: 'invidious', fn: () => searchInvidious(q) });
            order.push({ name: 'piped', fn: () => searchPiped(q) });
        } else {
            order.push({ name: 'piped', fn: () => searchPiped(q) });
            order.push({ name: 'invidious', fn: () => searchInvidious(q) });
        }

        if (apiKey && provider !== 'youtube') {
            order.push({ name: 'youtube', fn: () => searchYouTube(q, apiKey) });
        }
    order.push({ name: 'youtube', fn: () => searchYouTubeHtml(q) });

        for (const p of order) {
            try {
                const songs = await p.fn();
                if (songs.length > 0) {
                    cacheResult(q, songs, p.name);
                    return { songs, provider: p.name };
                }
            } catch (e) {
                console.error(`[${p.name}] error:`, e);
            }
        }

        const fallback = smartFallback(q);
        cacheResult(q, fallback, provider);
        return { songs: fallback, provider };
    };

    // Mobile-friendly: don't let public instances keep the UI spinning forever.
    return Promise.race([
        providerFlow(),
        new Promise<{ songs: Song[]; provider: SearchProvider }>((resolve) => {
            window.setTimeout(() => {
                const fallback = smartFallback(q);
                cacheResult(q, fallback, provider);
                resolve({ songs: fallback, provider });
            }, 4500);
        }),
    ]);
}

export function clearSearchCache(): void {
    const keys = Object.keys(localStorage);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith('music_search_') || keys[i] === 'music_instance_health') {
            localStorage.removeItem(keys[i]);
        }
    }
}

// ─── YouTube API Key Validator ──────────────────────────────────────────────
export type YouTubeKeyStatus = 'unknown' | 'checking' | 'connected' | 'invalid' | 'quota' | 'error';

export async function validateYouTubeKey(apiKey: string): Promise<{ status: YouTubeKeyStatus; message: string }> {
    if (!apiKey?.trim()) {
        return { status: 'unknown', message: 'No API key set' };
    }
    try {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', 'test');
        url.searchParams.set('type', 'video');
        url.searchParams.set('maxResults', '1');
        url.searchParams.set('key', apiKey.trim());

        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 8000);
        const res = await fetch(url.toString(), { signal: ac.signal });
        clearTimeout(timer);

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.items)) {
                return { status: 'connected', message: 'Connected · API key is valid' };
            }
            return { status: 'error', message: 'Unexpected response from YouTube' };
        }

        const errorBody = await res.json().catch(() => ({}));
        const reason = errorBody?.error?.errors?.[0]?.reason || '';
        const errMsg = errorBody?.error?.message || '';

        if (res.status === 400 || reason === 'badRequest' || reason === 'keyInvalid') {
            return { status: 'invalid', message: 'Invalid API key' };
        }
        if (res.status === 403) {
            if (reason === 'quotaExceeded' || /quota/i.test(errMsg)) {
                return { status: 'quota', message: 'Quota exceeded for today' };
            }
            if (reason === 'forbidden' || reason === 'ipRefererBlocked' || reason === 'accessNotConfigured') {
                return { status: 'invalid', message: errMsg || 'API key forbidden / not configured' };
            }
            return { status: 'invalid', message: errMsg || 'Forbidden' };
        }
        return { status: 'error', message: errMsg || `HTTP ${res.status}` };
    } catch (e: any) {
        if (e?.name === 'AbortError') {
            return { status: 'error', message: 'Network timeout while checking key' };
        }
        return { status: 'error', message: 'Could not reach YouTube' };
    }
}
