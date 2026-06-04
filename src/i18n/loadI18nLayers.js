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

/** Clés de pages secondaires — après le premier rendu. */
export async function loadSecondaryI18n() {
  const [
    { heritageI18nKeys },
    { heritageI18nKeysExpansion },
    { heritageI18nKeysCharactersExtra },
    { confessionalI18n },
  ] = await Promise.all([
    import('./heritageI18nKeys'),
    import('./heritageI18nKeysExpansion'),
    import('./heritageI18nKeysCharactersExtra'),
    import('./confessionalI18n'),
  ]);

  mergeKeys(heritageI18nKeys);
  mergeKeys(heritageI18nKeysExpansion);
  mergeKeys(heritageI18nKeysCharactersExtra);
  mergeKeys(confessionalI18n);
}
