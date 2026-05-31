import { useEffect, useState } from 'react';
import { resolveHeritageLang } from '../lib/heritageLang';
import { translateHeritageBlocks } from '../lib/translateHeritageBlocks';

const ON_DEMAND_LANGS = new Set(['es', 'nl', 'pt', 'ar']);
const CACHE_VERSION = 'tkv_heritage_v1';

function readBlockCache(contentId, lang) {
  if (!contentId) return null;
  try {
    const raw = localStorage.getItem(`${CACHE_VERSION}:${contentId}:${lang}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

function writeBlockCache(contentId, lang, blocks) {
  if (!contentId || !blocks?.length) return;
  try {
    localStorage.setItem(`${CACHE_VERSION}:${contentId}:${lang}`, JSON.stringify(blocks));
  } catch {
    /* quota */
  }
}

function pickSourceBlocks(blockMap, lang) {
  if (!blockMap) return { blocks: [], sourceLang: 'fr' };
  if (blockMap[lang]?.length) return { blocks: blockMap[lang], sourceLang: lang };
  if (lang === 'en' && blockMap.en?.length) return { blocks: blockMap.en, sourceLang: 'en' };
  if (blockMap.fr?.length) return { blocks: blockMap.fr, sourceLang: 'fr' };
  if (blockMap.en?.length) return { blocks: blockMap.en, sourceLang: 'en' };
  return { blocks: [], sourceLang: 'fr' };
}

export function useHeritageBlocks(blockMap, i18n, contentId) {
  const lang = resolveHeritageLang(i18n);
  const [blocks, setBlocks] = useState([]);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const { blocks: source, sourceLang } = pickSourceBlocks(blockMap, lang);

    setTranslateError(false);

    if (!source.length) {
      setBlocks([]);
      setTranslating(false);
      return undefined;
    }

    if (!ON_DEMAND_LANGS.has(lang) || lang === sourceLang) {
      setBlocks(source);
      setTranslating(false);
      return undefined;
    }

    const cached = readBlockCache(contentId, lang);
    if (cached) {
      setBlocks(cached);
      setTranslating(false);
      return undefined;
    }

    setBlocks(source);
    setTranslating(true);

    (async () => {
      try {
        const translated = await translateHeritageBlocks(source, {
          from: sourceLang,
          to: lang,
        });
        if (!cancelled) {
          setBlocks(translated);
          writeBlockCache(contentId, lang, translated);
        }
      } catch {
        if (!cancelled) {
          setBlocks(source);
          setTranslateError(true);
        }
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blockMap, lang, contentId]);

  return { blocks, translating, translateError, lang };
}
