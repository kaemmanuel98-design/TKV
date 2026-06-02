/**
 * Traduction des définitions Strong vers la langue du lecteur (cache dédié).
 */
import { translateTexts } from '../translateOnDemand.js';

const CACHE_KEY = 'tkv_strong_lex_v3';
const CACHE_MAX = 900;

const GENERIC_GLOSS_RE =
  /^(Mot original|Palabra en lengua|Original language word|Oorspronkelijk woord|Palavra na língua|كلمة أصلية)\s*\(/i;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(store) {
  try {
    const keys = Object.keys(store);
    if (keys.length > CACHE_MAX) {
      for (const k of keys.slice(0, keys.length - CACHE_MAX)) delete store[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

function cacheGet(lang, text) {
  const store = readCache();
  const hit = store[`${lang}|${hash(text)}`];
  return hit != null && String(hit).trim() ? hit : null;
}

function cacheSet(lang, text, value) {
  if (!value?.trim()) return;
  const store = readCache();
  store[`${lang}|${hash(text)}`] = value;
  writeCache(store);
}

function hash(text) {
  let h = 5381;
  const s = String(text);
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function langCode(language) {
  return String(language || 'fr').split('-')[0].toLowerCase();
}

export function isLikelyFrench(text) {
  if (!text) return false;
  return /[àâäéèêëïîôùûüç]|qu['']|cœur|être|Dieu|dieu|Parole|pourquoi|commencement/i.test(
    text.slice(0, 400)
  );
}

function isLikelySpanish(text) {
  if (!text) return false;
  return /[ñáéíóú¿¡]|\bdios\b|\bel\b|\bque\b/i.test(text.slice(0, 400));
}

function isLikelyPortuguese(text) {
  if (!text) return false;
  return /[ãõç]|\bDeus\b|\bque\b|\bnão\b/i.test(text.slice(0, 400));
}

function isLikelyDutch(text) {
  if (!text) return false;
  return /\bvan\b|\been\b|\bGod\b|\bhet\b/i.test(text.slice(0, 400));
}

function isLikelyArabic(text) {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text.slice(0, 400));
}

function looksEnglish(text) {
  if (!text?.trim()) return false;
  return /\b(the|and|of|to|be|was|God|Lord)\b/i.test(text.slice(0, 200));
}

/** Gloss ou définition utilisable dans la langue du lecteur ? */
export function glossNeedsTranslation(gloss, lang, englishSource = '') {
  const l = langCode(lang);
  const g = (gloss || '').trim();
  const en = (englishSource || '').trim();

  if (!g) return Boolean(en);
  if (GENERIC_GLOSS_RE.test(g)) return true;
  if (en && g === en) return true;

  if (l === 'fr') return !isLikelyFrench(g);
  if (l === 'es') return !isLikelySpanish(g);
  if (l === 'pt') return !isLikelyPortuguese(g);
  if (l === 'nl') return !isLikelyDutch(g);
  if (l === 'ar') return !isLikelyArabic(g);
  if (l === 'en') return looksEnglish(g) && g.length > 12 && /;|,/.test(g);
  return looksEnglish(g);
}

function wrapForSimpleTranslation(text, lang) {
  const t = String(text || '').trim();
  if (!t) return t;
  const l = langCode(lang);

  const hints = {
    fr: 'Sens biblique en français très simple, mots courants, une ou deux phrases courtes : ',
    en: 'Bible word meaning in very simple everyday English, short and clear: ',
    es: 'Significado bíblico en español sencillo, frases cortas: ',
    nl: 'Bijbelse betekenis in eenvoudig Nederlands, korte zinnen: ',
    pt: 'Significado bíblico em português simples, frases curtas: ',
    ar: 'معنى كتابي بالعربية البسيطة، جمل قصيرة: ',
  };

  return (hints[l] || hints.fr) + t;
}

async function translateStrongLine(text, lang) {
  const l = langCode(lang);
  const source = String(text || '').trim();
  if (!source) return source;

  const cached = cacheGet(l, source);
  if (cached) return cached;

  const wrapped = wrapForSimpleTranslation(source, l);
  const from = l === 'en' ? 'en' : 'en';
  const to = l;

  let out;
  if (l === 'en') {
    const [line] = await translateTexts([wrapped], { from: 'en', to: 'en', allowSameLanguage: true });
    out = line || source;
  } else {
    const [line] = await translateTexts([wrapped], { from, to });
    out = line || source;
  }

  const cleaned = String(out || source)
    .replace(/^(Sens biblique|Bible word meaning|Significado bíblico|Bijbelse betekenis|معنى كتابي)[^:]*:\s*/i, '')
    .trim();

  cacheSet(l, source, cleaned);
  return cleaned;
}

async function translateField(text, lang, fallback = '') {
  const src = String(text || fallback || '').trim();
  if (!src) return '';
  try {
    return await translateStrongLine(src, lang);
  } catch {
    return src;
  }
}

/**
 * Adapte une entrée lexique pour l'affichage (définition + étymologie en langue du lecteur).
 */
export async function localizeLexiconEntry(entry, lang) {
  if (!entry || entry.missing) return entry;

  const l = langCode(lang);
  const englishDef = (entry.definitionOriginal || '').trim();
  const baseGloss = (entry.gloss || '').trim();
  const sourceForTranslate = englishDef || baseGloss;

  // Always localize all textual fields to the active app language.
  // This guarantees consistent translation for any clicked Strong entry.
  const shouldTranslateAll = l !== 'en';

  let meaning = baseGloss;
  if (shouldTranslateAll) {
    meaning = await translateField(sourceForTranslate, l, baseGloss || englishDef);
  } else if (glossNeedsTranslation(meaning, l, englishDef)) {
    meaning = await translateField(sourceForTranslate, l, baseGloss || englishDef);
  }

  const derivation = shouldTranslateAll
    ? await translateField(entry.derivation, l)
    : entry.derivation || '';

  const localizedKjvDef = shouldTranslateAll ? await translateField(entry.kjvDef, l) : entry.kjvDef || '';
  const localizedDefinitionOriginal = shouldTranslateAll
    ? await translateField(entry.definitionOriginal, l)
    : entry.definitionOriginal || '';

  return {
    ...entry,
    gloss: meaning,
    localizedMeaning: meaning,
    derivation,
    kjvDef: localizedKjvDef,
    definitionOriginal: localizedDefinitionOriginal || entry.definitionOriginal,
    showEnglishReference: false,
  };
}
