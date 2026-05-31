/** Numéros d'urgence — CdC Confessionnal §3 (vérifier tous les 6 mois). */

export const CRISIS_HOTLINES = {
  FR: {
    countryKey: 'confessional_country_fr',
    lines: [
      { labelKey: 'confessional_hotline_fr_3114', tel: '3114' },
      { labelKey: 'confessional_hotline_fr_sos', tel: '0972394050' },
      { labelKey: 'confessional_hotline_emergency', tel: '15' },
      { labelKey: 'confessional_hotline_eu', tel: '112' },
    ],
  },
  BE: {
    countryKey: 'confessional_country_be',
    lines: [
      { labelKey: 'confessional_hotline_be_suicide', tel: '080032123' },
      { labelKey: 'confessional_hotline_be_sos', tel: '026484014' },
      { labelKey: 'confessional_hotline_eu', tel: '112' },
    ],
  },
  CH: {
    countryKey: 'confessional_country_ch',
    lines: [
      { labelKey: 'confessional_hotline_ch_143', tel: '143' },
      { labelKey: 'confessional_hotline_emergency', tel: '144' },
      { labelKey: 'confessional_hotline_eu', tel: '112' },
    ],
  },
  CA: {
    countryKey: 'confessional_country_ca',
    lines: [
      { labelKey: 'confessional_hotline_ca_qc', tel: '18662773553' },
      { labelKey: 'confessional_hotline_ca', tel: '18002632266' },
      { labelKey: 'confessional_hotline_us_911', tel: '911' },
    ],
  },
  CD: {
    countryKey: 'confessional_country_cd',
    lines: [{ labelKey: 'confessional_hotline_eu', tel: '112' }],
  },
  CI: {
    countryKey: 'confessional_country_ci',
    lines: [
      { labelKey: 'confessional_hotline_ci', tel: '0707070707' },
      { labelKey: 'confessional_hotline_ci_185', tel: '185' },
    ],
  },
  GB: {
    countryKey: 'confessional_country_gb',
    lines: [
      { labelKey: 'confessional_hotline_gb', tel: '116123' },
      { labelKey: 'confessional_hotline_gb_999', tel: '999' },
      { labelKey: 'confessional_hotline_eu', tel: '112' },
    ],
  },
  US: {
    countryKey: 'confessional_country_us',
    lines: [
      { labelKey: 'confessional_hotline_us_988', tel: '988' },
      { labelKey: 'confessional_hotline_us', tel: '18002738255' },
      { labelKey: 'confessional_hotline_us_911', tel: '911' },
    ],
  },
  BR: {
    countryKey: 'confessional_country_br',
    lines: [
      { labelKey: 'confessional_hotline_br', tel: '188' },
      { labelKey: 'confessional_hotline_br_190', tel: '190' },
    ],
  },
};

const COUNTRY_ALIASES = {
  FR: ['fr', 'france', 'français', 'francais'],
  BE: ['be', 'belgique', 'belgium', 'belgië', 'belgie'],
  CH: ['ch', 'suisse', 'switzerland', 'schweiz'],
  CA: ['ca', 'canada', 'québec', 'quebec'],
  CD: ['cd', 'rdc', 'congo', 'rd congo', 'république démocratique du congo'],
  CI: ['ci', "côte d'ivoire", 'cote divoire', 'ivory coast'],
  GB: ['gb', 'uk', 'royaume-uni', 'united kingdom', 'angleterre', 'england'],
  US: ['us', 'usa', 'états-unis', 'etats-unis', 'united states'],
  BR: ['br', 'brésil', 'bresil', 'brazil'],
};

export function resolveHotlineCountry(profileCountry = '') {
  const raw = String(profileCountry || '').trim().toLowerCase();
  if (!raw) return 'FR';
  for (const [code, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (aliases.some((a) => raw === a || raw.includes(a))) return code;
  }
  if (raw.length === 2) return raw.toUpperCase();
  return 'FR';
}

export function getHotlinesForCountry(profileCountry) {
  const code = resolveHotlineCountry(profileCountry);
  return CRISIS_HOTLINES[code] || CRISIS_HOTLINES.FR;
}
