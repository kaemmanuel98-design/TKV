import { supabase } from './supabase';

const moduleKey = (courseId, moduleIndex) => `${courseId}:${moduleIndex}`;

/** Fusionne progression locale et distante (union des modules complétés). */
export function mergeCourseCompleted(local = {}, remote = {}) {
  const merged = { ...local };
  for (const key of Object.keys(remote)) {
    if (remote[key]) merged[key] = true;
  }
  return merged;
}

/** Charge la progression depuis Supabase → map `{ "foundations:1": true, ... }`. */
export async function fetchCourseProgress(userId) {
  if (!userId) return {};

  const { data, error } = await supabase
    .from('course_module_progress')
    .select('course_slug, module_index')
    .eq('user_id', userId);

  if (error) {
    console.warn('[courseProgressSync] fetch failed', error.message);
    return {};
  }

  const completed = {};
  for (const row of data || []) {
    completed[moduleKey(row.course_slug, row.module_index)] = true;
  }
  return completed;
}

/** Enregistre un module complété (ignore si non connecté ou table absente). */
export async function saveCourseModuleComplete(userId, courseId, moduleIndex) {
  if (!userId || courseId == null || moduleIndex == null) return;

  const { error } = await supabase.from('course_module_progress').upsert(
    {
      user_id: userId,
      course_slug: courseId,
      module_index: moduleIndex,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_slug,module_index' }
  );

  if (error) {
    console.warn('[courseProgressSync] save failed', error.message);
  }
}

/** Pousse toute la progression locale vers Supabase (après fusion à la connexion). */
export async function pushLocalCourseProgress(userId, completed = {}) {
  if (!userId) return;

  const rows = Object.entries(completed)
    .filter(([, done]) => done)
    .map(([key]) => {
      const sep = key.indexOf(':');
      if (sep < 0) return null;
      const course_slug = key.slice(0, sep);
      const module_index = parseInt(key.slice(sep + 1), 10);
      if (!course_slug || Number.isNaN(module_index)) return null;
      return {
        user_id: userId,
        course_slug,
        module_index,
        completed_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (!rows.length) return;

  const { error } = await supabase
    .from('course_module_progress')
    .upsert(rows, { onConflict: 'user_id,course_slug,module_index' });

  if (error) {
    console.warn('[courseProgressSync] push failed', error.message);
  }
}
