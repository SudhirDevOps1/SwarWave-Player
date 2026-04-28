// PiP via pop-out window - works with any playback engine

export function isPiPSupported(): boolean {
  return typeof window !== 'undefined';
}

export async function exitPiP(): Promise<void> {
  // nothing to do for pop-out
}

export async function togglePiP(
  currentSong: { videoId: string; title: string } | null,
  setIsPiP: (v: boolean) => void,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
) {
  if (!currentSong) {
    showToast('No song playing', 'error');
    return;
  }

  try {
    // Open YouTube in a small pop-out window (PiP-like)
    const url = `https://www.youtube.com/watch?v=${currentSong.videoId}`;
    const w = window.open(url, 'privmitlab-pip', 'width=480,height=300,menubar=no,toolbar=no,location=no,status=no');
    if (w) {
      setIsPiP(true);
      showToast('Pop-out player opened (PiP)', 'success');
      // Detect when popup closes
      const timer = setInterval(() => {
        if (w.closed) {
          setIsPiP(false);
          clearInterval(timer);
        }
      }, 1000);
    } else {
      showToast('Pop-up blocked. Please allow pop-ups for this site.', 'error');
    }
  } catch {
    showToast('Failed to open pop-out player', 'error');
  }
}
