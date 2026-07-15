import i18n from '../i18n';

function mergeKeys(keysByLang) {
  Object.keys(keysByLang).forEach((lang) => {
    if (i18n.hasResourceBundle(lang, 'translation')) {
      i18n.addResourceBundle(lang, 'translation', keysByLang[lang], true, true);
    }
  });
}

/** Clés essentielles (navigation, accueil, lecteur de livres) — avant le premier rendu. */
export async function loadPrimaryI18n() {
  const [{ cdcKeys }, { gynoskoReaderKeys }] = await Promise.all([
    import('./cdcKeys'),
    import('./gynoskoReaderKeys'),
  ]);
  mergeKeys(cdcKeys);
  mergeKeys(gynoskoReaderKeys);
}

/** Clés Héritage — préchargées à l’approche de /heritage. */
export async function loadHeritageI18n() {
  const [
    { heritageI18nKeys },
    { heritageI18nKeysExpansion },
    { heritageI18nKeysCharactersExtra },
  ] = await Promise.all([
    import('./heritageI18nKeys'),
    import('./heritageI18nKeysExpansion'),
    import('./heritageI18nKeysCharactersExtra'),
  ]);
  mergeKeys(heritageI18nKeys);
  mergeKeys(heritageI18nKeysExpansion);
  mergeKeys(heritageI18nKeysCharactersExtra);
}

/** Clés cours EIDO détaillées — chargées à l’approche de /courses. */
export async function loadCourseI18n() {
  const { courseKeysExtended } = await import('./courseKeysExtended');
  mergeKeys(courseKeysExtended);
}

/** Clés de pages secondaires — après le premier rendu (confessionnal uniquement). */
export async function loadSecondaryI18n() {
  const { confessionalI18n } = await import('./confessionalI18n');
  mergeKeys(confessionalI18n);
}
