import { getCourseModuleCount } from './courseStats';

export const CERTIFICATE_COURSES = {
  foundations: { titleKey: 'course_foundations_title', badgeId: 'course_nepios' },
  apologetics: { titleKey: 'course_apologetics_title', badgeId: 'course_neaniskos' },
  teleios: { titleKey: 'course_teleios_title', badgeId: 'course_teleios' },
};

export function isCourseEligibleForCertificate(courseId, completedMap = {}) {
  const total = getCourseModuleCount(courseId);
  if (!total) return false;
  const done = Object.keys(completedMap).filter((k) => k.startsWith(`${courseId}:`)).length;
  return done >= total;
}

export function generateCertificateCode(courseSlug) {
  const prefix = courseSlug.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase() || 'TKV';
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TKV-${prefix}-${year}-${rand}`;
}
