import { supabase } from '../supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';
const TTS_TIMEOUT_MS = 60000;

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.tts ?? data.openai);
  } catch {
    return false;
  }
}

function playAudioBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    currentAudio = audio;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
    };

    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.playsInline = true;
    audio.volume = 1;

    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error('audio_playback'));
    };

    audio.oncanplaythrough = () => {
      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise.catch((err) => {
          cleanup();
          reject(err);
        });
      }
    };

    audio.src = url;
    audio.load();
  });
}

async function parseTtsError(res) {
  let code = res.status === 503 ? 'tts_unavailable' : 'tts_failed';
  try {
    const data = await res.json();
    const msg = data.message || data.error || '';
    if (res.status === 429 || /quota|429/i.test(msg)) code = 'tts_quota_exceeded';
  } catch {
    /* corps non JSON */
  }
  const err = new Error(code);
  err.status = res.status;
  return err;
}

export async function speakWithCloud(text, locale) {
  stopCloudSpeech();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        text: text.slice(0, 4096),
        locale,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw await parseTtsError(res);
    }

    const blob = await res.blob();
    if (!blob.size) {
      throw new Error('tts_empty');
    }

    await playAudioBlob(blob);
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('tts_timeout');
    }
    throw err;
  }
}
