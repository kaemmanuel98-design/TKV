import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'tkv_podcast_quota';
export const FREE_PODCAST_EPISODES_PER_MONTH = 3;

const monthKey = () => new Date().toISOString().slice(0, 7);

export const usePodcastQuotaStore = create(
  persist(
    (set, get) => ({
      month: monthKey(),
      playedSlugs: [],

      resetIfNewMonth: () => {
        const current = monthKey();
        if (get().month !== current) {
          set({ month: current, playedSlugs: [] });
        }
      },

      hasPlayed: (slug) => get().playedSlugs.includes(slug),

      playedCount: () => {
        get().resetIfNewMonth();
        return get().playedSlugs.length;
      },

      canPlay: (slug, isPremiumUser) => {
        if (isPremiumUser) return true;
        get().resetIfNewMonth();
        if (get().playedSlugs.includes(slug)) return true;
        return get().playedSlugs.length < FREE_PODCAST_EPISODES_PER_MONTH;
      },

      recordPlay: (slug) => {
        if (!slug) return;
        get().resetIfNewMonth();
        if (get().playedSlugs.includes(slug)) return;
        set({ playedSlugs: [...get().playedSlugs, slug] });
      },

      remainingFree: () => {
        get().resetIfNewMonth();
        return Math.max(0, FREE_PODCAST_EPISODES_PER_MONTH - get().playedSlugs.length);
      },
    }),
    { name: STORAGE_KEY }
  )
);
