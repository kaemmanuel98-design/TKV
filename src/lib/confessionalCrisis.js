/** Détection côté client (< 200 ms) — miroir server/lib/confessionalCrisis.js */

const CRITICAL = [
  /je\s+veux\s+mourir/i,
  /je\s+veux\s+en\s+finir/i,
  /\bsuicide\b/i,
  /me\s+tuer/i,
  /plus\s+envie\s+de\s+vivre/i,
  /j'en\s+peux\s+plus/i,
  /je\s+n['']en\s+peux\s+plus/i,
  /\bdisparaitre\b/i,
  /disparaître/i,
  /personne\s+s['']en\s+souciera/i,
  /tout\s+arrêter/i,
  /tout\s+arreter/i,
  /\boverdose\b/i,
  /\bsauter\b/i,
  /méthode\s+pour\s+mourir/i,
  /methode\s+pour\s+mourir/i,
  /je\s+vais\s+le\s+faire/i,
  /want\s+to\s+die/i,
  /kill\s+myself/i,
  /\bsuicidal\b/i,
  /end\s+my\s+life/i,
  /quiero\s+morir/i,
  /suicid/i,
  /matarme/i,
  /quero\s+morrer/i,
  /me\s+matar/i,
];

const HIGH = [
  /\bdépression\b/i,
  /\bdepression\b/i,
  /je\s+suis\s+perdu/i,
  /j'ai\s+besoin\s+d'aide/i,
  /je\s+souffre\s+trop/i,
  /\bdrogue\b/i,
  /\balcool\b/i,
  /dépendance/i,
  /dependance/i,
  /je\s+peux\s+pas\s+arrêter/i,
  /je\s+peux\s+pas\s+arreter/i,
  /\bcancer\b/i,
  /maladie\s+grave/i,
  /\bdiagnostic\b/i,
  /on\s+m'a\s+dit\s+que/i,
  /\bdepressed\b/i,
  /need\s+help/i,
  /addiction/i,
];

export const SITUATION_LEVEL = {
  suicidal: 'critical',
  depression: 'high',
  addiction: 'high',
  illness: 'medium',
  family: 'medium',
  grief: 'medium',
  spiritual: 'low',
  other: 'medium',
};

export function detectCrisisLevel(text = '') {
  const t = String(text).trim();
  if (!t) return { level: 'low', keywords: [] };

  const keywords = [];
  for (const re of CRITICAL) {
    if (re.test(t)) keywords.push(re.source);
  }
  if (keywords.length) return { level: 'critical', keywords };

  for (const re of HIGH) {
    if (re.test(t)) keywords.push(re.source);
  }
  if (keywords.length) return { level: 'high', keywords };

  return { level: 'low', keywords: [] };
}

export function maxCrisisLevel(a, b) {
  const order = { critical: 4, high: 3, medium: 2, low: 1 };
  return (order[a] || 0) >= (order[b] || 0) ? a : b;
}
