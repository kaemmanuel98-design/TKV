import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_ACCENT, baseLang } from '../lib/speech/accents';

const STORAGE_KEY = 'tkv_speech_prefs';

export const useSpeechStore = create(
  persist(
    (set, get) => ({
      /** auto = cloud si dispo, sinon navigateur · browser · cloud */
      engine: 'auto',
      accents: { ...DEFAULT_ACCENT },
      cloudAvailable: null,

      setEngine: (engine) => set({ engine }),
      setCloudAvailable: (available) => set({ cloudAvailable: available }),

      setAccent: (language, locale) => {
        const code = baseLang(language);
        set({ accents: { ...get().accents, [code]: locale } });
      },

      getAccent: (language) => {
        const code = baseLang(language);
        return get().accents[code] || DEFAULT_ACCENT[code] || 'fr-FR';
      },

      shouldUseCloud: () => {
        const { engine, cloudAvailable } = get();
        if (engine === 'browser') return false;
        if (engine === 'cloud') return Boolean(cloudAvailable);
        return Boolean(cloudAvailable);
      },
    }),
    { name: STORAGE_KEY }
  )
);
