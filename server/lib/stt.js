import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { config } from '../config.js';

let client = null;

function getClient() {
  if (!config.openaiKey) return null;
  if (!client) client = new OpenAI({ apiKey: config.openaiKey });
  return client;
}

/**
 * Transcrit un enregistrement audio (webm/mp4/wav) via Whisper.
 * @param {Buffer} buffer
 * @param {string} language - fr, en, …
 */
export async function transcribeAudio(buffer, language = 'fr') {
  const openai = getClient();
  if (!openai) throw new Error('openai_not_configured');

  const lang = language?.split('-')[0] || 'fr';
  const file = await toFile(buffer, 'mim-voice.webm', { type: 'audio/webm' });

  const res = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: lang,
    response_format: 'text',
  });

  const text = typeof res === 'string' ? res : res?.text || '';
  return text.trim();
}
