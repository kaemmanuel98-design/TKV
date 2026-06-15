import { create } from 'zustand';
import { BIBLE_BOOKS } from '../data/bible/catalog';
import {
  loadFrenchBibleVersion,
  saveFrenchBibleVersion,
} from '../data/bible/frenchVersions';

const defaultBook = BIBLE_BOOKS[0];

export const useBibleStore = create((set, get) => ({
  bookId: defaultBook.id,
  currentChapter: 1,
  lexiconSelection: null,
  frenchVersion: loadFrenchBibleVersion(),
  scrollToVerse: null,

  setBook: (bookId) => set({ bookId, currentChapter: 1, lexiconSelection: null, scrollToVerse: null }),
  setChapter: (chapter) => set({ currentChapter: chapter, lexiconSelection: null, scrollToVerse: null }),
  setScrollToVerse: (verseNum) => set({ scrollToVerse: verseNum }),
  clearScrollToVerse: () => set({ scrollToVerse: null }),
  setLexiconSelection: (selection) => set({ lexiconSelection: selection }),
  clearLexicon: () => set({ lexiconSelection: null }),
  setFrenchVersion: (frenchVersion) => {
    saveFrenchBibleVersion(frenchVersion);
    set({ frenchVersion, lexiconSelection: null });
  },

  getBookMeta: () => BIBLE_BOOKS.find((b) => b.id === get().bookId) || defaultBook,
}));
