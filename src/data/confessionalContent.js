/** Contenu guidé — personnalisation CdC §6 (croyant / sceptique / curieux). */

export const CONFESSIONAL_STEPS = ['welcome', 'examen', 'confession', 'grace', 'resolution'];

export const examenPrompts = {
  believer: {
    thankful: 'confessional_examen_thankful_believer',
    review: 'confessional_examen_review_believer',
    growth: 'confessional_examen_growth_believer',
  },
  skeptic: {
    thankful: 'confessional_examen_thankful_skeptic',
    review: 'confessional_examen_review_skeptic',
    growth: 'confessional_examen_growth_skeptic',
  },
  curious: {
    thankful: 'confessional_examen_thankful_curious',
    review: 'confessional_examen_review_curious',
    growth: 'confessional_examen_growth_curious',
  },
};

/** Versets de grâce (référence + clé i18n pour le texte). */
export const graceVerses = [
  { key: 'psalm_103_12', ref: 'Psaume 103:12' },
  { key: '1john_1_9', ref: '1 Jean 1:9' },
  { key: 'isaiah_1_18', ref: 'Ésaïe 1:18' },
  { key: 'micah_7_18', ref: 'Michée 7:18-19' },
  { key: 'romans_8_1', ref: 'Romains 8:1' },
  { key: '2cor_5_17', ref: '2 Corinthiens 5:17' },
];

const verseRefByLang = {
  psalm_103_12: {
    fr: 'Psaume 103:12',
    en: 'Psalm 103:12',
    es: 'Salmo 103:12',
    nl: 'Psalm 103:12',
    pt: 'Salmo 103:12',
    ar: 'مزمور 103:12',
  },
  '1john_1_9': {
    fr: '1 Jean 1:9',
    en: '1 John 1:9',
    es: '1 Juan 1:9',
    nl: '1 Johannes 1:9',
    pt: '1 João 1:9',
    ar: '1 يوحنا 1:9',
  },
  isaiah_1_18: {
    fr: 'Ésaïe 1:18',
    en: 'Isaiah 1:18',
    es: 'Isaías 1:18',
    nl: 'Jesaja 1:18',
    pt: 'Isaías 1:18',
    ar: 'إشعياء 1:18',
  },
  micah_7_18: {
    fr: 'Michée 7:18-19',
    en: 'Micah 7:18-19',
    es: 'Miqueas 7:18-19',
    nl: 'Micha 7:18-19',
    pt: 'Miquéias 7:18-19',
    ar: 'ميخا 7:18-19',
  },
  romans_8_1: {
    fr: 'Romains 8:1',
    en: 'Romans 8:1',
    es: 'Romanos 8:1',
    nl: 'Romeinen 8:1',
    pt: 'Romanos 8:1',
    ar: 'رومية 8:1',
  },
  '2cor_5_17': {
    fr: '2 Corinthiens 5:17',
    en: '2 Corinthians 5:17',
    es: '2 Corintios 5:17',
    nl: '2 Korintiërs 5:17',
    pt: '2 Coríntios 5:17',
    ar: '2 كورنثوس 5:17',
  },
};

export function getGraceVerseRef(key, lang = 'fr') {
  const base = lang?.split('-')[0] || 'fr';
  return verseRefByLang[key]?.[base] || graceVerses.find((v) => v.key === key)?.ref || key;
}

export function pickGraceVerse(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return graceVerses[Math.abs(h) % graceVerses.length];
}

export function getExamenKeys(userType) {
  return examenPrompts[userType] || examenPrompts.curious;
}
