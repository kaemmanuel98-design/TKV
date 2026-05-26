/** Catalogue des livres bibliques — chapitres disponibles chargés à la demande */
export const BIBLE_BOOKS = [
  { id: 'genesis', chapters: 50, testament: 'ot' },
  { id: 'exodus', chapters: 40, testament: 'ot' },
  { id: 'psalms', chapters: 150, testament: 'ot' },
  { id: 'isaiah', chapters: 66, testament: 'ot' },
  { id: 'matthew', chapters: 28, testament: 'nt' },
  { id: 'john', chapters: 21, testament: 'nt' },
  { id: 'romans', chapters: 16, testament: 'nt' },
  { id: 'revelation', chapters: 22, testament: 'nt' },
];

export const BOOK_NAMES = {
  genesis: { fr: 'Genèse', en: 'Genesis', es: 'Génesis', nl: 'Genesis', pt: 'Génesis', ar: 'التكوين' },
  exodus: { fr: 'Exode', en: 'Exodus', es: 'Éxodo', nl: 'Exodus', pt: 'Êxodo', ar: 'الخروج' },
  psalms: { fr: 'Psaumes', en: 'Psalms', es: 'Salmos', nl: 'Psalmen', pt: 'Salmos', ar: 'المزامير' },
  isaiah: { fr: 'Ésaïe', en: 'Isaiah', es: 'Isaías', nl: 'Jesaja', pt: 'Isaías', ar: 'إشعياء' },
  matthew: { fr: 'Matthieu', en: 'Matthew', es: 'Mateo', nl: 'Mattheüs', pt: 'Mateus', ar: 'متى' },
  john: { fr: 'Jean', en: 'John', es: 'Juan', nl: 'Johannes', pt: 'João', ar: 'يوحنا' },
  romans: { fr: 'Romains', en: 'Romans', es: 'Romanos', nl: 'Romeinen', pt: 'Romanos', ar: 'رومية' },
  revelation: { fr: 'Apocalypse', en: 'Revelation', es: 'Apocalipsis', nl: 'Openbaring', pt: 'Apocalipse', ar: 'الرؤيا' },
};

export function getBookName(bookId, lang = 'fr') {
  const l = lang.split('-')[0];
  return BOOK_NAMES[bookId]?.[l] || BOOK_NAMES[bookId]?.fr || bookId;
}
