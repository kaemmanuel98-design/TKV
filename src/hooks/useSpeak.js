import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { speakText, stopSpeech, isSpeechSupported } from '../lib/speech';

export function useSpeak() {
  const { i18n, t } = useTranslation();

  const speak = useCallback(
    async (text) => {
      if (!isSpeechSupported()) {
        alert(t('bible_tts_unsupported'));
        return;
      }
      try {
        await speakText(text, { language: i18n.language });
      } catch {
        alert(t('speech_error'));
      }
    },
    [i18n.language, t]
  );

  return { speak, stop: stopSpeech };
}
