import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2 } from 'lucide-react';
import { useSpeechStore } from '../store/useSpeechStore';
import { accentsForLanguage } from '../lib/speech/accents';
import { initSpeechEngine } from '../lib/speech';
import { useSpeak } from '../hooks/useSpeak';

const SpeechSettings = () => {
  const { t, i18n } = useTranslation();
  const engine = useSpeechStore((s) => s.engine);
  const cloudAvailable = useSpeechStore((s) => s.cloudAvailable);
  const setEngine = useSpeechStore((s) => s.setEngine);
  const getAccent = useSpeechStore((s) => s.getAccent);
  const setAccent = useSpeechStore((s) => s.setAccent);

  const { speak } = useSpeak();
  const accents = accentsForLanguage(i18n.language);
  const currentAccent = getAccent(i18n.language);

  useEffect(() => {
    initSpeechEngine();
  }, []);

  return (
    <section className="card profile-speech">
      <h2 className="profile-section-title">
        <Volume2 size={20} />
        {t('speech_settings_title')}
      </h2>
      <p className="text-muted speech-settings-desc">{t('speech_settings_desc')}</p>

      <p className="profile-label">{t('speech_engine_label')}</p>
      <div className="profile-type-row speech-engine-row">
        <button
          type="button"
          className={`profile-type-btn ${engine === 'auto' ? 'active' : ''}`}
          onClick={() => setEngine('auto')}
        >
          {t('speech_engine_auto')}
        </button>
        <button
          type="button"
          className={`profile-type-btn ${engine === 'cloud' ? 'active' : ''}`}
          onClick={() => setEngine('cloud')}
          disabled={!cloudAvailable}
        >
          {t('speech_engine_cloud')}
        </button>
        <button
          type="button"
          className={`profile-type-btn ${engine === 'browser' ? 'active' : ''}`}
          onClick={() => setEngine('browser')}
        >
          {t('speech_engine_browser')}
        </button>
      </div>
      {!cloudAvailable && (
        <p className="text-muted speech-hint">{t('speech_cloud_unavailable')}</p>
      )}
      {cloudAvailable && engine === 'browser' && (
        <p className="text-muted speech-hint">{t('speech_cloud_recommended')}</p>
      )}

      <label className="profile-label" htmlFor="speech-accent">
        {t('speech_accent_label')}
      </label>
      <select
        id="speech-accent"
        className="input speech-accent-select"
        value={currentAccent}
        onChange={(e) => setAccent(i18n.language, e.target.value)}
      >
        {accents.map(({ locale, labelKey }) => (
          <option key={locale} value={locale}>
            {t(labelKey)}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="btn btn-outline btn-sm speech-preview-btn"
        onClick={() => speak(t('speech_preview_sample'))}
      >
        <Volume2 size={16} />
        {t('speech_preview_btn')}
      </button>
    </section>
  );
};

export default SpeechSettings;
