/** Débloque la lecture audio / TTS pendant le geste utilisateur (clic « Écouter »). */
export function unlockSpeechPlayback() {
  if (typeof window === 'undefined') return;

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ctx = window.__tkvSpeechAudioCtx || new Ctx();
      window.__tkvSpeechAudioCtx = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const silent =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    const probe = new Audio(silent);
    probe.volume = 0.001;
    probe.setAttribute('playsinline', '');
    const p = probe.play();
    if (p?.then) {
      p.then(() => {
        probe.pause();
        probe.removeAttribute('src');
      }).catch(() => {});
    }
  } catch {
    /* ignore */
  }

  try {
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) {
        window.speechSynthesis.getVoices();
      }
      const u = new SpeechSynthesisUtterance('\u200b');
      u.volume = 0;
      u.rate = 10;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    }
  } catch {
    /* ignore */
  }
}
