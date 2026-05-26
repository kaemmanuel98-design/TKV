import { create } from 'zustand';
import { BIBLE_BOOKS } from '../data/bible/catalog';

const defaultBook = BIBLE_BOOKS[0];

export const useBibleStore = create((set, get) => ({
  bookId: defaultBook.id,
  currentChapter: 1,
  lexiconSelection: null,

  setBook: (bookId) => set({ bookId, currentChapter: 1, lexiconSelection: null }),
  setChapter: (chapter) => set({ currentChapter: chapter, lexiconSelection: null }),
  setLexiconSelection: (selection) => set({ lexiconSelection: selection }),
  clearLexicon: () => set({ lexiconSelection: null }),

  getBookMeta: () => BIBLE_BOOKS.find((b) => b.id === get().bookId) || defaultBook,
}));
