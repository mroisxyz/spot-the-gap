// Tiny synthesized cues: no audio files, no network, no autoplay. The context is only created
// after a real click or key press, and every failure is silently ignored.
export function createSound() {
  let context = null;

  function audio() {
    if (context === null) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      try {
        context = Audio ? new Audio() : false;
      } catch {
        context = false;
      }
    }
    if (context && context.state === 'suspended') context.resume().catch(() => {});
    return context || null;
  }

  function note(ctx, frequency, offset, duration, volume, type = 'sine') {
    const start = ctx.currentTime + offset;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function play(kind) {
    const ctx = audio();
    if (!ctx) return;
    try {
      if (kind === 'find') {
        note(ctx, 740, 0, 0.16, 0.07);
        note(ctx, 1110, 0.07, 0.22, 0.055);
      } else if (kind === 'miss') {
        note(ctx, 190, 0, 0.14, 0.045, 'triangle');
      } else if (kind === 'hint') {
        note(ctx, 620, 0, 0.12, 0.04);
        note(ctx, 930, 0.09, 0.16, 0.035);
      } else if (kind === 'complete') {
        [523, 659, 784, 1047].forEach((frequency, index) => note(ctx, frequency, index * 0.09, 0.28, 0.05));
      } else if (kind === 'tick') {
        note(ctx, 880, 0, 0.05, 0.016, 'square');
      }
    } catch {
      // An audio device that refuses to play must never stop the puzzle.
    }
  }

  return { play };
}
