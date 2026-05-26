import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'tkv_gamification';

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultState = {
  streakCurrent: 0,
  streakBest: 0,
  lastCheckIn: null,
  badges: [],
  readingProgress: 12,
  iaQuestionsCount: 0,
  communityPostsCount: 0,
};

export const useGamificationStore = create(
  persist(
    (set, get) => ({
      ...defaultState,

      checkInToday: () => {
        const today = todayKey();
        const { lastCheckIn, streakCurrent, streakBest } = get();
        if (lastCheckIn === today) return false;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().slice(0, 10);

        let nextStreak = 1;
        if (lastCheckIn === yesterdayKey) {
          nextStreak = streakCurrent + 1;
        }

        const nextBest = Math.max(streakBest, nextStreak);
        const badges = [...get().badges];
        if (!badges.includes('first_step')) badges.push('first_step');
        if (nextStreak >= 7 && !badges.includes('streak_7')) badges.push('streak_7');

        set({
          streakCurrent: nextStreak,
          streakBest: nextBest,
          lastCheckIn: today,
          badges,
        });
        return true;
      },

      hasCheckedInToday: () => get().lastCheckIn === todayKey(),

      awardBadge: (id) => {
        const badges = get().badges;
        if (badges.includes(id)) return;
        set({ badges: [...badges, id] });
      },

      setReadingProgress: (percent) => {
        set({ readingProgress: Math.min(100, Math.max(0, percent)) });
        if (percent >= 25) get().awardBadge('reader');
      },

      incrementIaQuestions: () => {
        const count = get().iaQuestionsCount + 1;
        set({ iaQuestionsCount: count });
      },

      incrementCommunityPosts: () => {
        set({ communityPostsCount: get().communityPostsCount + 1 });
      },

      syncFromProfile: (profile) => {
        if (!profile) return;
        set({
          streakCurrent: profile.streak_current ?? get().streakCurrent,
          streakBest: profile.streak_best ?? get().streakBest,
          lastCheckIn: profile.last_active_date ?? get().lastCheckIn,
        });
      },
    }),
    { name: STORAGE_KEY }
  )
);

export const ONBOARDING_KEY = 'tkv_onboarding_complete';
export const PROFILE_TYPE_KEY = 'tkv_profile_type';
