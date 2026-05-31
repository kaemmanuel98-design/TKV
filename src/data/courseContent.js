/** Contenu des modules — EIDO + modules pratiques par niveau */
import { buildEidoCourseContent } from './courseContentEido.js';
import { EIDO_DISTRIBUTION } from './courseModules.js';
import { SUPPLEMENT_MODULES } from './courseContentSupplement.js';

function pickEidoModules(eidoFull, eidoIndices) {
  return Object.fromEntries(
    eidoIndices.map((srcIdx, localIdx) => [localIdx + 1, eidoFull[srcIdx]])
  );
}

function mergeCourseContent(eidoPart, supplementPart = {}) {
  return { ...eidoPart, ...supplementPart };
}

const eidoFull = buildEidoCourseContent();

export const COURSE_CONTENT = {
  foundations: mergeCourseContent(
    pickEidoModules(eidoFull, EIDO_DISTRIBUTION.foundations),
    SUPPLEMENT_MODULES.foundations
  ),
  apologetics: mergeCourseContent(
    pickEidoModules(eidoFull, EIDO_DISTRIBUTION.apologetics),
    SUPPLEMENT_MODULES.apologetics
  ),
  teleios: mergeCourseContent(
    pickEidoModules(eidoFull, EIDO_DISTRIBUTION.teleios),
    SUPPLEMENT_MODULES.teleios
  ),
};
