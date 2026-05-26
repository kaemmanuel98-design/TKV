/** Lexique Strong — échantillon embarqué + chargement du lexique complet */
import { STRONG_LEXICON as SAMPLE } from './lexiconSample.js';

let fullLexicon = null;
let loadPromise = null;
let loadFailed = false;

function mergeWithSample(data, sample) {
  const out = { ...data };
  for (const [id, sampleEntry] of Object.entries(sample)) {
    const existing = out[id];
    if (!existing) {
      out[id] = sampleEntry;
      continue;
    }
    out[id] = {
      ...existing,
      lemma: { ...existing.lemma, ...sampleEntry.lemma },
      gloss: { ...existing.gloss, ...sampleEntry.gloss },
    };
  }
  return out;
}

async function ensureFullLexicon() {
  if (fullLexicon) return fullLexicon;
  if (!loadPromise) {
    loadPromise = fetch('/bible/lexicon.json')
      .then((r) => {
        if (!r.ok) throw new Error('lexicon_fetch_failed');
        return r.json();
      })
      .then((data) => {
        fullLexicon = mergeWithSample(data, SAMPLE);
        loadFailed = false;
        return fullLexicon;
      })
      .catch(() => {
        loadFailed = true;
        fullLexicon = { ...SAMPLE };
        return fullLexicon;
      });
  }
  return loadPromise;
}

export function preloadLexicon() {
  return ensureFullLexicon();
}

export function isLexiconLoadFailed() {
  return loadFailed;
}

function pickGloss(entry, lang) {
  const l = lang.split('-')[0];
  return (
    entry.gloss?.[l] ||
    entry.gloss?.en ||
    entry.gloss?.fr ||
    entry.strongsDef ||
    entry.strongs_def ||
    ''
  );
}

export function getLexiconEntry(strongId, lang = 'fr') {
  const l = lang.split('-')[0];
  const dict = fullLexicon || SAMPLE;
  const entry = dict[strongId];

  const isGreek = strongId.startsWith('G');

  if (!entry) {
    return {
      strongId,
      isGreek,
      lemmaOriginal: '',
      transliteration: '',
      pronunciation: '',
      derivation: '',
      definitionOriginal: '',
      kjvDef: '',
      gloss: '',
      speakLemma: '',
      missing: true,
    };
  }

  const lemmaOriginal =
    entry.lemma?.original || entry.lemma?.gr || entry.lemma?.he || entry.lemma?.[l] || '';
  const transliteration =
    entry.translit || entry.lemma?.translit || entry.lemma?.en || entry.lemma?.fr || '';
  const definitionOriginal =
    entry.strongsDef || entry.strongs_def || entry.gloss?.en || pickGloss(entry, 'en') || '';
  const gloss = pickGloss(entry, l) || definitionOriginal;
  const pronunciation = entry.pron || '';
  const derivation = entry.derivation || '';
  const kjvDef = entry.kjvDef || entry.kjv_def || '';

  return {
    strongId,
    isGreek,
    lemmaOriginal,
    transliteration,
    pronunciation,
    derivation,
    definitionOriginal,
    kjvDef,
    gloss,
    speakLemma: transliteration || lemmaOriginal,
    missing: false,
  };
}

const GENERIC_GLOSS_RE =
  /^(Mot original|Palabra en lengua|Original language word|Oorspronkelijk woord|Palavra na língua|كلمة أصلية)\s*\(/i;

/** Sens principal — définition Strong si la traduction locale est un simple placeholder */
export function getLexiconDisplayMeaning(entry, lang = 'fr') {
  if (!entry) return '';
  const gloss = entry.gloss || '';
  const strong = entry.definitionOriginal || '';

  if (strong && (!gloss || GENERIC_GLOSS_RE.test(gloss))) return strong;
  if (gloss && gloss !== strong) return gloss;
  return strong || gloss;
}

export async function getLexiconEntryAsync(strongId, lang = 'fr') {
  await ensureFullLexicon();
  return getLexiconEntry(strongId, lang);
}
