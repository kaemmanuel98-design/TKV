/**
 * Préparation orale du texte de prédication — moins « livre lu par une IA ».
 */

const ORDINALS_FR = {
  1: 'Premièrement',
  2: 'Deuxièmement',
  3: 'Troisièmement',
  4: 'Quatrièmement',
  5: 'Cinquièmement',
  6: 'Sixièmement',
  7: 'Septièmement',
  8: 'Huitièmement',
};

const SECTION_HEADS =
  /^(introduction|conclusion(?:\s+et\s+appel)?|prière|appel(?:\s+à\s+la\s+décision)?)$/i;

/** ~2–3 phrases : bon compromis continuité / expressivité ElevenLabs */
export const MAX_UNIT_CHARS = Number(process.env.PODCAST_UNIT_CHARS) || 1600;
export const MIN_UNIT_CHARS = 280;

export function splitParagraphs(text) {
  return String(text)
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n+/g, ' ').trim())
    .filter(Boolean);
}

export function spokenBibleRefs(text, lang = 'fr') {
  if (!text?.includes(':')) return text;
  const book =
    String.raw`(?:\d+\s+)?[A-ZÀ-ÜÉÈÊËÎÏÔÙÛÜÇ][\wàâäéèêëïîôùûüç'-]*(?:\s+[\wàâäéèêëïîôùûüç'-]+)?`;
  const re = new RegExp(
    `(${book})\\s+(\\d{1,3})\\s*:\\s*(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?`,
    'gu'
  );
  return text.replace(re, (_, b, ch, v, end) => {
    if (lang.split('-')[0] === 'en') {
      return end
        ? `${b} chapter ${ch}, verses ${v} to ${end}`
        : `${b} chapter ${ch}, verse ${v}`;
    }
    if (lang.split('-')[0] === 'es') {
      return end
        ? `${b} capítulo ${ch}, versículos ${v} a ${end}`
        : `${b} capítulo ${ch}, versículo ${v}`;
    }
    return end
      ? `${b} chapitre ${ch}, versets ${v} à ${end}`
      : `${b} chapitre ${ch}, verset ${v}`;
  });
}

function softenWrittenFrench(text) {
  return text
    .replace(/\s*;\s*/g, '. ')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/\.\.\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/(\w)\s+([?!:,])/g, '$1$2')
    .trim();
}

function splitLongSentences(text) {
  const parts = text.split(/(?<=[.!?…])\s+/);
  const out = [];
  for (const part of parts) {
    const s = part.trim();
    if (!s) continue;
    if (s.length <= 140) {
      out.push(s);
      continue;
    }
    const chunks = s.split(/,\s+(?=(?:et|mais|car|parce que|donc|alors|or|cependant|pourtant|ainsi)\s)/i);
    if (chunks.length > 1) {
      out.push(...chunks.map((c) => c.trim()).filter(Boolean));
    } else {
      out.push(s);
    }
  }
  return out.join(' ');
}

export function prepareOralParagraph(raw, lang = 'fr') {
  let p = String(raw).replace(/\n+/g, ' ').trim();
  p = p.replace(/\*\*([^*]+)\*\*/g, '$1');
  p = p.replace(/\*([^*]+)\*/g, '$1');
  p = p.replace(/#{1,6}\s/g, '');
  p = p.replace(/«\s*/g, '').replace(/\s*»/g, '');
  p = p.replace(/[“”]/g, '"');

  const numMatch = p.match(/^(\d+)\.\s+(.+)$/);
  if (numMatch && lang.split('-')[0] === 'fr') {
    const num = parseInt(numMatch[1], 10);
    const lead = ORDINALS_FR[num] || `Partie ${num}`;
    p = `${lead}, ${numMatch[2]}`;
  }

  if (SECTION_HEADS.test(p.replace(/[.…!?:]/g, '').trim())) {
    p = p.replace(/[.…!?:]*$/, '');
  }

  p = spokenBibleRefs(p, lang);

  if (lang.split('-')[0] === 'fr') {
    p = softenWrittenFrench(p);
    p = splitLongSentences(p);
  }

  return p.trim();
}

export function isSectionBreak(paragraph) {
  if (/^\d+\.\s/.test(paragraph)) return true;
  const bare = paragraph.replace(/[.…!?:,]/g, '').trim();
  if (SECTION_HEADS.test(bare)) return true;
  return Object.values(ORDINALS_FR).some((ord) => paragraph.startsWith(`${ord},`));
}

export function pauseAfterUnit(text, { sectionBreak = false, last = false } = {}) {
  if (last) return 0;
  if (sectionBreak) return 1.05;
  if (/\?\s*$/.test(text)) return 0.55;
  if (text.length > 900) return 0.65;
  return 0.42;
}

/**
 * Regroupe le texte en « prises » longues pour limiter les coutures TTS.
 * @returns {{ text: string, pauseAfter: number, sectionBreak: boolean }[]}
 */
export function buildSpeechUnits(rawText, lang = 'fr') {
  const paragraphs = splitParagraphs(rawText).map((p) => prepareOralParagraph(p, lang));
  if (!paragraphs.length) return [];

  const units = [];
  let buf = '';
  let pendingSection = false;

  const flush = (pauseOpts = {}) => {
    const text = buf.trim();
    if (!text) return;
    units.push({
      text,
      sectionBreak: pendingSection,
      pauseAfter: pauseAfterUnit(text, pauseOpts),
    });
    buf = '';
    pendingSection = false;
  };

  for (let i = 0; i < paragraphs.length; i += 1) {
    const p = paragraphs[i];
    const section = isSectionBreak(p);

    if (section && buf) {
      flush({ sectionBreak: true });
    }

    const candidate = buf ? `${buf}\n\n${p}` : p;
    if (candidate.length > MAX_UNIT_CHARS && buf.length >= MIN_UNIT_CHARS) {
      flush({ sectionBreak: pendingSection });
      buf = p;
      pendingSection = section;
    } else {
      buf = candidate;
      pendingSection = section || pendingSection;
    }
  }

  if (buf.trim()) {
    flush({ last: true });
    if (units.length) units[units.length - 1].pauseAfter = 0;
  }

  return units;
}

export function unitsToParagraphs(units) {
  return units.flatMap((u) => splitParagraphs(u.text));
}
