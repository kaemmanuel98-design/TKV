import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { COURSE_MODULES } from '../data/courseModules';
import { COURSE_CONTENT } from '../data/courseContent';
import { useProfileStore } from '../store/useProfileStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { useGamificationStore } from '../store/useGamificationStore';
import './CourseModule.css';

const CourseModule = () => {
  const { courseId, moduleIndex } = useParams();
  const { t, i18n } = useTranslation();
  const index = parseInt(moduleIndex, 10);
  const course = COURSE_MODULES[courseId];
  const modMeta = course?.modules.find((m) => m.index === index);
  const content = COURSE_CONTENT[courseId]?.[index];
  const isPremium = useProfileStore((s) => s.isPremium);
  const markComplete = useCourseProgressStore((s) => s.markComplete);
  const isComplete = useCourseProgressStore((s) => s.isComplete);
  const awardBadge = useGamificationStore((s) => s.awardBadge);

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

  const lang = ['fr', 'en'].includes(i18n.language.split('-')[0])
    ? i18n.language.split('-')[0]
    : 'fr';
  const paragraphs = content.sections[lang] || content.sections.fr;
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
      />

      <article className="card course-module-body">
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
