import { useGamificationStore } from '../store/useGamificationStore';
import { getOverallCourseProgress, getCourseModuleCount } from './courseStats';
import { EIDO_MODULE_TOTAL, countCompletedEidoModules } from '../data/courseModules';

const COURSE_BADGE_RULES = [
  { courseId: 'foundations', badgeId: 'course_nepios' },
  { courseId: 'apologetics', badgeId: 'course_neaniskos' },
  { courseId: 'teleios', badgeId: 'course_teleios' },
];

export function completedCountForCourse(completedMap, courseId) {
  return Object.keys(completedMap || {}).filter((k) => k.startsWith(`${courseId}:`)).length;
}

/** Applique badges parcours + barre de progression globale depuis la map `completed`. */
export function applyCourseBadgesFromProgress(completedMap = {}) {
  const { awardBadge, setReadingProgress } = useGamificationStore.getState();

  for (const { courseId, badgeId } of COURSE_BADGE_RULES) {
    if (completedCountForCourse(completedMap, courseId) >= getCourseModuleCount(courseId)) {
      awardBadge(badgeId);
    }
  }

  if (countCompletedEidoModules(completedMap) >= EIDO_MODULE_TOTAL) {
    awardBadge('course_eido');
  }

  const pct = getOverallCourseProgress(completedMap);
  if (pct > 0) {
    setReadingProgress(pct);
  }
}
