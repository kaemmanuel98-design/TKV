import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'tkv_course_progress';

const moduleKey = (courseId, moduleIndex) => `${courseId}:${moduleIndex}`;

export const useCourseProgressStore = create(
  persist(
    (set, get) => ({
      completed: {},

      markComplete: (courseId, moduleIndex) => {
        const key = moduleKey(courseId, moduleIndex);
        if (get().completed[key]) return;
        set({ completed: { ...get().completed, [key]: true } });
      },

      isComplete: (courseId, moduleIndex) => !!get().completed[moduleKey(courseId, moduleIndex)],

      completedCount: (courseId) =>
        Object.keys(get().completed).filter((k) => k.startsWith(`${courseId}:`)).length,
    }),
    { name: STORAGE_KEY }
  )
);
