/** Bibliothèque ressources pastorales (CdC §5.2 — dashboard accompagnateur). */
export const CONFESSIONAL_RESOURCES = [
  {
    id: 'crisis-protocol',
    titleKey: 'confessional_res_crisis_title',
    descKey: 'confessional_res_crisis_desc',
    url: 'https://www.3114.fr/',
  },
  {
    id: 'listen-guide',
    titleKey: 'confessional_res_listen_title',
    descKey: 'confessional_res_listen_desc',
  },
  {
    id: 'prayer-framework',
    titleKey: 'confessional_res_prayer_title',
    descKey: 'confessional_res_prayer_desc',
  },
  {
    id: 'referral',
    titleKey: 'confessional_res_referral_title',
    descKey: 'confessional_res_referral_desc',
    url: 'https://www.ameli.fr/',
  },
];

export const CONFESSIONAL_RESOURCE_DETAILS = {
  'listen-guide': {
    fr: [
      'Écouter sans juger ni conseiller trop vite.',
      'Reformuler ce que la personne ressent.',
      'Proposer une prière ou un accompagnateur, jamais un diagnostic.',
    ],
    en: [
      'Listen without judging or advising too quickly.',
      'Reflect back what the person feels.',
      'Offer prayer or a companion — never a clinical diagnosis.',
    ],
  },
  'prayer-framework': {
    fr: [
      'Remercier Dieu pour sa présence.',
      'Confier la souffrance nommée.',
      'Demander paix, courage et bonnes ressources concrètes.',
    ],
    en: [
      'Thank God for his presence.',
      'Name the suffering honestly.',
      'Ask for peace, courage, and concrete next steps.',
    ],
  },
};
