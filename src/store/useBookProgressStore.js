import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'tkv_book_progress';

export const useBookProgressStore = create(
  persist(
    (set, get) => ({
      bySlug: {},

      saveProgress: (slug, chapterIndex, totalChapters) => {
        if (!slug || !totalChapters) return;
        const idx = Math.max(0, Math.min(chapterIndex, totalChapters - 1));
        set({
          bySlug: {
            ...get().bySlug,
            [slug]: {
              chapterIndex: idx,
              totalChapters,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },

      getProgress: (slug) => get().bySlug[slug] || null,

      progressPercent: (slug) => {
        const row = get().bySlug[slug];
        if (!row?.totalChapters) return 0;
        return Math.round(((row.chapterIndex + 1) / row.totalChapters) * 100);
      },
    }),
    { name: STORAGE_KEY }
  )
);
