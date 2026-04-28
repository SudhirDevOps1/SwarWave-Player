import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Clear old cached search results from previous versions on first load
try {
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith('music_search_') && !key.startsWith('music_search_v6_')) {
      localStorage.removeItem(key);
    }
  }
} catch {}

// Register service worker with update check
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 30 * 60 * 1000);
      })
      .catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
