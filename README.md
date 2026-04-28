# SwarWave - Music, Video & Live Radio Hub

> **Production-ready, privacy-first** Progressive Web App for music playback, video playback, live radio (50,000+ stations), playlists, offline caching, background playback, and Picture-in-Picture (PiP).

**Author:** Sudhir Kumar
**GitHub:** [@wherewhere/PrivMITLab-Music-Radio](https://github.com/wherewhere/PrivMITLab-Music-Radio)
**License:** MIT © 2025 Sudhir Kumar

---

## 📑 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Search Providers](#-search-providers)
- [Playlists - Full Guide](#-playlists--full-guide)
- [Mobile Now Playing Screen](#-mobile-now-playing-screen)
- [Player Controls](#-player-controls)
- [Keyboard Shortcuts (PC)](#%EF%B8%8F-keyboard-shortcuts-pc)
- [Background Playback](#-background-playback)
- [Picture-in-Picture (PiP)](#%EF%B8%8F-picture-in-picture-pip)
- [Lock Screen Controls](#-lock-screen-controls)
- [EQ & Sleep Timer](#-eq--sleep-timer)
- [Live Radio](#-live-radio)
- [Offline Mode](#-offline-mode)
- [Privacy](#-privacy)
- [Build & Deploy](#-build--deploy)
- [Android WebView (APK)](#-android-webview-apk)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🆕 NEW Features (Latest Update)
- 📊 **Listening Statistics** — Track your music habits with detailed stats
  - Total songs played & play time
  - Top artists & songs
  - Daily activity chart (last 30 days)
  - Reset stats option
- 🎤 **Voice Search** — Search by speaking (Chrome/Edge)
  - Click "Voice" button
  - Speak your query
  - Auto-searches what you said
- 📤 **Share Songs** — Share current song easily
  - Native share on mobile (WhatsApp, Telegram, etc.)
  - Copy link on desktop
  - Opens YouTube if share not supported
- 💾 **Export/Import Data** — Backup & restore your data
  - Export favorites, playlists, history to JSON
  - Import from backup file
  - Perfect for switching devices
- 🚗 **Car Mode** — Simplified UI for driving
  - Large controls
  - Simplified interface
  - Toggle from quick actions bar
- 🎨 **Theme Colors** — 7 color themes
  - Violet, Blue, Green, Orange, Pink, Red, Teal
  - Click color dots in quick actions bar
  - Persists across sessions

### Core
- 🎵 **Music search** with 3 providers (Piped, Invidious, YouTube API)
- 🎬 **Video playback** with expandable video mode
- 📻 **Live radio** with 50,000+ stations
- 📱 **Full mobile support** with native Now Playing screen
- 💻 **PC support** with keyboard shortcuts
- 🌙 **Dark/Light themes**
- 🔒 **100% privacy-first** — zero tracking, zero analytics

### Playlists
- ➕ Create unlimited playlists
- ✏️ **Edit/Rename** playlists
- 🗑️ Delete playlists
- ➕ **Add current playing song** to any playlist
- ➕ **Add from search results** with one click
- ▶️ Play entire playlist
- ▶️ Play individual songs from playlist
- ❌ Remove songs from playlists
- ❤️ Favorite songs from inside playlists

### Player
- ⏯️ Play/Pause
- ⏭️ Next / ⏮️ Previous
- 🔀 Shuffle
- 🔁 Repeat (none / one / all)
- 🔊 Volume control
- 🔇 Mute
- 📈 6-band EQ (Flat, Bass, Pop, Rock, Vocal, Night)
- 😴 Sleep timer (5, 15, 30, 60 min)
- ⬇️ Audio & video download
- 🎯 Auto-next with 3-method detection

### Mobile UX
- 👆 **Tap song info to open Now Playing**
- ⬇️ **Big close button** to exit Now Playing screen
- ❤️ **Favorite button** in mobile player & Now Playing
- 📱 **Touch-friendly** progress bar
- 📲 **Edge-to-edge video** on mobile
- 💾 **Safe area** insets for iOS notches

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (single-file output)
npm run build

# Preview production build
npm run preview
```

The build produces a **single HTML file** with inlined CSS/JS in `dist/index.html` — perfect for Cloudflare Pages, GitHub Pages, or Android WebView.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 7 + vite-plugin-singlefile |
| Styling | Tailwind CSS v4 (Glass Morphism) |
| Icons | Lucide React |
| State | React Hooks + localStorage + IndexedDB |
| Audio/Video | YouTube IFrame API + HTML5 Audio |
| Radio | Radio Browser API (4 hosts) |
| PWA | Web App Manifest + Service Worker |

---

## 🔍 Search Providers

SwarWave has 3 providers configurable in **Settings**:

### 1. Piped (Default — Free, no key)
- Privacy-focused YouTube frontend
- Uses 9 public Piped instances
- **Health-tracking** — fastest instances are tried first
- **Parallel racing** in batches of 3 for fast results

### 2. Invidious (Free, no key)
- Alternative YouTube frontend
- Uses 8 public Invidious instances
- Same health tracking + parallel racing

### 3. YouTube Data API v3 (Optional)
- Add your API key in Settings → YouTube API Key
- **Live validation** with status badge:
  - 🟢 Connected
  - 🔴 Invalid Key
  - 🟠 Quota Exceeded
  - ⚫ Disconnected
- Get a free key: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**Search flow:** Selected provider tried first → falls back to other free providers → YouTube API as last resort if key is set.

---

## 📋 Playlists — Full Guide

Playlists are visible at the top of the **Music tab**.

### Create a Playlist
1. Type a name in the input
2. Press **Create** or hit Enter

### Manage a Playlist

| Action | How |
|--------|-----|
| ✏️ **Rename** | Click the Edit icon → type new name → Check ✓ |
| 🗑️ **Delete** | Click the Trash icon |
| ▶️ **Play All** | Click the **Play All** button (gradient) |
| 👁️ **View Songs** | Click **View** to expand |
| ➕ **Add Now Playing** | Click **+ Now Playing** when a song is playing |
| ➕ **Add from Search** | After searching, click **+ Add from search results** dropdown |
| ❌ **Remove Song** | Inside playlist, click X next to any song |
| ▶️ **Play Specific Song** | Click the song or its Play button |
| ❤️ **Favorite Song** | Click ❤️ next to any song in the playlist |

All playlists are saved to `localStorage` — they persist across sessions.

---

## 📱 Mobile Now Playing Screen

Tap the **song info area** in the bottom player bar to open the **full-screen Now Playing view**.

### Now Playing Includes
- ⬇️ **Big close button** (top-left) — exit anytime
- 🎵 **Queue button** (top-right)
- 🖼️ Large album art
- 📝 Song title + artist
- ❤️ **Favorite button** (centered below title)
- ⏱️ Progress bar with touch seek
- 🎮 Big touch-friendly controls
- 🔊 Volume slider
- 🎬 Video / 🖼️ PiP / ⬇️ Download buttons
- 🎚️ EQ + 😴 Sleep timer expandable panel

### Exit Now Playing
- Tap the **⬇️ down arrow** at top-left
- Press **Escape** key (PC)

---

## 🎮 Player Controls

### Bottom Bar (always visible when playing)
- Song thumbnail + title (tap to open Now Playing)
- Mobile: Heart, Prev, Play/Pause, Next, Queue
- Desktop: Shuffle, Prev, Play/Pause, Next, Repeat, Time, Volume, Heart, Video, PiP, Download, Queue

### Now Playing (full screen)
- All controls + EQ + Sleep + Album art

---

## ⌨️ Keyboard Shortcuts (PC)

| Key | Action |
|-----|--------|
| `Space` / `K` | Play/Pause |
| `N` | Next track |
| `P` | Previous track |
| `M` | Mute |
| `S` | Shuffle |
| `R` | Cycle repeat |
| `F` | Favorite current |
| `↑` / `↓` | Volume ±10 |
| `Shift+←` / `Shift+→` | Seek ±10s |
| `Esc` | Close Now Playing |

---

## 📊 Listening Statistics

Access from the **Stats** button in the quick actions bar.

### What's Tracked
- **Total Songs Played** — Lifetime count
- **Total Play Time** — Hours and minutes listened
- **Top Artists** — Your most-played artists (top 10)
- **Top Songs** — Your most-played tracks (top 10)
- **Daily Activity** — Bar chart of last 14 days
- **Favorites Count** — Number of favorited songs
- **Playlists Count** — Number of created playlists

### Privacy
- All stats stored **locally** on your device
- No data sent to any server
- Reset anytime with the trash icon

---

## 🎤 Voice Search

**Browser Support:** Chrome, Edge, Safari (desktop & mobile)

### How to Use
1. Click the **Voice** button in quick actions bar
2. Wait for "Listening..." indicator
3. Speak clearly: "party dance bollywood songs"
4. App automatically searches what you said

### Tips
- Speak in natural language
- Works in any language your browser supports
- Click anywhere to cancel

---

## 📤 Share Songs

Share the currently playing song with friends.

### Mobile (Native Share)
- Opens system share sheet
- Share via WhatsApp, Telegram, SMS, etc.
- Includes song title, artist, and YouTube link

### Desktop (Copy Link)
- Copies YouTube link to clipboard
- Paste anywhere: social media, chat, email

---

## 💾 Export & Import Data

### Export Your Data
1. Click **Export** in quick actions bar
2. Downloads `privmitlab-backup.json`
3. Contains: favorites, playlists, recently played

### Import Data
1. Click **Import** in quick actions bar
2. Select your `.json` backup file
3. Data is restored instantly

### Use Cases
- Switch to a new device
- Backup before clearing browser data
- Share playlists with friends (send JSON file)

---

## 🚗 Car Mode

Simplified interface for safe driving.

### Features
- **Large Controls** — Easier to tap while driving
- **Simplified UI** — Less distraction
- **High Contrast** — Better visibility

### Toggle
Click the **Car** button in quick actions bar.

---

## 🎨 Theme Colors

Personalize your app with 7 color themes.

### Available Colors
- 🟣 **Violet** (default)
- 🔵 **Blue**
- 🟢 **Green**
- 🟠 **Orange**
- 🩷 **Pink**
- 🔴 **Red**
- 🟦 **Teal**

### How to Change
Click any color dot in the quick actions bar. Theme persists across sessions.

---

## 🔋 Background Playback

When the browser tab is in the background or the screen is locked:
- ✅ Audio continues playing
- ✅ Lock screen shows song info & controls
- ✅ Service Worker keeps the app alive (every 20s ping)
- ✅ Silent audio loop prevents audio channel from being killed (Android WebView)
- ✅ Visibility change resumes audio automatically

---

## 🖼️ Picture-in-Picture (PiP)

Click the **PiP button** in the player. Three methods are tried in order:

1. **Native iframe video PiP** — works in some Brave/Chrome configurations
2. **Document Picture-in-Picture API** (Chrome/Edge 116+)
3. **Pop-out YouTube window fallback** — always works

The pop-out window opens YouTube directly so you can resize/move it freely while continuing to use the main app.

---

## 🔒 Lock Screen Controls

SwarWave uses the **Media Session API** so your phone's lock screen and notification panel show:
- Song title & artist
- Album art
- ▶️ Play / ⏸️ Pause buttons
- ⏭️ Next / ⏮️ Previous buttons
- 🎯 Seek bar (where supported)
- ⏪ Skip back 10s / ⏩ Skip forward 10s

This works on Android, iOS Safari, and most desktop browsers.

---

## 🎚️ EQ & Sleep Timer

Open the Now Playing screen → tap **EQ** button.

### EQ Presets
- **Flat** — no EQ
- **Bass** — boosted lows for hip-hop, EDM
- **Pop** — slight mid boost for vocals
- **Rock** — V-shaped curve for guitars
- **Vocal** — mid-high boost for podcasts/vocals
- **Night** — reduced lows/highs for late-night listening

### Sleep Timer
Auto-pauses playback after: **5, 15, 30, or 60 minutes**.

---

## 📻 Live Radio

50,000+ stations from Radio Browser API.

### Categories
- 🔝 Top
- 🇮🇳 Hindi
- 🎬 Bollywood
- 🎭 Bhojpuri
- 🥁 Punjabi
- 🎻 Classical
- 🙏 Devotional
- 🎤 Pop
- 📰 News
- 🌍 English

### Features
- Multi-host fetch (de1, nl1, at1, fr1)
- CORS proxy fallback (allorigins.win)
- Search by name
- Auto-deduplicates by URL
- 30 min in-memory cache
- HTML5 audio playback (MP3/AAC/OGG)

---

## 📴 Offline Mode

- Songs saved to **IndexedDB** (`privmitlab-db`)
- Tap **Download icon** on any song
- Listen even when offline
- Visible in **Offline tab** anytime
- Clear all from **Settings → Cache Management**

---

## 🔐 Privacy

- ❌ **Zero tracking**
- ❌ **Zero analytics**
- ❌ **Zero cookies**
- ✅ All data stays on **your device** (localStorage + IndexedDB)
- ✅ Open source on GitHub

---

## 📦 Build & Deploy

### Local Build
```bash
npm run build
```

Output: **`dist/index.html`** — a single self-contained file with inlined CSS/JS.

### Deploy to Cloudflare Pages
1. Connect your GitHub repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Done!

### Deploy to GitHub Pages / Netlify / Vercel
Same as above — just point to `dist/`.

### Deploy as Single HTML File
Just upload `dist/index.html` — no other files needed (except `public/` assets like manifest, sw.js, favicon).

---

## 📱 Android WebView (APK)

Wrap `dist/` in a basic Android WebView project:

```kotlin
// MainActivity.kt
val webView: WebView = findViewById(R.id.webview)
webView.settings.javaScriptEnabled = true
webView.settings.domStorageEnabled = true
webView.settings.mediaPlaybackRequiresUserGesture = false
webView.loadUrl("file:///android_asset/index.html")
```

The app handles:
- Silent audio unlock on first touch
- Service worker keep-alive
- Media Session for Android notification
- `display: standalone` PWA mode

---

## 🛠️ Troubleshooting

### "No results found"
- Public Piped/Invidious instances may be down — try again in a minute
- Add a YouTube API key in Settings for guaranteed results
- Check your internet connection

### Lock screen controls don't work
- Make sure browser permissions allow autoplay
- Try playing once with the screen unlocked first
- Some browsers require HTTPS for Media Session

### PiP button does nothing
- Browser may not support native PiP — pop-out window will open instead
- Allow popups for the site
- Try Chrome/Edge for best support

### Search is slow
- Public instances are sometimes overloaded
- Add YouTube API key in Settings for fastest results
- Check Settings → Cache to clear and retry

### App is slow on mobile
- Clear search cache in Settings
- Clear browser data
- Use the production build, not dev mode

---

## 💝 Credits

Made with ❤️ by **Sudhir Kumar**

GitHub: [@wherewhere](https://github.com/wherewhere)
Repo: [PrivMITLab-Music-Radio](https://github.com/wherewhere/PrivMITLab-Music-Radio)

If you found this useful, ⭐ star the repo!

---

## 📜 License

MIT License © 2025 Sudhir Kumar

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```
