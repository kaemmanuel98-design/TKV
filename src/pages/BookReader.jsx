import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Volume2, ArrowLeft, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LogoMark } from '../components/Logo';
import { useSpeak } from '../hooks/useSpeak';
import { stopSpeech } from '../lib/speech';

const BookReader = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { speak } = useSpeak();

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [book, setBook] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      setBook(null);
      setUnavailable(false);

      if (id !== 'gynosko') {
        setUnavailable(true);
        return;
      }

      try {
        const supportedLangs = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];
        let lang = i18n.language.split('-')[0];
        if (!supportedLangs.includes(lang)) {
          lang = 'fr';
        }
        const module = await import(`../data/gynosko_${lang}.js`);
        setBook(module.BOOK_DATA);
      } catch (err) {
        console.error('Error loading book:', err);
        setUnavailable(true);
      }
    };
    loadBook();
  }, [i18n.language, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setScore(0);
    stopSpeech();
  }, [currentChapterIdx]);

  const handleQuizChange = (questionIdx, answer) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionIdx]: answer,
    }));
  };

  const submitQuiz = () => {
    if (!book) return;
    const chapter = book.chapters[currentChapterIdx];
    let currentScore = 0;
    chapter.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setQuizSubmitted(true);
  };

  const formatContent = (content) =>
    content.split('\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return <br key={idx} />;
      return <p key={idx}>{paragraph}</p>;
    });

  if (unavailable) {
    return (
      <div className="container book-reader-loading animate-fade-in">
        <h1 className="book-meta-title">{t('book_unavailable_title')}</h1>
        <p className="text-muted">{t('book_unavailable_desc')}</p>
        <Link to="/library" className="btn btn-primary btn-sm mt-4">
          <ArrowLeft size={16} /> {t('book_back')}
        </Link>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container book-reader-loading animate-fade-in">
        <LogoMark size={64} />
        <p className="text-muted">{t('book_loading')}</p>
      </div>
    );
  }

  const chapter = book.chapters[currentChapterIdx];

  return (
    <div className="container book-reader animate-fade-in">
      <div className="mb-4">
        <Link to="/library" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} /> {t('book_back')}
        </Link>
      </div>

      <div className="book-meta">
        <h1 className="book-meta-title">{book.title}</h1>
        <p className="book-meta-author">
          {book.subtitle} — {book.author}
        </p>
      </div>

      <div className="card mb-8">
        <div className="book-chapter-head">
          <h2 className="flex items-center gap-2 m-0" style={{ fontSize: '1.35rem', fontFamily: 'var(--font-display)' }}>
            <BookOpen color="var(--gold)" size={22} />
            {t('book_chapter')} {currentChapterIdx + 1}
          </h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => speak(chapter.content)} title={t('book_listen')}>
            <Volume2 size={18} /> <span className="hide-mobile">{t('book_listen')}</span>
          </button>
        </div>

        <h3 className="book-chapter-title">{chapter.title}</h3>

        <div className="book-content">{formatContent(chapter.content)}</div>
      </div>

      {chapter.quiz && chapter.quiz.length > 0 && (
        <div className="card book-quiz-card mb-8">
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
          onClick={() => setCurrentChapterIdx((prev) => prev - 1)}
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
          onClick={() => setCurrentChapterIdx((prev) => prev + 1)}
          disabled={currentChapterIdx === book.chapters.length - 1}
        >
          {t('book_next')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default BookReader;
