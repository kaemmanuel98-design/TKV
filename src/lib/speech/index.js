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

function shouldTryCloud(engine, cloudAvailable) {
  if (!cloudAvailable) return false;
  return engine !== 'browser';
}

/** Pour un chapitre entier : plusieurs requêtes cloud si besoin */
async function speakWithCloudLong(text, locale) {
  const chunks = chunkTextForSpeech(text, 3800);
  for (const chunk of chunks) {
    await speakWithCloud(chunk, locale);
  }
}

export async function speakText(text, { language = 'fr', locale, prepared = false } = {}) {
  const store = useSpeechStore.getState();
  const targetLocale = resolveSpeechLocale(language, locale, store.getAccent);
  const trimmed = prepared
    ? text?.trim()
    : prepareSpeechText(text, { locale: targetLocale });

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
    const tryCloud = shouldTryCloud(store.engine, cloudAvailable);
    let cloudFailed = false;

    if (tryCloud) {
      try {
        if (trimmed.length > 3800) {
          await speakWithCloudLong(trimmed, targetLocale);
        } else {
          await speakWithCloud(trimmed, targetLocale);
        }
        return;
      } catch (cloudErr) {
        cloudFailed = true;
        console.warn('[TKV TTS] cloud failed:', cloudErr?.message || cloudErr);
        const authBlocked = cloudErr?.status === 401;
        if (cloudErr?.message === 'tts_quota_exceeded') {
          store.setCloudAvailable(false);
        }
        if (store.engine === 'cloud' && !('speechSynthesis' in window)) {
          throw cloudErr;
        }
        if (authBlocked && !('speechSynthesis' in window)) {
          throw new Error('tts_login_required');
        }
      }
    }

    if (!('speechSynthesis' in window)) {
      if (cloudAvailable && !cloudFailed) {
        await speakWithCloud(trimmed.slice(0, 4096), targetLocale);
        return;
      }
      throw new Error('unsupported');
    }

    await speakWithBrowser(trimmed, targetLocale);
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
