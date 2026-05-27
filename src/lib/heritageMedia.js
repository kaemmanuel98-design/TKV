/**
 * Images Héritage — illustrations SVG locales uniquement (fiables hors-ligne).
 */
import illustrationEvent from '../assets/heritage/illustration-event.svg?url';
import illustrationCouncil from '../assets/heritage/illustration-council.svg?url';
import illustrationPersecution from '../assets/heritage/illustration-persecution.svg?url';
import illustrationReform from '../assets/heritage/illustration-reform.svg?url';
import illustrationRevival from '../assets/heritage/illustration-revival.svg?url';
import illustrationArticle from '../assets/heritage/illustration-article.svg?url';
import illustrationProof from '../assets/heritage/illustration-proof.svg?url';
import illustrationCharacter from '../assets/heritage/illustration-character.svg?url';

export const HERITAGE_LOCAL = {
  event: illustrationEvent,
  council: illustrationCouncil,
  persecution: illustrationPersecution,
  reform: illustrationReform,
  revival: illustrationRevival,
  article: illustrationArticle,
  proof: illustrationProof,
  character: illustrationCharacter,
  default: illustrationEvent,
};

const SLUG_TO_KIND = {
  'nero-persecution': 'persecution',
  'constantine-legalization': 'event',
  nicaea: 'council',
  'constantinople-381': 'council',
  'ephesus-431': 'council',
  chalcedon: 'council',
  'council-trent': 'council',
  'vatican-i': 'council',
  'vatican-ii': 'council',
  reformation: 'reform',
  'zwingli-reform': 'reform',
  'anabaptist-reform': 'reform',
  'calvin-geneva': 'reform',
  'english-reformation': 'reform',
  'great-awakening': 'revival',
  azusa: 'revival',
  pentecost: 'revival',
};

export function getLocalFallback(kind) {
  return HERITAGE_LOCAL[kind] || HERITAGE_LOCAL.default;
}

/**
 * @param {{ slug?: string, kind?: string }} opts
 */
export function resolveHeritageImage(opts = {}) {
  const { slug, kind = 'event' } = opts;
  const localKind = (slug && SLUG_TO_KIND[slug]) || kind || 'event';
  const url = getLocalFallback(localKind);
  return { primary: url, fallback: url };
}

export function heritageImageForSlug(slug, kind) {
  return resolveHeritageImage({ slug, kind }).primary;
}
