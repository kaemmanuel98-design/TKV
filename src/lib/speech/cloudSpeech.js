const API_BASE = import.meta.env.VITE_API_URL || '';

let currentAudio = null;

export function stopCloudSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}

export async function checkCloudSpeechAvailable() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.openai);
  } catch {
    return false;
  }
}

export function speakWithCloud(text, locale) {
  return new Promise(async (resolve, reject) => {
    stopCloudSpeech();

    try {
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 4096),
          locale,
        }),
      });

      if (!res.ok) {
        reject(new Error('tts_failed'));
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        reject(new Error('audio_playback'));
      };

      await audio.play();
    } catch (err) {
      reject(err);
    }
  });
}
