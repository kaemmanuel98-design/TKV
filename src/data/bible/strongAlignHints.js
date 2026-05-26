/** Correspondances mot de surface → Strong (alignement traductions + clic) */

export function normalizeToken(word) {
  return (word || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’]/g, "'");
}

/** Formes fréquentes par langue (Hébreu H… / Grec G… selon le mot) */
export const SURFACE_STRONG_HINTS = {
  fr: {
    dieu: 'H430',
    dieux: 'H430',
    seigneur: 'H3068',
    eternel: 'H3068',
    'l-eternel': 'H3068',
    commencement: 'H7225',
    origine: 'H7225',
    crea: 'H1254',
    cree: 'H1254',
    creer: 'H1254',
    cieux: 'H8064',
    ciel: 'H8064',
    terre: 'H776',
    lumiere: 'H216',
    tenebres: 'H2822',
    eaux: 'H4325',
    eau: 'H4325',
    souffle: 'H7307',
    jour: 'H3117',
    nuit: 'H3915',
    homme: 'H120',
    femme: 'H802',
    vie: 'H2416',
    mort: 'H4191',
    peche: 'H2403',
    amour: 'H157',
    foi: 'H530',
    paix: 'H7965',
    roi: 'H4428',
    maison: 'H1004',
    fils: 'H1121',
    fille: 'H1323',
    peuple: 'H5971',
    israel: 'H3478',
    jerusalem: 'H3389',
    moise: 'H4872',
    abraham: 'H85',
    david: 'H1732',
    esprit: 'H7307',
    jesus: 'G2424',
    christ: 'G5547',
    disciples: 'G3101',
    apotres: 'G652',
  },
  es: {
    dios: 'H430',
    senor: 'H3068',
    principio: 'H7225',
    creo: 'H1254',
    cielos: 'H8064',
    tierra: 'H776',
    luz: 'H216',
    tinieblas: 'H2822',
    aguas: 'H4325',
    espiritu: 'H7307',
    dia: 'H3117',
    noche: 'H3915',
    hombre: 'H120',
    mujer: 'H802',
    jesus: 'G2424',
    cristo: 'G5547',
  },
  nl: {
    god: 'H430',
    heer: 'H3068',
    begin: 'H7225',
    schiep: 'H1254',
    hemel: 'H8064',
    aarde: 'H776',
    licht: 'H216',
    duisternis: 'H2822',
    wateren: 'H4325',
    geest: 'H7307',
    dag: 'H3117',
    nacht: 'H3915',
  },
  pt: {
    deus: 'H430',
    senhor: 'H3068',
    principio: 'H7225',
    criou: 'H1254',
    ceus: 'H8064',
    terra: 'H776',
    luz: 'H216',
    trevas: 'H2822',
    aguas: 'H4325',
    espirito: 'H7307',
    dia: 'H3117',
    noite: 'H3915',
    jesus: 'G2424',
    cristo: 'G5547',
  },
  ar: {
    الله: 'H430',
    الرب: 'H3068',
    بداية: 'H7225',
    خلق: 'H1254',
  },
  en: {},
};

/** Paires EN ↔ langue cible pour l’alignement au build */
export const LANG_ANCHORS = {
  fr: [
    { en: ['god'], fr: ['dieu', 'dieux'] },
    { en: ['beginning'], fr: ['commencement', 'origine', 'principe'] },
    { en: ['created', 'create'], fr: ['crea', 'cree', 'creer', 'creat'] },
    { en: ['heavens', 'heaven'], fr: ['cieux', 'ciel'] },
    { en: ['earth'], fr: ['terre'] },
    { en: ['light'], fr: ['lumiere', 'lumieres'] },
    { en: ['darkness'], fr: ['tenebres'] },
    { en: ['waters', 'water'], fr: ['eaux', 'eau'] },
    { en: ['spirit'], fr: ['esprit', 'souffle'] },
    { en: ['day'], fr: ['jour', 'journee'] },
    { en: ['night'], fr: ['nuit', 'soir'] },
    { en: ['man'], fr: ['homme'] },
    { en: ['woman'], fr: ['femme'] },
    { en: ['lord'], fr: ['seigneur', 'eternel'] },
    { en: ['jesus'], fr: ['jesus', 'jeshua'] },
    { en: ['christ'], fr: ['christ', 'messie'] },
  ],
  es: [
    { en: ['god'], fr: ['dios'] },
    { en: ['beginning'], fr: ['principio', 'comienzo'] },
    { en: ['created'], fr: ['creo', 'crearon'] },
    { en: ['heavens'], fr: ['cielos', 'cielo'] },
    { en: ['earth'], fr: ['tierra'] },
    { en: ['light'], fr: ['luz'] },
    { en: ['darkness'], fr: ['tinieblas'] },
    { en: ['waters'], fr: ['aguas', 'agua'] },
    { en: ['spirit'], fr: ['espiritu'] },
  ],
  nl: [
    { en: ['god'], fr: ['god'] },
    { en: ['beginning'], fr: ['begin', 'beginne'] },
    { en: ['created'], fr: ['schiep', 'schep'] },
    { en: ['heavens'], fr: ['hemel', 'hemelen'] },
    { en: ['earth'], fr: ['aarde'] },
    { en: ['light'], fr: ['licht'] },
    { en: ['waters'], fr: ['wateren', 'water'] },
    { en: ['spirit'], fr: ['geest'] },
  ],
  pt: [
    { en: ['god'], fr: ['deus'] },
    { en: ['beginning'], fr: ['principio', 'comeco'] },
    { en: ['created'], fr: ['criou', 'criar'] },
    { en: ['heavens'], fr: ['ceus', 'ceu'] },
    { en: ['earth'], fr: ['terra'] },
    { en: ['light'], fr: ['luz'] },
    { en: ['waters'], fr: ['aguas', 'agua'] },
    { en: ['spirit'], fr: ['espirito'] },
  ],
  ar: [
    { en: ['god'], fr: ['الله', 'الله'] },
    { en: ['beginning'], fr: ['بداية', 'المبدأ'] },
    { en: ['created'], fr: ['خلق', 'بارا'] },
    { en: ['heavens'], fr: ['السماء', 'السموات'] },
    { en: ['earth'], fr: ['الارض', 'الأرض'] },
  ],
};

/** Au clic : corrige un Strong mal aligné si le mot a une entrée connue */
export function resolveStrongForSurface(surface, lang, segmentStrongId) {
  const key = normalizeToken(surface);
  const hints = SURFACE_STRONG_HINTS[lang?.split('-')[0]] || {};
  const hinted = hints[key];
  if (!hinted) return segmentStrongId;
  if (!segmentStrongId || segmentStrongId !== hinted) return hinted;
  return segmentStrongId;
}
