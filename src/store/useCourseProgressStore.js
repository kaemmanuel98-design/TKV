import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCourseProgressPercent, getOverallCourseProgress } from '../lib/courseStats';
import {
  fetchCourseProgress,
  mergeCourseCompleted,
  pushLocalCourseProgress,
  saveCourseModuleComplete,
} from '../lib/courseProgressSync';
import { applyCourseBadgesFromProgress } from '../lib/courseBadges';

const STORAGE_KEY = 'tkv_course_progress';

const moduleKey = (courseId, moduleIndex) => `${courseId}:${moduleIndex}`;

export const useCourseProgressStore = create(
  persist(
    (set, get) => ({
      completed: {},
      _hydratedFor: null,

      hydrateFromUser: async (userId) => {
        if (!userId) return;
        if (get()._hydratedFor === userId) return;

        const local = { ...get().completed };
        const remote = await fetchCourseProgress(userId);
        const merged = mergeCourseCompleted(local, remote);

        set({ completed: merged, _hydratedFor: userId });

        applyCourseBadgesFromProgress(merged);

        await pushLocalCourseProgress(userId, merged);
      },

      resetRemoteHydration: () => set({ _hydratedFor: null }),

      markComplete: (courseId, moduleIndex, userId) => {
        const key = moduleKey(courseId, moduleIndex);
        if (get().completed[key]) return get();
        const completed = { ...get().completed, [key]: true };
        set({ completed });
        if (userId) {
          saveCourseModuleComplete(userId, courseId, moduleIndex);
        }
        return { completed, courseId, moduleIndex };
      },

      isComplete: (courseId, moduleIndex) => !!get().completed[moduleKey(courseId, moduleIndex)],

      completedCount: (courseId) =>
        Object.keys(get().completed).filter((k) => k.startsWith(`${courseId}:`)).length,

      progressPercent: (courseId) =>
        getCourseProgressPercent((id) => get().completedCount(id), courseId),

      overallProgressPercent: () => getOverallCourseProgress(get().completed),
    }),
    { name: STORAGE_KEY }
  )
);
