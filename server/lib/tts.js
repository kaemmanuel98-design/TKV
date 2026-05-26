import OpenAI from 'openai';
import { config } from '../config.js';

/** Voix OpenAI — timbres différents selon la locale (approximation d’accent) */
const VOICE_BY_LOCALE = {
  'fr-FR': 'nova',
  'fr-CA': 'shimmer',
  'fr-BE': 'nova',
  'en-US': 'alloy',
  'en-GB': 'fable',
  'en-AU': 'echo',
  'es-ES': 'nova',
  'es-MX': 'shimmer',
  'es-AR': 'onyx',
  'nl-NL': 'alloy',
  'nl-BE': 'fable',
  'pt-PT': 'nova',
  'pt-BR': 'shimmer',
  'ar-SA': 'onyx',
  'ar-EG': 'echo',
};

function pickVoice(locale) {
  if (locale && VOICE_BY_LOCALE[locale]) return VOICE_BY_LOCALE[locale];
  const base = locale?.split('-')[0];
  const fallback = Object.entries(VOICE_BY_LOCALE).find(([k]) => k.startsWith(`${base}-`));
  return fallback?.[1] || 'nova';
}

let client = null;

function getClient() {
  if (!config.openaiKey) return null;
  if (!client) client = new OpenAI({ apiKey: config.openaiKey });
  return client;
}

export async function synthesizeSpeech(text, locale = 'fr-FR') {
  const openai = getClient();
  if (!openai) {
    throw new Error('openai_not_configured');
  }

  const voice = pickVoice(locale);
  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice,
    input: text,
    response_format: 'mp3',
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}
