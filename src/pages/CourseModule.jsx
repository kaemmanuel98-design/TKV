import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { COURSE_MODULES } from '../data/courseModules';
import { COURSE_CONTENT } from '../data/courseContent';
import { useProfileStore } from '../store/useProfileStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
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
  const isPremium = useProfileStore((s) => s.isPremium);
  const markComplete = useCourseProgressStore((s) => s.markComplete);
  const isComplete = useCourseProgressStore((s) => s.isComplete);
  const awardBadge = useGamificationStore((s) => s.awardBadge);

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

      setTranslating(false);
      setTranslateError(false);

      const direct = content.sections[lang];
      if (direct?.length && (lang === 'fr' || lang === 'en' || isUsableInLanguage(direct.join(' '), lang))) {
        setParagraphs(direct);
        return;
      }

      const sourceLang = content.sections.fr?.length ? 'fr' : 'en';
      const source = content.sections[sourceLang] || content.sections.fr || content.sections.en || [];

      if (lang === sourceLang) {
        setParagraphs(source);
        return;
      }

      setTranslating(true);
      try {
        const translated = await translateParagraphs(source, lang, sourceLang);
        if (!cancelled) setParagraphs(translated);
      } catch {
        if (!cancelled) {
          setParagraphs(source);
          setTranslateError(true);
        }
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

    const speechText = prepareModuleSpeech(paragraphs.join('\n\n'), { locale: i18n.language });
    if (!speechText.trim()) return;

    setIsSpeaking(true);
    try {
      await speak(speechText, { prepared: true });
    } catch {
      /* alertes dans useSpeak */
    } finally {
      setIsSpeaking(false);
    }
  }, [paragraphs, i18n.language, isSpeaking, speak, stop]);

  if (!course || !modMeta) {
    return (
      <div className="container">
        <p>{t('course_not_found')}</p>
        <Link to="/courses">{t('course_back')}</Link>
      </div>
    );
  }

  const locked = !modMeta.free && !isPremium();

  if (locked) {
    return (
      <div className="container course-module-page">
        <Link to={`/courses/${courseId}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={18} />
          {t('course_back')}
        </Link>
        <p className="mt-4">{t('course_premium_only')}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container course-module-page">
        <Link to={`/courses/${courseId}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={18} />
          {t('course_back')}
        </Link>
        <p className="mt-4 text-muted">{t('course_module_no_content')}</p>
      </div>
    );
  }

  const done = isComplete(courseId, index);

  const handleComplete = () => {
    markComplete(courseId, index);
    awardBadge('reader');
  };

  return (
    <div className="container course-module-page animate-fade-in">
      <Link to={`/courses/${courseId}`} className="btn btn-ghost btn-sm course-module-back">
        <ArrowLeft size={18} />
        {t('course_back')}
      </Link>

      <PageHeader
        title={t(content.titleKey)}
        subtitle={t('course_module_label', { num: index })}
        actions={
          <button
            type="button"
            className={`btn btn-sm ${isSpeaking ? 'btn-ghost' : 'btn-primary'}`}
            onClick={toggleListen}
            disabled={translating || !paragraphs.length}
            title={isSpeaking ? t('book_stop_listen') : t('course_listen_module')}
          >
            {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span className="hide-mobile">
              {isSpeaking ? t('book_stop_listen') : t('course_listen_module')}
            </span>
          </button>
        }
      />

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
        className="card course-module-body"
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={lang}
      >
        {paragraphs.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </article>

      <div className="course-module-actions">
        {!done ? (
          <button type="button" className="btn btn-primary" onClick={handleComplete}>
            <CheckCircle size={18} />
            {t('course_module_mark_done')}
          </button>
        ) : (
          <p className="course-module-done-msg">
            <CheckCircle size={20} color="var(--gold-bright)" />
            {t('course_module_complete')}
          </p>
        )}
        <Link to={`/courses/${courseId}`} className="btn btn-outline">
          {t('course_module_next')}
        </Link>
      </div>
    </div>
  );
};

export default CourseModule;
