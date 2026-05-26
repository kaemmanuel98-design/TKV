import { BIBLE_BOOKS } from './books.js';

let manifestPromise = null;

async function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch('/bible/manifest.json')
      .then((r) => {
        if (!r.ok) throw new Error('manifest');
        return r.json();
      })
      .catch(() => null);
  }
  return manifestPromise;
}

export function isChapterAvailable(bookId, chapter) {
  const book = BIBLE_BOOKS.find((b) => b.id === bookId);
  return Boolean(book && chapter >= 1 && chapter <= book.chapters);
}

export async function loadBibleChapter(bookId, chapter) {
  if (!isChapterAvailable(bookId, chapter)) return null;

  try {
    const res = await fetch(`/bible/chapters/${bookId}/${chapter}.json`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function listAvailableChapters() {
  const manifest = await loadManifest();
  if (!manifest?.books) {
    return BIBLE_BOOKS.flatMap((b) =>
      Array.from({ length: b.chapters }, (_, i) => ({ bookId: b.id, chapter: i + 1 }))
    );
  }
  return manifest.books.flatMap((b) =>
    Array.from({ length: b.chapters }, (_, i) => ({ bookId: b.id, chapter: i + 1 }))
  );
}
