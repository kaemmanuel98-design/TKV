import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  gamificationFromProfile,
  mergeBadges,
  mergeReadingProgress,
  saveGamificationToProfile,
} from '../lib/gamificationSync';
import { useAuthStore } from './useAuthStore';

const STORAGE_KEY = 'tkv_gamification';

const todayKey = () => new Date().toISOString().slice(0, 10);

let pushTimer = null;

function schedulePushGamification() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const { badges, readingProgress, streakCurrent, streakBest, lastCheckIn } =
      useGamificationStore.getState();
    saveGamificationToProfile(userId, {
      badges,
      readingProgress,
      streakCurrent,
      streakBest,
      lastCheckIn,
    });
  }, 1500);
}

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
        schedulePushGamification();
        return true;
      },

      hasCheckedInToday: () => get().lastCheckIn === todayKey(),

      awardBadge: (id) => {
        const badges = get().badges;
        if (badges.includes(id)) return;
        set({ badges: [...badges, id] });
        schedulePushGamification();
      },

      setReadingProgress: (percent) => {
        const readingProgress = Math.min(100, Math.max(0, percent));
        set({ readingProgress });
        if (readingProgress >= 25) get().awardBadge('reader');
        schedulePushGamification();
      },

      incrementIaQuestions: () => {
        set({ iaQuestionsCount: get().iaQuestionsCount + 1 });
      },

      incrementCommunityPosts: () => {
        set({ communityPostsCount: get().communityPostsCount + 1 });
      },

      syncFromProfile: (profile) => {
        if (!profile) return;

        const remote = gamificationFromProfile(profile);
        const mergedBadges = mergeBadges(get().badges, remote.badges);
        const mergedReading = mergeReadingProgress(get().readingProgress, remote.readingProgress);

        set({
          streakCurrent: profile.streak_current ?? get().streakCurrent,
          streakBest: profile.streak_best ?? get().streakBest,
          lastCheckIn: profile.last_active_date ?? get().lastCheckIn,
          badges: mergedBadges,
          readingProgress: mergedReading,
        });

        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          saveGamificationToProfile(userId, {
            badges: mergedBadges,
            readingProgress: mergedReading,
            streakCurrent: profile.streak_current ?? get().streakCurrent,
            streakBest: profile.streak_best ?? get().streakBest,
            lastCheckIn: profile.last_active_date ?? get().lastCheckIn,
          });
        }
      },
    }),
    { name: STORAGE_KEY }
  )
);

export const ONBOARDING_KEY = 'tkv_onboarding_complete';
export const PROFILE_TYPE_KEY = 'tkv_profile_type';
