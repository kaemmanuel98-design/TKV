import { translateTexts } from './translateOnDemand';

function cloneBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type === 'list') {
      return { ...block, items: [...(block.items || [])] };
    }
    return { ...block };
  });
}

/** Extrait les textes traduisibles d'une liste de blocs Héritage. */
function collectTexts(blocks) {
  const texts = [];
  const refs = [];

  blocks.forEach((block, blockIndex) => {
    if (block.text?.trim()) {
      texts.push(block.text);
      refs.push({ blockIndex, field: 'text' });
    }
    if (block.source?.trim()) {
      texts.push(block.source);
      refs.push({ blockIndex, field: 'source' });
    }
    if (block.type === 'list' && block.items?.length) {
      block.items.forEach((item, itemIndex) => {
        if (String(item).trim()) {
          texts.push(String(item));
          refs.push({ blockIndex, field: 'items', itemIndex });
        }
      });
    }
  });

  return { texts, refs };
}

function applyTranslations(blocks, refs, translations) {
  const out = cloneBlocks(blocks);
  refs.forEach((ref, i) => {
    const value = translations[i];
    if (value == null || !String(value).trim()) return;
    const block = out[ref.blockIndex];
    if (ref.field === 'text') block.text = value;
    else if (ref.field === 'source') block.source = value;
    else if (ref.field === 'items') block.items[ref.itemIndex] = value;
  });
  return out;
}

/** Traduit les blocs d'un article / personnage / événement Héritage. */
export async function translateHeritageBlocks(blocks, { from = 'fr', to } = {}) {
  if (!blocks?.length || !to || to === from) return blocks;

  const { texts, refs } = collectTexts(blocks);
  if (!texts.length) return blocks;

  const translated = await translateTexts(texts, { from, to });
  return applyTranslations(blocks, refs, translated);
}
