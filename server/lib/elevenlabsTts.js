import { config } from '../config.js';

const DEFAULT_MODEL = 'eleven_multilingual_v2';

/**
 * Réglages « chaire » — stabilité basse = plus d'émotion et moins de ton robotique.
 * Ajustez via .env si besoin après écoute.
 */
export const PREACHING_VOICE_SETTINGS = {
  stability: Number(process.env.ELEVENLABS_STABILITY) || 0.31,
  similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY) || 0.82,
  style: Number(process.env.ELEVENLABS_STYLE) || 0.48,
  use_speaker_boost: process.env.ELEVENLABS_SPEAKER_BOOST !== 'false',
};

function apiKey() {
  return config.elevenlabsApiKey;
}

function voiceId(override) {
  return override || config.elevenlabsVoiceId;
}

export function elevenlabsConfigured(requireVoice = true) {
  if (!apiKey()) return false;
  if (requireVoice && !voiceId()) return false;
  return true;
}

/**
 * Synthèse d'un bloc de texte (MP3 buffer).
 * @param {string} text
 * @param {{ voiceId?: string, modelId?: string, previousText?: string, nextText?: string, voiceSettings?: object }} opts
 */
export async function synthesizeElevenLabs(text, opts = {}) {
  const key = apiKey();
  const vid = voiceId(opts.voiceId);
  if (!key || !vid) throw new Error('elevenlabs_not_configured');

  const body = {
    text: String(text || '').trim(),
    model_id: opts.modelId || config.elevenlabsModel || DEFAULT_MODEL,
    voice_settings: { ...PREACHING_VOICE_SETTINGS, ...opts.voiceSettings },
  };

  if (opts.previousText?.trim()) body.previous_text = opts.previousText.trim().slice(-500);
  if (opts.nextText?.trim()) body.next_text = opts.nextText.trim().slice(0, 500);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`elevenlabs_tts_failed:${res.status}`);
    err.detail = detail.slice(0, 400);
    throw err;
  }

  return Buffer.from(await res.arrayBuffer());
}

/** Liste les voix du compte (pour retrouver l'ID de ta voix clonée). */
export async function listElevenLabsVoices() {
  const key = apiKey();
  if (!key) throw new Error('elevenlabs_not_configured');

  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': key },
  });
  if (!res.ok) throw new Error(`elevenlabs_voices_failed:${res.status}`);
  const data = await res.json();
  return data.voices || [];
}
