import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useProfileStore } from '../store/useProfileStore';
import './Courses.css';

const courses = [
  {
    id: 'foundations',
    titleKey: 'course_foundations_title',
    descKey: 'course_foundations_desc',
    modules: 8,
    free: true,
    progress: 12,
  },
  {
    id: 'apologetics',
    titleKey: 'course_apologetics_title',
    descKey: 'course_apologetics_desc',
    modules: 6,
    free: false,
    progress: 0,
  },
];

const Courses = () => {
  const { t } = useTranslation();
  const isPremium = useProfileStore((s) => s.isPremium);

  return (
    <div className="container courses-page animate-fade-in">
      <PageHeader
        eyebrow={t('course_eyebrow')}
        title={t('course_page_title')}
        subtitle={t('course_page_subtitle')}
      />

      <div className="courses-grid">
        {courses.map(({ id, titleKey, descKey, modules, free, progress }) => {
          const locked = !free && !isPremium();
          return (
            <article key={id} className={`card course-card ${locked ? 'course-card-locked' : ''}`}>
              <div className="course-card-icon">
                {locked ? <Lock size={22} /> : <GraduationCap size={22} strokeWidth={1.5} />}
              </div>
              <h3>{t(titleKey)}</h3>
              <p className="text-muted">{t(descKey)}</p>
              <p className="course-meta">
                {t('course_modules_count', { count: modules })}
                {free ? ` · ${t('course_free_badge')}` : ''}
              </p>
              {!locked && progress > 0 && (
                <div className="course-progress">
                  <div className="course-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
              {locked ? (
                <span className="course-locked-label">{t('course_premium_only')}</span>
              ) : (
                <Link to={`/courses/${id}`} className="btn btn-outline btn-sm">
                  {progress > 0 ? t('course_continue') : t('course_start')}
                  <ArrowRight size={16} />
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <section className="card course-free-note">
        <CheckCircle size={20} />
        <p>{t('course_free_note')}</p>
      </section>
    </div>
  );
};

export default Courses;
