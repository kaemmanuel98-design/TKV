import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  speakText,
  stopSpeech,
  isSpeechSupported,
  checkCloudSpeechAvailable,
} from '../lib/speech';
import { useSpeechStore } from '../store/useSpeechStore';
import { resolveSpeechLocale } from '../lib/speech/locale';
import { unlockSpeechPlayback } from '../lib/speech/unlockPlayback';

export function useSpeak() {
  const { i18n, t } = useTranslation();
  const getAccent = useSpeechStore((s) => s.getAccent);
  const setCloudAvailable = useSpeechStore((s) => s.setCloudAvailable);

  const speak = useCallback(
    async (text, options = {}) => {
      unlockSpeechPlayback();

      const language = options.language ?? i18n.language;
      const locale = resolveSpeechLocale(language, options.locale, getAccent);
      const trimmed = String(text || '').trim();

      if (!trimmed) {
        alert(t('speech_empty_text'));
        return;
      }

      const cloudOk = await checkCloudSpeechAvailable();
      setCloudAvailable(cloudOk);

      if (!isSpeechSupported() && !cloudOk) {
        alert(t('bible_tts_unsupported'));
        return;
      }

      try {
        await speakText(trimmed, {
          language,
          locale,
          prepared: options.prepared ?? false,
        });
      } catch (err) {
        const code = err?.message || 'speech_error';
        if (code === 'no_voice_for_locale') {
          alert(t('speech_no_native_voice'));
          return;
        }
        if (code === 'tts_unavailable') {
          alert(t('speech_cloud_unavailable'));
          return;
        }
        if (code === 'tts_quota_exceeded') {
          alert(t('speech_quota_exceeded'));
          return;
        }
        if (code === 'empty_text') {
          alert(t('speech_empty_text'));
          return;
        }
        if (code === 'audio_autoplay_blocked') {
          alert(t('speech_autoplay_blocked'));
          return;
        }
        if (code === 'audio_playback' || code === 'audio_playback_timeout' || code === 'tts_invalid_response') {
          alert(t('speech_error'));
          return;
        }
        if (code === 'speech_not_started' || code === 'speech_error' || code === 'interrupted' || code === 'canceled') {
          alert(t('speech_error'));
          return;
        }
        console.error('[TKV TTS]', err);
        alert(t('speech_error'));
      }
    },
    [i18n.language, getAccent, setCloudAvailable, t]
  );

  return { speak, stop: stopSpeech };
}
