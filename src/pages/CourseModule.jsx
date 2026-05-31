import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { COURSE_MODULES } from '../data/courseModules';
import { COURSE_CONTENT } from '../data/courseContent';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { applyCourseBadgesFromProgress } from '../lib/courseBadges';
import { useGamificationStore } from '../store/useGamificationStore';
import { useSpeak } from '../hooks/useSpeak';
import { stopSpeech } from '../lib/speech';
import { prepareModuleSpeech } from '../lib/prepareBookSpeech';
import { isUsableInLanguage, translateParagraphs } from '../lib/translateOnDemand';
import './CourseModule.css';

const BOOK_LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

const CourseModule = () => {
  const { courseId, moduleIndex } = useParams();
  const { t, i18n } = useTranslation();
  const { speak, stop } = useSpeak();
  const index = parseInt(moduleIndex, 10);
  const course = COURSE_MODULES[courseId];
  const modMeta = course?.modules.find((m) => m.index === index);
  const content = COURSE_CONTENT[courseId]?.[index];
  const user = useAuthStore((s) => s.user);
  const isPremium = useProfileStore((s) => s.isPremium);
  const markComplete = useCourseProgressStore((s) => s.markComplete);
  const isComplete = useCourseProgressStore((s) => s.isComplete);

  const [paragraphs, setParagraphs] = useState([]);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const langCode = i18n.language?.split('-')[0] || 'fr';
  const lang = BOOK_LANGS.includes(langCode) ? langCode : 'fr';
  const isRtl = lang === 'ar';

  useEffect(() => {
    let cancelled = false;

    const resolveContent = async () => {
      if (!content?.sections) {
        setParagraphs([]);
        return;
      }

      setTranslateError(false);

      const direct = content.sections[lang];
      if (direct?.length && (lang === 'fr' || lang === 'en' || isUsableInLanguage(direct.join(' '), lang))) {
        setParagraphs(direct);
        setTranslating(false);
        return;
      }

      const sourceLang = content.sections.fr?.length ? 'fr' : 'en';
      const source = content.sections[sourceLang] || content.sections.fr || content.sections.en || [];

      if (lang === sourceLang) {
        setParagraphs(source);
        setTranslating(false);
        return;
      }

      setParagraphs(source);
      setTranslating(true);
      try {
        const translated = await translateParagraphs(source, lang, sourceLang);
        if (!cancelled) setParagraphs(translated);
      } catch {
        if (!cancelled) setTranslateError(true);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    resolveContent();
    return () => {
      cancelled = true;
    };
  }, [content, lang]);

  useEffect(() => {
    stopSpeech();
    setIsSpeaking(false);
  }, [lang, index]);

  useEffect(() => () => stopSpeech(), []);

  const toggleListen = useCallback(async () => {
    if (isSpeaking) {
      stop();
      setIsSpeaking(false);
      return;
    }

    const speechText = prepareModuleSpeech(paragraphs.join('\n\n'), { locale: lang });
    if (!speechText.trim()) return;

    setIsSpeaking(true);
    try {
      await speak(speechText, { prepared: true, language: lang });
    } catch {
      /* alertes dans useSpeak */
    } finally {
      setIsSpeaking(false);
    }
  }, [paragraphs, i18n.language, isSpeaking, speak, stop]);

  if (!course || !modMeta) {
    return (
      <div className="container course-module-empty animate-fade-in">
        <p>{t('course_not_found')}</p>
        <Link to="/courses" className="course-module-back">
          <ArrowLeft size={18} aria-hidden />
          {t('course_back')}
        </Link>
      </div>
    );
  }

  const locked = !modMeta.free && !isPremium();

  if (locked) {
    return (
      <div className="container course-module-locked animate-fade-in">
        <Link to={`/courses/${courseId}`} className="course-module-back">
          <ArrowLeft size={18} aria-hidden />
          {t('course_back')}
        </Link>
        <p>{t('course_premium_only')}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container course-module-empty animate-fade-in">
        <Link to={`/courses/${courseId}`} className="course-module-back">
          <ArrowLeft size={18} aria-hidden />
          {t('course_back')}
        </Link>
        <p>{t('course_module_no_content')}</p>
      </div>
    );
  }

  const done = isComplete(courseId, index);

  const handleComplete = () => {
    markComplete(courseId, index, user?.id);
    applyCourseBadgesFromProgress(useCourseProgressStore.getState().completed);
  };

  const hasNext = index < course.modules.length;

  return (
    <div className="course-module-page animate-fade-in">
      <div className="container course-module-top">
        <Link to={`/courses/${courseId}`} className="course-module-back">
          <ArrowLeft size={18} aria-hidden />
          {t('course_back')}
        </Link>
        <header className="course-module-hero">
          <div className="course-module-hero-copy">
            <p className="course-module-eyebrow">
              {t('course_module_label', { num: index })}
            </p>
            <h1 className="course-module-title">{t(content.titleKey)}</h1>
          </div>
          <div className="course-module-listen">
            <button
              type="button"
              className={`btn btn-sm ${isSpeaking ? 'btn-ghost' : 'btn-outline'}`}
              onClick={toggleListen}
              disabled={translating || !paragraphs.length}
              title={isSpeaking ? t('book_stop_listen') : t('course_listen_module')}
            >
              {isSpeaking ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
              <span className="hide-mobile">
                {isSpeaking ? t('book_stop_listen') : t('course_listen_module')}
              </span>
            </button>
          </div>
        </header>
      </div>

      <div className="container course-module-body-wrap">
        {translating && (
          <p className="course-module-notice" role="status">
            {t('content_translating')}
          </p>
        )}
        {translateError && !translating && (
          <p className="course-module-notice course-module-notice--warn" role="status">
            {t('content_translate_error')}
          </p>
        )}

        <article
          className="course-module-article"
          dir={isRtl ? 'rtl' : 'ltr'}
          lang={lang}
        >
          {paragraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </article>

        <footer className="course-module-footer">
          {!done ? (
            <button type="button" className="btn btn-primary" onClick={handleComplete}>
              <CheckCircle size={18} aria-hidden />
              {t('course_module_mark_done')}
            </button>
          ) : (
            <p className="course-module-done">
              <CheckCircle size={18} aria-hidden />
              {t('course_module_complete')}
            </p>
          )}
          {hasNext ? (
            <Link
              to={`/courses/${courseId}/module/${index + 1}`}
              className="btn btn-outline"
            >
              {t('course_module_next')}
              <ChevronRight size={16} aria-hidden />
            </Link>
          ) : (
            <Link to={`/courses/${courseId}`} className="btn btn-outline">
              {t('course_back')}
            </Link>
          )}
        </footer>
      </div>
    </div>
  );
};

export default CourseModule;
