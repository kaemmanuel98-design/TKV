/** Verset d'encouragement par situation (CdC — accueil contextualisé). */
export const CONFESSIONAL_VERSES = {
  suicidal: {
    fr: { text: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur.", ref: 'Jérémie 29:11' },
    en: { text: 'For I know the plans I have for you, declares the Lord, plans for peace and not for evil.', ref: 'Jeremiah 29:11' },
  },
  depression: {
    fr: { text: "L'Éternel est près de ceux qui ont le cœur brisé.", ref: 'Psaume 34:19' },
    en: { text: 'The Lord is near to the brokenhearted.', ref: 'Psalm 34:18' },
  },
  addiction: {
    fr: { text: 'Dieu est fidèle, et il ne permettra pas que vous soyez tentés au-delà de vos forces.', ref: '1 Corinthiens 10:13' },
    en: { text: 'God is faithful, and he will not let you be tempted beyond your strength.', ref: '1 Corinthians 10:13' },
  },
  family: {
    fr: { text: 'Dieu donne une famille aux solitaires.', ref: 'Psaume 68:7' },
    en: { text: 'God sets the lonely in families.', ref: 'Psalm 68:6' },
  },
  illness: {
    fr: { text: "L'Éternel lui portera secours sur son lit de souffrance.", ref: 'Psaume 41:4' },
    en: { text: 'The Lord will sustain him on his sickbed.', ref: 'Psalm 41:3' },
  },
  grief: {
    fr: { text: 'Heureux ceux qui pleurent, car ils seront consolés.', ref: 'Matthieu 5:4' },
    en: { text: 'Blessed are those who mourn, for they shall be comforted.', ref: 'Matthew 5:4' },
  },
  spiritual: {
    fr: { text: "Demandez, et l'on vous donnera; cherchez, et vous trouverez.", ref: 'Matthieu 7:7' },
    en: { text: 'Ask, and it will be given to you; seek, and you will find.', ref: 'Matthew 7:7' },
  },
  other: {
    fr: { text: "Remets ton sort à l'Éternel, et il agira.", ref: 'Psaume 37:5' },
    en: { text: 'Commit your way to the Lord; trust in him.', ref: 'Psalm 37:5' },
  },
};

export function getConfessionalVerse(situation, lang = 'fr') {
  const key = CONFESSIONAL_VERSES[situation] ? situation : 'other';
  const pack = CONFESSIONAL_VERSES[key];
  const l = lang?.split('-')[0] || 'fr';
  return pack[l] || pack.fr || pack.en;
}
