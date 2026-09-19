// Generates a short two-tone alert beep using the Web Audio API.
// No audio file needed, synthesized on the fly, works offline.
export function playAlertSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Two-tone alert: high-low, like an emergency chirp
    playTone(880, now, 0.15);
    playTone(660, now + 0.18, 0.2);

    // Clean up context after sound finishes
    setTimeout(() => ctx.close(), 600);
  } catch (e) {
    console.log('[alertSound] playback failed:', e);
  }
}