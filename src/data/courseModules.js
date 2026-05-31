/** Répartition EIDO + modules pratiques par niveau. */
export const EIDO_DISTRIBUTION = {
  foundations: [1, 2, 3, 4, 5],
  apologetics: [6, 7, 8, 9],
  teleios: [10, 11, 12, 13],
};

export const EIDO_MODULE_TOTAL = Object.values(EIDO_DISTRIBUTION).flat().length;

function buildEidoModules(eidoIndices, startIndex = 1, { freeFirst = 0 } = {}) {
  return eidoIndices.map((eidoIdx, i) => ({
    index: startIndex + i,
    titleKey: `module_e${eidoIdx}_title`,
    descKey: `module_e${eidoIdx}_desc`,
    free: i < freeFirst,
    eidoIndex: eidoIdx,
  }));
}

function buildSupplementModules(entries) {
  return entries.map(({ index, titleKey, descKey, free = false }) => ({
    index,
    titleKey,
    descKey,
    free,
  }));
}

export const COURSE_MODULES = {
  foundations: {
    titleKey: 'course_foundations_title',
    modules: [
      ...buildEidoModules(EIDO_DISTRIBUTION.foundations, 1, { freeFirst: 2 }),
      ...buildSupplementModules([
        { index: 6, titleKey: 'module_n6_title', descKey: 'module_n6_desc' },
        { index: 7, titleKey: 'module_n7_title', descKey: 'module_n7_desc' },
      ]),
    ],
  },
  apologetics: {
    titleKey: 'course_apologetics_title',
    modules: [
      ...buildEidoModules(EIDO_DISTRIBUTION.apologetics, 1),
      ...buildSupplementModules([
        { index: 5, titleKey: 'module_a5_title', descKey: 'module_a5_desc' },
      ]),
    ],
  },
  teleios: {
    titleKey: 'course_teleios_title',
    modules: [
      ...buildEidoModules(EIDO_DISTRIBUTION.teleios, 1),
      ...buildSupplementModules([
        { index: 5, titleKey: 'module_t5_title', descKey: 'module_t5_desc' },
        { index: 6, titleKey: 'module_t6_title', descKey: 'module_t6_desc' },
        { index: 7, titleKey: 'module_t7_title', descKey: 'module_t7_desc' },
      ]),
    ],
  },
};

/** Compte les modules EIDO complétés (badge EIDO). */
export function countCompletedEidoModules(completedMap = {}) {
  let count = 0;
  for (const [courseId, eidoIndices] of Object.entries(EIDO_DISTRIBUTION)) {
    const course = COURSE_MODULES[courseId];
    if (!course) continue;
    for (const mod of course.modules) {
      if (mod.eidoIndex && completedMap[`${courseId}:${mod.index}`]) {
        count += 1;
      }
    }
  }
  return count;
}
