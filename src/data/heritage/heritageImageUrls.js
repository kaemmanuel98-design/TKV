/**
 * Images Héritage — photos locales (public/heritage/photos/) avec repli Wikimedia.
 * Générées via: node scripts/download-heritage-photos.mjs
 */
import localManifest from './heritagePhotosManifest.json';
import { HERITAGE_REMOTE_IMAGES } from './heritageRemoteImageUrls.js';

/** Clés alt i18n → slug image (illustrations dans le corps des articles). */
export const HERITAGE_ALT_TO_SLUG = {
  heritage_img_jesus_alt: 'jesus',
  heritage_img_codex_alt: 'manuscripts',
  heritage_img_transfig_alt: 'transfiguration',
  heritage_img_sinaiticus_alt: 'sinaiticus',
  heritage_img_scrolls_alt: 'dead-sea-scrolls',
  heritage_img_tomb_alt: 'empty-tomb',
  heritage_img_cross_alt: 'problem-evil',
  heritage_img_gospels_alt: 'gospels',
  heritage_img_resurrection_event_alt: 'crucifixion-resurrection',
  heritage_img_pentecost_alt: 'pentecost',
  heritage_img_70_alt: 'jerusalem-70',
  heritage_img_nicaea_alt: 'nicaea',
  heritage_img_chalcedon_alt: 'chalcedon',
  heritage_img_schism_alt: 'great-schism',
  heritage_img_luther_alt: 'reformation',
  heritage_img_azusa_alt: 'azusa',
  heritage_img_nero_alt: 'nero-persecution',
  heritage_img_constantine_alt: 'constantine-legalization',
  heritage_img_constantinople_alt: 'constantinople-381',
  heritage_img_ephesus_alt: 'ephesus-431',
  heritage_img_rome476_alt: 'fall-rome-476',
  heritage_img_gregory_alt: 'gregory-great',
  heritage_img_charlemagne_alt: 'charlemagne',
  heritage_img_crusades_alt: 'crusades',
  heritage_img_western_schism_alt: 'western-schism',
  heritage_img_1453_alt: 'fall-constantinople',
  heritage_img_printing_alt: 'printing-reformation',
  heritage_img_zwingli_alt: 'zwingli-reform',
  heritage_img_anabaptist_alt: 'anabaptist-reform',
  heritage_img_calvin_alt: 'calvin-geneva',
  heritage_img_henry_alt: 'english-reformation',
  heritage_img_trent_alt: 'council-trent',
  heritage_img_awakening_alt: 'great-awakening',
  heritage_img_vatican_alt: 'vatican-i',
  heritage_img_vatican2_alt: 'vatican-ii',
  heritage_proof_tacitus_img_alt: 'tacitus',
  heritage_proof_josephus_img_alt: 'josephus',
  heritage_proof_pliny_img_alt: 'pliny-trajan',
  heritage_proof_suetonius_img_alt: 'suetonius',
  heritage_proof_talmud_img_alt: 'talmud-mentions',
  heritage_proof_creeds_img_alt: 'early-creeds',
  heritage_proof_martyrdom_img_alt: 'early-martyrdom',
  heritage_proof_pagan_img_alt: 'pagan-critics',
  heritage_proof_minimal_img_alt: 'minimal-facts',
  heritage_proof_modern_img_alt: 'modern-skeptics',
  heritage_proof_archaeo_img_alt: 'archaeology-proofs',
  heritage_proof_manuscript_img_alt: 'manuscript-proofs',
  heritage_char_peter_img_alt: 'peter',
  heritage_char_paul_img_alt: 'paul',
  heritage_char_mary_img_alt: 'mary-magdalene',
  heritage_char_augustine_img_alt: 'augustine',
  heritage_char_athanasius_img_alt: 'athanasius',
  heritage_char_polycarp_img_alt: 'polycarp',
  heritage_char_luther_img_alt: 'luther',
  heritage_char_seymour_img_alt: 'seymour',
  heritage_char_wesley_img_alt: 'wesley',
  heritage_char_parham_img_alt: 'parham',
  heritage_char_wigglesworth_img_alt: 'wigglesworth',
  heritage_char_branham_img_alt: 'branham',
  heritage_char_roberts_img_alt: 'roberts',
};

export function heritagePhotoForSlug(slug) {
  if (!slug) return null;
  return localManifest[slug] || HERITAGE_REMOTE_IMAGES[slug] || null;
}

export function heritagePhotoForAltKey(altKey) {
  const mapped = altKey ? HERITAGE_ALT_TO_SLUG[altKey] : null;
  return mapped ? heritagePhotoForSlug(mapped) : null;
}
