import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Volume2, VolumeX, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LogoMark } from '../components/Logo';
import { useSpeak } from '../hooks/useSpeak';
import { stopSpeech } from '../lib/speech';
import { loadBook, SUPPORTED_SLUGS } from '../lib/bookLoader';
import { translateChapter } from '../lib/translateOnDemand';
import { formatBookContent } from '../lib/formatBookContent';
import { prepareBookChapterSpeech } from '../lib/prepareBookSpeech';
import './BookReader.css';

const BookReader = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { speak, stop } = useSpeak();

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [book, setBook] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);
  const [displayChapter, setDisplayChapter] = useState(null);
  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setBook(null);
      setDisplayChapter(null);
      setUnavailable(false);
      setTranslateError(false);

      if (!SUPPORTED_SLUGS.includes(id)) {
        if (!cancelled) setUnavailable(true);
        return;
      }

      const data = await loadBook(id, i18n.language);
      if (cancelled) return;
      if (!data) {
        setUnavailable(true);
        return;
      }
      setBook(data);
      setCurrentChapterIdx(0);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [i18n.language, id]);

  useEffect(() => {
    if (!book?.chapters?.length) return undefined;

    let cancelled = false;
    const raw = book.chapters[currentChapterIdx];
    if (!raw) return undefined;

    const run = async () => {
      setTranslateError(false);

      if (!book.needsChapterTranslation && book.uiLang === book.contentLang) {
        setDisplayChapter(raw);
        setTranslating(false);
        return;
      }

      setDisplayChapter(raw);
      setTranslating(true);

      try {
        const translated = await translateChapter(raw, {
          from: book.contentLang || 'fr',
          to: book.uiLang,
          title: raw.title,
        });
        if (!cancelled) setDisplayChapter({ ...raw, ...translated });
      } catch {
        if (!cancelled) {
          setDisplayChapter(raw);
          setTranslateError(true);
        }
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [book, currentChapterIdx, i18n.language]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setScore(0);
    stopSpeech();
    setIsSpeaking(false);
  }, [currentChapterIdx]);

  useEffect(() => () => {
    stopSpeech();
  }, []);

  const handleQuizChange = (questionIdx, answer) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIdx]: answer }));
  };

  const submitQuiz = () => {
    if (!displayChapter) return;
    let currentScore = 0;
    displayChapter.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer) currentScore++;
    });
    setScore(currentScore);
    setQuizSubmitted(true);
  };

  const toggleListen = useCallback(async () => {
    if (!displayChapter) return;
    if (isSpeaking) {
      stop();
      setIsSpeaking(false);
      return;
    }

    const speechText = prepareBookChapterSpeech(displayChapter.content, {
      locale: i18n.language,
    });
    if (!speechText.trim()) return;

    setIsSpeaking(true);
    try {
      await speak(speechText, { prepared: true });
    } catch {
      /* alertes dans useSpeak */
    } finally {
      setIsSpeaking(false);
    }
  }, [displayChapter, i18n.language, isSpeaking, speak, stop]);

  const goToChapter = (idx) => {
    setCurrentChapterIdx(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (unavailable) {
    return (
      <div className="container book-reader-loading animate-fade-in">
        <h1 className="book-reader-title">{t('book_unavailable_title')}</h1>
        <p className="text-muted">{t('book_unavailable_desc')}</p>
        <Link to="/library" className="btn btn-primary btn-sm mt-4">
          <ArrowLeft size={16} /> {t('book_back')}
        </Link>
      </div>
    );
  }

  if (!book || !displayChapter) {
    return (
      <div className="container book-reader-loading animate-fade-in">
        <LogoMark size={64} />
        <p className="text-muted">{t('book_loading')}</p>
      </div>
    );
  }

  const chapter = displayChapter;
  const showTranslationNotice = translateError || (book.usingFallback && translating);

  return (
    <div
      className={`container book-reader book-reader--${book.theme || 'gynosko'} animate-fade-in`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mb-4">
        <Link to="/library" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} /> {t('book_back')}
        </Link>
      </div>

      <header className="book-reader-hero">
        <div className="book-reader-cover-wrap">
          <img
            src={book.coverUrl}
            alt={t('book_cover_alt')}
            className="book-reader-cover"
            width={200}
            height={293}
          />
        </div>
        <div className="book-reader-hero-text">
          <p className="book-reader-tagline">{book.tagline}</p>
          <h1 className="book-reader-title">{book.title}</h1>
          <p className="book-reader-subtitle">{book.subtitle}</p>
          <p className="book-reader-author">{book.author}</p>
        </div>
      </header>

      <div className="book-reader-layout">
        <nav className="book-reader-toc" aria-label={t('book_toc')}>
          <h2>{t('book_toc')}</h2>
          <ul className="book-reader-toc-list">
            {book.chapters.map((ch, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  className={`book-reader-toc-item ${idx === currentChapterIdx ? 'book-reader-toc-item--active' : ''}`}
                  onClick={() => goToChapter(idx)}
                  title={t('book_open_chapter')}
                >
                  <strong>{idx + 1}.</strong> {ch.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="book-reader-main">
          {translating && (
            <p className="book-reader-notice" role="status">
              {t('content_translating')}
            </p>
          )}
          {translateError && !translating && (
            <p className="book-reader-notice" role="status">
              {t('content_translate_error')}
            </p>
          )}
          {showTranslationNotice && !translating && !translateError && (
            <p className="book-reader-notice" role="status">
              {t('book_translation_notice')}
            </p>
          )}

          <article className="card book-chapter-card mb-4">
            <div className="book-chapter-head">
              <div>
                <p className="book-chapter-label">
                  {t('book_chapter')} {currentChapterIdx + 1}
                </p>
                <h2 className="book-chapter-title">{chapter.title}</h2>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${isSpeaking ? 'btn-ghost' : 'btn-primary'}`}
                onClick={toggleListen}
                disabled={!chapter.content?.trim()}
                title={isSpeaking ? t('book_stop_listen') : t('book_listen_chapter')}
              >
                {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                <span className="hide-mobile">
                  {isSpeaking ? t('book_stop_listen') : t('book_listen_chapter')}
                </span>
              </button>
            </div>

            <div className="book-chapter-body">
              <div className="book-content">
                {chapter.content?.trim()
                  ? formatBookContent(chapter.content)
                  : (
                    <p className="text-muted">{t('book_chapter_empty')}</p>
                  )}
              </div>
            </div>
          </article>

          {chapter.quiz?.length > 0 && (
            <div className="card book-quiz-card mb-4">
              <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <CheckCircle color="var(--gold)" size={22} /> {t('book_quiz_title')}
              </h3>

              {chapter.quiz.map((q, idx) => (
                <div key={idx} className="mb-6">
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{q.question}</p>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, optIdx) => {
                      const value = opt.label.replace(')', '');
                      const isSelected = quizAnswers[idx] === value;
                      const isCorrect = quizSubmitted && q.answer === value;
                      const isWrong = quizSubmitted && isSelected && q.answer !== value;

                      let className = 'quiz-option';
                      if (quizSubmitted) className += ' quiz-option--locked';
                      if (isSelected && !quizSubmitted) className += ' quiz-option--selected';
                      if (isCorrect) className += ' quiz-option--correct';
                      if (isWrong) className += ' quiz-option--wrong';

                      return (
                        <label key={optIdx} className={className}>
                          <input
                            type="radio"
                            name={`question-${idx}`}
                            value={value}
                            checked={isSelected}
                            onChange={() => handleQuizChange(idx, value)}
                            disabled={quizSubmitted}
                            style={{ accentColor: 'var(--gold)', marginTop: '0.2rem' }}
                          />
                          <span>
                            <strong>{opt.label}</strong> {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!quizSubmitted ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length !== chapter.quiz.length}
                >
                  {t('book_quiz_submit')}
                </button>
              ) : (
                <div className={`quiz-result ${score === chapter.quiz.length ? 'quiz-result--perfect' : ''}`}>
                  <h4>
                    {t('book_quiz_score')} {score} / {chapter.quiz.length}
                  </h4>
                  <p className="text-muted mt-2 mb-0">
                    {score === chapter.quiz.length ? t('book_quiz_perfect') : t('book_quiz_retry')}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="book-nav">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => goToChapter(currentChapterIdx - 1)}
              disabled={currentChapterIdx === 0}
            >
              <ArrowLeft size={16} /> {t('book_prev')}
            </button>

            <span className="book-nav-progress">
              {t('book_progress', { current: currentChapterIdx + 1, total: book.chapters.length })}
            </span>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => goToChapter(currentChapterIdx + 1)}
              disabled={currentChapterIdx === book.chapters.length - 1}
            >
              {t('book_next')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReader;
