import { useGamificationStore } from '../store/useGamificationStore';
import { getOverallCourseProgress } from './courseStats';

const COURSE_BADGE_RULES = [
  { courseId: 'foundations', minModules: 8, badgeId: 'course_nepios' },
  { courseId: 'apologetics', minModules: 6, badgeId: 'course_neaniskos' },
  { courseId: 'teleios', minModules: 6, badgeId: 'course_teleios' },
];

export function completedCountForCourse(completedMap, courseId) {
  return Object.keys(completedMap || {}).filter((k) => k.startsWith(`${courseId}:`)).length;
}

/** Applique badges parcours + barre de progression globale depuis la map `completed`. */
export function applyCourseBadgesFromProgress(completedMap = {}) {
  const { awardBadge, setReadingProgress } = useGamificationStore.getState();

  for (const { courseId, minModules, badgeId } of COURSE_BADGE_RULES) {
    if (completedCountForCourse(completedMap, courseId) >= minModules) {
      awardBadge(badgeId);
    }
  }

  const pct = getOverallCourseProgress(completedMap);
  if (pct > 0) {
    setReadingProgress(pct);
  }
}
