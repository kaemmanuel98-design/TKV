/** Traductions françaises disponibles dans Bible Strong */
export const FRENCH_BIBLE_VERSIONS = [
  {
    id: 'fr',
    labelKey: 'bible_fr_version_epee',
    defaultLabel: "Bible de l'Épée",
  },
  {
    id: 'fr_pdv',
    labelKey: 'bible_fr_version_pdv',
    defaultLabel: 'Parole de Vie 2017',
  },
];

export const DEFAULT_FRENCH_BIBLE_VERSION = 'fr';

const STORAGE_KEY = 'tkv_bible_fr_version';

export function loadFrenchBibleVersion() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && FRENCH_BIBLE_VERSIONS.some((v) => v.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_FRENCH_BIBLE_VERSION;
}

export function saveFrenchBibleVersion(versionId) {
  try {
    localStorage.setItem(STORAGE_KEY, versionId);
  } catch {
    /* ignore */
  }
}

export function resolveFrenchBibleTextKey(frenchVersion) {
  return frenchVersion === 'fr_pdv' ? 'fr_pdv' : 'fr';
}
