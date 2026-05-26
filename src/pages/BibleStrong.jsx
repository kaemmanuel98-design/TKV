import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBibleStore } from '../store/useBibleStore';
import { Volume2, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { BIBLE_BOOKS, getBookName } from '../data/bible/catalog';
import { loadBibleChapter, isChapterAvailable } from '../data/bible/loadChapter';
import { getLexiconEntry } from '../data/bible/lexicon';
import { verseText } from '../data/bible/utils';
import { useSpeak } from '../hooks/useSpeak';
import './BibleStrong.css';

const BibleStrong = () => {
  const { t, i18n } = useTranslation();
  const lang = ['fr', 'en'].includes(i18n.language.split('-')[0])
    ? i18n.language.split('-')[0]
    : 'fr';

  const { bookId, currentChapter, lexiconSelection, setBook, setChapter, setLexiconSelection, clearLexicon, getBookMeta } =
    useBibleStore();

  const bookMeta = getBookMeta();
  const bookLabel = getBookName(bookId, lang);
  const chapterAvailable = isChapterAvailable(bookId, currentChapter);

  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadChapter = useCallback(async () => {
    setLoading(true);
    setChapterData(null);
    if (!chapterAvailable) {
      setLoading(false);
      return;
    }
    try {
      const data = await loadBibleChapter(bookId, currentChapter);
      const localized = data?.[lang] || data?.fr;
      setChapterData(localized || null);
    } catch (err) {
      console.error(err);
      setChapterData(null);
    } finally {
      setLoading(false);
    }
  }, [bookId, currentChapter, lang, chapterAvailable]);

  useEffect(() => {
    loadChapter();
    clearLexicon();
  }, [loadChapter, clearLexicon]);

  const verses = chapterData?.verses || [];
  const { speak } = useSpeak();

  const readWholeChapter = () => {
    speak(verses.map((v) => verseText(v)).join(' '));
  };

  const openLexicon = (strongId, surface) => {
    const entry = getLexiconEntry(strongId, lang);
    if (!entry) return;
    setLexiconSelection({ strongId, surface, ...entry });
  };

  const lexicon = lexiconSelection;

  const goPrevChapter = () => {
    if (currentChapter > 1) setChapter(currentChapter - 1);
  };

  const goNextChapter = () => {
    if (currentChapter < bookMeta.chapters) setChapter(currentChapter + 1);
  };

  const chapterOptions = Array.from({ length: bookMeta.chapters }, (_, i) => i + 1);

  return (
    <div className="container bible-strong-page animate-fade-in">
      <div className="bible-strong-layout flex gap-6 flex-col lg:flex-row">
        <div className="flex-1">
          <PageHeader
            eyebrow={t('bible')}
            title={
              <span className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                <BookOpen color="var(--gold)" size={26} />
                {bookLabel} {currentChapter}
              </span>
            }
            subtitle={t('bible_subtitle')}
            actions={
              chapterAvailable && verses.length > 0 ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={readWholeChapter}>
                  <Volume2 size={18} /> {t('bible_listen_chapter')}
                </button>
              ) : null
            }
          />

          <div className="card bible-toolbar">
            <label className="bible-toolbar-field">
              <span className="bible-toolbar-label">{t('bible_select_book')}</span>
              <select
                className="bible-select"
                value={bookId}
                onChange={(e) => setBook(e.target.value)}
              >
                <optgroup label={t('bible_testament_ot')}>
                  {BIBLE_BOOKS.filter((b) => b.testament === 'ot').map((b) => (
                    <option key={b.id} value={b.id}>
                      {getBookName(b.id, lang)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t('bible_testament_nt')}>
                  {BIBLE_BOOKS.filter((b) => b.testament === 'nt').map((b) => (
                    <option key={b.id} value={b.id}>
                      {getBookName(b.id, lang)}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label className="bible-toolbar-field">
              <span className="bible-toolbar-label">{t('bible_select_chapter')}</span>
              <select
                className="bible-select"
                value={currentChapter}
                onChange={(e) => setChapter(Number(e.target.value))}
              >
                {chapterOptions.map((n) => (
                  <option key={n} value={n}>
                    {t('bible_chapter_num', { num: n })}
                  </option>
                ))}
              </select>
            </label>

            <div className="bible-chapter-nav">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={goPrevChapter}
                disabled={currentChapter <= 1}
                aria-label={t('bible_prev_chapter')}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={goNextChapter}
                disabled={currentChapter >= bookMeta.chapters}
                aria-label={t('bible_next_chapter')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {!chapterAvailable && (
            <div className="card bible-unavailable">
              <p>{t('bible_chapter_unavailable')}</p>
              <p className="text-muted bible-available-hint">{t('bible_available_hint')}</p>
            </div>
          )}

          {chapterAvailable && loading && (
            <p className="bible-loading text-muted">
              <Loader2 size={20} className="spin" />
              {t('bible_loading')}
            </p>
          )}

          {chapterAvailable && !loading && verses.length > 0 && (
            <div className="card bible-reader-card">
              {verses.map((verse) => (
                <div key={verse.id} className="bible-verse">
                  <span className="bible-verse-num">{verse.id}</span>
                  {verse.segments.map((seg, index) => {
                    if (seg.s) {
                      return (
                        <span
                          key={index}
                          role="button"
                          tabIndex={0}
                          className="bible-word-strong"
                          onClick={() => openLexicon(seg.s, seg.t.trim())}
                          onKeyDown={(e) => e.key === 'Enter' && openLexicon(seg.s, seg.t.trim())}
                          title={t('bible_word_tooltip')}
                        >
                          {seg.t}
                        </span>
                      );
                    }
                    return <span key={index}>{seg.t}</span>;
                  })}
                  <button
                    type="button"
                    className="btn btn-ghost bible-verse-listen"
                    onClick={() => speak(verseText(verse))}
                    title={t('bible_listen_verse')}
                    aria-label={t('bible_listen_verse')}
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {lexicon && (
          <aside className="card lexicon-panel animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0, color: 'var(--gold-bright)', fontFamily: 'var(--font-display)' }}>
                {t('bible_lexicon_title')}
              </h3>
              <button
                type="button"
                onClick={clearLexicon}
                className="modal-close"
                style={{ position: 'static' }}
                aria-label={t('payment_close_aria')}
              >
                &times;
              </button>
            </div>
            <div className="lexicon-body">
              <p className="lexicon-lang-badge">
                {lexicon.isGreek ? t('bible_lexicon_greek') : t('bible_lexicon_hebrew')}
              </p>
              <p>
                <strong>{t('bible_lexicon_word')}:</strong> {lexicon.surface}
              </p>
              <p>
                <strong>{t('bible_lexicon_code')}:</strong> {lexicon.strongId}
              </p>
              {lexicon.lemma && (
                <p className="text-muted lexicon-lemma">{lexicon.lemma}</p>
              )}
              <p className="mt-4">
                <strong>{t('bible_lexicon_definition')}:</strong>
              </p>
              <p className="text-muted">{lexicon.gloss}</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default BibleStrong;
