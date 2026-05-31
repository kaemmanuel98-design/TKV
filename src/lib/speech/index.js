import { useSpeechStore } from '../../store/useSpeechStore';
import { baseLang } from './accents';
import { resolveSpeechLocale } from './locale';
import { prepareSpeechText } from './prepareText';
import { chunkTextForSpeech } from './chunkText.js';
import {
  preloadSpeechVoices,
  speakWithBrowser,
  stopBrowserSpeech,
  ensureVoicesReady,
  listVoicesForLocale,
  pickVoice,
} from './browserSpeech';
import { speakWithCloud, stopCloudSpeech, checkCloudSpeechAvailable } from './cloudSpeech';
import { unlockSpeechPlayback } from './unlockPlayback';

export { preloadSpeechVoices, listVoicesForLocale, pickVoice, checkCloudSpeechAvailable, ensureVoicesReady };
export { accentsForLanguage, SPEECH_ACCENTS_BY_LANG } from './accents';
export { resolveSpeechLocale } from './locale';

let speaking = false;

export function stopSpeech() {
  stopBrowserSpeech();
  stopCloudSpeech();
  speaking = false;
}

async function ensureCloudAvailable() {
  const store = useSpeechStore.getState();
  if (store.cloudAvailable !== null) return store.cloudAvailable;
  const available = await checkCloudSpeechAvailable();
  store.setCloudAvailable(available);
  return available;
}

function wantsCloudOnly(engine) {
  return engine === 'cloud';
}

async function speakWithCloudLong(text, locale) {
  const chunks = chunkTextForSpeech(text, 3800);
  for (const chunk of chunks) {
    await speakWithCloud(chunk, locale);
  }
}

async function tryCloudSpeak(trimmed, targetLocale) {
  if (trimmed.length > 3800) {
    await speakWithCloudLong(trimmed, targetLocale);
  } else {
    await speakWithCloud(trimmed, targetLocale);
  }
}

export async function speakText(text, { language = 'fr', locale, prepared = false } = {}) {
  unlockSpeechPlayback();

  const store = useSpeechStore.getState();
  const targetLocale = resolveSpeechLocale(language, locale, store.getAccent);
  const trimmed = prepared
    ? text?.trim()
    : prepareSpeechText(text, { locale: targetLocale, keepReferences: true });

  if (!trimmed) {
    throw new Error('empty_text');
  }

  stopSpeech();
  speaking = true;

  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      await ensureVoicesReady();
    }

    const cloudAvailable = await ensureCloudAvailable();
    const engine = store.engine;
    const useCloudFirst = cloudAvailable && engine !== 'browser';

    if (useCloudFirst) {
      try {
        await tryCloudSpeak(trimmed, targetLocale);
        return;
      } catch (cloudErr) {
        console.warn('[TKV TTS] cloud:', cloudErr?.message || cloudErr);
        if (wantsCloudOnly(engine)) throw cloudErr;
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        await speakWithBrowser(trimmed, targetLocale);
        return;
      } catch (browserErr) {
        console.warn('[TKV TTS] browser:', browserErr?.message || browserErr);
        if (engine === 'browser' && !cloudAvailable) {
          throw browserErr;
        }
      }
    }

    if (cloudAvailable && !useCloudFirst) {
      await tryCloudSpeak(trimmed, targetLocale);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      await speakWithBrowser(trimmed, targetLocale);
      return;
    }

    throw new Error('unsupported');
  } finally {
    speaking = false;
  }
}

export function isSpeechSupported() {
  if (typeof window === 'undefined') return false;
  if ('speechSynthesis' in window) return true;
  const cloud = useSpeechStore.getState().cloudAvailable;
  return cloud === true;
}

export async function initSpeechEngine() {
  preloadSpeechVoices();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    await ensureVoicesReady();
  }
  return ensureCloudAvailable();
}

export function getSpeechLangLabel(language) {
  return baseLang(language);
}
