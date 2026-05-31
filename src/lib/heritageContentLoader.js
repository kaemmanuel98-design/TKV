/** Charge le contenu Héritage à la demande (code-splitting). */

export async function loadHeritageArticle(slug) {
  const [articlesMod, proofsMod] = await Promise.all([
    import('../data/heritage/heritageArticlesContent'),
    import('../data/heritage/heritageProofsContent'),
  ]);
  return (
    articlesMod.HERITAGE_ARTICLES_CONTENT[slug] ||
    proofsMod.HERITAGE_PROOFS_CONTENT[slug] ||
    null
  );
}

export async function loadHeritageCharacter(slug) {
  const mod = await import('../data/heritage/heritageCharactersContent');
  return mod.HERITAGE_CHARACTERS_CONTENT[slug] || null;
}

export async function loadHeritageEvent(slug) {
  const mod = await import('../data/heritage/heritageEventsContent');
  return mod.HERITAGE_EVENTS_CONTENT[slug] || null;
}
