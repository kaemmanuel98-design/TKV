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
    currentAudio.removeAttribute('src');
    currentAudio.load();
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
    const audio = new Audio(url);
    currentAudio = audio;
    let settled = false;
    let playStarted = false;

    const finish = (err) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      if (err) reject(err);
      else resolve();
    };

    const tryPlay = () => {
      if (playStarted || settled) return;
      playStarted = true;
      const p = audio.play();
      if (p?.then) {
        p.catch((err) => {
          const name = err?.name || '';
          if (name === 'NotAllowedError') {
            finish(new Error('audio_autoplay_blocked'));
            return;
          }
          finish(err);
        });
      }
    };

    audio.volume = 1;
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    audio.preload = 'auto';
    audio.onended = () => finish();
    audio.onerror = () => finish(new Error('audio_playback'));

    audio.addEventListener('loadeddata', tryPlay, { once: true });
    audio.addEventListener('canplaythrough', tryPlay, { once: true });

    audio.src = url;
    audio.load();

    if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
    }

    setTimeout(() => {
      if (!settled && audio.paused) tryPlay();
    }, 400);

    setTimeout(() => {
      if (!settled && audio.paused) {
        finish(new Error('audio_playback_timeout'));
      }
    }, 120_000);
  });
}

async function parseTtsError(res) {
  if (res.status === 401) {
    const err = new Error('tts_login_required');
    err.status = 401;
    return err;
  }

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

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('audio') && !contentType.includes('mpeg')) {
      throw new Error('tts_invalid_response');
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
