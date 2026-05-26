const LOADERS = {
  'genesis:1': () => import('./chapters/genesis_1.js'),
  'john:1': () => import('./chapters/john_1.js'),
};

export function isChapterAvailable(bookId, chapter) {
  return Boolean(LOADERS[`${bookId}:${chapter}`]);
}

export async function loadBibleChapter(bookId, chapter) {
  const loader = LOADERS[`${bookId}:${chapter}`];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

export function listAvailableChapters() {
  return Object.keys(LOADERS).map((key) => {
    const [bookId, chapter] = key.split(':');
    return { bookId, chapter: Number(chapter, 10) };
  });
}
