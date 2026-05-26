import OpenAI from 'openai';
import { config } from '../config.js';
import {
  pickTtsInstructions,
  pickTtsLanguage,
  pickTtsSpeed,
  pickTtsVoice,
} from './ttsLocales.js';

const TTS_MODELS = [
  process.env.TTS_MODEL,
  'gpt-4o-mini-tts',
  'gpt-4o-mini-tts-2025-03-20',
  'tts-1-hd',
  'tts-1',
].filter(Boolean);

let client = null;

function getClient() {
  if (!config.openaiKey) return null;
  if (!client) client = new OpenAI({ apiKey: config.openaiKey });
  return client;
}

function isSteerableModel(model) {
  return model && String(model).includes('gpt-4o-mini-tts');
}

async function createSpeechAudio(openai, locale, text) {
  const voice = pickTtsVoice(locale);
  const instructions = pickTtsInstructions(locale);
  const speed = pickTtsSpeed(locale);
  const language = pickTtsLanguage(locale);
  const models = TTS_MODELS.length ? TTS_MODELS : ['gpt-4o-mini-tts'];

  let lastError;
  for (const model of models) {
    const attempts = isSteerableModel(model)
      ? [
          { instructions, language },
          { instructions },
          {},
        ]
      : [{}];

    for (const extra of attempts) {
      try {
        const params = {
          model,
          voice,
          input: text,
          response_format: 'mp3',
          speed,
          ...extra,
        };

        const response = await openai.audio.speech.create(params);
        return Buffer.from(await response.arrayBuffer());
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('tts_failed');
}

export async function synthesizeSpeech(text, locale = 'fr-FR') {
  const openai = getClient();
  if (!openai) {
    throw new Error('openai_not_configured');
  }

  return createSpeechAudio(openai, locale, text);
}
