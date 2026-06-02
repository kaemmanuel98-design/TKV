import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBibleStore } from '../store/useBibleStore';
import { Volume2, VolumeX, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { BibleLogo } from '../components/SectionLogos';
import { BIBLE_BOOKS, getBookName } from '../data/bible/catalog';
import { loadBibleChapter, isChapterAvailable } from '../data/bible/loadChapter';
import {
  getLocalizedLexiconEntryAsync,
  getLexiconDisplayMeaning,
  isLexiconLoadFailed,
  preloadLexicon,
} from '../data/bible/lexicon';
import { verseText } from '../data/bible/utils';
import { prepareChapterSpeechText } from '../lib/speech/prepareText';
import { resolveBibleReadLang, pickBibleChapterLang } from '../data/bible/languages';
import { resolveStrongForSurface } from '../data/bible/strongAlignHints';
import { useSpeak } from '../hooks/useSpeak';
import './BibleStrong.css';

const BibleStrong = () => {
  const { t, i18n } = useTranslation();
  const lang = resolveBibleReadLang(i18n.language);
  const readLang = lang;

  const { bookId, currentChapter, lexiconSelection, setBook, setChapter, setLexiconSelection, clearLexicon, getBookMeta } =
    useBibleStore();

  const bookMeta = getBookMeta();
  const bookLabel = getBookName(bookId, lang);
  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buildMissing, setBuildMissing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lexiconLoading, setLexiconLoading] = useState(false);
  const [lexiconFetchFailed, setLexiconFetchFailed] = useState(false);
  const [lexiconLargeText, setLexiconLargeText] = useState(false);
  const [lexiconPrewarming, setLexiconPrewarming] = useState(false);
  const [lexiconPrewarmProgress, setLexiconPrewarmProgress] = useState({ done: 0, total: 0 });
  const lexiconPanelRef = useRef(null);
  const prewarmKeyRef = useRef('');

  useEffect(() => {
    preloadLexicon().then(() => setLexiconFetchFailed(isLexiconLoadFailed()));
  }, []);

  const loadChapter = useCallback(async () => {
    setLoading(true);
    setChapterData(null);
    setBuildMissing(false);
    if (!isChapterAvailable(bookId, currentChapter)) {
      setLoading(false);
      return;
    }
    try {
      const data = await loadBibleChapter(bookId, currentChapter);
      if (!data) {
        setBuildMissing(true);
        setChapterData(null);
        return;
      }
      setChapterData(pickBibleChapterLang(data, readLang));
    } catch (err) {
      console.error(err);
      setChapterData(null);
    } finally {
      setLoading(false);
    }
  }, [bookId, currentChapter, readLang]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    clearLexicon();
  }, [bookId, currentChapter, clearLexicon]);

  const verses = chapterData?.verses || [];
  const { speak, stop } = useSpeak();

  useEffect(() => {
    if (!verses.length) return;

    const prewarmKey = `${bookId}:${currentChapter}:${lang}`;
    if (prewarmKeyRef.current === prewarmKey) return;
    prewarmKeyRef.current = prewarmKey;

    const strongSet = new Set();
    for (const verse of verses) {
      for (const seg of verse.segments || []) {
        if (!seg?.s || !seg?.t) continue;
        const resolvedId = resolveStrongForSurface(seg.t.trim(), lang, seg.s);
        if (resolvedId) strongSet.add(resolvedId);
      }
    }

    const strongIds = Array.from(strongSet);
    if (!strongIds.length) return;

    let cancelled = false;
    const connection = typeof navigator !== 'undefined' ? navigator.connection : null;
    const saveData = Boolean(connection?.saveData);
    const effectiveType = String(connection?.effectiveType || '').toLowerCase();
    const avoidPrewarm = saveData || effectiveType === 'slow-2g' || effectiveType === '2g';
    if (avoidPrewarm) {
      setLexiconPrewarming(false);
      setLexiconPrewarmProgress({ done: 0, total: 0 });
      return;
    }

    const prewarm = async () => {
      setLexiconPrewarming(true);
      setLexiconPrewarmProgress({ done: 0, total: strongIds.length });
      const chunkSize = 12;
      try {
        for (let i = 0; i < strongIds.length; i += chunkSize) {
          if (cancelled) return;
          const chunk = strongIds.slice(i, i + chunkSize);
          await Promise.allSettled(chunk.map((id) => getLocalizedLexiconEntryAsync(id, lang)));
          if (!cancelled) {
            const done = Math.min(i + chunk.length, strongIds.length);
            setLexiconPrewarmProgress({ done, total: strongIds.length });
          }
        }
      } finally {
        if (!cancelled) {
          setLexiconPrewarming(false);
          setLexiconPrewarmProgress({ done: 0, total: 0 });
        }
      }
    };

    prewarm();

    return () => {
      cancelled = true;
      setLexiconPrewarming(false);
      setLexiconPrewarmProgress({ done: 0, total: 0 });
    };
  }, [bookId, currentChapter, lang, verses]);

  const readWholeChapter = async () => {
    if (isSpeaking) {
      stop();
      setIsSpeaking(false);
      return;
    }
    const chapterText = prepareChapterSpeechText(verses, { locale: lang });
    if (!chapterText.trim()) return;

    setIsSpeaking(true);
    try {
      await speak(chapterText, { prepared: true, language: lang });
    } catch {
      /* alertes gérées dans useSpeak */
    } finally {
      setIsSpeaking(false);
    }
  };

  const readVerse = async (verse) => {
    if (isSpeaking) stop();
    const text = verseText(verse);
    if (!text.trim()) return;

    setIsSpeaking(true);
    try {
      await speak(text, { language: lang });
    } catch {
      /* alertes gérées dans useSpeak */
    } finally {
      setIsSpeaking(false);
    }
  };

  const scrollToLexiconPanel = () => {
    requestAnimationFrame(() => {
      lexiconPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const openLexicon = async (strongId, surface) => {
    const resolvedId = resolveStrongForSurface(surface, lang, strongId);
    setLexiconLoading(true);
    setLexiconSelection({ strongId: resolvedId, surface, loading: true });
    scrollToLexiconPanel();

    try {
      const entry = await getLocalizedLexiconEntryAsync(resolvedId, lang);
      setLexiconSelection({ ...entry, surface, loading: false });
    } catch {
      setLexiconSelection({
        strongId: resolvedId,
        surface,
        loading: false,
        missing: true,
        gloss: '',
      });
    } finally {
      setLexiconLoading(false);
    }
  };

  useEffect(() => {
    const current = lexiconSelection;
    if (!current?.strongId || current.loading) return;

    let cancelled = false;
    setLexiconLoading(true);
    setLexiconSelection({ ...current, loading: true });

    getLocalizedLexiconEntryAsync(current.strongId, lang)
      .then((entry) => {
        if (cancelled) return;
        setLexiconSelection({ ...entry, surface: current.surface, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setLexiconSelection({
          strongId: current.strongId,
          surface: current.surface,
          loading: false,
          missing: true,
          gloss: '',
        });
      })
      .finally(() => {
        if (!cancelled) setLexiconLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lang, lexiconSelection?.strongId]);

  const lexicon = lexiconSelection;
  const lexiconMeaning =
    lexicon && !lexicon.loading ? getLexiconDisplayMeaning(lexicon, lang) : '';

  const speakLemma = async () => {
    if (!lexiconSelection?.speakLemma) return;
    if (isSpeaking) stop();
    setIsSpeaking(true);
    try {
      await speak(lexiconSelection.speakLemma, { language: lang });
    } catch {
      /* alertes gérées dans useSpeak */
    } finally {
      setIsSpeaking(false);
    }
  };

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
            mark={<BibleLogo size={48} title={t('bible')} />}
            title={
              <span className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                <BookOpen color="var(--gold)" size={26} />
                {bookLabel} {currentChapter}
              </span>
            }
            subtitle={t('bible_subtitle')}
            actions={
              verses.length > 0 ? (
                <button
                  type="button"
                  className={`btn btn-sm ${isSpeaking ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={readWholeChapter}
                >
                  {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  {isSpeaking ? t('bible_stop_listening') : t('bible_listen_chapter')}
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

          {lexiconPrewarming && (
            <p className="lexicon-prewarm-hint text-muted" aria-live="polite">
              <Loader2 size={14} className="spin" />
              {t('bible_lexicon_prewarming')}
              {lexiconPrewarmProgress.total > 0 ? (
                <span className="lexicon-prewarm-count">
                  {lexiconPrewarmProgress.done}/{lexiconPrewarmProgress.total}
                </span>
              ) : null}
            </p>
          )}

          {buildMissing && !loading && (
            <div className="card bible-unavailable">
              <p>{t('bible_build_missing')}</p>
              <p className="text-muted bible-available-hint">{t('bible_build_missing_hint')}</p>
            </div>
          )}

          {loading && (
            <p className="bible-loading text-muted">
              <Loader2 size={20} className="spin" />
              {t('bible_loading')}
            </p>
          )}

          {!loading && !buildMissing && verses.length > 0 && (
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
                    onClick={() => readVerse(verse)}
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
          <aside
            ref={lexiconPanelRef}
            className={`card lexicon-panel lexicon-panel--open animate-fade-in ${
              lexiconLargeText ? 'lexicon-panel--large' : ''
            }`}
            aria-live="polite"
          >
            <div className="lexicon-head">
              <h3 className="lexicon-title">{t('bible_lexicon_title')}</h3>
              <div className="lexicon-head-actions">
                <button
                  type="button"
                  className={`btn btn-sm ${lexiconLargeText ? 'btn-primary' : 'btn-outline'} lexicon-large-toggle`}
                  onClick={() => setLexiconLargeText((v) => !v)}
                  aria-pressed={lexiconLargeText}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={clearLexicon}
                  className="modal-close lexicon-close-btn"
                  aria-label={t('payment_close_aria')}
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="lexicon-body">
              <p className="lexicon-lang-badge">
                {lexicon.isGreek ? t('bible_lexicon_greek') : t('bible_lexicon_hebrew')}
              </p>

              <p className="lexicon-surface-line">
                <strong>{t('bible_lexicon_word')}:</strong>{' '}
                <span className="lexicon-surface-word">{lexicon.surface}</span>
                <span className="text-muted lexicon-strong-id"> · {lexicon.strongId}</span>
              </p>

              {(lexicon.loading || lexiconLoading) && (
                <p className="lexicon-loading text-muted">
                  <Loader2 size={18} className="spin" />
                  {t('bible_lexicon_loading')}
                </p>
              )}

              {!lexicon.loading && !lexiconLoading && lexiconMeaning && (
                <div className="lexicon-meaning-primary">
                  <strong>{t('bible_lexicon_meaning')}:</strong>
                  <p>{lexiconMeaning}</p>
                </div>
              )}

              {!lexicon.loading && !lexiconLoading && !lexiconMeaning && (
                <p className="text-muted lexicon-missing">{t('bible_lexicon_not_found')}</p>
              )}

              {!lexicon.loading && lexiconFetchFailed && (
                <p className="text-muted lexicon-hint">{t('bible_lexicon_fetch_hint')}</p>
              )}

              {lexicon.lemmaOriginal && (
                <p className="lexicon-original-script" dir="auto" lang={lexicon.isGreek ? 'grc' : 'he'}>
                  {lexicon.lemmaOriginal}
                </p>
              )}

              {lexicon.transliteration && (
                <p className="lexicon-translit">{lexicon.transliteration}</p>
              )}

              {lexicon.pronunciation && (
                <p className="text-muted lexicon-pron">
                  <strong>{t('bible_lexicon_pronunciation')}:</strong> {lexicon.pronunciation}
                </p>
              )}

              {lexicon.speakLemma && (
                <button type="button" className="btn btn-outline btn-sm lexicon-speak-btn" onClick={speakLemma}>
                  <Volume2 size={16} />
                  {t('bible_lexicon_listen_word')}
                </button>
              )}

              {lexicon.showEnglishReference &&
                lexicon.definitionOriginal &&
                lexicon.definitionOriginal !== lexiconMeaning && (
                <div className="lexicon-block">
                  <strong>{t('bible_lexicon_strong_reference')}:</strong>
                  <p className="text-muted lexicon-block-text">{lexicon.definitionOriginal}</p>
                </div>
              )}

              {lexicon.derivation && (
                <div className="lexicon-block">
                  <strong>{t('bible_lexicon_derivation')}:</strong>
                  <p className="text-muted lexicon-block-text lexicon-derivation">{lexicon.derivation}</p>
                </div>
              )}

              {lexicon.kjvDef && (
                <div className="lexicon-block">
                  <strong>{t('bible_lexicon_kjv')}:</strong>
                  <p className="text-muted lexicon-block-text">{lexicon.kjvDef}</p>
                </div>
              )}

            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default BibleStrong;
