import { COURSE_MODULES } from '../data/courseModules';

export const COURSE_IDS = Object.keys(COURSE_MODULES);

export function getCourseModuleCount(courseId) {
  return COURSE_MODULES[courseId]?.modules?.length ?? 0;
}

export function getTotalCourseModules() {
  return COURSE_IDS.reduce((sum, id) => sum + getCourseModuleCount(id), 0);
}

export function getCourseProgressPercent(completedCount, courseId) {
  const total = getCourseModuleCount(courseId);
  if (!total) return 0;
  return Math.round((completedCount(courseId) / total) * 100);
}

export function getOverallCourseProgress(completedMap) {
  const total = getTotalCourseModules();
  if (!total) return 0;
  const done = Object.keys(completedMap || {}).length;
  return Math.round((done / total) * 100);
}

/** Prochain module non complété dans un parcours donné. */
export function getNextIncompleteModuleInCourse(courseId, completedMap = {}) {
  const course = COURSE_MODULES[courseId];
  if (!course?.modules) return null;
  for (const mod of course.modules) {
    const key = `${courseId}:${mod.index}`;
    if (!completedMap[key]) {
      return {
        courseId,
        moduleIndex: mod.index,
        moduleTitleKey: mod.titleKey,
        courseTitleKey: course.titleKey,
      };
    }
  }
  return null;
}

/** Prochain module non complété (parcours puis index). */
export function getNextIncompleteModule(completedMap = {}) {
  for (const courseId of COURSE_IDS) {
    const next = getNextIncompleteModuleInCourse(courseId, completedMap);
    if (next) return next;
  }
  return null;
}
