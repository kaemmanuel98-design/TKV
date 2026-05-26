import { useSpeechStore } from '../../store/useSpeechStore';
import { baseLang } from './accents';
import {
  preloadSpeechVoices,
  speakWithBrowser,
  stopBrowserSpeech,
  listVoicesForLocale,
  pickVoice,
} from './browserSpeech';
import { speakWithCloud, stopCloudSpeech, checkCloudSpeechAvailable } from './cloudSpeech';

export { preloadSpeechVoices, listVoicesForLocale, pickVoice, checkCloudSpeechAvailable };
export { accentsForLanguage, SPEECH_ACCENTS_BY_LANG } from './accents';

let speaking = false;

export function stopSpeech() {
  stopBrowserSpeech();
  stopCloudSpeech();
  speaking = false;
}

export async function speakText(text, { language = 'fr', locale } = {}) {
  const trimmed = text?.trim();
  if (!trimmed) return;

  stopSpeech();
  speaking = true;

  const store = useSpeechStore.getState();
  const targetLocale = locale || store.getAccent(language);

  try {
    if (store.shouldUseCloud()) {
      await speakWithCloud(trimmed, targetLocale);
      return;
    }
    await speakWithBrowser(trimmed, targetLocale);
  } catch (cloudErr) {
    if (store.shouldUseCloud()) {
      try {
        await speakWithBrowser(trimmed, targetLocale);
        return;
      } catch (browserErr) {
        throw browserErr;
      }
    }
    throw cloudErr;
  } finally {
    speaking = false;
  }
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export async function initSpeechEngine() {
  preloadSpeechVoices();
  const available = await checkCloudSpeechAvailable();
  useSpeechStore.getState().setCloudAvailable(available);
  return available;
}

export function getSpeechLangLabel(language) {
  return baseLang(language);
}
