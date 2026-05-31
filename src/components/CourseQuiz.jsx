import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import { translateQuizQuestions } from '../lib/translateQuiz';

const PASS_RATIO = 0.8;
const TRANSLATABLE_LANGS = ['es', 'nl', 'pt', 'ar'];

/**
 * @param {{ quiz?: { fr?: Array, en?: Array } }} props
 * @param {string} lang
 * @param {(passed: boolean, score: number, total: number) => void} onSubmitted
 */
export default function CourseQuiz({ quiz, lang, onSubmitted }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);

    const direct = quiz?.[lang];
    if (direct?.length) {
      setQuestions(direct);
      setLoadingQuiz(false);
      return;
    }

    const sourceLang = quiz?.fr?.length ? 'fr' : quiz?.en?.length ? 'en' : null;
    const source = sourceLang ? quiz[sourceLang] : [];

    if (!source.length) {
      setQuestions([]);
      setLoadingQuiz(false);
      return;
    }

    if (!TRANSLATABLE_LANGS.includes(lang) || lang === sourceLang) {
      setQuestions(source);
      setLoadingQuiz(false);
      return;
    }

    let cancelled = false;
    setLoadingQuiz(true);
    setQuestions(source);

    translateQuizQuestions(source, lang, sourceLang)
      .then((translated) => {
        if (!cancelled) setQuestions(translated);
      })
      .catch(() => {
        if (!cancelled) setQuestions(source);
      })
      .finally(() => {
        if (!cancelled) setLoadingQuiz(false);
      });

    return () => {
      cancelled = true;
    };
  }, [quiz, lang]);

  if (!questions.length && !loadingQuiz) return null;

  const handleSubmit = () => {
    let current = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) current += 1;
    });
    setScore(current);
    setSubmitted(true);
    const passed = current / questions.length >= PASS_RATIO;
    onSubmitted?.(passed, current, questions.length);
  };

  const passed = submitted && score / questions.length >= PASS_RATIO;

  return (
    <div className="card course-quiz-card">
      <h3 className="course-quiz-title">
        <CheckCircle size={22} aria-hidden />
        {t('course_quiz_title')}
      </h3>
      <p className="course-quiz-intro">{t('course_quiz_intro')}</p>

      {loadingQuiz ? (
        <p className="course-quiz-loading">{t('agent_loading')}</p>
      ) : (
        questions.map((q, idx) => (
          <div key={idx} className="course-quiz-question">
            <p className="course-quiz-q">{q.question}</p>
            <div className="course-quiz-options">
              {q.options.map((opt) => {
                const value = opt.label.replace(')', '').slice(-1);
                const isSelected = answers[idx] === value;
                const isCorrect = submitted && q.answer === value;
                const isWrong = submitted && isSelected && q.answer !== value;
                let className = 'quiz-option';
                if (submitted) className += ' quiz-option--locked';
                if (isSelected && !submitted) className += ' quiz-option--selected';
                if (isCorrect) className += ' quiz-option--correct';
                if (isWrong) className += ' quiz-option--wrong';

                return (
                  <label key={opt.label} className={className}>
                    <input
                      type="radio"
                      name={`course-q-${idx}`}
                      value={value}
                      checked={isSelected}
                      disabled={submitted}
                      onChange={() => setAnswers((prev) => ({ ...prev, [idx]: value }))}
                    />
                    <span>
                      {opt.label} {opt.text}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))
      )}

      {!loadingQuiz && !submitted ? (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={Object.keys(answers).length !== questions.length}
          onClick={handleSubmit}
        >
          {t('book_quiz_submit')}
        </button>
      ) : null}

      {!loadingQuiz && submitted ? (
        <div className={`quiz-result ${passed ? 'quiz-result--perfect' : ''}`}>
          <h4>
            {t('book_quiz_score')} {score} / {questions.length}
          </h4>
          <p>{passed ? t('course_quiz_pass') : t('course_quiz_retry')}</p>
        </div>
      ) : null}
    </div>
  );
}

export { PASS_RATIO as COURSE_QUIZ_PASS_RATIO };
